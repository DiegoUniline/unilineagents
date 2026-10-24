#!/usr/bin/env node
'use strict';
// Pruebas ESTÁTICAS de distribución y contrato. NO ejecutan el modelo ni demuestran conducta semántica.
const fs=require('fs'),path=require('path'),assert=require('node:assert/strict');
const R=path.join(__dirname,'..'),read=p=>fs.readFileSync(path.join(R,p),'utf8');
const skill='skills/clasificacion-hallazgos/SKILL.md';
let pass=0;
function check(name,fn){try{fn();pass++;console.log('PASS '+name)}catch(e){console.error('FAIL '+name+': '+e.message);process.exitCode=1;}}
const classes=['DEFECTO_COMPROBADO','DEFECTO_INFERIDO','RIESGO_ARQUITECTONICO','DECISION_NEGOCIO_PENDIENTE','RECOMENDACION','BRECHA_DE_VERIFICACION','DESVIACION_PROCESO','FALSO_POSITIVO'];
for(const cls of classes)check('clase documentada: '+cls,()=>assert.ok(read(skill).includes(cls)));
for(const f of ['core/principios.md','core/arquitecto.md','core/desarrollador.md','core/qa.md','core/auditor.md','core/evaluador.md','src/claude-md-encabezado.md','src/instrucciones-cortas.md','src/commands/evaluar.md','src/commands/calidad.md']){
  check('agente/enrutador conecta clasificación: '+f,()=>assert.ok(read(f).includes('clasificacion-hallazgos')));
}
for(const p of ['dist/proyecto/.claude/skills/clasificacion-hallazgos/SKILL.md','dist/claude-ai/skills/clasificacion-hallazgos/SKILL.md']){
  check('skill distribuida en '+p,()=>assert.equal(read(skill).trim(),read(p).trim()));
}
check('rúbrica distribuida a Claude Code',()=>assert.equal(read('skills/clasificacion-hallazgos/references/rubrica.md').trim(),read('dist/proyecto/.claude/skills/clasificacion-hallazgos/references/rubrica.md').trim()));
check('rúbrica distribuida a Claude.ai',()=>assert.equal(read('skills/clasificacion-hallazgos/references/rubrica.md').trim(),read('dist/claude-ai/skills/clasificacion-hallazgos/references/rubrica.md').trim()));
check('instrucciones Claude.ai referencian skill',()=>assert.match(read('dist/claude-ai/instrucciones-proyecto.md'),/clasificacion-hallazgos/));
check('CLAUDE.md generado referencia skill',()=>assert.match(read('dist/proyecto/CLAUDE.md'),/clasificacion-hallazgos/));
check('comandos generados enlazan skill',()=>assert.match(read('commands/evaluar.md')+read('commands/calidad.md'),/clasificacion-hallazgos/));
check('barrera anti falso positivo',()=>assert.match(read(skill),/preferencia del auditor/i));
check('barrera anti vulnerabilidad disfrazada',()=>assert.match(read(skill),/no se excusa una vulnerabilidad|NO desaparece porque/i));
check('ejemplo de TC con decisión separada',()=>assert.match(read(skill),/tipo_cambio=1000/));
check('puntuación no fabricada',()=>assert.match(read('docs/criterios-auditoria-causal.md'),/no reajustar cifras/i));
check('instrucciones breves dentro del límite',()=>assert.ok(read('src/instrucciones-cortas.md').length<=8000));
console.log(pass+' validaciones ESTÁTICAS completadas; evaluación real con Claude pendiente.');
process.exit(process.exitCode||0);
