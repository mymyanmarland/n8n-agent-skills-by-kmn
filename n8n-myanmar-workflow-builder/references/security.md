# Security Checklist

This project handles user-supplied prompts, AI-generated content, and bot tokens. Follow the checklist below on every workflow change.

## Credential safety

- **Never** put API keys, bot tokens, passwords, encryption keys, or decrypted credential values into:
  - workflow JSON files
  - compose files (`.yaml`)
  - `.env.telegram` (only the webhook URL, not the bot token)
  - project files in `scripts/`, `backups/`, or anywhere on disk
  - chat output, logs, or telemetry
- Reference credentials only by `name` in workflow JSON. n8n stores the actual secret in `n8n_data`.
- Never paste a real `n8n_api_key` into a builder script. Reference it by env var at runtime if a script needs it.

### What goes in `.env.telegram` and what does not

| Item | Allowed |
|---|---|
| `TELEGRAM_WEBHOOK_URL=https://<tunnel>.trycloudflare.com/` | Yes |
| Bot token | No |
| API keys for OpenAI / Anthropic / Google | No |
| Database connection strings | No |

## Audit script

Run `scripts/audit-credentials.cjs` (in this skill) before publishing any workflow. It scans for patterns that look like leaked secrets.

## Prompt-injection guards

When a workflow lets users supply content that is fed to a model that posts externally, treat the user input as untrusted:

1. Pass the model only the user-supplied text inside a quoted string. Never let the user control the system message or the surrounding context.
2. After the model returns, validate every field in JavaScript:
   - Required keys present
   - Lengths inside expected ranges
   - Allowed characters or allowed values for categorical fields
   - URLs in a separate field must come from a known allow-list (e.g. source list)
3. Never pass credential values, internal IDs, or environment metadata to the model.

### Example: validating model output

```javascript
const required = ['title', 'sourceUrl', 'category'];
const allowedCategories = new Set(['AI', 'Web', 'Security', 'Mobile', 'Startup', 'Other']);
const allowList = new Set(candidates.map(c => c.url));

for (const item of parsed.items) {
  for (const key of required) if (!item[key]) throw new Error('Missing field: ' + key);
  if (!allowList.has(item.sourceUrl)) throw new Error('URL not in allow-list: ' + item.sourceUrl);
  if (!allowedCategories.has(item.category)) throw new Error('Bad category: ' + item.category);
}
```

If any check fails, abort the workflow before sending to Telegram.

## HTML injection

User-supplied content can contain `<`, `>`, `&`, `"`. Always HTML-escape before sending to Telegram. Apply the same escaping to AI-generated content; even the model can emit `<` for math notation or `&` in URLs.

## Source allow-lists

For digest/news workflows, give the model the candidate list of `(sourceId, url)` pairs and require it to return only those IDs. Never let the model invent a URL or a sourceId. After parsing, look up each returned ID in the candidate map. Discard any that do not match.

## Reservation guard

For any irreversible external post (Telegram channel, email, social API):

1. Insert reservation rows first (`reservationState = "reserved"`).
2. Generate content.
3. Deliver.
4. On success update to `reservationState = "sent"`. On failure leave them reserved and raise an error.
5. Have an idle-expiry that releases reservations older than 24 hours.

This stops duplicate posts when the same job is scraped from multiple sources.

## Tunnel safety

- `trycloudflare.com` URLs are public. Do not use them for anything other than the Telegram webhook path.
- The nginx gateway only exposes the Telegram webhook path; the n8n editor and REST API remain on `localhost:5678` and are not reachable from the tunnel.
- If you suspect the tunnel is leaking, recreate the tunnel container (`docker compose up -d --force-recreate telegram-tunnel`) and re-register the webhook.

## Data at rest

- `n8n_data` is the persistent volume. It contains: workflows, credentials (encrypted), execution history, data tables, static data.
- Never delete, prune, reset, or recreate `n8n_data` unless the user has explicitly asked and the data loss has been explained.
- Before editing an existing workflow, export a backup to `backups/<name>-before-<change>-<YYYYMMDD-HHMMSS>.json`.

## Editor exposure

- Keep `N8N_HOST=localhost` and `ports: "127.0.0.1:5678:5678"` in `compose.yaml`.
- Never set `N8N_HOST=0.0.0.0` or bind the editor to a public interface.
- Use tunnel/ngrok only for narrowly-defined paths.

## Encryption key

- The n8n encryption key (`N8N_ENCRYPTION_KEY`) protects stored credentials. Losing it means credentials become unreadable even if `n8n_data` is intact.
- Store the encryption key outside `n8n_data` (e.g. password manager). Do not store it in this folder.
- If you must reference the key in compose, use `${N8N_ENCRYPTION_KEY}` from an `.env` file not committed to this project.

## Minimum pre-publish checklist

- [ ] `scripts/audit-credentials.cjs` returned no matches.
- [ ] No real API keys, tokens, or passwords anywhere in workflow JSONs, compose files, or `.env.telegram`.
- [ ] Validator Code node checks every model-emitted field.
- [ ] HTML escaped before sending.
- [ ] Length guard inside `[300, 3900]`.
- [ ] Reservation history written only on delivery confirmation.
- [ ] Backup placed in `backups/` before any change.
- [ ] `PROJECT_MEMORY.md` updated with workflow name, ID, credential names, schedule.
