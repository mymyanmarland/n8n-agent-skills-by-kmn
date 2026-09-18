# Telegram in n8n

Telegram is used in this project for both public channel publishing and direct-message bots. This reference collects the rules that consistently come up.

## Send-only vs trigger bot

- **Send-only (Telegram node, no Trigger):** Used by scheduled publishing workflows. No public URL required. Posting works as long as the bot is a channel admin.
- **Trigger bot (Telegram Trigger):** Requires a public HTTPS webhook URL. Use the temporary `trycloudflare.com` tunnel setup in this project.

## Public channel username format

In `chatId`, use the public username prefixed with `@`:

```
chatId: "@MyanmarTechDigest"
```

For private channels, use the numeric `-100...` ID. To find a private channel ID, post a message into the channel from the bot and call `getUpdates` on the Bot API.

## HTML formatting

The Telegram node accepts `parse_mode: HTML`. Allowed tags:

```
<b>bold</b>
<i>italic</i>
<u>underline</u>
<s>strike</s>
<code>inline code</code>
<pre>preformatted block</pre>
<a href="https://example.com">link</a>
```

`Markdown` mode is supported but more brittle. Stick to `HTML` for new workflows.

Always set:
```
additionalFields: {
  appendAttribution: false,
  parse_mode: "HTML",
  disable_web_page_preview: true,
}
```

`appendAttribution: false` removes the auto-appended bot signature. `disable_web_page_preview: true` keeps the message clean even when it contains long URLs.

## Escaping

Before sending any AI-generated HTML, escape these characters:

```javascript
const escapeHtml = (value) => String(value)
  .replace(/&/g, '&amp;')
  .replace(/</g, '&lt;')
  .replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;');
```

Apply this to every field that might contain `<`, `>`, `&`, or `"` (titles, summaries, URLs, candidate names). If you do not escape, a model that emits `<` for math or `&` in a URL will silently break the message.

## Length guard

Telegram's hard cap is 4096 chars. After HTML escaping, character count grows slightly. After emoji, some clients measure width differently. Stay inside `300 <= len <= 3900` of visible text (HTML stripped) to be safe.

```javascript
const stripForMeasure = (value) => String(value)
  .replace(/<\/?[a-zA-Z][^>]*>/g, '')
  .replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"');
const visibleLength = (value) => [...stripForMeasure(value)].length;

if (visibleLength(text) < 300 || visibleLength(text) > 3900) {
  throw new Error('Message outside the safe Telegram range.');
}
```

Counting `[...str].length` (codepoint count) is more accurate than `str.length` for emoji-heavy messages.

## Long-message splitting

For trigger bots whose AI reply can exceed 3500 visible chars, split into chunks before sending:

```javascript
let chunk = '';
const push = () => { if (chunk) result.push({ json: { chatId, messageId, text: escapeHtml(chunk) }, pairedItem: { item: i } }); chunk = ''; };
for (const ch of output) {
  if (chunk.length + ch.length > 3500) push();
  chunk += ch;
}
push();
```

Loop over codepoints (or grapheme clusters) so emoji and combining marks do not split mid-character.

## Reply semantics

- For trigger bots, set `reply_to_message_id` to the user's incoming message ID. This keeps the chat thread visually clean.
- For scheduled posts, omit `reply_to_message_id`.

## Bot permissions

- Channel admin: the bot must be an admin in the channel with `post_messages` permission for channel posts.
- Group admin: `delete_messages` permission is needed if the workflow should also handle moderation.
- Direct chats: no admin required.

Verify with the metadata-only `check-telegram-channel.cjs` script in `scripts/`.

## Webhook setup (trigger bot)

1. Configure `n8n-nodes-base.telegramTrigger` with the bot token credential. n8n registers the webhook automatically.
2. Set `WEBHOOK_URL` in `compose.telegram.yaml` overlay to `https://<tunnel-url>/`.
3. Start the tunnel via `Start-Telegram.cmd` (calls `start-telegram.ps1`).
4. The script force-recreates the `telegram-tunnel` container to issue a fresh URL.
5. The script writes `TELEGRAM_WEBHOOK_URL=<url>/` into `.env.telegram` and restarts n8n.
6. The script waits for `http://localhost:5678/healthz/readiness` to return 200.

If `Reply on Telegram` returns `Unauthorized: Tunnel not found`, the tunnel expired even though the container is still running. Run `Start-Telegram.cmd` again.

## Tunnel lifecycle gotchas

- `trycloudflare.com` URLs are temporary and may stop resolving minutes after the container looks healthy.
- The overlay `compose.telegram.yaml` keeps the n8n container's `WEBHOOK_URL` in sync with the latest tunnel URL via `.env.telegram`.
- The nginx gateway only forwards the Telegram webhook path; the n8n editor stays on `localhost:5678`.
- Do not edit `.env.telegram` by hand; let `start-telegram.ps1` write it.

## Sample telegram-gateway.conf

```nginx
server {
  listen 8080;
  server_name _;
  client_max_body_size 25m;

  location /webhook/telegram/ {
    proxy_pass http://n8n:5678/webhook/telegram/;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto https;
    proxy_http_version 1.1;
    proxy_read_timeout 60s;
  }

  location / {
    return 404;
  }
}
```

Only the webhook path is exposed. The editor and the n8n REST API are not reachable from the tunnel.

## Retry strategy

- `retryOnFail: true, maxTries: 3, waitBetweenTries: 5000` for AI steps where transient rate limits are common.
- For Telegram sendMessage, retry once on `429 Too Many Requests` (parse `retry_after`) and once on `502/503`. Do not retry on `400 Bad Request`.
- On persistent failure, write a row into a `FailedPosts` data table so a human can review.
