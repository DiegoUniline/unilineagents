#!/usr/bin/env node
'use strict';
// Contract and distribution tests only. Real agent performance requires executing scenario evaluations with the LLM.
const fs=require('fs'), path=require('path'), assert=require('node:assert/strict');
const root=path.join(__dirname,'..');
const text=p=>fs.readFileSync(path.join(root,p),'utf8');
const check=(name,fn)=>{try{fn();console.log('PASS',name);return true}catch(e){console.error('FAIL',name,e.message);return false}};
const refs=['arquitectura-datos','rendimiento-realtime','seguridad-acceso','operacion-entrega','flujos-empresariales','evaluaciones'];
const expected=['Consulta lenta','RLS','Realtime','Ventas duplicadas','Catálogos'];
let result=[];
result.push(check('orchestrator skill registered',()=>assert.match(text('skills/supabase-saas-enterprise/SKILL.md'),/name: supabase-saas-enterprise/)));
for(const ref of refs)result.push(check('reference '+ref,()=>assert.ok(text('skills/supabase-saas-enterprise/references/'+ref+'.md').length>250)));
for(const dest of ['dist/proyecto/.claude/skills/supabase-saas-enterprise/SKILL.md','dist/claude-ai/skills/supabase-saas-enterprise/SKILL.md'])
  result.push(check('distribution '+dest,()=>assert.equal(text(dest).trim(),text('skills/supabase-saas-enterprise/SKILL.md').trim())));
for(const ref of refs)result.push(check('project reference '+ref,()=>assert.equal(text('dist/proyecto/.claude/skills/supabase-saas-enterprise/references/'+ref+'.md').trim(),text('skills/supabase-saas-enterprise/references/'+ref+'.md').trim())));
result.push(check('source CLI evaluator command',()=>assert.match(text('src/commands/evaluar.md'),/\{\{ROL:evaluador\}\}/)));
result.push(check('built evaluator agent',()=>assert.match(text('dist/proyecto/.claude/agents/evaluador.md'),/AGENTE AUDITOR DE EVALUACI[ÓO]N/)));
result.push(check('built evaluator command',()=>assert.match(text('commands/evaluar.md'),/auditor independiente/i)));
result.push(check('Claude project routes evaluator',()=>assert.match(text('dist/proyecto/CLAUDE.md'),/\.claude\/agents\/evaluador\.md/)));
result.push(check('Claude.ai routes evaluator',()=>assert.match(text('dist/claude-ai/instrucciones-proyecto.md'),/EVALUADOR \(\/evaluar\)/)));
result.push(check('ChatGPT instruction length',()=>assert.ok(text('src/instrucciones-cortas.md').length<=8000)));
result.push(check('supabase official source intact',()=>assert.match(text('skills/supabase/SKILL.md'),/name: supabase/)));
result.push(check('security capability',()=>assert.match(text('skills/supabase-saas-enterprise/references/seguridad-acceso.md'),/SECURITY DEFINER/)));
result.push(check('retry/concurrency capability',()=>assert.match(text('skills/supabase-saas-enterprise/references/arquitectura-datos.md'),/idempoten/i)));
result.push(check('realtime reconciliation',()=>assert.match(text('skills/supabase-saas-enterprise/references/rendimiento-realtime.md'),/reconcilia/i)));
const evalText=text('skills/supabase-saas-enterprise/references/evaluaciones.md');
for(const scenario of expected) result.push(check('evaluative scenario '+scenario,()=>assert.ok(evalText.includes(scenario))));
result.push(check('no false semantic claims',()=>assert.match(text('core/evaluador.md'),/fixture|simulad/i)));
const ok=result.filter(Boolean).length;
console.log(ok+'/'+result.length+' static checks passed. NO empirical model evaluation performed.');
process.exit(ok===result.length?0:1);
