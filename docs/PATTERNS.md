# Pattern Quick Index

Fifteen reusable workflow shapes covered by the skill. Each pattern ships with the trigger, must-have nodes, failure modes, and validation hooks in `n8n-myanmar-workflow-builder/references/patterns.md`.

## 1. Chat assistant (private Chat Trigger)

**Use when:** internal helper, "ask Claude" pane on the editor.

```
Chat Trigger -> Claude Agent + Anthropic LM + Memory
```

## 2. Telegram trigger bot

**Use when:** public chatbot over Telegram with user identity.

```
Telegram Trigger -> If text -> Claude Agent -> Escape + Split -> Reply
                    false branch -> Ask for text
```

## 3. Scheduled bilingual content -> Telegram channel

**Use when:** digests, lessons, tips, news.

```
Schedule + Manual -> history -> LLM (structured) -> validate -> Telegram -> write history
```

## 4. RSS aggregation -> AI digest

**Use when:** 5+ sources, dedup across runs, bilingual summaries.

```
Schedule -> feeds -> splitInBatches -> rssFeedRead -> dedupe -> LLM -> Telegram
```

## 5. External job/board scraper with reservation guard

**Use when:** posting jobs, listings, marketplace items where duplicates are bad.

```
Schedule -> search loop -> normalize -> reserve -> generate -> deliver
                                          on success -> mark sent
                                          on failure -> keep reservation
```

## 6. Reserve-before-send (general)

For any irreversible external delivery. Write reservation rows first; mark sent only after the destination confirms.

## 7. Form to inbox / spreadsheet

`formTrigger -> if -> googleSheets append / gmail / telegram`.

## 8. Error workflow (catcher)

`errorTrigger -> format context -> telegram operator chat / slack / email`.

## 9. Sub-workflow composition

`executeWorkflowTrigger` + `executeWorkflow` for shared logic used 3+ times.

## 10. Webhook intake + HTTP API

`webhook -> validate -> httpRequest -> return JSON to caller`.

## 11. MCP / Tool workflows

`workflowTrigger` exposed as a strict tool to an AI agent in another workflow.

## 12. AI summarization pipeline

`input -> code (extract) -> chainLlm -> outputParserStructured -> destination`.

## 13. Multimodal AI

Image-bearing trigger -> base64 convert -> agent with multimodal model.

## 14. Chatbot with tool calling

`agent (auto) -> lmChat... -> toolWorkflow references + memory`.

## 15. CRM sync

`schedule/webhook -> list source -> splitInBatches -> upsert destination`.

---

For each pattern's full node parameters, see `n8n-myanmar-workflow-builder/references/patterns.md`.
