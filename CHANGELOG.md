# Changelog

All notable changes to this skill are documented here. The format follows [Keep a Changelog](https://keepachangelog.com) and the project adheres to [Semantic Versioning](https://semver.org).

## [1.0.0] - 2026-09-18

### Added
- Initial release.
- `SKILL.md` with Burmese-first documentation.
- `references/nodes.md` - node catalog with usage statistics from 18,070 templates.
- `references/patterns.md` - 15 reusable workflow patterns.
- `references/telegram.md` - Telegram HTML, length guards, gateway, tunnel.
- `references/security.md` - credential and prompt safety checklist.
- `scripts/build-workflow.cjs` - generic Builder CLI with chat-local, chat-telegram, scheduled-digest, blank templates.
- `scripts/validate-workflow.cjs` - JSON structure, credential safety, Telegram settings, timezone.
- `scripts/audit-credentials.cjs` - secret-leak scanner (OpenAI, Anthropic, Telegram, GitHub, AWS, JWT, DB URLs).
- `scripts/check-telegram-channel.cjs` - metadata-only bot/channel verification.
- `examples/chat-claude.json` - importable chat template.
- `examples/scheduled-telegram-channel.json` - importable scheduled template.
- `docs/INSTALL.md`, `docs/PATTERNS.md`, `docs/WHY.md`.
- `README.md`, `LICENSE` (MIT), issue templates, GitHub Actions CI.

### Notes
- All statistics in the documentation come from a real scan of 18,070 importable templates on 2026-09-18.
- Patterns are derived from 8 production workflows running on the contributor's local n8n host.
