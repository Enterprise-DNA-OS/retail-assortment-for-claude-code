---
description: Close action for the retail assortment desk
---

# close-action

Read actions, then use --action=<ID> --resolution=<what happened> --actor=<operator>. Already closed actions are rejected. No message is sent.

Start with the relevant read and run the one CLI: `npm run assortment -- close-action --json`. For writes, supply the required fields above and the real operator. Use help for the complete flags. List ambiguous candidates and let the operator select. Present dates, currency, unknown values and source limitations with the result. Never send, publish or change an external system.
