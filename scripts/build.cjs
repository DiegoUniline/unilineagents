#!/usr/bin/env node
// Genera todas las salidas desde core/, skills/, src/ y templates/.
// Uso: node scripts/build.cjs
'use strict';
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const R = path.join(__dirname, '..');
const rd = p => fs.readFileSync(path.join(R, p), 'utf8').trim();
const wr = (p, c) => { const a = path.join(R, p); fs.mkdirSync(path.dirname(a), { recursive: true }); fs.writeFileSync(a, c.trim() + '\n'); };
const limpiar = p => fs.rmSync(path.join(R, p), { recursive: true, force: true });

const PRINCIPIOS = rd('core/principios.md');
const CONV = rd('core/convenciones.md');
const ROLES = ['arquitecto', 'auditor', 'desarrollador', 'qa', 'evaluador'];
const rol = n => rd(`core/${n}.md`);
const BASE = `${PRINCIPIOS}\n\n---\n\n${CONV}`;

const DESC = {
  arquitecto: 'Diseña sistemas y módulos nuevos: investiga el giro, entrevista al dueño una pregunta a la vez, propone base de datos, reglas, flujos y escalabilidad, y genera SQL solo tras aprobación.',
  auditor: 'Audita sistemas existentes en solo lectura: documenta campo por campo con nivel de certeza y evidencia, detecta riesgos e inconsistencias y genera preguntas. Úsalo para inventarios y auditorías largas de módulos.',
  desarrollador: 'Hace cambios y correcciones mínimos en sistemas existentes: entiende, planea, pide OK, ejecuta, verifica con evidencia y actualiza la documentación. Nunca borra ni supone.',
  qa: 'Genera y corre pruebas de reglas de BD, aislamiento multiempresa, permisos, casos "qué pasa si" y criterios de aceptación de un módulo. No modifica código de la aplicación.',
  evaluador: 'Auditor independiente de los agentes y skills: prepara escenarios reproducibles, distingue pruebas reales de verificaciones estáticas, detecta supuestos, omisiones, falta de contexto y falso éxito. No modifica productos.',
};

const NOTA_SUBAGENTE = `## Si corres como subagente
No puedes conversar con el dueño. Haz todo lo que no requiera decisiones de negocio, deja las dudas registradas en /docs/preguntas.md y /docs/00-estado.md, y devuelve como resultado: resumen, hallazgos y la PRIMERA pregunta pendiente más importante para que el agente principal se la haga al dueño.`;

// ---------- skill generada ----------
wr('skills/documentacion-modulo/SKILL.md', `---
name: documentacion-modulo
description: Plantillas y convenciones de documentación del proyecto (/docs, documento vivo 00-estado, módulo, diccionario de datos, P-XXX, D-XXX, niveles de certeza, convenciones de BD). Úsala al crear o actualizar cualquier archivo de /docs.
---

${CONV}

## Plantilla /docs/00-estado.md
${rd('templates/docs/00-estado.md')}`);

const SKILLS = fs.readdirSync(path.join(R, 'skills')).filter(d => fs.existsSync(path.join(R, 'skills', d, 'SKILL.md'))).sort();
const TERCEROS = SKILLS.filter(d => fs.existsSync(path.join(R, 'skills', d, 'ORIGEN.md')));
const PROPIAS = SKILLS.filter(d => !TERCEROS.includes(d));
const cpDir = (src, dst) => { fs.rmSync(path.join(R, dst), { recursive: true, force: true }); fs.cpSync(path.join(R, src), path.join(R, dst), { recursive: true }); };

// ---------- Claude Code: agentes ----------
limpiar('agents');
for (const n of ROLES) {
  wr(`agents/${n}.md`, `---
name: ${n}
description: ${DESC[n]}
---

${BASE}

---

${rol(n)}

${NOTA_SUBAGENTE}`);
}

// ---------- Claude Code: comandos ----------
limpiar('commands');
for (const f of fs.readdirSync(path.join(R, 'src/commands'))) {
  let t = rd(`src/commands/${f}`);
  t = t.replace(/\{\{BASE\}\}/g, BASE)
       .replace(/\{\{CONV\}\}/g, CONV)
       .replace(/\{\{ROL:([a-z]+)\}\}/g, (_, n) => `---\n\n${rol(n)}`)
       .replace(/\{\{TPL:([\w-]+)\}\}/g, (_, n) => '```\n' + rd(`templates/docs/${n}.md`) + '\n```');
  wr(`commands/${f}`, t);
}

