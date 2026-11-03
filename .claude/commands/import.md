---
description: Import for the retail assortment desk
---

# import

Read docs/replace-dotactiv.md. Export the product report to Excel, save the sheet as CSV, and explicitly map the actual headers. Run `npm run assortment -- import dotactiv` with the required flags and --dry-run first. Confirm source row count, store, dates and currency. Remove --dry-run only when the supplied import instruction authorises loading. Never overwrite changed or overlapping evidence.

Start with the relevant read and run the one CLI: `npm run assortment -- import dotactiv --store="<store code or ID>" --json`. For writes, supply the required fields above and the real operator. Use help for the complete flags. List ambiguous candidates and let the operator select. Present dates, currency, unknown values and source limitations with the result. Never send, publish or change an external system.
