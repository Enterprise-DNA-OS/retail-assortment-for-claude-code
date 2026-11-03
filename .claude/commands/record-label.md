---
description: Record label for the retail assortment desk
---

# record-label

Use --store, --product, --evidence, --checked=YYYY-MM-DD and --actor after a human has checked the actual display or documented an exemption. Read docs/compliance.md. A future date is rejected. Never fabricate evidence.

Start with the relevant read and run the one CLI: `npm run assortment -- record-label --store="<store code or ID>" --json`. For writes, supply the required fields above and the real operator. Use help for the complete flags. List ambiguous candidates and let the operator select. Present dates, currency, unknown values and source limitations with the result. Never send, publish or change an external system.