// ---------- Claude.ai: skills sueltas + roles + instrucciones de proyecto ----------
limpiar('dist');
const skillsClaudeAi = [];
for (const s of SKILLS) { cpDir(`skills/${s}`, `dist/claude-ai/skills/${s}`); skillsClaudeAi.push(s); }
for (const n of ROLES) {
  const nom = `uniline-${n}`;
  wr(`dist/claude-ai/skills/${nom}/SKILL.md`, `---
name: ${nom}
description: Rol ${n.toUpperCase()} de Uniline. ${DESC[n]} Úsala cuando el usuario escriba /${n === 'arquitecto' ? 'disenar, /modulo o /proponer' : n === 'auditor' ? 'inventario, /auditar o /reauditar' : n === 'desarrollador' ? 'cambio o /corregir' : n === 'evaluador' ? 'evaluar' : 'probar'}, o pida esa tarea.
---

${rol(n)}`);
  skillsClaudeAi.push(nom);
}
wr('dist/claude-ai/instrucciones-proyecto.md', rd('src/instrucciones-cortas.md').replace(
  'están en el archivo de conocimiento uniline-conocimiento.md: consúltalo',
  'están en las skills uniline-* y en las skills de cada tema: cárgalas'));
fs.mkdirSync(path.join(R, 'dist/claude-ai/zips'), { recursive: true });
try {
  for (const s of skillsClaudeAi)
    execSync(`zip -qr "../zips/${s}.zip" "${s}"`, { cwd: path.join(R, 'dist/claude-ai/skills') });
} catch { console.warn('⚠️ zip no disponible: sube las carpetas de dist/claude-ai/skills comprimidas a mano'); }

// ---------- Conocimiento consolidado (ChatGPT, Lovable, Gemini, etc.) ----------
const quitarFM = t => t.replace(/^---[\s\S]*?---\s*/, '');
const conocimiento = [
  '# CONOCIMIENTO UNILINE — referencia completa',
  PRINCIPIOS, CONV,
  ...ROLES.map(n => rol(n)),
  ...PROPIAS.filter(s => s !== 'documentacion-modulo').map(s => `# SKILL: ${s}\n\n${quitarFM(rd(`skills/${s}/SKILL.md`))}`),
  `# SKILLS DE TERCEROS INCLUIDAS (en .claude/skills/, cada una con LICENSE y ORIGEN.md)\n\n${TERCEROS.join(' · ')}`,
].join('\n\n---\n\n');
wr('dist/chatgpt/uniline-conocimiento.md', conocimiento);
wr('dist/chatgpt/instrucciones.md', rd('src/instrucciones-cortas.md'));
wr('dist/lovable/knowledge.md', rd('src/instrucciones-cortas.md').replace(
  /Las plantillas[\s\S]*$/, 'Lee /docs/00-estado.md y AGENTS.md del repo antes de cualquier cambio.'));

// ---------- AGENTS.md (Codex, Cursor, Gemini CLI, Windsurf, Lovable vía repo) ----------
wr('dist/AGENTS.md', `# AGENTS.md — Reglas Uniline\n\n${conocimiento.replace(/^# CONOCIMIENTO UNILINE — referencia completa\n*/, '')}`);

