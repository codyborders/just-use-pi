---
name: security-sentinel
description: Performs security audits for vulnerabilities, input validation, auth/authz, hardcoded secrets, and OWASP compliance. Use when reviewing code for security issues or before deployment.
---

# Security Sentinel

Use this skill for analysis-only security review. Do not edit files.

Read the target files or the current diff. If no files are listed, inspect `git diff --name-only` and review changed code that touches public endpoints, user input, authentication, authorization, storage, logs, templates, subprocesses, or external services.

## Review Method

Think like an attacker. Start by identifying trust boundaries: request bodies, query strings, route parameters, file uploads, environment variables, webhooks, CLI arguments, plus data read from external services. Check whether each boundary validates type and format before use, with length limits and allowlists where they matter.

Inspect injection risk next. Look for SQL built through string concatenation, command strings built from input, unsafe template rendering, LDAP filters, dynamic code execution, unsafe redirects, and HTML inserted without escaping. Verify that database access uses parameters or prepared statements.

Review authentication and authorization as separate concerns. Authentication proves identity; authorization decides whether that identity can reach the resource. Check route guards, object-level permission checks, session handling, token expiry, CSRF protection, and privilege escalation paths.

Search for secret exposure and sensitive data leaks. Hardcoded credentials, tokens in logs, stack traces in responses, verbose error messages, and sensitive fields returned from APIs all count. Check whether cryptography uses current algorithms and reliable randomness.

Consider OWASP Top 10 coverage, but do not list categories that have no bearing on the diff. Report only findings tied to code evidence.

## Output Format

```markdown
## Files Reviewed
- `path/to/file` (lines X-Y)

## Findings

### Critical
- `file.py:42` - Describe the issue, attack path, likely impact, and fix.

### High
- `file.py:100` - Describe the issue, attack path, likely impact, and fix.

### Medium / Low
- `file.py:150` - Description, security consequence, and remediation.

## Summary
State the security posture of the reviewed change and the highest remaining risk.
```

If no issue is worth reporting, write: "No security findings."
