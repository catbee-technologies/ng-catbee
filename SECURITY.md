# Security Policy

## Supported Versions

- **Scope:** This workspace and all packages under `packages/` (e.g., `@ng-catbee/monaco-editor`, `@ng-catbee/storage`).
- **Security fixes target:** Latest release of each package and the previous minor version when feasible.
- **Pre-releases are not supported** for security fixes.

## Reporting a Vulnerability

Do **not** open public issues for security reports.

- **Preferred:** Open a private advisory (GitHub > Security > Advisories > Report a vulnerability) if this repo is hosted on GitHub.
- **Alternative:** Email a private report to **security@catbee.in** with:
  - Affected package(s) and version(s)
  - Environment details (Angular version, Node.js, OS, browser)
  - Impact assessment and PoC or reproduction steps
  - Any relevant logs, stack traces, or console output

We will acknowledge receipt within **3 business days** and triage within **7 days**. We will coordinate timelines and mitigation steps based on severity.

## Disclosure

We follow coordinated disclosure:

- Keep reports private until a fix or mitigation is available.
- We aim to publish fixes and a security advisory as soon as practical.
- **Default disclosure window:** 90 days, adjustable by mutual agreement.

## Scope of Testing

**Allowed:**

- Local testing against a private clone and test data
- Static and dynamic analysis that does not impact others

**Not allowed:**

- Denial of service against CI/CD or related infrastructure
- Exfiltration of non-public data or credentials
- Social engineering or attempting to access private systems

## Dependencies

We regularly update dependencies (e.g., via Renovate) and prioritize security updates.

- Consumers should keep dependencies current and run:
  - `npm audit`
  - `npm outdated`

## Notes for Consumers & Best Practices

- **Angular Security Model:** Follow Angular security best practices (context-aware DOM sanitization, avoid unsafe `bypassSecurityTrust*` calls unless strictly necessary).
- **Monaco Editor:** When embedding Monaco Editor (`@ng-catbee/monaco-editor`), avoid executing untrusted code directly in the main thread; disable or isolate features that evaluate arbitrary user input, and configure web workers securely.
- **Storage & Cookies:** Do not store sensitive unencrypted secrets (tokens, passwords, PII) in insecure client storage (`@ng-catbee/storage`, `@ng-catbee/cookie`, `@ng-catbee/indexed-db`) without appropriate client encryption and `Secure` / `SameSite` flags.
- **JWT Handling:** Validate token signatures and expiration on the backend; `@ng-catbee/jwt` client-side parsing is for display and state management, not security enforcement.

## Contact

For urgent security matters: **security@catbee.in**
