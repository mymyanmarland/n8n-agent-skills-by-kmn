---
name: n8n-myanmar-workflow-builder
description: Build, edit, validate, and deploy production-grade n8n workflows that combine AI (Claude, OpenAI, Anthropic), Telegram bots/channels, RSS, webhooks, Data Tables, and scheduled publishing. Use when the user asks to create or modify an n8n workflow, write a Builder/Validator Node.js script that emits importable workflow JSON, design a Telegram send-only or trigger bot, add bilingual (English/Burmese) AI-generated content pipelines, set up a temporary Cloudflare Tunnel + nginx gateway for Telegram webhooks, audit an existing n8n workflow for credential leakage or unsafe prompts, or recover from `trycloudflare.com` tunnel expiry. Reuse this skill for any local Docker + n8n + AI + Telegram automation project.
---

# n8n Myanmar Workflow Builder

Bilingual (English/Burmese) skill for building production n8n workflows. Burmese Unicode prompts, Telegram HTML, AI structured output, persistent Data Tables, credential safety, and Docker Compose layouts are all first-class.

## When to use

- New workflow that uses Claude / OpenAI / Anthropic + Telegram / RSS / webhooks / Data Tables.
- Editing an existing workflow and you need a backup, builder script, validator, or a fix to prompts, length guards, or duplicate detection.
- Setting up a temporary `trycloudflare.com` HTTPS endpoint for Telegram triggers.
- Auditing a workflow for credential leaks, unsafe prompts, or Telegram length issues.

## Operating principles

1. **Backup before edit.** Copy the current workflow JSON to `backups/<name>-before-<change>-<YYYYMMDD-HHMMSS>.json` before changing anything. Never edit the SQLite database directly.
2. **Code in Builder scripts.** Author and modify workflows as Node.js (`.cjs`) builders that emit importable JSON, not by hand-editing the workflow file. Validators run on the JSON before import.
3. **Secrets stay in n8n Credentials.** Never paste API keys, bot tokens, encryption keys, or decrypted credentials into project files, logs, or chat. Reference credentials by `name` only.
4. **Persistent state via Data Tables.** Use n8n Data Tables (`n8n-nodes-base.dataTable`) for any history, reservation, or audit data. Use `$getWorkflowStaticData('global')` only for tiny rolling dedup lists (<=80 entries).
5. **Reserve-before-send for irreversible delivery.** When posting to Telegram channels or other external destinations, write the history row only after the destination returns a confirmed ID. If fewer than the required count are fresh, end the run successfully with no delivery.
6. **Bilingual Burmese with English technical terms.** Burmese prose for explanations; English for keywords, identifiers, library names, code, and links. Preserve standard terms (function, list, API, decorator, async).
7. **Timezone = `Asia/Yangon`.** Set `settings.timezone` and `GENERIC_TIMEZONE` env var. Schedule cron in user-local time.
8. **Local-first.** Editor stays on `http://localhost:5678`. Never expose the editor publicly. Telegram traffic can use a narrow `nginx` gateway behind a temporary `cloudflared` tunnel.

## Skill layout

- `references/nodes.md` - n8n node catalog used by the workflow patterns (Schedule, Data Table, Code, Telegram, Chat Trigger, LangChain).
- `references/patterns.md` - reusable workflow patterns (chat assistant, send-only channel, scheduled digest, trigger bot, reservation guard).
- `references/telegram.md` - Telegram HTML, length guards, escape rules, gateway/tunnel setup.
- `references/security.md` - credential names, secret-leak audit checklist, prompt-injection guard.
- `scripts/build-workflow.cjs` - generic Builder that emits importable workflow JSON.
- `scripts/validate-workflow.cjs` - generic Validator (structure, credentials, prompt safety, length guards).
- `scripts/audit-credentials.cjs` - scans workflow JSONs and compose files for accidental secret strings.
- `scripts/check-telegram-channel.cjs` - metadata-only `getMe` / `getChat` check via Bot API.
- `examples/chat-claude.json` - minimal chat trigger → Claude agent example.
- `examples/scheduled-telegram-channel.json` - minimal schedule → AI → Telegram channel example.

## Build checklist

Copy this list and tick off as you go:

```
- [ ] Workflow purpose and schedule decided
- [ ] Backup of current state placed in backups/ (timestamped)
- [ ] Credential names mapped (Anthropic, OpenAI, Telegram) - secrets NOT in code
- [ ] Builder script drafted in scripts/build-<workflow>.cjs
- [ ] Workflow JSON emitted and saved as <workflow>-workflow.json
- [ ] Validator script run: scripts/validate-<workflow>.cjs (exit 0)
- [ ] Credential audit: scripts/audit-credentials.cjs (no secret strings)
- [ ] Length guards in formatter (Telegram 4096, safe range 300-3900)
- [ ] History written only after Telegram returns message_id
- [ ] schedule.timezone = Asia/Yangon
- [ ] Manual Trigger included alongside Schedule Trigger
- [ ] PROJECT_MEMORY.md updated with name, ID, credential names, schedule
```

