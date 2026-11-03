# Validation

2026-11-03: npm install succeeded. npm test passed on Linux with PGlite, exercising all 27 CLI commands and 62 counted checks plus failure and document assertions. npm run demo completed with the committed fictional seed. No production database or customer export was used.

The test uses temporary directories, platform-neutral paths and Node subprocess APIs. GitHub Actions defines Linux, Windows and disposable PostgreSQL 16 jobs. Before those jobs run, their definitions are not evidence that those environments passed.

The importer is tested with an explicitly illustrative mapped product report. A signed-in DotActiv export was not available, so no native-export certification is claimed. See replace-dotactiv.md for the actual mapping contract.
