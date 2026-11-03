---
description: Imports for the retail assortment desk
---

# imports

Read reporting periods, source references, row counts, field maps and hashes. Reconcile to the original export rather than assuming a successful import proves completeness.

Start with the relevant read and run the one CLI: `npm run assortment -- imports --store="<store code or ID>" --json`. For writes, supply the required fields above and the real operator. Use help for the complete flags. List ambiguous candidates and let the operator select. Present dates, currency, unknown values and source limitations with the result. Never send, publish or change an external system.