## Quick recipes

### Recipe 1: Chat trigger → Claude agent

Flow: Chat Trigger → Claude AI Agent → Anthropic Claude (sub-node) + Conversation Memory (sub-node).

```javascript
// Minimal builder excerpt (see scripts/build-workflow.cjs for full template)
const nodes = [
  { parameters: { public: false, options: { responseMode: 'lastNode' } },
    name: 'When chat message received', type: '@n8n/n8n-nodes-langchain.chatTrigger',
    typeVersion: 1.4, position: [260, 300] },
  { parameters: { promptType: 'auto', text: '={{ $json.chatInput }}',
      options: { systemMessage: 'You are a helpful assistant. Reply in the same language as the user. When the user writes in Burmese, reply in natural Burmese.', enableStreaming: false } },
    name: 'Claude AI Agent', type: '@n8n/n8n-nodes-langchain.agent', typeVersion: 3.1, position: [520, 300] },
  { parameters: { model: { __rl: true, mode: 'list', value: 'claude-sonnet-5' }, options: {} },
    name: 'Anthropic Claude', type: '@n8n/n8n-nodes-langchain.lmChatAnthropic', typeVersion: 1.6,
    credentials: { anthropicApi: { id: '<cred-id>', name: 'Anthropic account' } }, position: [500, 560] },
  { parameters: { sessionIdType: 'fromInput', sessionKey: '={{ $json.sessionId }}', contextWindowLength: 10 },
    name: 'Conversation Memory', type: '@n8n/n8n-nodes-langchain.memoryBufferWindow', typeVersion: 1.4, position: [760, 560] },
];
```

Connections: trigger → agent; sub-nodes (Claude, Memory) connect via `ai_languageModel` and `ai_memory`.

### Recipe 2: Scheduled AI → Telegram channel

Flow: Schedule Trigger + Manual Trigger → Ensure Data Table → Read history → Build prompt → Claude/OpenAI Chain → Output Parser (Structured) → Validate and Format → Telegram send → Store history.

Key rules:
- Generate N candidates and pick the first one that passes duplicate + Burmese + length validation.
- Telegram HTML must escape `& < > "`. Use `parse_mode: HTML` and `disable_web_page_preview: true`.
- Total visible length: keep between 300 and 3900 to stay safely under Telegram's 4096 cap after escaping and emoji width variation.
- History row written only after Telegram returns `result.message_id`.

### Recipe 3: Telegram trigger bot (requires tunnel)

Flow: Telegram Trigger → If text → Claude agent → Prepare reply (HTML escape + 3500-char chunk split) → Reply on Telegram. False branch → Ask for text.

Requires a public HTTPS URL. Use the temporary `compose.telegram.yaml` + `start-telegram.ps1` setup. The bot must be reachable, so the `WEBHOOK_URL` env var must point at the tunnel URL when the workflow is published.

### Recipe 4: Reservation guard (no-repeat)

Flow: Read full history → filter candidates against normalized title/canonical URL/identity keys → choose exactly N distinct → write all reservation rows first → generate content → send → on success, mark `deliveryState = 'sent'`; on failure, leave reservation so the jobs are not retried.

This is the safe pattern for anything that publishes externally (job boards, news, vocabulary, tips).

## Length-guard helper (paste into a Code node formatter)

```javascript
const escapeHtml = (value) => String(value)
  .replace(/&/g, '&amp;')
  .replace(/</g, '&lt;')
  .replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;');

const stripForMeasure = (value) => String(value)
  .replace(/<\/?[a-zA-Z][^>]*>/g, '')
  .replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"');

const visibleLength = (value) => [...stripForMeasure(value)].length;
const SAFE_MIN = 300;
const SAFE_MAX = 3900; // Telegram limit is 4096; reserve headroom for emoji and HTML escape expansion

if (visibleLength(text) < SAFE_MIN || visibleLength(text) > SAFE_MAX) {
  throw new Error('Message length outside the safe Telegram range; delivery was blocked.');
}
```

Always measure the **post-parse visible text**, not the raw HTML. Counting raw HTML will mis-flag messages whose `<a href="...">` contains long verified URLs.

## Compose layout

