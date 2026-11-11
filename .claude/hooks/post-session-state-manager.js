#!/usr/bin/env node
/**
 * post-session-state-manager — Fase 4: CLOSE. Actualiza STATE.md con resumen y handoff.
 * Uso: node .claude/hooks/post-session-state-manager.js --summary "..." --wip "TASK-X" --next "/planner"
 */
'use strict';
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..', '..');
const STATE = path.join(ROOT, '.claude', 'state', 'STATE.md');

const args = { summary: '', wip: '', next: '' };
for (let i = 2; i < process.argv.length; i++) {
  if (process.argv[i] === '--summary') args.summary = process.argv[++i] || '';
  else if (process.argv[i] === '--wip') args.wip = process.argv[++i] || '';
  else if (process.argv[i] === '--next') args.next = process.argv[++i] || '';
}

const now = new Date().toISOString().slice(0, 16).replace('T', ' ');
let content = fs.existsSync(STATE) ? fs.readFileSync(STATE, 'utf8') : '# STATE\n';

content += `\n---\n\n## Sesión ${now}\n`;
if (args.summary) content += `- **Resumen**: ${args.summary}\n`;
if (args.wip) content += `- **WIP**: ${args.wip}\n`;
if (args.next) content += `- **Next**: ${args.next}\n`;

fs.mkdirSync(path.dirname(STATE), { recursive: true });
fs.writeFileSync(STATE, content, 'utf8');
console.log(`═══ POST-SESSION: STATE.md actualizado (${now}) ═══`);
console.log(`Resumen: ${args.summary || '(vacío)'} · WIP: ${args.wip || '(ninguno)'} · Next: ${args.next || '(definir)'}`);
