# Architecture and assurance boundary

Groundwork separates four things: an approved rule, a stored executable artifact, a computed evidence record, and an optional human decision.

## Universe workshop (current creation experience)

The normal `?studio=1` entry opens a 64×64 discrete world. Four cell values represent empty space, sand, water, and stone. Every whole tick applies two disjoint 2×2 partitions, at even and odd offsets, with wrapping boundaries. The wrapped top-left block coordinate selects its direction from an 8×8 field map.

People author up to eight ordered local rules. A before-cell matches a literal material or any material. An after-cell reads one of the four original cells or writes a literal material. The first enabled direct match wins; optional horizontal reflection is tried before moving to the next rule. Direction filters use world coordinates. Matching/output pictures use the frame oriented with the field pointing down, and outputs rotate back. Unmatched encounters use the prepared falling/spreading behavior. These operations permit copying, destruction, transformation, and motion; validity is not guaranteed by the editor.

The canonical artifact contains both `rule(block, context)` and `step(world)` as standalone JavaScript source. Literal templates and normalized JSON keep its bytes stable across minification. Source identity and exact template-family membership are checked before evaluation. The browser and checker execute that stored source; exports embed its exact module bytes. This is a restricted source loader, not a universal JavaScript verifier. User text is encoded safely before entering module source or HTML.

An independent interpreter supplies expected local outputs and metadata for 256 arrangements × four directions × two phases. Separate invariant evaluators count matter/materials and inspect stone positions. Full enumeration is **2,048 local cases**. The same artifact also receives 15 independent whole-engine fixture steps: five declared worlds × three ticks, including wrap and field seams. These fixture tests are not an induction proof of engine composition. No Bend/Lean checker, native compiler, GPU benchmark, or live model service runs in this browser application.

The constitution always protects total matter; per-material counts and fixed stone positions are explicit optional promises. A change requires a reviewed requirement revision. Evidence binds source/revision, law/revision, checker, configuration, complete bounds, assumptions, exclusions and witnesses. Source/reference conformance and elected laws are distinct properties. Stop, refresh interruption, invalid work and exhausted budgets remain inconclusive; generation guards reject late completion after an edit or stop.

Current and trial programs are replayed from the same frozen scene to the same selected step. Eighty steps is the comparison horizon, not the local checking domain. Captured encounters show an actual selected rule/output from an identified snapshot. Witnesses are labeled possible inputs, not claimed occurrences in today's drawing. Adoption retains the displayed trial world, comparison seed/step, source, law, report identity, and exact exported HTML plus its hash.

Scene and brush edits are outside physics. They retain restorable snapshots and do not invalidate a local rule result that covers every supported input. Direction fields are executable configuration and do invalidate evidence. Starting another comparison from a trial is an explicit scene change; it does not adopt the proposed program. Stored kept worlds remain available.

`groundwork.universe.v1` stores the workshop separately from lessons and archived starters. Restore validates shape, source, evidence hashes and decision-to-report relationships. Invalid originals are preserved for recovery. Editable project imports accept program settings, scene and promises only; they never import source, evidence or acceptance. Import confirmation exposes changed promises. Full-workspace backups are export-only. Local history is editable and unsigned.

## Beginner checks

The badge rule operates on four fixed fictional people. Independent literal answers define the first-name and full-name outputs. Candidate source produces the badge text; the checker and live sample load exactly that identified source.

The shopping model has two bought flags, four states, mark-needed-item operations, and reset. Its candidate returns state, visible rows, and a receipt. The UI renders those outputs instead of independently repeating the filter. The checker tests four view cases and eight enabled transitions against separate state/transition/display tables.

Beginner checks are synchronous because the domains are tiny. Results record snapshots, source/rule revisions, checker/reference/configuration identities, expected/actual cases, property outcomes, assumptions, exclusions, and completion. Historical currency is computed against current dependencies; a historical pass is not automatically current or accepted.

## Archived starter projects (0.2)

