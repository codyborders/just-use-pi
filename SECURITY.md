# Security Policy

## Reporting a Vulnerability

Do not open a public issue for a suspected vulnerability or exposed credential. Use GitHub's private vulnerability reporting for this repository.

Include the affected path, expected impact, reproduction details, and any evidence needed to verify the report. Do not access data beyond what is necessary to demonstrate the issue.

## Repository Scope

This repository must not contain authentication files, model credentials, session transcripts, local trust decisions, or machine-specific state. The ignore rules cover known Pi runtime paths, but contributors remain responsible for reviewing staged files before committing.

Pi extensions execute with the user's permissions, and skills can direct an agent to run commands. Review changes to either resource as executable code.
