#!/usr/bin/env node
/**
 * pre-session-orchestrator — Fase 0: diagnóstico de inicio de sesión.
 * Lee STATE.md y sugiere la siguiente acción. No modifica nada salvo timestamp.
 */
'use strict';
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..', '..');
const STATE = path.join(ROOT, '.claude', 'state', 'STATE.md');
const VISION = path.join(ROOT, '.claude', 'VISION.md');

console.log('═══ PRE-SESSION (Fase 0: INIT) ═══');

if (!fs.existsSync(STATE)) {
  console.log('⚠️  No existe .claude/state/STATE.md — crear desde templates/STATE.md');
} else {
  const s = fs.readFileSync(STATE, 'utf8');
  const wip = (s.match(/in_progress/gi) || []).length;
  console.log(`📄 STATE.md leído. Bloques in_progress: ${wip} (WIP limit = 1)`);
  if (wip > 1) console.log('🚫 WIP > 1 — cerrar una tarea antes de continuar (gate wip-limit-1)');
  const next = s.match(/\*\*Next\*\*:?\s*(.*)/i);
  if (next) console.log(`👉 Siguiente sugerido: ${next[1]}`);
}

if (fs.existsSync(VISION)) {
  console.log('🎯 VISION.md presente (anti-goal-drift activo)');
} else {
  console.log('⚠️  No existe .claude/VISION.md — crear desde templates/VISION.md');
}

console.log('═══ FIN PRE-SESSION ═══');
