<!-- Hero banner placeholder -->
<p align="center">
  <img src="https://capsule-render.vercel.app/api?type=waving&color=gradient&customColorList=12,20,30&height=240&section=header&text=n8n%20Agent%20Skills%20by%20KMN&fontSize=42&fontColor=fff&animation=twinkling&fontAlignY=35&desc=Production-grade%20Cursor%20Skills%20%E2%9A%A1%20Claude%20%E2%9A%A1%20Telegram%20%E2%9A%A1%20n8n&descSize=18&descAlignY=55&descColor=ffd166" width="100%" alt="Header banner"/>
</p>

<p align="center">
  <img src="https://readme-typing-svg.demolab.com?font=Fira+Code&size=22&duration=3000&pause=1000&color=FF6D5A&center=true&vCenter=true&multiline=true&repeat=true&width=720&height=80&lines=Claude+သုံးပြီး+n8n+workflow+တည်ဆောက်မယ်;Telegram+bot+%26+channel+လုပ်မယ်;RSS+digest+%26+scheduled+post+%E2%9A%A1;Burmese-first+documentation" alt="Typing SVG"/>
</p>

<p align="center">
  <a href="#-what-is-this"><img src="https://img.shields.io/badge/version-1.0.0-ff6d5a?style=for-the-badge&logo=github&logoColor=white" alt="version"/></a>
  <a href="LICENSE"><img src="https://img.shields.io/badge/license-MIT-22c55e?style=for-the-badge&logo=opensourceinitiative&logoColor=white" alt="license"/></a>
  <a href="#-install"><img src="https://img.shields.io/badge/setup-60s-3b82f6?style=for-the-badge&logo=rocket&logoColor=white" alt="setup"/></a>
  <a href="#-scripts"><img src="https://img.shields.io/badge/scripts-4-a855f7?style=for-the-badge&logo=node.js&logoColor=white" alt="scripts"/></a>
  <a href="#-reference-docs"><img src="https://img.shields.io/badge/refs-4-ef4444?style=for-the-badge&logo=bookstack&logoColor=white" alt="refs"/></a>
</p>

<p align="center">
  <a href="https://n8n.io"><img src="https://img.shields.io/badge/n8n-FF6D5A?style=for-the-badge&logo=n8n&logoColor=white" alt="n8n"/></a>
  <a href="https://cursor.com"><img src="https://img.shields.io/badge/Cursor-000?style=for-the-badge&logo=cursor&logoColor=white" alt="Cursor"/></a>
  <a href="https://anthropic.com"><img src="https://img.shields.io/badge/Claude-Sonnet_5-CC785C?style=for-the-badge&logo=anthropic&logoColor=white" alt="Claude"/></a>
  <a href="https://openai.com"><img src="https://img.shields.io/badge/OpenAI-GPT-412991?style=for-the-badge&logo=openai&logoColor=white" alt="OpenAI"/></a>
  <a href="https://telegram.org"><img src="https://img.shields.io/badge/Telegram-2CA5E0?style=for-the-badge&logo=telegram&logoColor=white" alt="Telegram"/></a>
  <a href="https://www.cloudflare.com"><img src="https://img.shields.io/badge/Cloudflare-F38020?style=for-the-badge&logo=cloudflare&logoColor=white" alt="Cloudflare"/></a>
  <a href="#-burmese-section"><img src="https://img.shields.io/badge/Myanmar-မြန်မာ-FFD700?style=for-the-badge&logo=data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAxMDAgNjAiPjx0ZXh0IHk9IjUwIiBmb250LXNpemU9IjUwIj7imrw8L3RleHQ+PC9zdmc+" alt="Myanmar"/></a>
</p>

---

## 🪬 What is this?

> **A drop-in Cursor Agent Skill that turns any LLM into an expert n8n workflow builder.**

Built from **8 production workflows**, **50+ scripts**, and an **18,070-template reference library**. Born on a real local n8n host running Claude + Telegram + RSS + Cloudflare Tunnel.

It distills all that into:

| 📦 Package | 📝 What it does |
|---|---|
| `SKILL.md` (236 lines) | Loaded by agent on demand - Burmese-first knowledge base |
| `references/*.md` (4 files) | 728 nodes · 15 patterns · Telegram · Security |
| `scripts/*.cjs` (4 scripts) | Builder · Validator · Auditor · Bot-metadata checker |
| `examples/*.json` (2 files) | Importable templates (chat + scheduled channel) |

