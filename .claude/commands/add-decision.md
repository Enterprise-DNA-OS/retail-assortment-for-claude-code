---
description: Add decision for the retail assortment desk
---

# add-decision

Read range-review, margin-review and gaps. Use --store, --product, --recommendation=keep|review|delist, --reason, --evidence and --actor. The command freezes current evidence. A report older than 14 days is refused. State missing costs and uncertainty in the reason.

Start with the relevant read and run the one CLI: `npm run assortment -- add-decision --store="<store code or ID>" --json`. For writes, supply the required fields above and the real operator. Use help for the complete flags. List ambiguous candidates and let the operator select. Present dates, currency, unknown values and source limitations with the result. Never send, publish or change an external system.
