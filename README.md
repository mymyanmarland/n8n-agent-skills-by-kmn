# n8n Agent Skills by KMN

> Production-grade **Cursor Agent Skills** for building n8n workflows with AI (Claude, OpenAI), Telegram bots and channels, RSS aggregation, scheduled publishing, and Docker + Cloudflare Tunnel setups. Born from a real local n8n host with 8 production workflows and 18,070-template reference library.

[![License: MIT](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
[![n8n](https://img.shields.io/badge/n8n-workflows-ff6d5a?logo=n8n&logoColor=white)](https://n8n.io)
[![Cursor](https://img.shields.io/badge/Cursor-Agent_Skill-000?logo=cursor)](https://cursor.com)
[![Claude](https://img.shields.io/badge/Claude-Sonnet_5-cc785c?logo=anthropic)](https://anthropic.com)
[![Telegram](https://img.shields.io/badge/Telegram-2CA5E0?logo=telegram&logoColor=white)](https://telegram.org)
[![OpenAI](https://img.shields.io/badge/OpenAI-GPT-412991?logo=openai&logoColor=white)](https://openai.com)
[![Burmese](https://img.shields.io/badge/Myanmar-မြန်မာ-yellow)](#-burmese-first)

---

## What is this?

A **drop-in skill** for Cursor (`.cursor/skills/`) that gives your AI agent expert knowledge for building, validating, and auditing n8n workflows. It distils **eight production workflows**, **fifty-plus scripts**, and an **18,070-template reference library** into:

- a single `SKILL.md` that the agent loads on demand,
- four reference docs covering nodes, patterns, Telegram, and security,
- four CLI scripts (Builder, Validator, Auditor, Bot-metadata checker),
- and two importable workflow JSON examples.

The agent uses Burmese-first explanations with English technical terms preserved. It runs locally, validates before publishing, and never writes secrets to disk.

---

## At a glance

| | |
|---|---|
| **Workflows produced** | Chat assistants, Telegram bots, RSS digests, scheduled channels, job scrapers, multimodal AI |
| **AI models supported** | Claude (Anthropic), GPT (OpenAI), OpenAI-compatible endpoints, RAG agents, structured output parsers |
| **Integrations** | Telegram, Google Sheets/Drive/Gmail, RSS, HTTP, Data Tables, sub-workflows |
| **Validation** | JSON structure, credential name safety, HTML/Telegram length guards, prompt-injection defense |
| **Tunnel** | Cloudflare quick-tunnel overlay + narrow nginx gateway (no public editor) |
| **Locale** | `Asia/Yangon`, bilingual Burmese/English |

---

## Repository layout

```
n8n-agent-skills-by-kmn/
├── README.md                                    <- you are here
├── LICENSE
├── n8n-myanmar-workflow-builder/               <- the skill package
│   ├── SKILL.md                                 <- loaded by Cursor on demand
│   ├── references/
│   │   ├── nodes.md                             <- node catalog + real-world usage stats
│   │   ├── patterns.md                          <- 15 reusable workflow patterns
│   │   ├── telegram.md                          <- Telegram HTML, length, tunnel
│   │   └── security.md                          <- credential + prompt safety
│   ├── scripts/
│   │   ├── build-workflow.cjs                   <- generic Builder CLI
│   │   ├── validate-workflow.cjs                <- JSON structure + safety validator
│   │   ├── audit-credentials.cjs                <- secret-leak scanner
│   │   └── check-telegram-channel.cjs           <- metadata-only Bot API check
│   └── examples/
│       ├── chat-claude.json                     <- importable chat template
│       └── scheduled-telegram-channel.json      <- importable scheduled template
└── docs/
    ├── INSTALL.md                               <- how to install in Cursor
    ├── PATTERNS.md                              <- quick pattern index
    └── WHY.md                                   <- design notes
```

---

## Install (60 seconds)

### 1. Drop the skill into your project

```bash
# From your Cursor workspace root:
mkdir -p .cursor/skills
cp -r n8n-myanmar-workflow-builder .cursor/skills/
```

### 2. (Optional) Add scripts to your PATH

```bash
# Linux / macOS
ln -s "$PWD/n8n-myanmar-workflow-builder/scripts/build-workflow.cjs"     ~/.local/bin/n8n-build
ln -s "$PWD/n8n-myanmar-workflow-builder/scripts/validate-workflow.cjs"  ~/.local/bin/n8n-validate
ln -s "$PWD/n8n-myanmar-workflow-builder/scripts/audit-credentials.cjs"  ~/.local/bin/n8n-audit
ln -s "$PWD/n8n-myanmar-workflow-builder/scripts/check-telegram-channel.cjs" ~/.local/bin/n8n-tgcheck
```

### 3. Try it

Open any chat in Cursor and ask:

> "Build me a Telegram trigger bot that uses Claude to reply in Burmese, with a 3500-char safe chunking formatter."

The agent will use `SKILL.md` and `references/telegram.md` to produce a builder script and an importable workflow JSON, then run the validator before suggesting import.

---

## What it builds

### A. Chat assistant
Chat Trigger → Claude Agent + Memory → reply in user's language.

### B. Telegram trigger bot
Telegram Trigger → If text → Claude → HTML-escape → chunk split → Reply. False branch asks for text.

### C. Scheduled bilingual content → Telegram channel
Schedule + Manual → history check → structured LLM → validate → Telegram → write history only on confirmed delivery.

### D. RSS aggregation → AI digest
Schedule → 5+ RSS sources → loop → dedupe → Claude digest → Telegram.

### E. Job board scraper with reservation guard
80 searches → normalize → reserve-before-send → Claude summary → Telegram → mark `sent` only after confirmation.

### F. Plus 10 more patterns
See `references/patterns.md` for: error workflows, sub-workflow composition, webhook APIs, MCP tools, AI summarization, multimodal AI, chatbots with tool calling, CRM sync, form-to-inbox, reserve-before-send general.

---

## What it validates

- JSON structure and required nodes
- Duplicate node names and IDs
- Connection graph consistency
- Credential **name** safety (no secret-shaped strings)
- Telegram settings: `parse_mode: HTML`, `disable_web_page_preview: true`, `appendAttribution: false`
- `settings.timezone: Asia/Yangon` for scheduled workflows
- HTML escaping, length guard, prompt-injection defense
- Sticky-note documentation presence

Run from your terminal:

```bash
node n8n-myanmar-workflow-builder/scripts/validate-workflow.cjs my-workflow.json
node n8n-myanmar-workflow-builder/scripts/audit-credentials.cjs .
node n8n-myanmar-workflow-builder/scripts/check-telegram-channel.cjs @MyChannel
```

Exit codes follow standard convention: `0` clean, `1` errors, `2` warnings only.

---

## Real-world usage data (from 18,070 template scan)

The reference docs include counts from a real scan of 18,070 importable templates:

| Most-used node | Count |
|---|---:|
| `stickyNote` | 90,493 |
| `stopAndError` | 30,475 |
| `httpRequest` | 21,727 |
| `set` | 21,607 |
| `code` | 12,032 |
| `if` | 10,739 |
| `googleSheets` | 8,754 |
| `agent` (LangChain) | 6,711 |
| `lmChatOpenAi` | 5,831 |
| `telegram` | 4,111 |
| `scheduleTrigger` | 3,605 |

| Top credentials | Count |
|---|---:|
| `openAiApi` | 8,672 |
| `googleSheetsOAuth2Api` | 5,685 |
| `httpHeaderAuth` | 4,243 |
| `telegramApi` | 3,452 |
| `gmailOAuth2` | 3,042 |
| `googleDriveOAuth2Api` | 2,356 |
| `anthropicApi` | 428 |

778 distinct node types and 77 categories live in the wild. The skill ships the patterns that the library shows are most useful.

---

## Design principles

1. **Backup before edit.** Always export the current workflow JSON to a timestamped backup before any change.
2. **Builders over hand-edits.** Author workflows with Node.js Builder scripts that emit importable JSON.
3. **Secrets stay in n8n Credentials.** Never write API keys, bot tokens, or encryption keys into project files or logs.
4. **Reserve before send.** For irreversible external delivery (Telegram channel posts, emails, social posts), write a reservation row first; mark sent only after confirmation.
5. **Validate after generate.** Always run the validator and credential auditor before publishing.
6. **Local first.** The n8n editor stays on `http://localhost:5678`. Telegram uses a narrow nginx gateway + temporary Cloudflare tunnel.
7. **Burmese-first, English-preserved.** Explanations in Burmese; technical terms in English.

---

## Burmese (မြန်မာ) section

ဒီ repo က **Cursor Agent Skill** ပါ။ n8n workflow တွေကို Claude / OpenAI / Telegram / RSS / Data Table တွေနဲ့ တည်ဆောက်ဖို့ expert knowledge ပါပါတယ်။

### ထည့်သွင်းနည်း
```bash
mkdir -p .cursor/skills
cp -r n8n-myanmar-workflow-builder .cursor/skills/
```

### အသုံးပြုပုံ
Cursor ထဲမှာ မြန်မာလို မေးလိုက်ပါ -

> "Telegram trigger bot တစ်ခု လုပ်ပေးပါ။ Claude သုံးပြီး မြန်မာလို reply ပြန်တာ၊ ၃၅၀၀ လိုင်း safe chunking နဲ့။"

Agent က `SKILL.md` နဲ့ `references/telegram.md` ကို load လုပ်ပြီး builder script + importable workflow JSON ထုတ်ပေးပါလိမ့်မယ်။ Validator ကို import မလုပ်ခင် run ပါမယ်။

### ဘာကြောင့် ဒီ skill လဲ?
- **Real production workflows** ၈ ခုကနေ pattern ထုတ်ထားပါတယ်
- **Burmese-first** documentation (English technical terms ထိန်းသိမ်းထား)
- **Secret-safe**: API key / bot token / encryption key ဘယ်နေရာမှာမှ မရေးပါ
- **Local Docker + n8n** stack အတွက် အကောင်းဆုံး fit
- **Cloudflare quick-tunnel** + nginx gateway pattern

---

## License

MIT - see [LICENSE](LICENSE).

---

## Credits

Built by [mymyanmarland](https://github.com/mymyanmarland) on top of the open n8n ecosystem. Pattern library draws from the local `19,000+ n8n Workflow Templates` collection shipped with the [08-n8n workflow automation course](https://github.com/mymyanmarland).

> Made with care for the Myanmar developer community and anyone running local-first AI automation.
