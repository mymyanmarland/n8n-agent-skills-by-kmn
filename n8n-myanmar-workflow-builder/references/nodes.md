# n8n Node Catalog (used by workflow patterns)

All node `typeVersion` values match the local n8n install at `n8nio/n8n:latest` (late 2026 series).

## Triggers

| Node | type | typeVersion | Notes |
|---|---|---|---|
| Schedule Trigger | `n8n-nodes-base.scheduleTrigger` | 1.2 | Use `cronExpression` or `interval`. Pair with `Manual Trigger` so the workflow can be tested safely. |
| Manual Trigger | `n8n-nodes-base.manualTrigger` | 1 | Use only for one-off test runs. Do not keep it wired into production paths without a guard. |
| Chat Trigger | `@n8n/n8n-nodes-langchain.chatTrigger` | 1.4 | `public: false` keeps it private. `responseMode: lastNode` returns the final node's output. |
| Telegram Trigger | `n8n-nodes-base.telegramTrigger` | 1.5 | `updates: ["message"]` for plain chat bots. Needs a public HTTPS webhook URL. |

## Flow control

| Node | type | typeVersion | Notes |
|---|---|---|---|
| If | `n8n-nodes-base.if` | 2.3 | Use strict type validation; leftValue/rightValue references must use expressions. |
| Code | `n8n-nodes-base.code` | 2 | `mode: "runOnceForAllItems"` for batch logic, default `runOnceForEachItem` for per-item. |
| Split In Batches | `n8n-nodes-base.splitInBatches` | 3 | `batchSize: 1` is a clean way to loop a single item per iteration. |
| Sticky Note | `n8n-nodes-base.stickyNote` | 1 | Document the workflow on the canvas with `content`, `height`, `width`, `color` (1-7). |

## Data

| Node | type | typeVersion | Notes |
|---|---|---|---|
| Data Table | `n8n-nodes-base.dataTable` | 1.1 | Use `resource: table, operation: create` with `createIfNotExists: true` to ensure schema. Use `resource: row, operation: get/insert` for data. |
| RSS Feed Read | `n8n-nodes-base.rssFeedRead` | 1 | `onError: "continueRegularOutput"` lets a single bad feed not break the whole loop. |

## HTTP

| Node | type | typeVersion | Notes |
|---|---|---|---|
| HTTP Request | `n8n-nodes-base.httpRequest` | 4.x | Use for webhooks, REST APIs, job boards. Set `options.timeout` and fail-soft `onError` where appropriate. |

## AI / LangChain

| Node | type | typeVersion | Notes |
|---|---|---|---|
| AI Agent | `@n8n/n8n-nodes-langchain.agent` | 3.1 | Connect language model + memory sub-nodes via `ai_languageModel` and `ai_memory`. |
| Basic LLM Chain | `@n8n/n8n-nodes-langchain.chainLlm` | 1.9 | Use with Output Parser Structured for typed output. |
| Anthropic Chat | `@n8n/n8n-nodes-langchain.lmChatAnthropic` | 1.6 | `model: { __rl: true, mode: "list", value: "claude-opus-5" }`. Bind credential by `name`. |
| OpenAI Chat | `@n8n/n8n-nodes-langchain.lmChatOpenAi` | 1.3 | `responsesApiEnabled: false` for Chat Completions endpoints; custom `baseURL` for proxies. |
| Memory Buffer Window | `@n8n/n8n-nodes-langchain.memoryBufferWindow` | 1.4 | `sessionKey` expression for per-user isolation. |
| Output Parser Structured | `@n8n/n8n-nodes-langchain.outputParserStructured` | 1.3 | Schema-first, `autoFix: true`. Connect via `ai_outputParser` to the LLM chain. |

## Telegram

| Node | type | typeVersion | Notes |
|---|---|---|---|
| Telegram | `n8n-nodes-base.telegram` | 1.2 | Use `resource: message, operation: sendMessage`. Set `parse_mode: HTML`, `disable_web_page_preview: true`, `appendAttribution: false`. |

## Common connection types

- `main` - data flow.
- `ai_languageModel` - model into agent/chain.
- `ai_memory` - memory into agent.
- `ai_outputParser` - parser into chain.
- `ai_tool` - tool into agent (function calling).

## Position spacing

Use a 240-260 px grid. Triggers at x=80-160, Code/Data nodes at x=300-600, AI nodes around x=700-1500, Telegram and final storage at x=1700+. This keeps the visual order intuitive on the canvas.

## Real-world usage (from 18,070 template library scan)

### Most-used nodes by frequency
| Node type | Count | Use |
|---|---|---|
| `n8n-nodes-base.stickyNote` | 90,493 | Documentation on canvas |
| `n8n-nodes-base.stopAndError` | 30,475 | Error handling |
| `n8n-nodes-base.httpRequest` | 21,727 | External API calls |
| `n8n-nodes-base.set` | 21,607 | Data transformation |
| `n8n-nodes-base.code` | 12,032 | Custom logic |
| `n8n-nodes-base.if` | 10,739 | Conditional branching |
| `n8n-nodes-base.googleSheets` | 8,754 | Spreadsheet ops |
| `n8n-nodes-base.noOp` | 7,006 | Debug placeholder |
| `@n8n/n8n-nodes-langchain.agent` | 6,711 | AI agents |
| `@n8n/n8n-nodes-langchain.lmChatOpenAi` | 5,831 | OpenAI models |
| `n8n-nodes-base.telegram` | 4,111 | Telegram send/receive |
| `n8n-nodes-base.scheduleTrigger` | 3,605 | Scheduled runs |
| `n8n-nodes-base.wait` | 3,518 | Delay/step |
| `n8n-nodes-base.merge` | 4,320 | Parallel branch merge |

### Top triggers (18,070 template sample)
- Manual Trigger: 1,254
- Webhook: 486
- Schedule Trigger: 454
- Execute Workflow Trigger: 235
- Form Trigger: 158
- Telegram Trigger: 120
- Chat Trigger (LangChain): 99
- Gmail Trigger: 74
- Typeform Trigger: 48
- Google Drive Trigger: 46
- Google Sheets Trigger: 38

### Top credentials (18,070 template sample)
- `openAiApi`: 8,672
- `googleSheetsOAuth2Api`: 5,685
- `httpHeaderAuth`: 4,243
- `telegramApi`: 3,452
- `gmailOAuth2`: 3,042
- `googleDriveOAuth2Api`: 2,356
- `googlePalmApi`: 1,938
- `airtableTokenApi`: 1,476
- `notionApi`: 1,244
- `slackApi`: 1,239
- `anthropicApi`: 428
- `openRouterApi`: 527

### Top categories (18,070 templates)
- `n8n Ai/Automation`: 681
- `n8n Ai/Ai`: 562
- `n8n Ai/Open ai`: 258
- `n8n Ai/Other`: 230
- `n8n Ai/IT Ops`: 192
- `n8n Ai/Chatbot`: 175
- `n8n Ai/Gpt`: 125
- `n8n Ai/Multimodal AI`: 123
- `Social Media templates/N8n Telegram`: 176
- `Business and E-commerce/*`: ~3,000 total across sub-categories

### Total distinct node types in the wild: **728**
