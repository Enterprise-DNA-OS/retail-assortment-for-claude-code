# What the figures mean

One import is one store, one currency and an inclusive reporting window, with one row per SKU. Reporting windows may not overlap within a store. The latest report is selected by its end date. Range and product performance reads use that report. Category output stays separate for each store, category, currency and exact window. Cluster is a label for grouping, not an automatically calculated segmentation.

Gross margin is sales value minus recorded cost. Margin percent is 100 times that margin divided by sales value. Missing cost yields unknown margin. Zero sales yields unknown margin percent. Category margin is withheld when any included row lacks cost. Sales and cost must use the same tax basis. The importer does not infer it.

Stock cover in days is closing stock units times the number of days in the window divided by units sold. With zero unit sales it is unknown, and the slow-movers review separately flags products with stock and no sales. The default review threshold is 60 days. It is local policy, not a forecast or a legal threshold.

Sales per facing is period sales divided by reported facings. Sales per metre is sales times 1000 divided by facings times product width in millimetres. These measures ignore shelf depth, stacked rows, availability, substitutions, seasonality and demand effects. Zero facings and missing widths yield unknown values. They are descriptive productivity measures, not an optimised physical layout.

Reports older than 14 days appear in attention and cannot support a new decision record. The threshold is an editable local operating policy. Decisions freeze the current source window, currency, metrics and range status. Later range changes do not rewrite that snapshot. A decision is a recommendation, not an instruction sent to a store.

This base accepts nonnegative aggregate units, sales, cost and stock. Negative net returns, transaction-level returns, alternative tax bases or repeated fixture rows require explicit preprocessing and reconciliation. Preserve the source and document each transformation. A missing product is not zero sales. Importing a product report does not declare that all products are in the approved range.
