#!/usr/bin/env node
'use strict';
// Pruebas de integración de fuentes y distribución. No sustituyen evaluaciones con Claude real.
const fs = require('fs');
const path = require('path');
const assert = require('node:assert/strict');
const root = path.join(__dirname, '..');
const read = p => fs.readFileSync(path.join(root,p),'utf8');
const checks = [];
const test = (n, fn) => checks.push([n,fn]);
for(const slug of ['autoprompter','ux-ui-jerarquia-saas','mobile-ux-architect','evaluacion-ux-movil','contexto-eficiente','continuidad-proyecto','evaluacion-agente']){
 test('Skill accesible: '+slug,()=>assert.match(read('skills/'+slug+'/SKILL.md'),new RegExp('name: '+slug)));
 test('Skill distribuida a proyecto: '+slug,()=>assert.equal(read('dist/proyecto/.claude/skills/'+slug+'/SKILL.md').trim(),read('skills/'+slug+'/SKILL.md').trim()));
 test('Skill disponible en Claude.ai: '+slug,()=>assert.equal(read('dist/claude-ai/skills/'+slug+'/SKILL.md').trim(),read('skills/'+slug+'/SKILL.md').trim()));
}
test('AutoPrompter v3 natural',()=>assert.match(read('skills/autoprompter/SKILL.md'),/conversación natural/i));
test('Excepciones triviales',()=>assert.match(read('skills/autoprompter/SKILL.md'),/Trivial/));
test('Análisis interno en vez de nueve títulos',()=>assert.match(read('skills/autoprompter/SKILL.md'),/control INTERNO/i));
test('Enrutador actualizado',()=>assert.match(read('dist/proyecto/CLAUDE.md'),/AutoPrompter v3/));
test('Enrutador no duplica constitución completa',()=>assert.ok(read('dist/proyecto/CLAUDE.md').length < read('core/principios.md').length, 'CLAUDE.md demasiado largo'));
test('Claude.ai usa conversación natural',()=>assert.match(read('dist/claude-ai/instrucciones-proyecto.md'),/conversa (naturalmente|sin formularios)|sin nueve apartados fijos/i));
test('Continuidad usa checkpoint',()=>assert.match(read('skills/continuidad-proyecto/SKILL.md'),/Checkpoint/));
test('UX referencia sistema aprobado',()=>assert.match(read('skills/ux-ui-jerarquia-saas/SKILL.md'),/sistema-diseno/));
test('UX accesibilidad explícita',()=>assert.match(read('skills/ux-ui-jerarquia-saas/SKILL.md'),/WCAG 2\.2/));
test('UX con checklist bajo demanda',()=>assert.match(read('dist/proyecto/.claude/skills/ux-ui-jerarquia-saas/references/auditoria.md'),/Lista de comprobación/));
test('Desarrollador utiliza skill UX',()=>assert.match(read('core/desarrollador.md'),/ux-ui-jerarquia-saas/));
test('QA utiliza skill UX',()=>assert.match(read('core/qa.md'),/ux-ui-jerarquia-saas/));
test('Contexto eficiente en instrucciones',()=>assert.match(read('src/instrucciones-cortas.md'),/contexto-eficiente/));
test('Sin nueve títulos obligatorios en encabezado',()=>assert.doesNotMatch(read('src/claude-md-encabezado.md'),/NUEVE encabezados obligatorios/i));
test('Mobile skill ref distribuida',()=>assert.equal(read('dist/proyecto/.claude/skills/mobile-ux-architect/references/patrones-moviles.md').trim(),read('skills/mobile-ux-architect/references/patrones-moviles.md').trim()));
test('Evaluador móvil tiene rúbrica',()=>assert.match(read('skills/evaluacion-ux-movil/SKILL.md'),/100 puntos/));
test('Ruta móvil activada en desarrollador',()=>assert.match(read('core/desarrollador.md'),/mobile-ux-architect/));
test('Rúbrica QA incluida',()=>assert.match(read('core/qa.md'),/evaluacion-ux-movil/));
test('Comando calidad distribuido',()=>assert.match(read('dist/proyecto/.claude/skills/calidad/SKILL.md'),/calidad/));
test('Continuidad documentada',()=>assert.match(read('dist/proyecto/.claude/skills/continuidad-proyecto/references/checkpoint-esquema.md'),/Checkpoint/));
let ok=0; for(const [n,fn] of checks){try{fn();console.log('OK '+n);ok++;}catch(e){console.error('FAIL '+n+': '+e.message)}}
console.log(ok+'/'+checks.length+' validaciones estáticas. Comprobar conducta con el modelo real sigue pendiente.');
process.exit(ok===checks.length?0:1);