**🟢 Zero dependencies · Node.js 20+ · 100% local-first**

---

## 🏗️ Architecture

```ascii
                          ┌─────────────────────────────────────┐
                          │   Cursor Agent (Claude / GPT)       │
                          │   ┌───────────────────────────────┐ │
                          │   │  n8n-myanmar-workflow-builder  │ │
                          │   │          SKILL.md              │ │
                          │   └───────────────┬───────────────┘ │
                          └───────────────────│─────────────────┘
                                              │ generates JSON
                                              ▼
              ┌────────────────────────────────────────────────────┐
              │              n8n (Docker, localhost:5678)          │
              │  ┌──────────────┐ ┌──────────────┐ ┌────────────┐  │
              │  │ Chat Trigger │ │ Telegram Bot │ │ Scheduler  │  │
              │  └──────┬───────┘ └──────┬───────┘ └─────┬──────┘  │
              │         ▼                ▼               ▼         │
              │  ┌──────────────┐ ┌──────────────┐ ┌────────────┐  │
              │  │ Claude Agent │ │  RSS Ingest  │ │  History   │  │
              │  │   + Memory   │ │  + Dedupe    │ │  Guard     │  │
              │  └──────┬───────┘ └──────┬───────┘ └─────┬──────┘  │
              │         ▼                ▼               ▼         │
              │  ┌────────────────────────────────────────────────┐ │
              │  │       Reserve → Send → Confirm pattern        │ │
              │  └────────────────────────────────────────────────┘ │
              └─────────────────┬──────────────────┬────────────────┘
                                │                  │
                                ▼                  ▼
                    ┌──────────────────┐  ┌────────────────────┐
                    │  Telegram Bot    │  │  Telegram Channel  │
                    │   (user reply)   │  │  (broadcast post)  │
                    └──────────────────┘  └────────────────────┘
                                ▲
                                │ HTTPS (webhook)
                                │
                    ┌──────────────────┐
                    │ Cloudflare       │
                    │ Quick-Tunnel     │
                    └──────────────────┘
                                ▲
                                │ HTTPS only - Telegram
                                │
                    ┌──────────────────┐
                    │ nginx gateway    │
                    │ (narrow route)   │
                    └──────────────────┘
```

---

## ⚡ Quick Start (60 seconds)

### Step 1 — Install

```bash
mkdir -p .cursor/skills
git clone https://github.com/mymyanmarland/n8n-agent-skills-by-kmn.git /tmp/kmn-skill
cp -r /tmp/kmn-skill/n8n-myanmar-workflow-builder .cursor/skills/
rm -rf /tmp/kmn-skill
```

### Step 2 — Restart Cursor

`Ctrl/Cmd + Shift + P` → "Reload Window"

### Step 3 — Try it

In any Cursor chat, type:

> <img src="https://img.shields.io/badge/Burmese-မြန်မာ-FFD700?style=flat-square" alt="Burmese"/> "Telegram trigger bot တစ်ခု လုပ်ပေးပါ - Claude သုံးပြီး မြန်မာလို reply ပြန်၊ ၃၅၀၀ လိုင်း safe chunking ပါစေ"

Or in English:

> <img src="https://img.shields.io/badge/English-EN-3b82f6?style=flat-square" alt="English"/> "Build me a Telegram trigger bot that uses Claude to reply in Burmese with 3500-char safe chunking."

The agent will load `SKILL.md` + `references/telegram.md` → emit builder script + importable JSON → run the validator → confirm everything is safe.

---

## 🎬 Demo

> Drop a terminal-recorded GIF here showing the workflow builder + validator in action.

<details>
<summary><b>🎥 Want a GIF?</b> (click to expand)</summary>

```bash
# Record your terminal:
npx asciinema rec demo.cast
# Convert to GIF:
npm i -g asciicast2gif
asciicast2gif demo.cast demo.gif
# Save to docs/demo.gif and embed:
# ![demo](docs/demo.gif)
```

</details>

---

## 📚 At a glance

<table>
<tr>
<td width="50%" valign="top">

### 🤖 AI Models
- **Claude** (Anthropic) — Sonnet 5, Sonnet 4.5
- **GPT** (OpenAI) — GPT-4o, GPT-5
- **OpenAI-compatible** endpoints
- **Local models** via Ollama / LM Studio

