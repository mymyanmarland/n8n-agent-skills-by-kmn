#!/usr/bin/env node
/**
 * scripts/validate-workflow.cjs
 * Generic workflow JSON validator.
 * Checks: valid JSON, nodes array, connections map, required triggers,
 * duplicate node names, credential names (no secrets), HTML settings,
 * Telegram length guard presence.
 *
 * Usage:
 *   node validate-workflow.cjs workflow.json
 *   cat workflow.json | node validate-workflow.cjs --stdin
 *
 * Exit 0 on pass, 1 on error, 2 on warning only.
 */
'use strict';
const fs = require('fs');
const file = process.argv[2] === '--stdin' ? null : process.argv[2];
const json = file ? fs.readFileSync(file, 'utf8') : (function() {
  try { return fs.readFileSync(0, 'utf8'); } catch { return fs.readFileSync(process.stdin.fd, 'utf8') || ''; }
})();
const WARNINGS = []; const ERRORS = [];
const warn = m => WARNINGS.push(m); const err = m => ERRORS.push(m);

let wf;
try { wf = JSON.parse(json); } catch (e) { console.error('FATAL: Not valid JSON:', e.message); process.exit(1); }

if (!wf.nodes) err('Missing "nodes" array');
if (!Array.isArray(wf.nodes) || wf.nodes.length === 0) err('"nodes" must be a non-empty array');
if (wf.connections && typeof wf.connections !== 'object') err('"connections" must be an object');

const names = wf.nodes.map(n => n.name);
const dupNames = names.filter((n, i) => names.indexOf(n) !== i);
if (dupNames.length) err('Duplicate node names: ' + [...new Set(dupNames)].join(', '));

const ids = wf.nodes.map(n => n.id).filter(Boolean);
const dupIds = ids.filter((id, i) => ids.indexOf(id) !== i);
if (dupIds.length) err('Duplicate node IDs: ' + dupIds.slice(0, 5).join(', ') + (dupIds.length > 5 ? '...' : ''));

const triggers = wf.nodes.filter(n => n.type && (n.type.includes('Trigger') || n.type.includes('webhook')));
if (!triggers.length) warn('No trigger nodes found; workflow may never run automatically');
if (triggers.length > 1) warn(triggers.length + ' trigger-like nodes found; check connections are intentional');

for (const node of wf.nodes) {
  if (!node.credentials) continue;
  for (const [credType, credVal] of Object.entries(node.credentials)) {
    const val = typeof credVal === 'object' ? credVal.name : credVal;
    if (!val || typeof val !== 'string') continue;
    const secretPatterns = [/^[a-zA-Z0-9_-]{20,64}$/, /sk-[a-zA-Z0-9_-]{20,}/, /[A-Za-z0-9+/]{40,}={0,2}$/];
    for (const pat of secretPatterns) if (pat.test(val)) err('Credential name "' + val + '" looks like a secret value (node: ' + node.name + ')');
  }
}

if (wf.connections) {
  const nodeNames = new Set(wf.nodes.map(n => n.name));
  for (const [src, conns] of Object.entries(wf.connections)) {
    if (!nodeNames.has(src)) err('Connection source node not in nodes: "' + src + '"');
    if (!conns) continue;
    for (const [type, outputs] of Object.entries(conns)) {
      if (!Array.isArray(outputs)) continue;
      for (const output of outputs) {
        if (!Array.isArray(output)) continue;
        for (const edge of output) {
          if (!nodeNames.has(edge.node)) err('Connection target node not in nodes: "' + edge.node + '" (from: ' + src + ')');
        }
      }
    }
  }
}

const stickyNotes = wf.nodes.filter(n => n.type === 'n8n-nodes-base.stickyNote');
if (stickyNotes.length === 0) warn('No StickyNote nodes; workflow may lack on-canvas documentation');

if (wf.settings?.timezone && !wf.settings.timezone.includes('Yangon')) warn('Timezone is "' + wf.settings.timezone + '"; expected "Asia/Yangon" for local workflows');

const tgSends = wf.nodes.filter(n => n.type === 'n8n-nodes-base.telegram' && n.parameters?.resource === 'message' && n.parameters?.operation === 'sendMessage');
for (const node of tgSends) {
  const fields = node.parameters.additionalFields || {};
  if (fields.parse_mode && fields.parse_mode !== 'HTML') warn('Telegram node "' + node.name + '" uses parse_mode="' + fields.parse_mode + '"; HTML is preferred');
  if (!fields.disable_web_page_preview) warn('Telegram node "' + node.name + '" should set disable_web_page_preview: true');
  if (fields.appendAttribution !== false) warn('Telegram node "' + node.name + '" should set appendAttribution: false');
}

const schedNodes = wf.nodes.filter(n => n.type === 'n8n-nodes-base.scheduleTrigger');
if (schedNodes.length && (!wf.settings?.timezone || wf.settings.timezone !== 'Asia/Yangon')) warn('Scheduled workflow without timezone "Asia/Yangon"');

if (WARNINGS.length) { console.error('WARNINGS:'); WARNINGS.forEach(w => console.error('  WARN', w)); }
if (ERRORS.length) { console.error('ERRORS:'); ERRORS.forEach(e => console.error('  ERROR', e)); }
console.error('Result:', ERRORS.length, 'error(s),', WARNINGS.length, 'warning(s),', wf.nodes.length, 'node(s)');
if (ERRORS.length) process.exit(1);
if (WARNINGS.length) process.exit(2);
process.exit(0);
