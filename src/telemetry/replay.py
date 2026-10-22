import argparse
import base64
import hashlib
import hmac
import json
import re
import sys
import time
import urllib.error
import urllib.parse
import urllib.request
from datetime import datetime
from http.client import HTTPResponse
from http.client import HTTPMessage
from pathlib import Path


class NoRedirect(urllib.request.HTTPRedirectHandler):
    def redirect_request(
        self,
        req: urllib.request.Request,
        fp: HTTPResponse,
        code: int,
        msg: str,
        headers: HTTPMessage,
        newurl: str,
    ) -> None:
        return None


def unique_fields(pairs: list[tuple[str, object]]) -> dict[str, object]:
    result: dict[str, object] = {}
    for key, value in pairs:
        if key in result:
            raise ValueError("JSON contains a repeated field.")
        result[key] = value
    return result


def load_events(path: Path) -> list[str]:
    payloads = path.read_text(encoding="utf-8").splitlines()
    if not payloads:
        raise ValueError("The replay file is empty.")

    events: dict[str, dict[str, object]] = {}
    observations: dict[tuple[str, str, datetime], float] = {}
    truck_observations: dict[tuple[str, datetime], float] = {}
    fields = {"event_id", "shipment_id", "truck_id", "event_time_utc", "temperature_c"}
    for number, payload in enumerate(payloads, 1):
        event = json.loads(payload, object_pairs_hook=unique_fields)
        if not isinstance(event, dict) or set(event) != fields:
            raise ValueError(f"Event {number} must contain exactly the five contract fields.")
        for field in ("event_id", "shipment_id", "truck_id"):
            if not isinstance(event[field], str) or not event[field].strip():
                raise ValueError(f"Event {number} has an invalid {field}.")
        timestamp = event["event_time_utc"]
        if not isinstance(timestamp, str) or not re.fullmatch(
            r"[0-9]{4}-[0-9]{2}-[0-9]{2}T[0-9]{2}:[0-9]{2}:[0-9]{2}(?:\.[0-9]{1,6})?Z",
            timestamp,
        ):
            raise ValueError(f"Event {number} needs a UTC timestamp with at most six fractional digits.")
        observed_at = datetime.fromisoformat(timestamp[:-1] + "+00:00")
        temperature = event["temperature_c"]
        if (
            type(temperature) not in (int, float)
            or not -sys.float_info.max <= temperature <= sys.float_info.max
        ):
            raise ValueError(f"Event {number} needs a finite numeric temperature.")
        event_id = event["event_id"]
        if event_id in events and events[event_id] != event:
            raise ValueError(f"Event {number} conflicts with an earlier event ID.")
        events[event_id] = event
        key = (event["shipment_id"], event["truck_id"], observed_at)
        if key in observations and observations[key] != temperature:
            raise ValueError(f"Event {number} conflicts with a journey timestamp.")
        observations[key] = temperature
        truck_key = (event["truck_id"], observed_at)
        if (
            truck_key in truck_observations
            and truck_observations[truck_key] != temperature
        ):
            raise ValueError(f"Event {number} conflicts with another shipment's truck timestamp.")
        truck_observations[truck_key] = temperature
    return payloads


def read_connection(payload: object) -> tuple[str, str, str, str]:
    if not isinstance(payload, dict) or not isinstance(payload.get("data"), dict):
        raise ValueError("Expected a successful Fabio source-connection response on stdin.")
    connection = payload["data"]
    namespace = connection.get("fullyQualifiedNamespace")
    hub = connection.get("eventHubName")
    access_keys = connection.get("accessKeys")
    if not isinstance(namespace, str) or not re.fullmatch(
        r"[A-Za-z0-9-]+\.servicebus\.windows\.net", namespace
    ):
        raise ValueError("The response is not an approved managed Event Hubs endpoint.")
    if not isinstance(hub, str) or not re.fullmatch(r"[A-Za-z0-9_.-]+", hub):
        raise ValueError("The Event Hubs entity name is invalid.")
    if not isinstance(access_keys, dict):
        raise ValueError("The response has no source access keys.")
    connection_string = access_keys.get("primaryConnectionString")
    if not isinstance(connection_string, str):
        raise ValueError("The response has no primary source connection string.")

    parts: dict[str, str] = {}
    for part in connection_string.split(";"):
        if not part:
            continue
        name, separator, value = part.partition("=")
        if not separator or name in parts:
            raise ValueError("The source connection string has malformed or repeated fields.")
        parts[name] = value
    endpoint = urllib.parse.urlsplit(parts.get("Endpoint", ""))
    if (
        endpoint.scheme != "sb"
        or endpoint.netloc.lower() != namespace.lower()
        or endpoint.path not in ("", "/")
        or endpoint.query
        or endpoint.fragment
        or parts.get("EntityPath", hub) != hub
    ):
        raise ValueError("The connection string does not match the managed source endpoint.")
    key_name = parts.get("SharedAccessKeyName", "")
    key = parts.get("SharedAccessKey", "")
    if not key_name or not key:
        raise ValueError("The source connection string has no signing credentials.")
    return namespace, hub, key_name, key


def send_events(payloads: list[str], connection: tuple[str, str, str, str]) -> int:
    namespace, hub, key_name, key = connection
    resource = f"https://{namespace}/{hub}"
    encoded_resource = urllib.parse.quote_plus(resource)
    opener = urllib.request.build_opener(NoRedirect())
    sent = 0
    for payload in payloads:
        expires = str(int(time.time()) + 600)
        signature = hmac.new(
            key.encode(),
            f"{encoded_resource}\n{expires}".encode(),
            hashlib.sha256,
        ).digest()
        token = (
            f"SharedAccessSignature sr={encoded_resource}"
            f"&sig={urllib.parse.quote_plus(base64.b64encode(signature).decode())}"
            f"&se={expires}&skn={urllib.parse.quote_plus(key_name)}"
        )
        request = urllib.request.Request(
            f"{resource}/messages",
            data=payload.encode(),
            headers={"Authorization": token, "Content-Type": "application/json"},
            method="POST",
        )
        try:
            with opener.open(request, timeout=20) as response:
                if response.status != 201:
                    raise RuntimeError(f"Unexpected publish status after {sent} accepted events.")
        except urllib.error.HTTPError as error:
            raise RuntimeError(
                f"Publish returned HTTP {error.code} after {sent} accepted events. "
                "Resolve the failure, then replay the same stable event IDs."
            ) from None
        except (urllib.error.URLError, OSError):
            raise RuntimeError(
                f"Publishing lost connectivity after {sent} accepted events. "
                "The last send may have arrived; replay preserves its event ID."
            ) from None
        sent += 1
    return sent


def main() -> int:
    parser = argparse.ArgumentParser(
        description="Replay validated telemetry using a Fabio connection piped on stdin."
    )
    parser.add_argument("--input", required=True, type=Path, help="Telemetry JSONL file")
    parser.add_argument(
        "--validate-only", action="store_true", help="Validate without credentials or network access"
    )
    args = parser.parse_args()
    try:
        payloads = load_events(args.input)
        if args.validate_only:
            print(json.dumps({"validated_messages": len(payloads)}))
            return 0
        connection = read_connection(json.load(sys.stdin, object_pairs_hook=unique_fields))
        sent = send_events(payloads, connection)
        print(json.dumps({"accepted_messages": sent, "destination_verified": False}))
        return 0
    except (ValueError, RuntimeError, OSError) as error:
        print(f"Replay failed: {error}", file=sys.stderr)
        return 1


if __name__ == "__main__":
    sys.exit(main())
