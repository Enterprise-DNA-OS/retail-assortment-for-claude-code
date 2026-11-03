# Validation

2026-11-03: npm install succeeded. npm test passed on Linux with PGlite, exercising all 27 CLI commands and 62 counted checks plus failure and document assertions. npm run demo completed with the committed fictional seed. No production database or customer export was used.

The test uses temporary directories, platform-neutral paths and Node subprocess APIs. GitHub Actions defines Linux, Windows and disposable PostgreSQL 16 jobs. All three jobs passed on the authored build: [GitHub Actions run 41571505544](https://github.com/Enterprise-DNA-OS/retail-assortment-for-claude-code/actions/runs/41571505544). Linux PGlite, Windows PGlite and PostgreSQL 16 were exercised, not just configured.

The importer is tested with an explicitly illustrative mapped product report. A signed-in DotActiv export was not available, so no native-export certification is claimed. See replace-dotactiv.md for the actual mapping contract.

The weekly HTML was rendered and visually inspected. The category summary was reduced to seven columns so source windows, sales and margin are visible together on a desktop. Product detail remains available from the CLI and category review pack.
