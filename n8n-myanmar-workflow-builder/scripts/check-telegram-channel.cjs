#!/usr/bin/env node
/**
 * scripts/check-telegram-channel.cjs
 * Metadata-only Telegram bot/channel check via the Bot API.
 * Does NOT print or store the bot token.
 *
 * Usage:
 *   node check-telegram-channel.cjs @MyChannel
 *   node check-telegram-channel.cjs --chat-id -1001234567890
 *   node check-telegram-channel.cjs --me
 *   TELEGRAM_BOT_TOKEN=xxx node check-telegram-channel.cjs @MyChannel
 *
 * Requires: TELEGRAM_BOT_TOKEN env var or --bot-token flag.
 * Output: JSON with bot info, chat info, and bot membership.
 * Exit 0 = clean, 1 = error.
 */
'use strict';
const https = require('https');
const TOKEN = process.env.TELEGRAM_BOT_TOKEN || '';
const args = Object.fromEntries(
  (function* () {
    const arr = process.argv.slice(2);
    for (let i = 0; i < arr.length; i++) {
      if (arr[i].startsWith('--')) {
        const key = arr[i].slice(2);
        const next = arr[i + 1];
        if (!next || next.startsWith('--')) yield [key, true];
        else { i++; yield [key, next]; }
      }
    }
  })()
);

const botToken = args['bot-token'] || TOKEN;
if (!botToken) { console.error('ERROR: TELEGRAM_BOT_TOKEN env var or --bot-token flag required'); process.exit(1); }

const chatId = args.me ? null : (args['chat-id'] || args._[0] || null);

function tg(method, params = {}) {
  return new Promise((resolve, reject) => {
    const qs = Object.entries(params).map(([k, v]) => encodeURIComponent(k) + '=' + encodeURIComponent(v)).join('&');
    const opts = { hostname: 'api.telegram.org', path: '/bot' + botToken + '/' + method + (qs ? '?' + qs : ''), method: 'GET' };
    let data = '';
    https.get(opts, res => { res.on('data', d => data += d); res.on('end', () => { try { resolve(JSON.parse(data)); } catch (e) { reject(new Error('Invalid response: ' + data.slice(0, 200))); } }); }).on('error', reject);
  });
}

async function main() {
  const results = {};
  const me = await tg('getMe');
  if (!me.ok) { console.error('getMe failed:', me); process.exit(1); }
  results.bot = { id: me.result.id, username: me.result.username, first_name: me.result.first_name, can_join_groups: me.result.can_join_groups, can_read_all_group_messages: me.result.can_read_all_group_messages, supports_inline_queries: me.result.supports_inline_queries };

  if (chatId) {
    const chat = await tg('getChat', { chat_id: chatId });
    if (!chat.ok) { console.error('getChat failed for', chatId + ':', chat); process.exit(1); }
    results.chat = { id: chat.result.id, type: chat.result.type, title: chat.result.title || null, username: chat.result.username || null, first_name: chat.result.first_name || null, member_count: chat.result.member_count || null };
    try {
      const member = await tg('getChatMember', { chat_id: chatId, user_id: me.result.id });
      if (member.ok) results.botMembership = { status: member.result.status, can_post_messages: member.result.can_post_messages || null, can_edit_messages: member.result.can_edit_messages || null, can_delete_messages: member.result.can_delete_messages || null };
    } catch (e) { results.botMembership = { error: e.message }; }
  }

  console.log(JSON.stringify(results, null, 2));
  if (chatId && results.chat) {
    const issues = [];
    if (results.chat.type === 'channel' && !results.botMembership?.can_post_messages) issues.push('Bot cannot post to this channel - make it an admin');
    if (results.chat.type === 'group' && !results.botMembership?.can_read_all_group_messages) issues.push('Bot cannot read all group messages - enable privacy mode off or add as admin');
    if (issues.length) { console.error('ISSUES:'); issues.forEach(i => console.error('  WARN:', i)); }
  }
  process.exit(0);
}

main().catch(e => { console.error('ERROR:', e.message); process.exit(1); });
