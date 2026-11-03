# Move the range-review record from DotActiv

DotActiv's own [PowerBase update](https://dotactiv.com/blog/powerbase-updates-for-january-2020) documents exporting a Product Report to Excel. Its [export help page](https://powerbase.dotactiv.com/knowledge-base/export-reports/) redirects to a member-access page when opened without a login as of 2026-11-03. Confirm the current clicks and report availability in your licensed account. We do not claim to have inspected a signed-in export.

1. Export a Product Report for one store and one reporting window. Retain the original workbook. Save the relevant sheet as UTF-8 CSV. Keep product codes as text so leading zeros survive. Reconcile row count to the original report.
2. Check that there is exactly one row per product. A fixture-level report can repeat a SKU. Aggregate it explicitly before importing, preserving the original and documenting how sales, cost, stock and facings were combined. Never blindly sum duplicated report totals.
3. Copy examples/dotactiv-map.json and set each value to an actual column heading. Required fields are sku, name, category, units and sales_amount. Optional fields are brand, cost_amount, stock_units, facings and width_mm. Omit unavailable optional mappings or leave their values blank in the CSV. Missing values remain unknown.
4. Register the store with its actual currency, cluster, owner and review date. Run the import preview below with your source count, dates and evidence reference. It checks the whole file before loading. Remove --dry-run to load after reconciling the preview.

~~~bash
npm run assortment -- add-store --code=SHOP-01 --name="Your store" --cluster="City" --currency=AUD --owner="Your category manager" --due=2026-11-10 --actor="Your name"
npm run assortment -- import dotactiv --store=SHOP-01 --file=examples/dotactiv-product-report.csv --map=examples/dotactiv-map.json --start=2026-10-26 --end=2026-11-01 --currency=AUD --expected-count=2 --source-ref="Fictional demonstration fixture" --actor="Your name" --dry-run
~~~

The committed CSV and map are illustrative fixtures, not a vendor-generated file or a promise that every DotActiv installation uses those headings. Currency and window are explicit because exported headers vary. Reject an unknown tax basis or mixed reporting window before import. Numeric values use decimal points without currency signs or thousands separators.

The import creates missing product records, preserves the original selected product fields in each observation, and saves the source hash, mapping, source reference, count and operator. It does not store unrelated exported columns. Exact repeats add nothing. Changed or overlapping reports are refused. Failed imports roll back products, observations and report evidence together. There is no silent replace mode.

Use set-range to enter the approved active, paused or delisted range. Product reports alone do not establish that policy. Then compare range-review, gaps, margin-review and source totals. Missing rows are not converted to zero. One command loads the mapped CSV; mapping, export preparation and reconciliation are real work that must be completed first.

What remains separate: FLP planograms, images, floor layouts, automated placement rules, image recognition, live integrations and historical approval workflows do not import through this CSV path. Enterprise DNA scopes the needed visual tools and connections as part of a custom version. Keep your existing tools until those requirements and migrated totals have been accepted.

Export your owned record with npm run assortment -- export --file=exports/assortment.json. It refuses to overwrite an existing export. Keep native database backups and practise recovery. JSON restore is not included.
