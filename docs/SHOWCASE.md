# SureShotz · project guide

A React and Vite sports interface with match components and experimental probability, hedging and bankroll utilities.

**For:** Developers exploring sports-data interfaces and calculation tools.<br>
**Current stage:** Frontend prototype · provider setup required<br>
**Reviewed:** 8 September 2026, from repository files and available GitHub workflow records. This is a source review, not a fresh application test or production certification.

## Start with the evidence

- [src/App.tsx](../src/App.tsx)
- [src/components](../src/components)
- [src/utils](../src/utils)
- [src/services/sportsDataService.ts](../src/services/sportsDataService.ts)
- [package.json](../package.json)

## A useful first demo

Show the currently mounted UpcomingMatches screen with explicit provider configuration. If synthetic fixtures are used, label them visibly and keep them separate from live observations.

## Next release checklist

These are proposed acceptance gates. An unchecked item does not imply its implementation is absent; it means fresh release evidence is still needed.

- [ ] Document and provide the missing database setup; move secret provider calls behind a server boundary before public deployment.
- [ ] Make synthetic fallback data explicit in the interface and verify unavailable-provider behaviour.
- [ ] Add tests for probability and bankroll calculations; decide which existing components belong in the supported user journey.

## What to measure

Correct outputs on fixed calculation fixtures and clearly labelled source state for every displayed match.

Publish the dataset or evaluation method, date range, sample size and limitations with each result. Code size, feature counts and agent counts do not measure product usefulness.

## What a finished showcase contains

Configuration guide, labelled demo, calculation tests and an explicit feature-status table.

Keep one dated release record containing the commit, setup steps, required services, checks run, known limitations and rollback instructions. Add screenshots from that version using fictional or consented data; identify demo fixtures clearly.

## Three ways to evaluate this project

| Visitor | Start here | Evidence to look for |
| --- | --- | --- |
| Potential client | The demo scenario above | A repeatable workflow and a measurable outcome |
| Engineering team | Linked source and tests | Design decisions, failure handling and reproducibility |
| Product user or collaborator | README setup and release notes | A supported journey, current limitations and feedback route |

[Repository overview](../README.md) · [Issues](https://github.com/BalaShankar9/SureShotz/issues) · [More projects](https://github.com/BalaShankar9)
