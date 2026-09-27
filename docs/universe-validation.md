# Universe workshop validation — 2026-09-27

Current release: **0.3.0-rc.1**. This replaces the normal four-starter shelf with one physics workshop. Existing starter data is preserved behind an archived-work route. The name-badge, shopping, audio, and account code remains supported.

## Consultation and decision

Three GPT-6 Astra agents at medium reasoning effort independently considered game design, novice learning/accessibility, and verification engineering. Their initial proposals differed. After inspecting the supplied Tiny Universe project and six accompanying ideas, all recommended editable local physics. A second critique round established direct before/after authorship, synchronized futures, concrete witnesses, separate law revision, and explicit limits. The creator/play persona also implemented and critiqued the renderer; the verification persona reviewed integrity across the UI/session/export boundary.

These are model-assisted expert perspectives, not human participants or evidence that the experience is fun. No uncoached first-time human study was conducted. Tiny Universe was inspected read-only; its code, source rules, proofs, and server were not modified. Groundwork does not claim its native proof/GPU capabilities.

## Automated checks

macOS Apple Silicon; Node 24.21.0; existing locked dependencies, no dependency upgrades.

| Command | Observed result |
| --- | --- |
| `npm test` | 58 passed, 0 failed |
| `npm run test:ui` | 38 passed, 0 failed across 5 files |
| `npm run build` | Passed |
| `npm run test:sites` | 4 passed, 0 failed |

Engine tests use actual source execution and an independent interpreter. They cover reference/mirror/order semantics, all local contexts, malformed inputs, authored rising water, duplication/repair, alchemy/promise revision, fixed stone, field/seam composition, source identity and minification, cancellation, budgets, immutable evidence and corruption. Export tests compare module behavior and bytes, exercise standalone controls, and test safe text encoding. UI tests cover adoption, imports, late results, real checker outcomes, modal focus, persistence, account isolation, scene replacement and stable direction painting. WorldCanvas callbacks are mocked in the UI suite; real browser checks below cover the actual renderer.

## Browser-operated journeys

Used the Codex in-app Chromium browser on separate local development and production origins. The browser-control API did not expose its exact build number. Desktop captures used **840×900**, with **390×844** narrow editing and **320×800** reflow/dialog inspection. No page-wide horizontal overflow was observed in those states.

| Scenario | Observed outcome |
| --- | --- |
| Paint and author | Poured four water cells; created a before/after rule and swapped original cells. At equal step 80, current water pooled while trial water rose. Both retained 1,008 grains, including the four added by the brush. |
| Rule interaction | Added sand→water ahead of the rising-water rule. The executable matched its independent interpretation and conserved total matter, while the original per-material promise failed. |
| Human intent revision | Replayed the sand→water witness. Reviewed and approved material conversion. The **same source identity** failed under promise revision 1 and passed under revision 2. A fresh explicit adoption followed; the original failure remained historical. |
| Rejection and repair | Authored water copying. At step 80, current physics retained 1,008 grains while the trial reached 4,096. The checker computed a one-water-cell→two-water-cell witness. Adoption was unavailable. Replacing the original position with Empty repaired copying into movement; promises stayed unchanged, a new check passed, and a new version was adopted. |
| Stop a real check | Stopped after 2,048 local cases but before the separate engine fixtures completed. Restored outcome: **inconclusive**, no passing adoption evidence. |
| Refresh during a real check | Reloaded at **1,664/2,048** local cases. Restoration recorded **interrupted/inconclusive** and required a new check. |
| Persistence/history | Reload retained authored programs, promise revision 2, historical passes/failures/inconclusive runs, and three adoption decisions. Exact adopted HTML snapshots and their digests were preserved. |
| Production creation | Repeated the upward-water creation/check/adoption/download path against the production build. A new scene preserved physics and prior scene history. Actual encounter capture displayed the saved source's before/after result and selected rule. |
| Keyboard/reflow | Used keyboard world painting, slider scrubbing, focusable cell swaps, selects, checkboxes, Escape and dialog focus. Rule diagrams and long identifiers remained usable at narrow widths. |
| Downloads | HTML, editable JSON and full-history backup actually downloaded in the browser. The HTML matched the source-generated export bytes. Its standalone player was opened separately: Step worked, keyboard painting added nine grains to the brush ledger, and physics change stayed zero. |
| Runtime | No error/warning messages were recorded in the exercised production tab. Required app assets and standalone content rendered. |

## Recorded artifact chain

The development browser journey produced:

| Revision | Promise revision | Result | Meaning |
| --- | --- | --- | --- |
| 4 | 1 | Pass; adopted | Authored rising water, preserving materials and stone |
| 9 | 1 | Fail | Sand→water violated per-material conservation |
| 9 | 2 | Pass; adopted | Same executable, deliberately changed promise |
| 15 | 2 | Fail | Copying water created matter |
| 15 | 2 | Inconclusive | Stopped before all checking completed |
| 15 | 2 | Inconclusive | Interrupted by refresh at case 1,664 |
| 17 | 2 | Pass; adopted | Repaired copying into movement |

The final revision-17 source identity was `524ee75d42e2ba9e3c972d9583d57d4c348c253ee39969a3c15b90fe64b3233f`. Its browser-downloaded HTML hash was `169e5ec5e5be5064cac571aa3e35d9c36745f849b572c96b94f1d3661f74c733`; exact reconstruction matched. These are artifact identities, not signatures or independent attestations. The final checker protocol was then revalidated with the same executable family; checker changes conservatively make older results historical.

## Findings fixed before publication

- Initial duplicate worlds reduced the main interaction to tiny previews. The workshop now starts with one large world and reveals synchronized comparison for proposals.
- After-cell controls shrank and overlapped at intermediate widths. Responsive grids and explicit Before/After labels make the rule pictures readable.
- Wildcard references initially appeared as Empty. They now retain the visible Any meaning; captured examples show separately identified actual outputs.
- Saved adoption records needed explicit links to matching passing evidence. Restore now validates those relationships and exact saved export hashes.
- Brush edits needed reconstructible prior state. Gesture checkpoints retain source, seed and comparison step before editing.
- Trial painting initially rebuilt from the current branch. It now preserves the world actually painted as the new shared seed.
- Direction painting could change layout during its first stroke. The trial is now present before field painting begins.
- Script delimiters and Unicode separators in rule names required encoding in canonical source before HTML embedding.
- Assumptions and exclusions now have canonical identities in the evidence binding. Changing declared scope invalidates currency even when a record's outer hash is recomputed; the final checker is `local-3`. Older results remain historical.
- Stopped/late checks, blocked storage, quota failures and interrupted reloads fail closed; they never display current passing adoption evidence.

## Remaining limits

Only the declared four materials, 64×64 engine, eight-rule language and finite contexts are supported. No arbitrary source import, native Bend/Lean proof, GPU benchmark, live model generation, real fluid simulation, cloud sync or server-hosted personal universes. The HTML download is a player; editable JSON reopens the authoring workspace.

Local enumeration plus 15 engine fixtures is not a machine-checked all-world/all-tick theorem. The renderer, compiler/runtime, reference evaluator and checker remain trusted. Source hashes and browser history are unsigned. Template-family changes can require recovery of older saved work.

Native browser 200% zoom, Safari/Firefox, touch hardware, comprehensive contrast/screen-reader conformance, and human engagement/comprehension remain unverified in this round. Narrow reflow is not a substitute claim for native zoom testing.
