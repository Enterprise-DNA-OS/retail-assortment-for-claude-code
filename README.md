# Retail Assortment for Claude Code

Own the evidence behind the products you keep on the shelf. A database and one CLI for category managers reviewing store ranges, sales, gross margin, stock cover and follow-up. Built and optionally operated through **Omni by Enterprise DNA**.

## Three ways to own it

| Do it yourself | We customise it | We run it for you |
| --- | --- | --- |
| Free, MIT-licensed source. Install locally and use Claude Code, Codex, OpenCode or Cursor. | Enterprise DNA maps your DotActiv exports and builds your fields, rules, reports and any needed visual tools. | Enterprise DNA installs, connects and operates your agreed system inside Omni. |
| You manage access, backups and updates. | One setup fee, then a retainer. Scope and price are agreed with Sam. | One setup fee, then a retainer. No published service price. |

[Get your version built](https://enterprisedna.co/omni/book?offer=replace-software&utm_source=github&utm_medium=readme&utm_campaign=dotactiv).

## Why this exists

DotActiv's [published pricing](https://dotactiv.com/pricing) lists Enterprise at $4,500 per licence per year, excluding local tax. Five licences imply $22,500 a year. That is a pricing scenario, not a verified customer invoice. The page does not identify the dollar currency, so no NZD, AUD or USD assumption is made here. Checked 3 November 2026.

The free base owns the range-review record. It reads product reports, compares approved ranges with reported products, shows slow movers and unknown costs, and freezes evidence behind a range recommendation. It does not replace DotActiv's visual planogram editor, floor planning or image recognition. Enterprise DNA scopes any needed visual tools and connections before a switch.

## Try the fictional demo

Node 20 or newer. No database account or credentials needed.

```bash
git clone https://github.com/Enterprise-DNA-OS/retail-assortment-for-claude-code.git
cd retail-assortment-for-claude-code
npm install
npm run demo
npm run assortment -- slow-movers --store=DEMO-CBD
npm run view
npm run docs
```

The seed contains two fictional stores, five products, a slow coffee line, tea with no period sales, a missing range item, an off-range product, missing cost and a stale store report. Demo dates are relative to the first seed run. Seeding again adds no duplicate evidence and does not move that original window.

Local storage is PGlite under .data/db. DATABASE_URL selects PostgreSQL. Run npm run migrate against a new database. The included SQL works with both adapters. Use an owner or migration role for setup and a deliberately configured least-privilege operator for shared deployment. Tables have row security enabled with no public policies. This repository is not a multi-tenant hosted application.

## The working week

1. `/range-review`: reconcile the approved range with the latest store report.
2. `/category-review`: read sales and margin for like reporting windows.
3. `/space-review`: compare sales per facing and per metre of reported frontage.
4. `/slow-movers`: find high stock cover and products with stock but no period sales.
5. `/margin-review`: separate known margin from missing cost.

`/weekly-review` combines the range, gaps and overdue work into a private draft. Thirty-two slash commands ship in [.claude/commands](.claude/commands), including `/customise`, `/new-view`, `/compliance` and the write recipes. The one CLI has 27 commands. Run `npm run assortment -- help` for the list. Every command accepts --json. Case-insensitive names and ID prefixes resolve records. Ambiguous matches list candidates and exit 1.

## Bring the product report across

DotActiv documents exporting a Product Report to Excel. Save the relevant sheet as UTF-8 CSV and map the actual column headings. The supplied map and CSV are illustrative, not a vendor-generated export. One report covers one store, one currency, one non-overlapping window and one row per SKU. [The switching guide](docs/replace-dotactiv.md) explains export preparation, mapping and reconciliation.

```bash
npm run assortment -- import dotactiv --store=DEMO-CBD --file=examples/dotactiv-product-report.csv --map=examples/dotactiv-map.json --start=2026-10-01 --end=2026-10-07 --currency=AUD --expected-count=2 --source-ref="Fictional example" --actor="Demo operator" --dry-run
```

Use your real file, dates, currency, source count and operator for real work. Remove --dry-run after checking the preview. Required fields are product code, name, category, units and sales value. Cost, stock, facings, width and brand are optional. Missing metrics remain unknown. Duplicate SKUs and overlapping periods are rejected. Exact repeats add nothing. Changed source evidence is never silently replaced. Products are registered by the import, but approved ranges are entered explicitly with set-range.

## Ten questions to ask

These questions are answered by the shipped CLI. They are not claims that DotActiv cannot answer similar questions.

1. Which approved products are missing from the latest store report? `gaps`
2. Which reported products sit outside the active range? `gaps`
3. Which products have stock but no sales in the reported period? `slow-movers`
4. Which products exceed our chosen stock-cover threshold? `slow-movers --days=60`
5. Which category margins are unknown because a cost is missing? `category-review`
6. How much sales value does each reported facing support? `space-review`
7. Which stores have stale reports or overdue review work? `attention`
8. What did the numbers say when we recorded a range recommendation? `decisions`
9. Which unit-price display checks lack evidence? `compliance`
10. Which source file and mapping produced this report? `imports`

## Your first hour: ten things to ask for

1. Set our business name, logo and colours in brand.json.
2. Register our stores, clusters and actual currencies.
3. Assign each store's review owner and next review date.
4. Confirm whether a store is subject to Australian unit-pricing rules.
5. Register the approved product range.
6. Map a real product report and reconcile its row count.
7. Compare imported sales and cost against the original report.
8. Review missing products and unknown costs before deciding.
9. Record a range recommendation with evidence and a follow-up owner.
10. Render our category review pack and weekly view.

## Calculations, paperwork and boundaries

[Method](docs/method.md) explains the arithmetic and limits. Gross margin is sales minus cost. Stock days use observed period sales, not a forecast. Sales per metre uses facings times product width, not a physical planogram. Reports older than 14 days cannot support a new saved decision. These are review policies, not legal deadlines.

`npm run view` produces private weekly and space-review HTML. `npm run docs` produces category review packs and saved decision records. Both use brand.json. `/draft-range-review` writes to drafts and never sends. [Why no front end](docs/why-no-front-end.md).

`/compliance` flags missing or aged unit-price display evidence for explicitly in-scope stores. It does not inspect displays, verify the truth of an evidence reference or certify compliance. [Rules and official sources](docs/compliance.md).

Typed operator names provide attribution, not authentication. Shared hosting requires identity enforcement, permissions, backup recovery tests and a retention policy. Keep customer data out of git. Reports, observations, decisions and events are append-only for normal application use, but the database owner can bypass these protections.

`npm run assortment -- export --file=exports/assortment.json` writes all eight record types in one consistent read and refuses to overwrite files. Native database backups remain necessary. JSON restore is not shipped.

## Validation

`npm test` runs the migration, seed and all 27 CLI commands in temporary storage. It checks arithmetic, unknown values, import replay, malformed input, currency separation, overlapping windows, frozen decisions, ambiguous matches, escaped documents and private exports. Linux PGlite passed locally. The GitHub workflow also defines Windows and PostgreSQL checks. Their actual run status is recorded in [validation](docs/validation.md).

[Selection and sources](docs/research.md). [Command index](docs/command-index.json). This project is independent of DotActiv and is not endorsed by it.
