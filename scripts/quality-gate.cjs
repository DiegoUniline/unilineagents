#!/usr/bin/env node
'use strict';
// Structural evidence gate. Does NOT run Claude and cannot authenticate the truth of an evidence reference.
const fs=require('fs');
const categories=['contexto','agentes','supabase','ux-ui','mobile','seguridad','memoria','eficiencia','evaluacion'];
function validate(data){
  const errors=[];
  if(!data||typeof data!=='object')return {passed:false,errors:['Reporte inválido'],verified:0};
  if(data.schemaVersion!==1)errors.push('schemaVersion debe ser 1');
  if(!data.project||!data.revision||!data.evaluatedAt)errors.push('Faltan proyecto, revisión o fecha');
  if(!Array.isArray(data.areas))errors.push('Falta areas');
  if(!Array.isArray(data.globalBlockingFailures))errors.push('Falta globalBlockingFailures');
  if((data.globalBlockingFailures||[]).length)errors.push('Bloqueos globales');
  const present=new Set();
  for(const a of Array.isArray(data.areas)?data.areas:[]){
    if(!a||typeof a.id!=='string'){errors.push('Área sin id');continue;}
    if(present.has(a.id))errors.push('Área duplicada: '+a.id);
    present.add(a.id);
    if(!categories.includes(a.id))errors.push('Área no reconocida: '+a.id);
    if(!Number.isFinite(a.score)||a.score<0||a.score>100)errors.push('Puntuación no válida: '+a.id);
    else if(a.score<95)errors.push('Meta no alcanzada: '+a.id+' ('+a.score+'/100)');
    if(!Number.isInteger(a.casesPlanned)||a.casesPlanned<1||!Number.isInteger(a.casesRun)||a.casesRun!==a.casesPlanned)
      errors.push('Cobertura insuficiente: '+a.id);
    if(!Array.isArray(a.blockingFailures))errors.push('Sin registro de bloqueos: '+a.id);
    else if(a.blockingFailures.length)errors.push('Bloqueos críticos: '+a.id);
    const evidence=Array.isArray(a.evidence)?a.evidence:[];
    if(!evidence.some(x=>x&&x.type==='observed'&&typeof x.ref==='string'&&x.ref.trim()&&
      typeof x.description==='string'&&x.description.trim()))
      errors.push('Falta evidencia observada: '+a.id);
  }
  for(const id of categories)if(!present.has(id))errors.push('Área sin evaluar: '+id);
  return {passed:errors.length===0,errors,verified:present.size,total:categories.length};
}
if(require.main===module){
 const file=process.argv[2];
 if(!file){console.error('Uso: node scripts/quality-gate.cjs informe.json');process.exit(2);}
 try{
   const result=validate(JSON.parse(fs.readFileSync(file,'utf8')));
   console.log(result.passed?'OBJETIVO DOCUMENTADO: 95+/100 por dimensión (pendiente auditoría humana de evidencias)':'NO CERTIFICADO');
   console.log(result.verified+'/'+result.total+' áreas representadas');
   for(const e of result.errors)console.log('- '+e);
   process.exit(result.passed?0:1);
 }catch(e){console.error('Reporte no procesable: '+e.message);process.exit(2);}
}
module.exports={validate,categories};
