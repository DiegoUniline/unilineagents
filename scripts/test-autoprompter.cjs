#!/usr/bin/env node
'use strict';
const fs=require('fs'),path=require('path'),assert=require('node:assert/strict');
const rd=p=>fs.readFileSync(path.join(__dirname,'..',p),'utf8');
const names=['DIJISTE','ENTENDÍ','ESTO COMPROBÉ','ESTO DETECTÉ','ESTO PROPONGO','ESTO AFECTARÁ','ASÍ FUNCIONARÁ','NECESITO QUE DECIDAS','VERIFICARÉ'];
let pass=0,failed=0;
function check(title,fn){try{fn();pass++;console.log('OK '+title)}catch(e){failed++;console.error('FAIL '+title+': '+e.message)}}
for(const p of ['skills/autoprompter/SKILL.md','core/principios.md','src/claude-md-encabezado.md','src/instrucciones-cortas.md','hooks/recordatorio.cjs','docs/auto-prompter-v2.md']){
check('Nueve encabezados en orden: '+p,()=>{let last=-1;const s=rd(p);for(const x of names){const pos=s.indexOf(x,last+1);assert.ok(pos>last,'Falta o está desordenado '+x);last=pos;}});
}
check('Primera respuesta antes de modificar',()=>assert.match(rd('skills/autoprompter/SKILL.md'),/ANTES de editar código o datos/));
check('Decisiones sin repetir plantilla',()=>assert.match(rd('skills/autoprompter/SKILL.md'),/sin repetir los nueve apartados/i));
check('Tareas triviales exentas',()=>assert.match(rd('skills/autoprompter/SKILL.md'),/Exenciones y límites/));
check('Distinguir datos no comprobados',()=>assert.match(rd('skills/autoprompter/SKILL.md'),/No comprobado/));
check('Comando lee contrato',()=>assert.match(rd('src/commands/autoprompt.md'),/NUEVE encabezados obligatorios/));
check('Orden de trabajo respeta contrato',()=>assert.match(rd('skills/orden-de-trabajo/SKILL.md'),/NUEVE encabezados visibles/));
check('Claude Code distribuye contrato',()=>assert.match(rd('dist/proyecto/CLAUDE.md'),/Contrato visible obligatorio/));
check('Claude.ai distribuye contrato',()=>assert.match(rd('dist/claude-ai/instrucciones-proyecto.md'),/PRIMERA RESPUESTA VISIBLE ANTES DE EDITAR/));
check('Skill de proyecto generada sincronizada',()=>assert.equal(rd('skills/autoprompter/SKILL.md').trim(),rd('dist/proyecto/.claude/skills/autoprompter/SKILL.md').trim()));
console.log(pass+'/'+(pass+failed)+' validaciones estáticas (NO demuestran obediencia del modelo).');
process.exit(failed?1:0);