### 🔗 Integrations
- Telegram bot + channel + group
- Google Sheets / Drive / Gmail
- RSS / Atom feeds
- HTTP webhook APIs
- n8n Data Tables
- Sub-workflows

</td>
<td width="50%" valign="top">

### ✅ Validation
- JSON structure & node graph
- Credential **name** safety
- Telegram HTML + 3500-char guard
- `parse_mode`, length, attribution
- `settings.timezone: Asia/Yangon`
- Prompt-injection defense

### 🛡️ Safety
- Secrets stay in n8n credential store
- Reserve-before-send pattern
- Tunnel only exposes Telegram route
- Audit script scans for leaks

</td>
</tr>
</table>

---

## 🧰 Scripts

| Script | Purpose | Example |
|---|---|---|
| `build-workflow.cjs` | Generate workflow JSON from template | `--template chat-telegram --name "My bot"` |
| `validate-workflow.cjs` | Schema + best-practice checks | `validate my-workflow.json` |
| `audit-credentials.cjs` | Scan for hardcoded secrets | `audit-credentials .` |
| `check-telegram-channel.cjs` | Bot metadata (no token print) | `--me` or `--channel @x` |

**Exit codes:** `0` clean · `2` warnings · `1` errors

---

## 🎯 What it builds

<table>
<tr>
<th width="25%">Pattern</th>
<th width="45%">Flow</th>
<th width="30%">Use case</th>
</tr>
<tr>
<td><b>A. Chat assistant</b></td>
<td><code>Chat Trigger → Claude Agent + Memory → reply</code></td>
<td>Multilingual chatbot</td>
</tr>
<tr>
<td><b>B. Telegram trigger bot</b></td>
<td><code>Telegram → If text → Claude → HTML-escape → chunk → Reply</code></td>
<td>Burmese Telegram bot</td>
</tr>
<tr>
<td><b>C. Scheduled channel post</b></td>
<td><code>Schedule → history check → LLM → validate → Telegram → mark sent</code></td>
<td>Daily digest</td>
</tr>
<tr>
<td><b>D. RSS aggregation</b></td>
<td><code>Schedule → 5+ RSS → loop → dedupe → Claude → Telegram</code></td>
<td>News digest</td>
</tr>
<tr>
<td><b>E. Job board scraper</b></td>
<td><code>80 searches → normalize → reserve → Claude → Telegram → mark sent</code></td>
<td>Job alerts</td>
</tr>
<tr>
<td colspan="3"><b>Plus 10 more:</b> error workflows, sub-workflows, webhook APIs, MCP tools, AI summarization, multimodal AI, chatbots with tool calling, CRM sync, form-to-inbox, reserve-before-send.</td>
</tr>
</table>

---

## 📊 Real-world usage data

From a scan of **18,070 importable n8n templates**:

<details>
<summary><b>📈 Top 11 nodes</b> (click to expand)</summary>

| Node | Count |
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

</details>

<details>
<summary><b>🔑 Top 7 credentials</b> (click to expand)</summary>

| Credential | Count |
|---|---:|
| `openAiApi` | 8,672 |
| `googleSheetsOAuth2Api` | 5,685 |
| `httpHeaderAuth` | 4,243 |
| `telegramApi` | 3,452 |
| `gmailOAuth2` | 3,042 |
| `googleDriveOAuth2Api` | 2,356 |
| `anthropicApi` | 428 |

</details>

> **778 distinct node types** and **77 categories** live in the wild. The skill ships the patterns that the library shows are most useful.

---

## 🎨 Design principles

1. **Backup before edit** — export current workflow JSON to a timestamped backup before any change.
2. **Builders over hand-edits** — author workflows with Node.js Builder scripts that emit importable JSON.
3. **Secrets stay in n8n Credentials** — never write API keys, bot tokens, or encryption keys into project files.
4. **Reserve before send** — for irreversible external delivery, write a reservation row first; mark sent only after confirmation.
5. **Validate after generate** — always run the validator and credential auditor before publishing.
6. **Local first** — the n8n editor stays on `http://localhost:5678`. Telegram uses a narrow nginx gateway + temporary Cloudflare tunnel.
7. **Burmese-first, English-preserved** — explanations in Burmese; technical terms in English.

---

## 📁 Repository layout

