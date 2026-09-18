# Workflow Patterns

A pattern is a reusable shape that solves a recurring class of problems. Each pattern lists the trigger, the must-have nodes, the failure modes, and the validation hooks.

## A. Chat assistant (private Chat Trigger)

Trigger: `@n8n/n8n-nodes-langchain.chatTrigger` `public: false`.
Body: `Agent` with `promptType: auto, text: "={{ $json.chatInput }}"`. Sub-nodes: `lmChatAnthropic` or `lmChatOpenAi` + `memoryBufferWindow`.
Memory key: `={{ $json.sessionId }}` (per-conversation) or any stable user-derived value.

Use when: internal helper, single-user chatbot, "ask Claude anything" pane on the editor.

Failure modes:
- Model returns empty text → `output` is empty string → `memoryBufferWindow` skips on empty.
- Streaming enabled without proper browser handler → drops chunks → set `enableStreaming: false` unless the consumer handles SSE.

## B. Telegram trigger bot

Trigger: `n8n-nodes-base.telegramTrigger` `updates: ["message"]`.
Gate: `If` node checking `typeof $json.message?.text === 'string'` so commands and stickers can branch off.
Body: `Agent` → Code formatter → `telegram` sendMessage.
Formatter must: HTML-escape, chunk at 3500 visible chars per message, preserve `reply_to_message_id`.
Fallback branch: ask user to send text instead of voice/sticker.

Use when: public chatbot over Telegram, conversation has user identity.

Failure modes:
- Webhook not reachable → bot never delivers or replies → run `Start-Telegram.cmd`.
- Long output → 400 from Telegram → split before sending.
- HTML injected by the user → escapes broken → escape every model output.

## C. Scheduled bilingual content → Telegram channel

Trigger: `scheduleTrigger` + `manualTrigger` in parallel.
Flow: ensure data table → read history → build prompt with dedup list → LLM chain with `outputParserStructured` → validate-and-format Code → `telegram` sendMessage → write history rows only on success.

Use when: publishing recurring digests, lessons, tips, news summaries, prompts to a public channel.

Failure modes:
- Fewer fresh items than required → end successfully with no post (history only on delivery).
- Model hallucinates a sourceId → fail in formatter, do not write history.
- Visible length above 3900 chars → fail before sending.
- Telegram returns 400 → do NOT write history; let next run retry.

## D. RSS aggregation → AI digest

Trigger: `scheduleTrigger`.
Flow: Code node emits a list of feed URLs → `splitInBatches` (one feed per iteration) → `rssFeedRead` with `onError: "continueRegularOutput"` → Code merges/dedupes → SQLite Data Table for history → LLM chain → formatter → `telegram`.

Use when: pulling from 5+ sources, needing canonical URL + normalized title dedup, multi-language summaries.

Failure modes:
- One feed 503 → other feeds still processed if `onError` is `continueRegularOutput`.
- Network returns HTML page → empty items → filter out empty `articleKey`.
- Title collisions across sources → canonical URL or fuzzy Jaccard match.

## E. External job/board scraper with reservation guard

Trigger: `scheduleTrigger`.
Flow: build N search URLs → loop → `httpRequest` → Code normalizes → match against reservation history → pick top 5 → reserve them in history table with `reservationState = "reserved"` → generate content → send → on success update rows to `sent`, on failure leave as reserved so they are not retried, on a future run if the same row is `reserved` for more than X hours release it.

Use when: posting externally (jobs, listings, marketplace items) where duplicate detection matters more than throughput.

Failure modes:
- Source 403s → skip and try the next source.
- Reservation never confirmed → leaks; add an idle expiry release.
- Same job posted under different IDs → add a normalized identity hash and match on that too.

## F. Reserve-before-send (general)

Any irreversible external delivery should reserve before generation and confirm after success:

```
ensure-history-table → read-history → filter-fresh → pick-N →
write-reservation(state=reserved) → generate →
delivery →
  success: update-state=sent
  failure: leave-reservation, raise error
```

This pattern works for Telegram channel posts, email broadcasts, Discord webhook posts, social media posts via APIs.

## G. Form to inbox / form to spreadsheet

Trigger: `n8n-nodes-base.formTrigger`.
Body: optional `if` → `googleSheets` append OR `gmail` send OR `telegram` notify.
Use when: collecting small public inputs (sign-ups, feedback, contact form).

## H. Error workflow (catcher)

Trigger: `n8n-nodes-base.errorTrigger`.
Body: Code that formats the error context → `telegram` to operator chat or `emailSend`/`slack`.
Use when: you need to be notified when any production workflow fails.

Best practice: make one error workflow per project and reference its ID in each production workflow's `settings.errorWorkflow`.

## I. Sub-workflow composition

Trigger: `n8n-nodes-base.executeWorkflowTrigger`.
Body: pure logic with `n8n-nodes-base.executeWorkflow` call from a parent workflow.
Use when: shared logic (auth, validation, formatting) is reused by 3+ parent workflows.

Failure modes:
- Sub-workflow timeout → parent retries → set `retryOnFail: true, maxTries: 2, waitBetweenTries: 5000` only on the call node.

## J. Webhook intake + HTTP API

Trigger: `n8n-nodes-base.webhook`.
Body: validate payload → `httpRequest` to upstream → return JSON to caller with `responseMode: responseNode` or `lastNode`.
Use when: a public form posts to n8n; n8n enriches and proxies.

## K. MCP / Tool workflows

Trigger: `n8n-nodes-base.workflowTrigger` from an AI agent in another workflow.
Body: deterministic API calls (search, lookup, write).
Use when: an AI agent needs a strict, versioned tool to call.

## L. AI summarization pipeline

Trigger: anything (form, webhook, schedule, manual).
Flow: input → `code` to extract relevant text → `chainLlm` → optional `outputParserStructured` → destination.
Use when: emails/notes/articles → short summaries or actions.

## M. Multimodal AI

Trigger: anything that brings in images (form upload, Drive, Gmail).
Body: AI agent with `openAi`/`anthropic` multimodal model + `code` to convert binary to base64 if needed.
Use when: OCR, image description, document extraction.

## N. Chatbot with tool calling

Trigger: chat or Telegram.
Body: `agent` (auto prompt) → `lmChatOpenAi`/`lmChatAnthropic` → sub-nodes for `toolWorkflow` references, plus memory.
Use when: the bot needs to take real actions (look up orders, file tickets, query a database).

## O. CRM sync

Trigger: schedule OR webhook.
Body: list from source CRM → splitInBatches → upsert into destination CRM.
Use when: keeping HubSpot / Pipedrive / Notion / Airtable in sync.

## Common safety rails

- Always validate that an AI-emitted `sourceId`/URL actually exists in the candidate set before trusting it.
- Always escape HTML before sending to Telegram or any HTML destination.
- Always check message length after HTML stripping.
- Always write delivery history only after the destination returns a confirmed ID.
- Always set `settings.timezone` to the user's local zone.
