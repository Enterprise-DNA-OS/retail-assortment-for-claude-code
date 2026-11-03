---
description: Add store for the retail assortment desk
---

# add-store

Record --code, --name, --cluster, --currency, --owner, --due and --actor. Set --unit-pricing=yes only after confirming the store is in scope. The default is no. Do not invent an owner or applicability decision.

Start with the relevant read and run the one CLI: `npm run assortment -- add-store --json`. For writes, supply the required fields above and the real operator. Use help for the complete flags. List ambiguous candidates and let the operator select. Present dates, currency, unknown values and source limitations with the result. Never send, publish or change an external system.