`compose.yaml`:
```yaml
name: n8n-host
services:
  n8n:
    image: n8nio/n8n:latest
    container_name: n8n
    restart: unless-stopped
    ports:
      - "127.0.0.1:5678:5678"
    dns: [1.1.1.1, 8.8.8.8]
    environment:
      GENERIC_TIMEZONE: Asia/Yangon
      TZ: Asia/Yangon
      N8N_HOST: localhost
      N8N_PORT: "5678"
      N8N_PROTOCOL: http
      N8N_EDITOR_BASE_URL: http://localhost:5678/
      WEBHOOK_URL: http://localhost:5678/
      N8N_SECURE_COOKIE: "false"
      N8N_ENFORCE_SETTINGS_FILE_PERMISSIONS: "true"
      N8N_RUNNERS_ENABLED: "true"
    volumes:
      - n8n_data:/home/node/.n8n
volumes:
  n8n:
    external: true
    name: n8n_data
```

`compose.telegram.yaml` (overlay for temporary Cloudflare Tunnel):
```yaml
services:
  n8n:
    environment:
      WEBHOOK_URL: "${TELEGRAM_WEBHOOK_URL:-http://localhost:5678/}"
      N8N_PROXY_HOPS: "1"
  telegram-gateway:
    image: nginx:stable-alpine
    restart: unless-stopped
    volumes:
      - ./telegram-gateway.conf:/etc/nginx/conf.d/default.conf:ro
  telegram-tunnel:
    image: cloudflare/cloudflared:latest
    restart: unless-stopped
    command: ["tunnel", "--no-autoupdate", "--protocol", "http2", "--url", "http://telegram-gateway:8080"]
    depends_on: [telegram-gateway]
```

`telegram-gateway.conf` only forwards the Telegram webhook path; the n8n editor and REST API stay bound to localhost.

## Tunnel lifecycle

`trycloudflare.com` URLs are temporary. After Docker or Windows restart:

1. Run `Start-Telegram.cmd` (calls `start-telegram.ps1`).
2. The script force-recreates only the `telegram-tunnel` container so a fresh URL is issued. Gateway, n8n_data, workflows, and credentials are preserved.
3. The script writes `TELEGRAM_WEBHOOK_URL=<new-url>/` into `.env.telegram`, restarts n8n, and waits for `/healthz/readiness` to return 200.
4. Update `PROJECT_MEMORY.md` with the new URL.
5. If `Reply on Telegram` returns `Unauthorized: Tunnel not found`, the tunnel expired even though its container still looks healthy - run the script again.

## Telegram channel post layout (safe template)

```javascript
const header = '📰 <b>နည်းပညာသတင်းချုပ် — ' + escapeHtml(today) + '</b>';
const footer = '—\n<i>သတင်းအသစ်ရှိမှသာ ပို့ပေးပါသည်။</i>';
const blocks = selected.map((item, index) => [
  `${index + 1}. <b>${escapeHtml(item.title)}</b>`,
  escapeHtml(item.summary),
  `🔗 <a href="${escapeHtml(item.url)}">မူရင်းသတင်း</a>`,
].join('\n'));
const message = [header, blocks.join('\n\n'), footer].join('\n\n');
```

Always include `parse_mode: HTML` and `disable_web_page_preview: true` in the Telegram node `additionalFields`.

## Prompt safety

When AI emits content that gets posted externally:

- Restrict the model input to the fields it must use (titles, summaries, source labels, allowed URLs). Never pass credentials, internal IDs, or prompt metadata.
- Forbid the model from emitting URLs, emails, hashtags, Markdown fences, Telegram commands, or HTML it did not receive. Use a Structured Output Parser schema to enforce shape.
- After the model returns, validate every field in JavaScript: required keys present, Burmese characters present where required, allowed-URL allow-list, no double-encoded entities.
- Use a separate validator Code node rather than trusting the parser alone.

## Audit checklist (run before publishing)

- [ ] `scripts/audit-credentials.cjs` returns no matches.
- [ ] No literal API key, bot token, or password string anywhere in the JSON or `.env.telegram`.
- [ ] All `credentials.*.name` values match an existing credential in n8n.
- [ ] Schedule cron is set; manual trigger exists for safe one-off runs.
- [ ] `settings.timezone = "Asia/Yangon"`.
- [ ] Telegram destination is a public channel username (`@...`) validated by `scripts/check-telegram-channel.cjs` `getChat` returning `type: channel` and bot is admin.
- [ ] Output length is inside `300 <= len <= 3900` after HTML strip.
- [ ] History writes happen after the destination returns a confirmation ID.

## Additional resources

- For node parameters and type versions, see [references/nodes.md](references/nodes.md).
- For workflow patterns, see [references/patterns.md](references/patterns.md).
- For Telegram HTML, gateway, and tunnel details, see [references/telegram.md](references/telegram.md).
- For credential and prompt safety checklist, see [references/security.md](references/security.md).
- For Builder and Validator scripts, see [scripts/](scripts/).
- For importable workflow examples, see [examples/](examples/).