// ---------- Versión por proyecto (.claude/ dentro del repo; sirve en Claude Code web, app y terminal sin plugins) ----------
const P = 'dist/proyecto/.claude';
for (const n of ROLES) wr(`${P}/agents/${n}.md`, rd(`agents/${n}.md`));
// Comandos como skills: funcionan con /nombre y también pidiéndolo en palabras.
for (const f of fs.readdirSync(path.join(R, 'commands'))) {
  const nom = f.replace(/\.md$/, '');
  wr(`${P}/skills/${nom}/SKILL.md`, rd(`commands/${f}`).replace(/^---\n/, `---\nname: ${nom}\n`));
}
// CLAUDE.md es un enrutador conciso; la constitución detallada existe en .claude/core y los agentes especializados.
wr('dist/proyecto/CLAUDE.md', rd('src/claude-md-encabezado.md') + '\n\nLee `.claude/core/principios.md` cuando necesites las políticas completas. Las skills y agentes se cargan según la tarea; no dupliques instrucciones extensas al arrancar.\n');
for (const s of SKILLS) cpDir(`skills/${s}`, `${P}/skills/${s}`);
wr(`${P}/hooks/guardian.cjs`, rd('hooks/guardian.cjs'));
wr(`${P}/hooks/sesion.cjs`, rd('hooks/sesion.cjs'));
wr(`${P}/hooks/recordatorio.cjs`, rd('hooks/recordatorio.cjs'));
wr(`${P}/core/principios.md`, PRINCIPIOS);
wr(`${P}/settings.json`, JSON.stringify({
  hooks: {
    SessionStart: [{ hooks: [{ type: 'command', command: 'node "$CLAUDE_PROJECT_DIR/.claude/hooks/sesion.cjs"' }] }],
    UserPromptSubmit: [{ hooks: [{ type: 'command', command: 'node "$CLAUDE_PROJECT_DIR/.claude/hooks/recordatorio.cjs"' }] }],
    PreToolUse: [{ matcher: 'Bash|Write|Edit|MultiEdit|mcp__.*', hooks: [{ type: 'command', command: 'node "$CLAUDE_PROJECT_DIR/.claude/hooks/guardian.cjs"', timeout: 10 }] }],
  },
}, null, 2));
wr('dist/proyecto/AGENTS.md', rd('dist/AGENTS.md'));
// Ejemplo lleno de referencia para que los agentes copien el formato
fs.cpSync(path.join(R, 'docs/ejemplo-caja-chica/docs'), path.join(R, P, 'ejemplos/caja-chica'), { recursive: true });
fs.cpSync(path.join(R, 'docs/ejemplo-caja-chica.md'), path.join(R, P, 'ejemplos/caja-chica-recorrido.md'));

// ---------- Plantilla de proyecto nuevo (repo 'Use this template') ----------
const T = 'dist/plantilla';
fs.cpSync(path.join(R, 'dist/proyecto'), path.join(R, T), { recursive: true });
fs.cpSync(path.join(R, 'templates/plantilla/README.md'), path.join(R, T, 'README.md'));
fs.cpSync(path.join(R, 'templates/plantilla/NOTICE.md'), path.join(R, T, 'NOTICE.md'));
fs.cpSync(path.join(R, 'templates/plantilla/gitignore'), path.join(R, T, '.gitignore'));
fs.cpSync(path.join(R, 'LICENSE'), path.join(R, T, 'LICENSE'));
const vacio = t => `# ${t}\n`;
wr(`${T}/docs/00-estado.md`, rd('templates/docs/00-estado.md')
  .replace('<fecha y hora>', '—').replace('<arquitecto | auditor | desarrollador | qa>', '—')
  .replace('Vuelta <N> · <R<n> si aplica> · <paso> — <nombre> (ver .claude/agents/arquitecto.md)', 'Vuelta 0 · 0.1 — Arranque').replace('**Rebanada en curso:** <R<n> · nombre · estado>', '**Rebanada en curso:** —')
  .replace('**Módulo en curso:** <nombre>', '**Módulo en curso:** —')
  .replace('**Última pregunta:** P-XXX — <texto corto> — <ABIERTA | RESPONDIDA: respuesta>', '**Última pregunta:** —')
  .replace('**Siguiente paso exacto:** <qué sigue, en una línea>', '**Siguiente paso exacto:** el dueño escribe "Quiero un sistema para …"; el agente hace 0.2 (investigación del giro) y 0.3 (condiciones)')
  .replace('- D-XXX · <módulo> · <decisión en una línea>', '- (ninguna)'));
for (const [f, t] of [['00-vision','Visión'],['00-mapa','Mapa del sistema'],['investigacion-giro','Investigación del giro'],['historias','Historias'],['funciones','Catálogo de funciones'],['rebanadas','Rebanadas'],['diagrama-er','Diagrama entidad-relación'],['glosario','Glosario'],['sistema-diseno','Sistema de diseño'],['preguntas','Preguntas'],['decisiones','Decisiones'],['riesgos','Riesgos'],['plan-construccion','Plan de construcción']]) wr(`${T}/docs/${f}.md`, vacio(t));
wr(`${T}/docs/bitacora.md`, '# Bitácora\n');
wr(`${T}/docs/modulos/.gitkeep`, ''); wr(`${T}/docs/ordenes/.gitkeep`, '');

const len = rd('dist/chatgpt/instrucciones.md').length;
console.log(`agents: ${ROLES.length} · comandos: ${fs.readdirSync(path.join(R, 'commands')).length} · skills: ${PROPIAS.length} propias + ${TERCEROS.length} de terceros · instrucciones ChatGPT: ${len} caracteres${len > 8000 ? ' ⚠️ EXCEDE 8000' : ''}`);
