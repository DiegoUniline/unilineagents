#!/usr/bin/env node
'use strict';
// Evidencia estructural de aprendizaje: no sustituye tests adversariales reales ni un auditor independiente.
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const {spawnSync}=require('node:child_process');
const ID=/^INC-[0-9]{3,6}$/;
const CLASSES=new Set(['DEFECTO_COMPROBADO','DEFECTO_INFERIDO','RIESGO_ARQUITECTONICO','BRECHA_DE_VERIFICACION','DESVIACION_PROCESO']);
const SEVERITIES=new Set(['critical','high','medium','low']);
const STATUSES=new Set(['open','verified','false_positive']);
const own=(obj,k)=>Object.prototype.hasOwnProperty.call(obj,k);
const sha=s=>crypto.createHash('sha256').update(s).digest('hex');
function readTracked(root,rel,revision) {
  if(typeof rel!=='string'||!rel||path.isAbsolute(rel)||rel.split(/[\\/]/).includes('..')||rel.includes('\0'))throw Error('Ruta inválida: '+String(rel));
  const base=fs.realpathSync(root),absolute=path.resolve(base,rel);
  const actual=fs.realpathSync(absolute);
  if(!actual.startsWith(base+path.sep)||!fs.statSync(actual).isFile())throw Error('Ruta fuera del proyecto: '+rel);
  const bytes=fs.readFileSync(actual);
  const git=spawnSync('git',['show',revision+':'+rel],{cwd:root,maxBuffer:4*1024*1024});
  if(git.status!==0||!git.stdout.equals(bytes))throw Error('Archivo sin versión Git vigente: '+rel);
  return bytes;
}
function validateLearning({root,revision,registryPath='calidad/aprendizajes.json',scenarioConfig,deliveryReport}) {
  const errors=[],detail=[];
  let registry;
  try {registry=JSON.parse(readTracked(root,registryPath,revision));}
  catch(e){return {passed:false,errors:['Registro no disponible: '+e.message],incidents:detail};}
  if(registry.schemaVersion!==1||!Array.isArray(registry.incidents))return {passed:false,errors:['Registro requiere schemaVersion=1 e incidents=[]'],incidents:detail};
  const cases=new Map((scenarioConfig?.cases||[]).map(c=>[c.id,c]));
  const observations=new Map((deliveryReport?.cases||[]).map(c=>[c.id,c]));
  const seen=new Set();
  if(deliveryReport?.revision!==revision)errors.push('El informe de pruebas no coincide con revisión Git: '+revision);
  for(const incident of registry.incidents) {
    const label=incident?.id||'(sin id)',fails=[],description={id:label,status:incident?.status||'unknown',regressionIds:incident?.regressionCaseIds||[]};
    detail.push(description);
    if(!ID.test(label)||seen.has(label))fails.push('ID inválido o duplicado');
    seen.add(label);
    if(!CLASSES.has(incident?.classification))fails.push('Clasificación de defecto/riesgo inválida; las recomendaciones comerciales no son bugs');
    if(!SEVERITIES.has(incident?.severity))fails.push('Severidad inválida');
    if(!STATUSES.has(incident?.status))fails.push('Estado inválido');
    if(typeof incident?.module!=='string'||!incident.module.trim())fails.push('Falta módulo');
    if(typeof incident?.rootCause!=='string'||incident.rootCause.trim().length<25)fails.push('Causa raíz insuficiente o no investigada');
    if(typeof incident?.evidenceLevel!=='string'||!['REPRODUCIDO','OBSERVADO','INFERIDO','NO_VERIFICADO'].includes(incident.evidenceLevel))fails.push('Nivel de evidencia inválido');
    if(incident?.status==='verified'&&!['REPRODUCIDO','OBSERVADO'].includes(incident.evidenceLevel))fails.push('No verificar una inferencia sin observación o reproducción');
    const doc='docs/incidentes/'+label+'.md';
    try {
      const file=readTracked(root,doc,revision).toString('utf8');
      if(!file.includes(label)||!file.includes('## Causa')||!file.includes('## Verificación'))fails.push('Documento incidente sin ID, causa o verificación');
    }catch(e){fails.push('Falta incidente versionado: '+e.message);}
    if(incident?.status==='verified') {
      if(!Array.isArray(incident.regressionCaseIds)||!incident.regressionCaseIds.length)fails.push('Sin regresión identificada');
      else for(const id of incident.regressionCaseIds) {
        const c=cases.get(id),obs=observations.get(id);
        if(!c||c.applicable!==true||!c.adapter||!own(c,'expected')||c.expected===null)fails.push('Regresión sin escenario conectado: '+id);
        if(!obs||obs.status!=='passed'||!Array.isArray(obs.evidence)||!obs.evidence.length)fails.push('Regresión sin prueba ejecutada y evidencia: '+id);
      }
      if(typeof incident.reproductionFile!=='string')fails.push('Sin evidencia previa del fallo');
      else try {
        const before=readTracked(root,incident.reproductionFile,revision).toString('utf8');
        if(!before.includes(label)||before.trim().length<35)fails.push('Reproducción previa no describe el fallo');
      }catch(e){fails.push('Reproducción previa no versionada: '+e.message);}
      if(typeof incident.reviewer!=='string'||incident.reviewer.trim().length<3)fails.push('Falta revisión independiente registrada');
    } else if(incident?.status==='open' && ['critical','high'].includes(incident.severity)) {
      fails.push('Defecto/riesgo alto sin resolver: BLOQUEA ENTREGA');
    } else if(incident?.status==='false_positive') {
      if(typeof incident.refutationFile!=='string')fails.push('Falso positivo sin refutación');
      else try {
        const proof=readTracked(root,incident.refutationFile,revision).toString('utf8');
        if(!proof.includes(label)||proof.trim().length<35)fails.push('Refutación insuficiente');
      }catch(e){fails.push('Refutación no versionada: '+e.message);}
      if(typeof incident.reviewer!=='string'||incident.reviewer.trim().length<3)fails.push('Falso positivo sin revisor');
    }
    for(const item of fails)errors.push(label+': '+item);
  }
  return {passed:errors.length===0,errors,incidents:detail,kind:'learning-regression-structural-check',
    note:'Verifica trazabilidad y resultados reportados. No verifica independencia real del revisor, exhaustividad de incidentes ni que adaptadores ejecuten la aplicación; auditoría humana obligatoria.'};
}
module.exports={validateLearning};
if(require.main===module){
 const root=process.cwd(),revision=spawnSync('git',['rev-parse','HEAD'],{cwd:root,encoding:'utf8'}).stdout.trim();
 let result;
 try{
   const config=JSON.parse(fs.readFileSync(path.resolve(root,'calidad/escenarios.json'),'utf8'));
   const report=JSON.parse(fs.readFileSync(path.resolve(root,'artifacts/calidad/entrega.json'),'utf8'));
   result=validateLearning({root,revision,scenarioConfig:config,deliveryReport:report});
 }catch(e){result={passed:false,errors:[e.message]};}
 console.log(JSON.stringify(result,null,2));process.exitCode=result.passed?0:1;
}
