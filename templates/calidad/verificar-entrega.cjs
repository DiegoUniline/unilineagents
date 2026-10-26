#!/usr/bin/env node
'use strict';
// Runs project-owned scenario adapters; a fixture is not product evidence.
const fs = require('node:fs');
const path = require('node:path');
const {spawnSync} = require('node:child_process');
const {isDeepStrictEqual} = require('node:util');
const crypto = require('node:crypto');
const {validateLearning}=require('./validar-aprendizajes.cjs');
const REQUIRED = ['sale-remove-cancel','payment-method','payment-excess','service-no-stock','last-unit-concurrent','retry-once','rollback','tenant-permissions','transfer-partial','purchase-receipt','catalog-create','catalog-cancel','catalog-permissions','resume-context','restore-recovery'];
const hash = b => crypto.createHash('sha256').update(b).digest('hex');
function local(root, value) {
  if (typeof value !== 'string' || !value || path.isAbsolute(value)) throw Error('Ruta relativa requerida');
  const base=fs.realpathSync(root), candidate=fs.realpathSync(path.resolve(base,value));
  if (!candidate.startsWith(base+path.sep)) throw Error('Ruta fuera del proyecto');
  if (!fs.statSync(candidate).isFile()) throw Error('Se requiere archivo');
  return candidate;
}
function versioned(root,value,revision) {
  const file=local(root,value), relative=path.relative(fs.realpathSync(root),file).split(path.sep).join('/');
  const committed=spawnSync('git',['show',revision+':'+relative],{cwd:root,maxBuffer:4*1024*1024});
  if(committed.status!==0 || !committed.stdout.equals(fs.readFileSync(file))) throw Error('Archivo no versionado o distinto de la revisión: '+value);
  return file;
}
function validate(config) {
  const errors=[];
  if (config?.schemaVersion!==1) errors.push('schemaVersion debe ser 1');
  if (!Array.isArray(config?.cases)) return [...errors,'cases requerido'];
  const ids=config.cases.map(c=>c.id);
  if (new Set(ids).size!==ids.length) errors.push('IDs duplicados');
  for (const id of REQUIRED) if (!ids.includes(id)) errors.push('Caso ausente: '+id);
  for (const c of config.cases) {
    if (typeof c.id!=='string' || !c.id) errors.push('ID inválido');
    if (c.applicable!==true && c.applicable!==false) errors.push(c.id+': decidir aplicabilidad');
    if (c.applicable===false) {
      if (!c.exception || typeof c.exception.reason!=='string' || c.exception.reason.trim().length<20 || !c.exception.decisionFile) errors.push(c.id+': excepción sin motivo/decisión');
    } else if (!c.adapter || !Object.hasOwn(c,'expected') || c.expected===null) errors.push(c.id+': prueba sin conectar o sin resultado esperado');
  }
  return errors;
}
function run(root,configPath,output) {
  const report={schemaVersion:1,kind:'application-delivery',revision:null,configSha256:null,startedAt:new Date().toISOString(),passed:false,errors:[],cases:[]};
  try {
    const rev=spawnSync('git',['rev-parse','HEAD'],{cwd:root,encoding:'utf8'});
    const dirty=spawnSync('git',['status','--porcelain','--untracked-files=normal'],{cwd:root,encoding:'utf8'});
    if(rev.status!==0 || dirty.status!==0) throw Error('Se requiere checkout Git verificable');
    report.revision=rev.stdout.trim();
    if(dirty.stdout.trim()) throw Error('Checkout con cambios: probar una revisión limpia y versionada');
    const file=versioned(root,configPath,report.revision), raw=fs.readFileSync(file);
    report.configSha256=hash(raw);
    const config=JSON.parse(raw);report.errors.push(...validate(config));
    if(report.errors.length) throw Error('Configuración incompleta');
    for(const c of config.cases) {
      const caseStarted=Date.now();
      const item={id:c.id,status:'failed'};report.cases.push(item);
      try {
        if(!c.applicable) {
          const decision=versioned(root,c.exception.decisionFile,report.revision);
          item.status='not-applicable';item.reason=c.exception.reason;item.decisionSha256=hash(fs.readFileSync(decision));continue;
        }
        const adapter=versioned(root,c.adapter,report.revision);item.adapterSha256=hash(fs.readFileSync(adapter));
        const child=spawnSync(process.execPath,[adapter],{cwd:root,input:JSON.stringify({id:c.id,input:c.input,revision:report.revision}),encoding:'utf8',timeout:60000,maxBuffer:1024*1024});
        item.exitCode=child.status;item.stdoutSha256=hash(child.stdout||'');
        if(child.error || child.status!==0) throw Error(child.error?.message||'El adaptador terminó con error');
        const result=JSON.parse(child.stdout);
        if(result.kind!=='application-observation' || !Object.hasOwn(result,'actual')) throw Error('Respuesta inválida: se requiere observación de aplicación');
        if(!Array.isArray(result.evidence) || !result.evidence.length) throw Error('Falta evidencia de ejecución');
        item.evidence=result.evidence.map(ref=>{const f=local(root,ref);const bytes=fs.readFileSync(f);if(!bytes.length)throw Error('Evidencia vacía');if(fs.statSync(f).mtimeMs < caseStarted-1)throw Error('Evidencia anterior a esta ejecución');const digest=hash(bytes);const saved=path.join('artifacts/calidad/evidence',report.startedAt.replace(/[^0-9]/g,'')+'-'+process.pid,String(report.cases.length),digest+'.log');const dest=path.join(root,saved);fs.mkdirSync(path.dirname(dest),{recursive:true});fs.writeFileSync(dest,bytes,{flag:'wx'});return {path:saved,source:ref,sha256:digest};});
        // Compare observed results to versioned expectations outside the adapter.
        if(!isDeepStrictEqual(result.actual,c.expected)) throw Error('Resultado observado distinto del esperado');
        item.status='passed';
      } catch(e) {item.error=e.message;}
    }
    for(const item of report.cases) for(const e of item.evidence||[]) {if(hash(fs.readFileSync(local(root,e.path)))!==e.sha256) report.errors.push('Evidencia alterada: '+e.path);}
    // Aprendizaje continuo: solo los incidentes REGISTRADOS se cruzan con pruebas ejecutadas.
    // La validación es estructural, no reemplaza revisión independiente de adaptadores.
    const learning=validateLearning({root,revision:report.revision,scenarioConfig:config,deliveryReport:report});
    report.learning={kind:learning.kind,passed:learning.passed,incidents:learning.incidents,note:learning.note};
    report.errors.push(...learning.errors);
    const dirtyAfter=spawnSync('git',['diff','--exit-code','HEAD','--'],{cwd:root,encoding:'utf8'});
    if(dirtyAfter.status!==0) report.errors.push('Las pruebas modificaron archivos versionados');
    if(!report.cases.some(c=>c.status==='passed')) report.errors.push('Ninguna prueba de aplicación ejecutada');
    report.passed=report.errors.length===0 && report.cases.every(c=>['passed','not-applicable'].includes(c.status));
  } catch(e) {report.errors.push(e.message);}
  report.finishedAt=new Date().toISOString();
  fs.mkdirSync(path.dirname(output),{recursive:true});fs.writeFileSync(output,JSON.stringify(report,null,2)+'\n');
  return report;
}
if(require.main===module) {
 const root=process.cwd();const report=run(root,process.argv[2]||'calidad/escenarios.json',path.resolve(root,'artifacts/calidad/entrega.json'));
 console.log(JSON.stringify({passed:report.passed,revision:report.revision,errors:report.errors,cases:report.cases.map(c=>({id:c.id,status:c.status,error:c.error}))},null,2));process.exitCode=report.passed?0:1;
}
module.exports={validate,run,REQUIRED};
