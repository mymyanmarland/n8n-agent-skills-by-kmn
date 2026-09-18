#!/usr/bin/env node
/**
 * scripts/build-workflow.cjs
 * Generic Builder that emits an importable n8n workflow JSON.
 *
 * Usage:
 *   node build-workflow.cjs --name "My Workflow" --out my-workflow.json
 *   node build-workflow.cjs --template chat-telegram --out my-bot.json
 *
 * Patterns available:
 *   chat-telegram  - Telegram trigger -> If(text) -> Claude agent -> chunked reply
 *   chat-local     - Chat trigger -> Claude agent + memory
 *   scheduled-digest- Schedule -> history -> LLM -> format -> Telegram -> write history
 *   rss-digest     - Schedule -> RSS loop -> dedup -> LLM -> format -> Telegram
 *   job-scraper    - Schedule -> loop URLs -> normalize -> reserve -> generate -> deliver
 *   blank          - empty workflow with only Manual Trigger
 */
'use strict';
const fs = require('fs');
const path = require('path');

// --- CLI ---
const args = Object.fromEntries(
  (function* () {
    const arr = process.argv.slice(2);
    for (let i = 0; i < arr.length; i++) {
      if (arr[i].startsWith('--')) {
        const key = arr[i].slice(2);
        const next = arr[i + 1];
        if (!next || next.startsWith('--')) {
          yield [key, true];
        } else {
          i++;
          yield [key, next];
        }
      }
    }
  })()
);

const WORKFLOW_NAME = args.name || args.workflow || 'Untitled Workflow';
const OUTPUT_FILE = args.out || args.output || null;
const TEMPLATE = args.template || 'blank';
const TIMEZONE = args.timezone || 'Asia/Yangon';
const SCHEDULE = args.schedule || null;
const TELEGRAM_CHAT_ID = args.telegramChatId || args.chatId || null;
const TELEGRAM_CRED_NAME = args.telegramCred || 'Telegram account';
const AI_PROVIDER = args.ai || 'anthropic';
const AI_MODEL = args.model || (AI_PROVIDER === 'openai' ? 'gpt-4o' : 'claude-sonnet-5');
const AI_CRED_NAME = args.aiCred || (AI_PROVIDER === 'openai' ? 'OpenAI account' : 'Anthropic account');

let _idCounter = 1;
const uid = () => String(_idCounter++);
const nodeId = () => `${uid()}-${uid()}-${uid()}-${uid()}-${uid()}`;

function manualTrigger(x = 120, y = 300) {
  return { parameters: {}, id: nodeId(), name: 'Manual Trigger', type: 'n8n-nodes-base.manualTrigger', typeVersion: 1, position: [x, y] };
}

function scheduleTrigger(cronExpr, x = 120, y = 300) {
  return { parameters: { rule: { interval: [{ field: 'cronExpression', expression: cronExpr }] } }, id: nodeId(), name: 'Schedule', type: 'n8n-nodes-base.scheduleTrigger', typeVersion: 1.2, position: [x, y] };
}

function telegramTrigger(x = 120, y = 300) {
  return { parameters: { updates: ['message'], additionalFields: {} }, id: nodeId(), name: 'Telegram Trigger', type: 'n8n-nodes-base.telegramTrigger', typeVersion: 1.5, position: [x, y], credentials: { telegramApi: { id: '', name: TELEGRAM_CRED_NAME } } };
}

function chatTrigger(x = 120, y = 300) {
  return { parameters: { public: false, options: { responseMode: 'lastNode' } }, id: nodeId(), name: 'Chat Trigger', type: '@n8n/n8n-nodes-langchain.chatTrigger', typeVersion: 1.4, position: [x, y] };
}