```ascii
n8n-agent-skills-by-kmn/
├── README.md                                    ← you are here
├── LICENSE
├── n8n-myanmar-workflow-builder/               ← the skill package
│   ├── SKILL.md                                 ← loaded by Cursor on demand
│   ├── references/
│   │   ├── nodes.md                             ← node catalog + real-world usage stats
│   │   ├── patterns.md                          ← 15 reusable workflow patterns
│   │   ├── telegram.md                          ← Telegram HTML, length, tunnel
│   │   └── security.md                          ← credential + prompt safety
│   ├── scripts/
│   │   ├── build-workflow.cjs                   ← generic Builder CLI
│   │   ├── validate-workflow.cjs                ← JSON structure + safety validator
│   │   ├── audit-credentials.cjs                ← secret-leak scanner
│   │   └── check-telegram-channel.cjs           ← metadata-only Bot API check
│   └── examples/
│       ├── chat-claude.json                     ← importable chat template
│       └── scheduled-telegram-channel.json      ← importable scheduled template
└── docs/
    ├── INSTALL.md                               ← detailed install + Docker n8n setup
    ├── PATTERNS.md                              ← quick pattern index
    ├── HOW_TO_INVOKE.md                         ← Burmese + English skill invocation guide
    └── WHY.md                                   ← design notes
```

---

## 🪄 Burmese (မြန်မာ) section

<details>
<summary><b>📖 ဤ repo အကြောင်း</b> (နှိပ်ပြီး ဖွင့်ပါ)</summary>

ဒီ repo က **Cursor Agent Skill** ပါ။ n8n workflow တွေကို Claude / OpenAI / Telegram / RSS / Data Table တွေနဲ့ တည်ဆောက်ဖို့ expert knowledge ပါပါတယ်။

### 📦 ထည့်သွင်းနည်း
```bash
mkdir -p .cursor/skills
git clone https://github.com/mymyanmarland/n8n-agent-skills-by-kmn.git /tmp/kmn-skill
cp -r /tmp/kmn-skill/n8n-myanmar-workflow-builder .cursor/skills/
rm -rf /tmp/kmn-skill
```

### 💬 အသုံးပြုပုံ
Cursor ထဲမှာ မြန်မာလို မေးလိုက်ပါ -

> "Telegram trigger bot တစ်ခု လုပ်ပေးပါ။ Claude သုံးပြီး မြန်မာလို reply ပြန်တာ၊ ၃၅၀၀ လိုင်း safe chunking နဲ့။"

Agent က `SKILL.md` နဲ့ `references/telegram.md` ကို load လုပ်ပြီး builder script + importable workflow JSON ထုတ်ပေးပါလိမ့်မယ်။ Validator ကို import မလုပ်ခင် run ပါမယ်။

### 🌟 ဘာကြောင့် ဒီ skill လဲ?
- ✨ **Real production workflows** ၈ ခုကနေ pattern ထုတ်ထားပါတယ်
- 🇲🇲 **Burmese-first** documentation (English technical terms ထိန်းသိမ်းထား)
- 🔐 **Secret-safe**: API key / bot token / encryption key ဘယ်နေရာမှာမှ မရေးပါ
- 🐳 **Local Docker + n8n** stack အတွက် အကောင်းဆုံး fit
- 🌐 **Cloudflare quick-tunnel** + nginx gateway pattern

</details>

---

## 🤝 Contributing

Issues and PRs welcome. Keep changes small, focused, and **Burmese-first**.

---

## 📜 License

MIT — see [LICENSE](LICENSE).

---

## 🙏 Credits

Built by **[mymyanmarland](https://github.com/mymyanmarland)** on top of the open n8n ecosystem. Pattern library draws from the local `19,000+ n8n Workflow Templates` collection shipped with the [08-n8n workflow automation course](https://github.com/mymyanmarland).

<p align="center">
  <img src="https://capsule-render.vercel.app/api?type=waving&color=gradient&customColorList=12,20,30&height=120&section=footer&fontSize=18&fontColor=fff&animation=twinkling" width="100%" alt="Footer"/>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Made_with-❤-ff6d5a?style=for-the-badge" alt="Made with love"/>
  <img src="https://img.shields.io/badge/for-Myanmar-FFD700?style=for-the-badge" alt="for Myanmar"/>
  <img src="https://img.shields.io/badge/and_local-first_AI-3b82f6?style=for-the-badge" alt="for local-first AI"/>
</p>
