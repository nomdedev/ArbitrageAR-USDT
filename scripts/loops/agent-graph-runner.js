#!/usr/bin/env node
/**
 * agent-graph-runner — runner pre/post por prompt del proceso uniforme de agentes.
 * Uso:
 *   node scripts/loops/agent-graph-runner.js --phase pre  [--files "a.ts,b.ts"]
 *   node scripts/loops/agent-graph-runner.js --phase post [--files "..."] [--dry-run]
 * Sin --files, detecta archivos vía `git diff --name-only`.
 * Emite el bloque ═══ EVAL REPORT ═══. exit 1 = hard stop (eval fallido).
 * Solo Node stdlib (child_process, fs, path). Sin dependencias npm.
 */
'use strict';

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..', '..');
const GRAPH_PATH = path.join(ROOT, '.claude', 'graph', 'agent-graph.json');

function loadGraph() {
  if (!fs.existsSync(GRAPH_PATH)) {
    console.error(`[agent-graph] No se encontró ${GRAPH_PATH}`);
    process.exit(1);
  }
  return JSON.parse(fs.readFileSync(GRAPH_PATH, 'utf8'));
}

function parseArgs(argv) {
  const args = { phase: 'post', files: null, dryRun: false };
  for (let i = 2; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--phase') args.phase = argv[++i];
    else if (a === '--files') args.files = argv[++i];
    else if (a === '--dry-run') args.dryRun = true;
  }
  return args;
}

function detectFiles() {
  try {
    const out = execSync('git diff --name-only', { cwd: ROOT, encoding: 'utf8' });
    return out.split('\n').map((s) => s.trim()).filter(Boolean);
  } catch {
    return [];
  }
}

function classifyFile(file, classify) {
  const f = file.replace(/\\/g, '/');
  for (const [type, patterns] of Object.entries(classify)) {
    for (const p of patterns) {
      const rx = new RegExp(
        '^' + p.replace(/[.+^${}()|[\]\\]/g, '\\$&').replace(/\*/g, '.*').replace(/\?\*/g, '.*') + '$'
      );
      if (rx.test(f) || f.includes(p.replace(/\*/g, ''))) return type;
    }
  }
  return 'docs';
}

function runEval(name) {
  // Eval genérico: mapea nombres del grafo a comandos reales si existen scripts/evals/<name>.js
  const script = path.join(ROOT, 'evals', `${name.replace(/\s+/g, '-')}.js`);
  if (fs.existsSync(script)) {
    try {
      execSync(`node "${script}"`, { cwd: ROOT, stdio: 'pipe', encoding: 'utf8' });
      return { name, ok: true };
    } catch (e) {
      return { name, ok: false, detail: String(e.message).slice(0, 200) };
    }
  }
  // Sin script instalado: eval declarativo (solo lectura) — se marca SKIPPED, no bloquea.
  return { name, ok: true, skipped: true };
}

function main() {
  const args = parseArgs(process.argv);
  const graph = loadGraph();
  const gate = graph.gates['post-eval-matrix'];
  if (!gate) {
    console.error('[agent-graph] Falta gate post-eval-matrix');
    process.exit(1);
  }

  const files = args.files
    ? args.files.split(',').map((s) => s.trim()).filter(Boolean)
    : detectFiles();

  const byType = {};
  for (const f of files) {
    const t = classifyFile(f, gate.classify);
    (byType[t] = byType[t] || []).push(f);
  }

  const results = [];
  let hardStop = false;

  for (const [type, fs_] of Object.entries(byType)) {
    const spec = gate.matrix[type] || { pre: [], post: [] };
    const evals = args.phase === 'pre' ? spec.pre : spec.post;
    for (const ev of evals) {
      if (args.dryRun) {
        results.push({ type, name: ev, ok: true, dryRun: true });
        continue;
      }
      const r = runEval(ev);
      r.type = type;
      results.push(r);
      if (!r.ok) hardStop = true;
    }
    if (evals.length === 0) {
      results.push({ type, name: '(sin evals para este tipo)', ok: true, skipped: true });
    }
  }

  // ═══ EVAL REPORT ═══
  console.log('═══ EVAL REPORT ═══');
  console.log(`Phase: ${args.phase} · Files: ${files.length}${args.dryRun ? ' (dry-run)' : ''}`);
  for (const r of results) {
    const mark = r.dryRun ? '🔍' : r.skipped ? '⏭️' : r.ok ? '✅' : '❌';
    console.log(`${mark} [${r.type}] ${r.name}${r.detail ? ' — ' + r.detail : ''}`);
  }
  console.log(`Files touched: ${Object.entries(byType).map(([t, f]) => `${f.length} ${t}`).join(', ') || 'ninguno'}`);
  console.log(`Veredict: ${hardStop ? '❌ HARD STOP — eval fallido' : '✅ All evals passed'}`);

  if (hardStop && graph.hardStops && graph.hardStops.onEvalFailure === 'STOP_AND_REPORT') {
    process.exit(1);
  }
}

main();
