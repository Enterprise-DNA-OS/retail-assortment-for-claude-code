---
description: Set range for the retail assortment desk
---

# set-range

Read range-review and gaps first. Use --store, --product, --status=active|paused|delisted, --reason and --actor. This changes the internal approved range only. It does not send a store instruction, edit a shelf or change a price.

Start with the relevant read and run the one CLI: `npm run assortment -- set-range --store="<store code or ID>" --json`. For writes, supply the required fields above and the real operator. Use help for the complete flags. List ambiguous candidates and let the operator select. Present dates, currency, unknown values and source limitations with the result. Never send, publish or change an external system.
