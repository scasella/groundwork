# Architecture and assurance boundary

Groundwork separates four things: an approved rule, a stored executable artifact, a computed evidence record, and an optional human decision.

## Beginner checks

The badge rule operates on four fixed fictional people. Independent literal answers define the first-name and full-name outputs. Candidate source produces the badge text; the checker and live sample load exactly that identified source.

The shopping model has two bought flags, four states, mark-needed-item operations, and reset. Its candidate returns state, visible rows, and a receipt. The UI renders those outputs instead of independently repeating the filter. The checker tests four view cases and eight enabled transitions against separate state/transition/display tables.

Beginner checks are synchronous because the domains are tiny. Results record snapshots, source/rule revisions, checker/reference/configuration identities, expected/actual cases, property outcomes, assumptions, exclusions, and completion. Historical currency is computed against current dependencies; a historical pass is not automatically current or accepted.

## Queue checks

The advanced queue explores reachable states from an empty queue with A/B pushes and pop. Capacities 1–6 and two overflow policies are supported. It yields between transitions for pause/stop. A refresh during an active run restores interrupted evidence; late completion cannot overwrite a newer run's current evidence.

## Persistence and recovery

Beginner and queue sessions use separate versioned localStorage keys. Restores validate canonical rules/source, evidence identities, primitive display values, histories, and active-run artifact shapes before React receives them. Invalid original data are preserved until deliberate replacement. A valid defective queue may contain capacity+1 items; malformed non-A/B values are not the same as that intentional overflow.

Repairs, changes of intent, and acceptance events remain separate. Acceptance is idempotent for the same current result. Finishing a lesson is not acceptance. Changing input examples within the already-checked finite domain does not change the artifact.

## Limits

The checks are not theorem-kernel proofs or universal JavaScript verification. They trust the runtime, prepared generator, reference specification and checker. They do not prove the UI renders correctly or that the user chose the right requirement. Browser UAT and automated UI tests are separate evidence. Simulated persona reviews are not human usability studies.

## Optional Sites identity

The platform handles `/signin-with-chatgpt` and `/signout-with-chatgpt`. A small Worker wrapper exposes `/api/session` only as a same-origin, non-cacheable identity read. It trusts the platform’s forwarded ID/email headers only when explicitly enabled for Sites; it returns an opaque ID without email or name. No application auth database or token exchange is implemented.

The frontend resolves identity before mounting a lesson and selects a per-account localStorage namespace. Network/identity errors do not silently open another workspace. Static/dev servers without the endpoint run as guests. Sign-in does not synchronize lesson records or authenticate their exported history.