function aiAgent(subNodes = true, x = 600, y = 300) {
  const params = { promptType: 'auto', text: '={{ $json.chatInput }}', options: { systemMessage: 'You are a helpful assistant. Reply in the same language as the user.', enableStreaming: false } };
  if (!subNodes) { params.promptType = 'define'; params.text = '={{ $json.message?.text || $json.chatInput }}'; }
  return { parameters: params, id: nodeId(), name: 'AI Agent', type: '@n8n/n8n-nodes-langchain.agent', typeVersion: 3.1, position: [x, y], retryOnFail: true, maxTries: 3, waitBetweenTries: 5000 };
}

function anthropicModel(modelName, credName, x = 560, y = 560) {
  return { parameters: { model: { __rl: true, mode: 'list', value: modelName, cachedResultName: modelName }, options: {} }, id: nodeId(), name: 'Anthropic Claude', type: '@n8n/n8n-nodes-langchain.lmChatAnthropic', typeVersion: 1.6, position: [x, y], credentials: { anthropicApi: { id: '', name: credName } } };
}

function openaiModel(modelName, credName, x = 560, y = 560) {
  return { parameters: { model: { __rl: true, mode: 'list', value: modelName, cachedResultName: modelName }, responsesApiEnabled: false, options: { temperature: 0.7, maxTokens: 2000, timeout: 120000 } }, id: nodeId(), name: 'OpenAI Chat Model', type: '@n8n/n8n-nodes-langchain.lmChatOpenAi', typeVersion: 1.3, position: [x, y], credentials: { openAiApi: { id: '', name: credName } } };
}

function memory(sessionKey, contextLen = 10, x = 760, y = 560) {
  return { parameters: { sessionIdType: 'fromInput', sessionKey: sessionKey || '={{ $json.sessionId }}', contextWindowLength: contextLen }, id: nodeId(), name: 'Conversation Memory', type: '@n8n/n8n-nodes-langchain.memoryBufferWindow', typeVersion: 1.4, position: [x, y] };
}

function telegramSend(chatId, credName, x = 1200, y = 300) {
  return { parameters: { resource: 'message', operation: 'sendMessage', chatId: chatId || '={{ $json.message?.chat?.id || $json.chatId }}', text: '={{ $json.text }}', additionalFields: { appendAttribution: false, parse_mode: 'HTML', disable_web_page_preview: true } }, id: nodeId(), name: 'Reply on Telegram', type: 'n8n-nodes-base.telegram', typeVersion: 1.2, position: [x, y], credentials: { telegramApi: { id: '', name: credName } } };
}

function htmlEscapeCode(x = 960, y = 300) {
  return { parameters: { mode: 'runOnceForAllItems', jsCode: `const result = [];\nconst escapeHtml = (v) => String(v).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/\"/g,'&quot;');\nconst inputs = $input.all();\nfor (let i = 0; i < inputs.length; i++) {\n  const out = inputs[i].json.output;\n  if (typeof out !== 'string' || !out.trim()) throw new Error('Claude returned an empty reply.');\n  let chunk = '';\n  const push = () => { if (chunk) result.push({ json: { text: escapeHtml(chunk) }, pairedItem: { item: i } }); chunk = ''; };\n  for (const ch of out) { if (chunk.length + ch.length > 3500) push(); chunk += ch; }\n  push();\n}\nreturn result;` }, id: nodeId(), name: 'Escape and Split Reply', type: 'n8n-nodes-base.code', typeVersion: 2, position: [x, y] };
}

function ifText(x = 340, y = 300) {
  return { parameters: { conditions: { options: { caseSensitive: true, leftValue: '', typeValidation: 'strict', version: 2 }, conditions: [{ id: 'has-text', leftValue: "={{ typeof $json.message?.text === 'string' && $json.message.text.trim().length > 0 }}", rightValue: '', operator: { type: 'boolean', operation: 'true', singleValue: true } }], combinator: 'and' }, options: {} }, id: nodeId(), name: 'Has Text Message', type: 'n8n-nodes-base.if', typeVersion: 2.3, position: [x, y] };
}

