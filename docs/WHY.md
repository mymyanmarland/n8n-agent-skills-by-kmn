# Design Notes - Why This Skill Exists

## The problem

Building n8n workflows from scratch is **pattern-rich and detail-heavy**. A new user has to discover:

- which node types exist (728 in the wild),
- how to escape HTML for Telegram,
- how to wire an AI agent with a model and memory,
- how to keep secrets out of workflow JSON,
- how to deduplicate across runs,
- how to schedule in `Asia/Yangon` and serve webhooks safely,

...all before writing the first node. Tutorials cover the basics but leave production gaps. Templates exist but use random credentials and don't validate.

## What we did differently

We studied **eight real production workflows** running on a local Docker n8n host and **18,070 importable templates** from the community library. We extracted the patterns that actually work, the scripts that actually validate, and the rules that actually keep secrets safe.

Then we packaged that knowledge so a Cursor agent can apply it on demand.

## Five design decisions

### 1. Builders over hand-edits

Workflows are emitted by Node.js scripts that produce importable JSON. Reasons:

- reproducible (rebuild from source-of-truth),
- testable (validate the script output),
- diffable in code review,
- shareable (a script can be templated for many workflows).

The shipped `scripts/build-workflow.cjs` is the minimal version. The project's existing `scripts/build-*.cjs` files are the per-workflow evolution of the same idea.

### 2. Two-layer validation

Structured Output Parser alone is not enough. AI models occasionally emit a valid JSON schema with **wrong content** (invented URLs, escaped entities, hallucinated IDs). We always add a **second-layer JavaScript validator** that:

- checks required keys,
- enforces allow-lists for categorical fields,
- verifies URLs against a known source list,
- measures post-parse visible text length (not raw HTML),
- and aborts before delivery if any check fails.

### 3. Reserve-before-send for irreversible delivery

For jobs, listings, vocabulary, prompts, and tips posted to a public Telegram channel, the workflow:

1. inserts reservation rows first (`reservationState: "reserved"`),
2. generates content,
3. delivers,
4. updates rows to `sent` only after Telegram returns a `message_id`,
5. leaves reservations in place on failure so the same job is never retried.

This stops duplicates when the same job appears on multiple sources or when delivery fails for transient reasons.

### 4. Credential names only - never values

The skill enforces a simple rule: workflow JSON references credentials by `name`. Real secrets live in `n8n_data` encrypted at rest. The auditor script scans every file in the project for accidental secret strings (OpenAI `sk-`, Anthropic `sk-ant-api03-`, Telegram bot tokens, GitHub PATs, AWS access keys, etc.) and exits non-zero on any match.

This pattern keeps the workspace shareable and keeps your Bot Tokens out of chat history.

### 5. Local-first + narrow public surface

The n8n editor binds to `127.0.0.1:5678`. Public HTTPS is only used for the Telegram webhook path through a `cloudflared` quick-tunnel and an nginx gateway. The gateway forwards **only** `/webhook/telegram/*` to n8n; everything else returns 404.

This way the editor and the REST API are never reachable from the public internet, but the Telegram bot can still talk to its trigger workflow.

## Why Burmese

The Myanmar developer community is one of the most active builders of Telegram automation. We provide Burmese-first documentation so the project is usable without English fluency. English technical terms (function, list, API, async, agent, parser, webhook, credential) are preserved by convention, matching how Burmese developers actually write code-adjacent content.

## What's intentionally not included

- **No Docker setup helpers.** Every user's Docker setup is different. The skill assumes n8n runs and gives you the patterns.
- **No credential creation UI.** Use n8n's editor or `n8n CLI` to create credentials; the skill only references them by name.
- **No content moderation.** Out of scope for an automation builder. The patterns mention checking length, HTML escaping, and duplicate detection; user policy and consent are the deployer's responsibility.
- **No SaaS lock-in.** All scripts run on Node.js with zero npm dependencies (only `yaml` optional). Everything is portable.

## Roadmap

- More patterns: vector-search retrieval (Qdrant / pgvector), document parsing, audio transcription.
- More examples: WhatsApp trigger, Gmail auto-reply, Slack notification fan-out, Airtable CRM sync.
- A Node test harness for the Builder scripts that generates fixtures and runs the Validator on each.

Pull requests welcome.
