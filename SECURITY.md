# Security Policy

## Supported Versions
- **Scope:** This workspace and all packages under `packages/` (e.g., `@ng-catbee/monaco-editor`).
- **Security fixes target:** Latest release of each package and the previous minor when feasible.
- **Pre-releases are not supported** for security fixes.

## Reporting a Vulnerability
Do **not** open public issues for security reports.
- **Preferred:** Open a private advisory (GitHub > Security > Advisories > Report a vulnerability) if this repo is hosted on GitHub.
- **Alternative:** Email a private report to **security@catbee.in** with:
  - Affected package(s) and version(s)
  - Environment details (Angular/Node/OS)
  - Impact assessment and PoC or reproduction steps
  - Any relevant logs or stack traces

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

## Notes for Consumers
- Follow Angular security best practices (sanitization, avoid unsafe DOM APIs).
- When using Monaco, avoid executing untrusted code; disable features that evaluate arbitrary input.

## Contact
For urgent security matters: **security@catbee.in**
