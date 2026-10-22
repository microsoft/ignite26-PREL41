# Exercise 2.5: Read shipment notes with AI Functions

Some of what Contoso Fresh needs to know isn't in a column. Drivers write a note when something happens on the road, such as a temperature alarm or a refused shipment. QA staff write a note when they find an issue at release. Many of the notes are in French.

Fabric AI Functions apply a language model to a DataFrame column in one call. In this exercise, you use `ai.extract` to pull temperatures and durations out of driver notes, and `ai.generate_response` to rewrite QA notes as plain English. The results show in the notebook. Nothing is saved to a table.

## Check your starting point

Cell 15 printed `13 stores received YG-2291, read through OneLake`. If it didn't, finish Exercise 2.3 first.

## Cell 21: Apply the AI Functions settings

AI Functions call a language model that Fabric provides. On Runtime 2.0, Microsoft Learn asks for three temporary settings in each session before the first call: the `gpt-5.1` deployment, low reasoning effort and the model's default temperature.

1. Run the next code cell.
1. Check that it prints `Deployment: gpt-5.1` and `Temperature: None`.

    `None` means the model uses its default temperature. The reasoning effort is set too, but the library has no way to print it.

## Cell 22: Extract temperatures and durations

Cell 22 reads the 30 driver notes on shipments of the related lots. 13 of them are in French. `ai.extract` takes a list of labels, each with a description and a type, and returns one column per label: `temperature_c` as a number and `minutes` as a whole number.

1. Run the next code cell.
1. Check that it prints `30 notes: 30 temperatures, 23 durations`.

    French notes write decimals with a comma, and `temperature_c` holds them as numbers. The 7 notes on refused shipments give no duration. The `minutes` label tells the model to leave the value empty in that case, so those 7 rows have no `minutes`.

## Cell 23: Summarize the QA notes

6 of the related lots have a QA note. Cell 23 runs `ai.generate_response` with a prompt template: `{lot_id}` and `{qa_note}` in the prompt are filled in from each row. The prompt asks for one plain English sentence and a translation of any French note.

1. Run the next code cell.
1. Check that the table has 6 rows, each with a `summary` and an empty `error`.
1. Find YG-2291's summary. It says an environmental swab was sent to the lab and its result was still pending at release. The wording varies from run to run.

    QA released YG-2291 before the swab result came back. The investigation can follow that up.

**Completion check:** Cell 22 printed `30 notes: 30 temperatures, 23 durations`, and cell 23 shows an English summary for each of the 6 QA notes.
