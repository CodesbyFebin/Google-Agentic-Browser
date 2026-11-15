# Security Policy

Google Agentic Browser is an idea-stage prototype, not a production-hardened browser engine. Do not rely on it to carry out real-money transactions or unattended privileged account operations.

## Reporting a vulnerability

**Do not open a public GitHub issue for a security vulnerability.**

Use [GitHub's private vulnerability reporting](https://github.com/CodesbyFebin/Google-Agentic-Browser/security/advisories/new), if the repository has the feature enabled. If it is unavailable, contact the repository maintainer privately through an established contact channel; avoid sharing exploit details publicly until a coordinated disclosure route is agreed.

Please include affected code or version, reproduction steps, impact, and possible mitigations. Do not include real user credentials, session tokens or personal information.

No response-time commitment is currently published. The maintainer should document one when a private reporting channel is operational.

## High-risk areas

Treat server-side Gemini credentials, Firebase token verification, Firestore rules, Google OAuth scopes, SSRF protections, mission execution, single-use approval gates and any Google Workspace write routes as security-sensitive. Maintain authenticated checks and human approval gates; spending is simulation-only.

## Supported versions

The repository currently maintains its default branch and active prototype. There is no published long-term-support release policy.
