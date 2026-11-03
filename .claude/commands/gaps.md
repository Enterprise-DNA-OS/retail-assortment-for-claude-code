---
description: Gaps for the retail assortment desk
---

# gaps

Read both approved products missing from the latest report and observed products outside the active range. Missing does not mean zero sales. Reconcile source completeness before changing a range.

Start with the relevant read and run the one CLI: `npm run assortment -- gaps --store="<store code or ID>" --json`. For writes, supply the required fields above and the real operator. Use help for the complete flags. List ambiguous candidates and let the operator select. Present dates, currency, unknown values and source limitations with the result. Never send, publish or change an external system.
