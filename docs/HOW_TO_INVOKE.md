# Skill ပြန်ခေါ်သုံးနည်း (How to invoke the skill)

`n8n-myanmar-workflow-builder` skill ကို Cursor IDE ထဲမှာ ဘယ်လို ပြန်ခေါ်သုံးရမလဲ လမ်းညွှန်ချက်။

ဒီ skill က Cursor Agent အတွက် drop-in skill package ဖြစ်ပါတယ် - Claude Sonnet / GPT / Cursor Agent တို့က သက်ဆိုင်တဲ့ query တွေမှာ auto-load လုပ်ပါတယ်။

---

## 1. Install (one-time)

Skill ကို install လုပ်ထားမှ agent က load လုပ်နိုင်ပါမယ်။

### Project-local install (အကြံပြု)

သင့် n8n project folder ထဲ `.cursor/skills/` မှာ skill ထည့်ပါ:

```bash
cd "/e/Download/08-n8n workflow automation course/n8n host"

mkdir -p .cursor/skills
git clone https://github.com/mymyanmarland/n8n-agent-skills-by-kmn.git /tmp/skill-install
cp -r /tmp/skill-install/n8n-myanmar-workflow-builder .cursor/skills/
rm -rf /tmp/skill-install
```

### Global install (Cursor user-level)

`~/.cursor/skills/` ထဲထည့်ရင် project အကုန်မှာ အလုပ်လုပ်မယ်:

```bash
mkdir -p ~/.cursor/skills
git clone https://github.com/mymyanmarland/n8n-agent-skills-by-kmn.git /tmp/skill-install
cp -r /tmp/skill-install/n8n-myanmar-workflow-builder ~/.cursor/skills/
rm -rf /tmp/skill-install
```

### Install မှန်ကြောင်း စစ်ဆေး

```bash
ls .cursor/skills/n8n-myanmar-workflow-builder/
# SKILL.md  README.md  references/  scripts/  examples/  docs/

cat .cursor/skills/n8n-myanmar-workflow-builder/SKILL.md | head -5
# --- name: n8n-myanmar-workflow-builder  ဆိုရင် OK
```

Install လုပ်ပြီး Cursor ကို restart လုပ်ပါ။

---

## 2. Auto-invoke (recommended - အလွယ်ဆုံး)

Cursor chat box (Cmd/Ctrl + I) မှာ natural language နဲ့ ပြောလိုက်ပါ။ agent က query ကို scan လုပ်ပြီး `SKILL.md` + relevant reference files ကို auto-load လုပ်ပါလိမ့်မယ်။

### Trigger keywords

| Topic | Load |
|---|---|
| Telegram bot, Telegram channel, Claude, OpenAI, Burmese, Myanmar, RSS, digest, scheduled, cron, webhook, n8n workflow, trigger, scheduler | `SKILL.md` + matching `references/*.md` |
| validate, audit, credential, secret, token | `SKILL.md` + `scripts/validate-workflow.cjs` / `scripts/audit-credentials.cjs` |
| HTML escape, chunking, 3500, tunnel, Cloudflare | `references/telegram.md` |
| prompt injection, sanitization | `references/security.md` |

### Example queries (Burmese)

```
Telegram trigger bot တစ်ခု လုပ်ပေးပါ - Claude Sonnet သုံးပြီး မြန်မာလို reply ပြန်၊
3500 လိုင်း safe chunking ပါစေ၊ HTML escape လုပ်ပေးပါ။
```

```
မြန်မာ + အင်္ဂလိပ် နှစ်ဘာသာ RSS digest workflow တစ်ခု လုပ်ပေးပါ -
Telegram channel ကို post တင်ပေးမယ်၊ reservation guard ပါစေ။
```

```
Chat workflow JSON ကို validate လုပ်ပေးပါ - credential leak ရှိ/မရှိ audit ပါလုပ်ပေးပါ။
```

```
Telegram bot username ကို check လုပ်ပေးပါ - @MyBot
```

### Example queries (English)

```
Build me a Telegram trigger bot using Claude Sonnet that replies in Burmese
with 3500-char safe chunking and HTML escaping.
```

```
Create a scheduled bilingual RSS digest workflow that posts to a Telegram
channel with reservation guard and exponential backoff.
```

```
Validate my chat workflow JSON and audit for accidental credential leaks.
```

---

## 3. Explicit invoke (when auto-load မဖြစ်ဘဲ)

Cursor က skill auto-load မလုပ်ဘဲ ignore ဖြစ်နေရင် query မှာ "use the n8n-myanmar-workflow-builder skill" လို့ ထည့်ပြောပါ:

```
Use the n8n-myanmar-workflow-builder skill. Build a Telegram bot with Claude
Sonnet that replies in Burmese.
```

```
Refer to my n8n-myanmar-workflow-builder skill. Validate this workflow JSON
and audit for secrets.
```

agent က file load လုပ်ပြီး structured output ပေးပါလိမ့်မယ်။

---

## 4. Direct CLI use (terminal)

