import argparse
import json
import re
from pathlib import Path
from uuid import UUID


def nonzero_uuid(value: str) -> str:
    try:
        identifier = UUID(value.strip())
    except ValueError as error:
        raise argparse.ArgumentTypeError("Expected a nonzero UUID.") from error
    if not identifier.int:
        raise argparse.ArgumentTypeError("Expected a nonzero UUID.")
    return str(identifier)


def sql_host(value: str) -> str:
    host = value.strip()
    if not re.fullmatch(
        r"[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.datawarehouse\.fabric\.microsoft\.com",
        host,
    ):
        raise argparse.ArgumentTypeError("Expected a bare managed Fabric SQL hostname.")
    return host


def main() -> None:
    parser = argparse.ArgumentParser(
        description="Bind the guarded temperature pipeline without run-time parameters."
    )
    parser.add_argument("--workspace", required=True, type=nonzero_uuid)
    parser.add_argument("--lakehouse", required=True, type=nonzero_uuid)
    parser.add_argument("--sql-endpoint", required=True, type=nonzero_uuid)
    parser.add_argument("--sql-host", required=True, type=sql_host)
    parser.add_argument(
        "--output-table",
        choices=("recall_temperature_pipeline_candidate", "recall_temperature_status"),
        default="recall_temperature_pipeline_candidate",
    )
    parser.add_argument("--output", required=True, type=Path)
    arguments = parser.parse_args()

    directory = Path(__file__).resolve().parent
    definition = json.loads(
        (directory / "pipeline-content.json").read_text(encoding="utf-8")
    )
    analysis = directory.parents[2] / "src/sql/module-3-temperature-status.sql"
    activity = definition["properties"]["activities"][0]["typeProperties"]
    source = activity["source"]
    source["sqlReaderQuery"] = analysis.read_text(encoding="utf-8")
    source["datasetSettings"]["linkedService"]["properties"]["typeProperties"].update(
        endpoint=arguments.sql_host,
        artifactId=arguments.sql_endpoint,
        workspaceId=arguments.workspace,
    )
    sink = activity["sink"]
    sink["datasetSettings"]["typeProperties"]["table"] = arguments.output_table
    sink["datasetSettings"]["linkedService"]["properties"]["typeProperties"].update(
        artifactId=arguments.lakehouse,
        workspaceId=arguments.workspace,
    )
    try:
        with arguments.output.open("x", encoding="utf-8") as handle:
            json.dump(definition, handle, indent=2)
            handle.write("\n")
    except FileExistsError:
        parser.error("Output already exists. Inspect it or use a fresh output path.")
    print(f"Bound {arguments.output_table}; definition written to {arguments.output}.")


if __name__ == "__main__":
    main()