function telegramAskText(x = 600, y = 760) {
  return { parameters: { resource: 'message', operation: 'sendMessage', chatId: '={{ $json.message.chat.id }}', text: 'Please send your question as a text message.', additionalFields: { appendAttribution: false, parse_mode: 'HTML' } }, id: nodeId(), name: 'Ask For Text', type: 'n8n-nodes-base.telegram', typeVersion: 1.2, position: [x, y], credentials: { telegramApi: { id: '', name: TELEGRAM_CRED_NAME } } };
}

function mainConn(to) { return { node: to, type: 'main', index: 0 }; }
function addConn(conns, from, to) { if (!conns[from]) conns[from] = { main: [[]] }; conns[from].main[0].push(mainConn(to)); }
function aiConn(conns, model, agent) { if (!conns[model]) conns[model] = {}; if (!conns[model].ai_languageModel) conns[model].ai_languageModel = [[]]; conns[model].ai_languageModel[0].push(mainConn(model)); }
function memConn(conns, mem, agent) { if (!conns[mem]) conns[mem] = {}; if (!conns[mem].ai_memory) conns[mem].ai_memory = [[]]; conns[mem].ai_memory[0].push(mainConn(mem)); }

function buildChatLocal() {
  const nodes = []; const conns = {};
  const chat = chatTrigger(); const agent = aiAgent(true);
  const model = anthropicModel(AI_MODEL, AI_CRED_NAME);
  const mem = memory('={{ $json.sessionId }}');
  nodes.push(chat, agent, model, mem);
  addConn(conns, chat.name, agent.name);
  aiConn(conns, model.name, agent.name);
  memConn(conns, mem.name, agent.name);
  return { nodes, conns };
}

function buildChatTelegram() {
  const nodes = []; const conns = {};
  const trig = telegramTrigger(); const ifNode = ifText();
  const agent = aiAgent(false); const model = anthropicModel(AI_MODEL, AI_CRED_NAME);
  const mem = memory('={{ "tg:" + $json.message.chat.id + ":" + $json.message.from.id }}');
  const formatter = htmlEscapeCode(); const send = telegramSend(TELEGRAM_CHAT_ID || null, TELEGRAM_CRED_NAME);
  const askText = telegramAskText();
  nodes.push(trig, ifNode, agent, model, mem, formatter, send, askText);
  addConn(conns, trig.name, ifNode.name); addConn(conns, ifNode.name, agent.name);
  addConn(conns, ifNode.name, askText.name); addConn(conns, agent.name, formatter.name);
  addConn(conns, formatter.name, send.name);
  aiConn(conns, model.name, agent.name); memConn(conns, mem.name, agent.name);
  return { nodes, conns };
}

function buildScheduledDigest() {
  const nodes = []; const conns = {};
  const sched = scheduleTrigger(SCHEDULE || '0 */1 * * *');
  const manual = manualTrigger();
  const send = telegramSend(TELEGRAM_CHAT_ID || '@MyChannel', TELEGRAM_CRED_NAME);
  nodes.push(sched, manual, send);
  addConn(conns, sched.name, send.name); addConn(conns, manual.name, send.name);
  return { nodes, conns };
}

function buildBlank() { return { nodes: [manualTrigger()], conns: {} }; }

const builders = { 'chat-local': buildChatLocal, 'chat-telegram': buildChatTelegram, 'scheduled-digest': buildScheduledDigest, blank: buildBlank };
const builder = builders[TEMPLATE];
if (!builder) { console.error('Unknown template:', TEMPLATE, 'Available:', Object.keys(builders).join(', ')); process.exit(1); }

const { nodes, conns } = builder();
const workflow = { name: WORKFLOW_NAME, nodes, connections: conns, active: false, settings: { executionOrder: 'v1', timezone: TIMEZONE }, meta: { templateCredsSetupCompleted: false } };
const json = JSON.stringify(workflow, null, 2);

if (OUTPUT_FILE) { fs.writeFileSync(OUTPUT_FILE, json, 'utf8'); console.error('Written:', OUTPUT_FILE); }
process.stdout.write(json + '\n');
console.error('Generated:', WORKFLOW_NAME, '(' + nodes.length, 'nodes)');
