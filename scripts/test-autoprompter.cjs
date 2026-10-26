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
const labels=['ENTENDÍ','COMPROBÉ','PROPONGO','TAMBIÉN AFECTARÁ','RESULTADO','NECESITO QUE DECIDAS'];
for(const p of ['skills/autoprompter/SKILL.md','core/principios.md','src/claude-md-encabezado.md','src/instrucciones-cortas.md','hooks/recordatorio.cjs']){
 test('Contrato visible de seis puntos en '+p,()=>{const s=read(p);let last=-1;for(const label of labels){const at=s.indexOf(label,last+1);assert.ok(at>last,'falta o fuera de orden '+label);last=at;}});
}
test('Seis puntos antes de editar',()=>assert.match(read('skills/autoprompter/SKILL.md'),/ANTES DE EDITAR|antes de EDITAR/i));
test('Trivialidades exentas',()=>assert.match(read('skills/autoprompter/SKILL.md'),/trivialidad|corrección menor/i));
test('No repetir plantilla por turno',()=>assert.match(read('skills/autoprompter/SKILL.md'),/no repitas los seis apartados/i));
test('Hechos con evidencia',()=>assert.match(read('skills/autoprompter/SKILL.md'),/No comprobado/));
test('Análisis de nueve puntos internos',()=>assert.match(read('skills/autoprompter/SKILL.md'),/Los nueve puntos de análisis son INTERNOS/i));
test('Enrutador generado actualizado',()=>assert.match(read('dist/proyecto/CLAUDE.md'),/AutoPrompter v3\.1/));
test('Enrutador no duplica constitución',()=>assert.ok(read('dist/proyecto/CLAUDE.md').length<read('core/principios.md').length));
test('Claude.ai recibe contrato visible',()=>assert.match(read('dist/claude-ai/instrucciones-proyecto.md'),/ENTENDÍ \/ COMPROBÉ.*TAMBIÉN AFECTARÁ.*RESULTADO.*NECESITO QUE DECIDAS/));
test('Comando de Autoprompt actualizado',()=>assert.match(read('commands/autoprompt.md'),/TAMBIÉN AFECTARÁ/));
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
test('Memoria asociativa activada',()=>assert.match(read('src/claude-md-encabezado.md'),/memoria-asociativa/));
test('Skill asociativa distribuida',()=>assert.equal(read('dist/proyecto/.claude/skills/memoria-asociativa/SKILL.md').trim(),read('skills/memoria-asociativa/SKILL.md').trim()));
test('Router distribuido en Claude Code',()=>assert.equal(read('dist/proyecto/.claude/scripts/contexto.cjs').trim(),read('scripts/contexto.cjs').trim()));
test('Router distribuido en plantilla nueva',()=>assert.equal(read('dist/plantilla/.claude/scripts/contexto.cjs').trim(),read('scripts/contexto.cjs').trim()));
test('Índice inicial vacío, sin relaciones inventadas',()=>assert.deepEqual(JSON.parse(read('dist/plantilla/docs/contexto/relaciones.json')).modules,[]));
let ok=0; for(const [n,fn] of checks){try{fn();console.log('OK '+n);ok++;}catch(e){console.error('FAIL '+n+': '+e.message)}}
console.log(ok+'/'+checks.length+' validaciones estáticas. Comprobar conducta con el modelo real sigue pendiente.');
process.exit(ok===checks.length?0:1);
