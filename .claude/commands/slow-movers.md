---
description: Slow movers for the retail assortment desk
---

# slow-movers

Show products with stock and no sales in the period, or stock cover above the selected threshold. Default --days is 60. This is retrospective cover, not a demand forecast or a recommendation to delist.

Start with the relevant read and run the one CLI: `npm run assortment -- slow-movers --store="<store code or ID>" --json`. For writes, supply the required fields above and the real operator. Use help for the complete flags. List ambiguous candidates and let the operator select. Present dates, currency, unknown values and source limitations with the result. Never send, publish or change an external system.
