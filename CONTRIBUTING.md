# Contributing

Groundwork is a deliberately bounded educational prototype. Start by reproducing an issue in one of the supplied examples.

## Local checks

Use the Node version in `.nvmrc`, install with `npm ci`, then run `npm run check`. The build includes the preserved Sites packaging contract. Do not commit `node_modules`, build output, local session exports, credentials, or browser captures containing personal information.

Keep changes narrow and add regression coverage for observed defects. Verify the actual browser for interaction/layout changes; jsdom tests do not establish visual correctness. Report browser, viewport, steps, expected result, actual result, and whether the failure concerns program data, rendering, storage, or checking.

## Important boundaries

- A repair changes the program while preserving the rule. A requirement revision needs an explicit before/after review.
- The live example and checker must use the same identifiable stored source artifact. Expected answers must remain independent of candidate code.
- Outcome, currency, and human acceptance are separate. A stopped, errored, incomplete, invalid, or stale result cannot become an accepted current pass.
- Preserve historical evidence and decisions. Browser storage must be validated before rendering; failed restoration must not overwrite the original.
- Keep prepared templates labeled honestly. Do not introduce pretend AI generation or simulated verifier outcomes.
- Changes to checking semantics must update checker/reference identities and account for persisted artifacts. Unsupported historical templates may require an export-and-restart recovery path; do not silently execute arbitrary old source.
- The deliberate queue overflow demonstration can persist capacity+1 valid A/B values. Storage validation must preserve that demonstration while rejecting malformed values.

## Project layout

- `src/Groundwork.jsx`: default beginner and advanced-audio routing.
- `src/Lessons.jsx`, `src/lesson-engine.js`, `src/lesson-session.js`: beginner UI, executable checks, and session lifecycle.
- `src/App.jsx`, `src/engine.js`, `src/session.js`: audio queue.
- `src/storage-validation.js`: shared storage shape guards.
- `tests/`: Node integrity tests, jsdom interaction tests, and Worker/build tests.
- `worker/index.js`, `scripts/prepare-sites-build.mjs`: optional Sites packaging.

The CI workflow is read-only and pins action commits. A local pass does not imply CI has run on GitHub or every supported platform.
