---
name: Bug report
about: Report incorrect validation, broken example, or missing feature
title: "[bug] "
labels: ["bug"]
assignees: []
---

## What happened

A clear description of the bug.

## To reproduce

```bash
node n8n-myanmar-workflow-builder/scripts/validate-workflow.cjs my-workflow.json
```

Expected output:

```
(no errors)
```

Actual output:

```
ERRORS:
  ...
```

## Workflow JSON (sanitized)

Paste your workflow JSON with credential IDs and secrets removed.

## Environment

- OS: [e.g. Windows 11, macOS 14, Ubuntu 24.04]
- Node.js: [output of `node -v`]
- n8n version: [if relevant]
- Cursor version: [if relevant]

## Additional context

Anything else that helps.
