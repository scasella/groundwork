# Security and privacy

Groundwork is a browser-local educational application with a deliberately small supported domain. It is not a security verifier, proof kernel, production approval system, or authenticated audit service.

## Trust boundaries

Only exact bundled prepared source templates may be instantiated. The loader checks source identity and family membership before using JavaScript function construction. Arbitrary source import is unsupported. This design needs dynamic code evaluation; a deployment CSP that prohibits it will block execution. Do not weaken the template restriction to accommodate user-supplied programs.

The JavaScript runtime, generator, independent expected tables/rules, and checker are trusted. A result's hash is an integrity/identity aid, not a digital signature. An owner who edits their own browser storage can rewrite local history; defending against that owner is not a claimed boundary.

Storage is shape-validated before rendering and malformed originals are preserved for recovery. Current exact-template restrictions can reject older artifacts after an incompatible template update. Export before upgrading or clearing browser data; session import is not available.

## Privacy

There is no backend, account system, analytics, application telemetry, or application-level network API. The app serves locally bundled assets and stores progress in localStorage. Exports can include notes entered in the advanced example and full history: inspect them before sharing. Clear or restart the relevant example on shared machines when appropriate.

## Deployment and reports

Development/preview servers are for local development, not production service hosting. `npm run dev` binds to loopback by default. Use the static production build and your hosting platform's controls for a public deployment. The checked-in hosting metadata contains no existing project identifier.

For a reproducible defect, provide minimal steps and sanitized evidence. Do not post credentials or private session exports in public issues. Use a private reporting channel offered by the repository owner if one is available. This candidate has no separately verified private-reporting setup or response-time guarantee.

Dependency auditing and adversarial tests reduce known risks; they do not establish that the application is secure against all inputs or environments.