Skill ထဲ scripts တွေကို terminal ကနေ တိုက်ရိုက် run လို့ရ (zero dependencies, Node.js 20+):

### Build workflow

```bash
# Chat → Claude (local)
node .cursor/skills/n8n-myanmar-workflow-builder/scripts/build-workflow.cjs \
  --template chat-local --name "My chat" > my-workflow.json

# Chat → Claude → Telegram
node .cursor/skills/n8n-myanmar-workflow-builder/scripts/build-workflow.cjs \
  --template chat-telegram --name "My bot" > my-bot.json

# Scheduled RSS digest → Telegram channel
node .cursor/skills/n8n-myanmar-workflow-builder/scripts/build-workflow.cjs \
  --template digest-channel --name "Daily digest" > digest.json
```

### Validate workflow JSON

```bash
node .cursor/skills/n8n-myanmar-workflow-builder/scripts/validate-workflow.cjs my-workflow.json
```

Exit codes:
- `0` = clean (no warnings, no errors)
- `2` = warnings only (auto-fixable)
- `1` = errors (must fix before import)

### Audit for credential leaks

```bash
node .cursor/skills/n8n-myanmar-workflow-builder/scripts/audit-credentials.cjs .
```

Scans file/folder for hard-coded tokens, API keys, bot tokens, and password values.

### Check Telegram bot metadata (no token printed)

```bash
TELEGRAM_BOT_TOKEN=123456:abc-DEF node \
  .cursor/skills/n8n-myanmar-workflow-builder/scripts/check-telegram-channel.cjs \
  --me

TELEGRAM_BOT_TOKEN=123456:abc-DEF node \
  .cursor/skills/n8n-myanmar-workflow-builder/scripts/check-telegram-channel.cjs \
  --channel @MyChannel
```

Script က bot token ကို stdout မှာ print မလုပ်ပါ - just metadata (id, username, can_join_groups, permissions) ပဲ ပြတယ်။

---

## 5. What the skill loads (file structure)

agent က query ပေါ်မူတည်ပြီး load လုပ်တာ:

```
.cursor/skills/n8n-myanmar-workflow-builder/
├── SKILL.md                  ← Always loaded (entry point)
├── references/
│   ├── nodes.md              ← 728 node types + usage stats (loaded for node/trigger topics)
│   ├── patterns.md           ← 15 reusable workflow shapes
│   ├── telegram.md           ← HTML escape, chunking, tunnel
│   └── security.md           ← Credentials, prompt-injection, sanitization
├── scripts/
│   ├── build-workflow.cjs    ← Generates workflow JSON from templates
│   ├── validate-workflow.cjs ← Schema + best-practices checks
│   ├── audit-credentials.cjs ← Scans for hardcoded secrets
│   └── check-telegram-channel.cjs ← Bot/channel metadata (no token printed)
├── examples/
│   ├── chat-claude.json
│   └── scheduled-telegram-channel.json
└── docs/
    ├── INSTALL.md
    ├── PATTERNS.md
    └── WHY.md
```

agent က "loaded skill" status indicator ကို chat response အစမှာ ပြတတ်ပါတယ်။ မပေါ်ရင် explicit invoke ကို သုံးပါ။

---

## 6. Quick sanity check

Install + restart ပြီးရင် chat box မှာ မေးပါ:

```
What is the n8n-myanmar-workflow-builder skill? What can it do?
```

Response က skill အကြောင်း (Claude, OpenAI, Telegram, RSS, Docker, Cloudflare Tunnel topics) ပြောပြရင် load ဖြစ်ပါပြီ။

---

## 7. Tips

- **Burmese-first**: မြန်မာလို query ပေးရင် Burmese response ပြန်ပါတယ် - skill က မြန်မာ/English mix ကို support လုပ်ထားပါတယ်။
- **Skill auto-load triggers**: Cursor agent က query ထဲမှာ "Telegram", "n8n", "workflow", "Claude", "Burmese", "Myanmar", "RSS", "scheduler" စတဲ့ keyword တွေ ပါရင် auto-load လုပ်ပါတယ်။
- **Token safety**: Telegram bot token, Anthropic API key စတဲ့ secrets ကို chat message ထဲ မထည့်ပါနဲ့ - n8n credential store (`n8n_data`) ထဲမှာပဲ သိမ်းပါ။
- **Workspace rules**: Project memory (`AGENTS.md`, `PROJECT_MEMORY.md`) က skill content ထက် priority ပိုပါတယ် - local context က override ဖြစ်ပါတယ်။

---

## 8. Related docs

- [`INSTALL.md`](./INSTALL.md) - Detailed install + Docker n8n setup
- [`PATTERNS.md`](./PATTERNS.md) - 15 workflow patterns
- [`WHY.md`](./WHY.md) - Skill ကို ဘာလို့ တည်ဆောက်တာလဲ
- [`README.md`](../README.md) - Package overview
- [`CHANGELOG.md`](../CHANGELOG.md) - Version history