The four starter editors share a versioned workspace in `groundwork.starters.v1`. Each draft has a validated configuration and monotonically increasing revision. Checking creates a snapshot of its contract, source, exact standalone exports, configuration, assumptions, exclusions, outcome, and any failure witness. A keep decision references one completed, current passing result; exporting a draft does not create such a decision.

Literal source templates remain byte-stable across development and production minification. The loader checks SHA-256 identity and exact membership in a supported family before instantiating the module. The preview and checker call that same module. HTML exports contain its exact source in an inline module. User text is encoded safely and rendered as text; symbols are bundled Phosphor assets. No arbitrary source or SVG import is supported.

- **Pattern:** a 32-cell seed produces a 64-cell tile under reflection or half-turn. An independent coordinate formula supplies expected cells. Separately, the checker decodes 1,024 generated SVG rectangles and compares positions and colors. This does not check printer fidelity or artistic quality.
- **Memory:** four chosen symbols each occur twice. The checker validates that composition, then independently explores all reachable open/matched/pending states for the chosen arrangement and all ten supported actions. No timers, scores, or randomness guarantees are included.
- **Story:** five scenes with restricted forward destinations form an acyclic graph of depth at most two. The checker explores choice, Back, and Restart behavior. Explicit Back is not part of the forward no-loop claim. The words' quality and meaning remain human judgments.
- **Garden:** three pots have stages 0–2. Water is unlimited or three shared drops refilled by a manual Next turn. Independent transition rules check local growth, resource use, reset, and refill.

These small checks run synchronously, with a 10,000-transition budget (pattern checks 64 tile cells and the fixed SVG separately). Exhausting the budget or encountering invalid source yields an inconclusive result. Changes to draft revision, contract, source, checking conditions, or generated export bytes invalidate currency. Checker semantic changes require a checker-version bump. Old checked exports retain their original bytes rather than being regenerated by a newer renderer.

Editable project imports accept bounded settings only, discard extra fields, and create a new unchecked draft after confirmation. They never import source, evidence, or keep decisions. Restoring a historical design also creates a fresh draft. Only saved checked versions are retained in history; each project has one current editable draft. Playback is temporary, not saved game progress.

## Queue checks

The advanced queue explores reachable states from an empty queue with A/B pushes and pop. Capacities 1–6 and two overflow policies are supported. It yields between transitions for pause/stop. A refresh during an active run restores interrupted evidence; late completion cannot overwrite a newer run's current evidence.

## Persistence and recovery

Starter, beginner, and queue sessions use separate versioned localStorage keys. Restores validate canonical rules/source, evidence identities, primitive display values, histories, and active-run artifact shapes before React receives them. Invalid original data are preserved until deliberate replacement. A valid defective queue may contain capacity+1 items; malformed non-A/B values are not the same as that intentional overflow.

Repairs, changes of intent, and acceptance events remain separate. Acceptance is idempotent for the same current result. Finishing a lesson is not acceptance. Changing input examples within the already-checked finite domain does not change the artifact.

## Limits

The checks are not theorem-kernel proofs or universal JavaScript verification. They trust the runtime, prepared generator, reference specification and checker. They do not prove the UI renders correctly or that the user chose the right requirement. Browser UAT and automated UI tests are separate evidence. Simulated persona reviews are not human usability studies.

## Optional Sites identity

The platform handles `/signin-with-chatgpt` and `/signout-with-chatgpt`. A small Worker wrapper exposes `/api/session` only as a same-origin, non-cacheable identity read. It trusts the platform’s forwarded ID/email headers only when explicitly enabled for Sites; it returns an opaque ID without email or name. No application auth database or token exchange is implemented.

The frontend resolves identity before mounting a workspace and selects a per-account localStorage namespace. Identity is revalidated on focus, page restoration, and visibility changes; existing content is hidden until the check succeeds. Network/identity errors do not silently open another workspace. Sites-configured production builds require the account endpoint and reject unexpected HTML instead of treating it as guest mode. Static/dev servers without the endpoint run as guests. Sign-in does not synchronize project or lesson records or authenticate their exported history.
