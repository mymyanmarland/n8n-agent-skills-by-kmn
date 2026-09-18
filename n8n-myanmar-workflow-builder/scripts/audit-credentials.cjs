#!/usr/bin/env node
/**
 * scripts/audit-credentials.cjs
 * Scans workflow JSON files and compose YAML files for accidental secret leakage.
 *
 * Usage:
 *   node audit-credentials.cjs .
 *   node audit-credentials.cjs workflow.json
 *   cat file.json | node audit-credentials.cjs --stdin
 *
 * Exit 0 = clean, 1 = leaked secrets found.
 */
'use strict';
const fs = require('fs');
const path = require('path');

const PATTERNS = [
  { name: 'OpenAI API key',         re: /sk-[A-Za-z0-9_-]{20,}/ },
  { name: 'Anthropic API key',       re: /sk-ant-api03-[A-Za-z0-9_-]{40,}/ },
  { name: 'Google API key',          re: /AIza[0-9A-Za-z_-]{35}/ },
  { name: 'Telegram bot token',      re: /\b\d{8,10}:[A-Za-z0-9_-]{30,35}\b/ },
  { name: 'GitHub token',            re: /ghp_[A-Za-z0-9]{36,}/ },
  { name: 'Generic Bearer token',     re: /\bBearer\s+[A-Za-z0-9_-]{30,}\b/i },
  { name: 'Database URL with pwd',   re: /\b(postgres|mysql|mongodb|redis):\/\/[^:]+:[^@]+@/ },
  { name: 'JWT token',               re: /\beyJ[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\b/ },
  { name: 'Slack token',             re: /xox[baprs]-[0-9]{10,13}-[0-9]{10,13}-[A-Za-z0-9]{10,}/ },
  { name: 'AWS Access Key ID',       re: /\bAKIA[0-9A-Z]{16}\b/ },
  { name: '.env secret assignment',  re: /\b[A-Z_]{4,20}=(?:sk-|token|key|secret|password|passwd|pwd|api)[= ][A-Za-z0-9_+\/=-]{10,}/i },
];

const SKIP_IN = ['node_modules', '.git', '.cursor/AIContext'];
const SCAN_EXTS = new Set(['.json', '.yaml', '.yml', '.env', '.txt', '.md', '.cjs', '.js']);
const SKIP_KEYS = new Set(['id', 'nodeId', 'webhookId', 'credentialId', 'v', 'versionId', 'pinData', 'staticData', 'sessionId', 'chatId', 'port', 'portValue']);

function auditJson(obj) {
  const matches = [];
  function walk(o, path) {
    if (!o || typeof o !== 'object') return;
    if (Array.isArray(o)) { o.forEach((v, i) => walk(v, path + '[' + i + ']')); return; }
    for (const [k, v] of Object.entries(o)) {
      if (typeof v === 'string' && v.length > 20) {
        if (SKIP_KEYS.has(k)) continue;
        for (const { name, re } of PATTERNS) { if (re.test(v)) matches.push({ name, path: path + '.' + k, value: v.slice(0, 15) + '...' }); }
      } else if (typeof v === 'object') { walk(v, path + '.' + k); }
    }
  }
  walk(obj, 'root');
  return matches;
}

function auditText(content) {
  const matches = [];
  for (const { name, re } of PATTERNS) {
    for (const m of content.matchAll ? [...content.matchAll(re)] : []) {
      const lineNum = content.slice(0, m.index).split('\n').length;
      matches.push({ name, line: lineNum, value: m[0].slice(0, 15) + '...' });
    }
  }
  return matches;
}

function shouldSkip(p) { return SKIP_IN.some(s => p.includes(s)); }
function walkDir(d) {
  const r = [];
  for (const e of fs.readdirSync(d, { withFileTypes: true })) {
    const fp = path.join(d, e.name);
    if (shouldSkip(fp)) continue;
    if (e.isDirectory()) r.push(...walkDir(fp));
    else if (e.isFile() && SCAN_EXTS.has(path.extname(fp).toLowerCase())) r.push(fp);
  }
  return r;
}

const targets = process.argv.slice(2).filter(a => !a.startsWith('--'));
const useStdin = process.argv.includes('--stdin');
let files = [];
if (useStdin) files = ['stdin'];
else if (targets.length) { for (const t of targets) { const s = fs.statSync(t); if (s.isDirectory()) files.push(...walkDir(t)); else files.push(t); } }
else files = walkDir('.');

const ALL = []; let errors = 0;
for (const f of files) {
  try {
    let content; let isBackup = f.includes('backups');
    if (f === 'stdin') content = fs.readFileSync(0, 'utf8');
    else content = fs.readFileSync(f, 'utf8');
    let matches = [];
    if (f.endsWith('.json')) { try { matches = auditJson(JSON.parse(content)); } catch {} }
    else matches = auditText(content);
    if (matches.length) { ALL.push({ file: f, matches }); if (!isBackup) errors++; }
  } catch {}
}

if (ALL.length) {
  console.error('CREDENTIAL LEAK DETECTED:');
  for (const { file, matches } of ALL) {
    const tag = file.includes('backups') ? ' [BACKUP]' : '';
    console.error('  ' + file + tag);
    for (const m of matches) console.error('    - ' + m.name + ': "' + m.value + '"' + (m.line ? ' (line ' + m.line + ')' : '') + (m.path ? ' (' + m.path + ')' : ''));
  }
  console.error('Total: ' + ALL.length + ' file(s), ' + ALL.reduce((a, m) => a + m.matches.length, 0) + ' match(es). Non-backup errors: ' + errors);
  process.exit(1);
} else { console.error('OK: No credential leaks detected'); process.exit(0); }
