#!/usr/bin/env node
'use strict';
// Fixtures SIMULADOS: comprueban el guardián del registro, NO el comportamiento de ninguna aplicación.
const assert=require('node:assert/strict'),fs=require('node:fs'),os=require('node:os'),path=require('node:path');
const {execFileSync}=require('node:child_process');
const {validateLearning}=require('../templates/calidad/validar-aprendizajes.cjs');
let count=0;
const check=(title,fn)=>{fn();count++;console.log('OK '+title)};
const doc='# INC-001 — fallo simulado\n## Causa\nUna operación simultánea no respetaba el bloqueo de saldo.\n## Verificación\nEl caso concurrente ahora verifica el saldo.\n';
function fixture(options={}) {
 const root=fs.mkdtempSync(path.join(os.tmpdir(),'uniline-learning-'));
 const put=(p,t)=>{const file=path.join(root,p);fs.mkdirSync(path.dirname(file),{recursive:true});fs.writeFileSync(file,t);};
 const original={
  id:'INC-001',classification:'DEFECTO_COMPROBADO',status:'verified',
  severity:'high',module:'ventas',rootCause:'La lectura concurrente del saldo omitía bloqueo de fila',
  evidenceLevel:'REPRODUCIDO',regressionCaseIds:['saldo-race'],
  reproductionFile:'docs/incidentes/pruebas/INC-001-red.md',reviewer:'QA / auditor independiente'
 };
 const incident={...original,...(options.incident||{})};
 const registry={schemaVersion:1,incidents:options.empty?[]:[incident]};
 if(options.duplicate)registry.incidents.push({...incident});
 if(options.noDoc===undefined||!options.noDoc)put('docs/incidentes/INC-001.md',doc);
 if(!options.noRed)put('docs/incidentes/pruebas/INC-001-red.md','# INC-001\nSIMULADO: dos cajas consumían una sola vez el saldo registrado.\n');
 if(options.refutation)put('docs/incidentes/pruebas/INC-001-refutacion.md','# INC-001\nRefutación ficticia sustentada solo en fixture; no es prueba de producto.\n');
 put('calidad/aprendizajes.json',JSON.stringify(registry));
 put('calidad/escenarios.json',JSON.stringify({schemaVersion:1,cases:[{id:'saldo-race',applicable:!options.unwired,adapter:options.unwired?null:'calidad/adaptador.cjs',expected:{balance:0}}]}));
 put('calidad/adaptador.cjs','// SIMULADO: no ejecuta aplicación');
 put('.gitignore','artifacts/\n');
 const git=(...a)=>execFileSync('git',a,{cwd:root,encoding:'utf8'});
 git('init','-q');git('add','.');git('-c','user.name=Fixture','-c','user.email=fixture@example.invalid','commit','-qm','only simulated fixtures');
 const revision=git('rev-parse','HEAD').trim();
 const scenarioConfig=JSON.parse(fs.readFileSync(path.join(root,'calidad/escenarios.json'),'utf8'));
 const deliveryReport={revision:options.badRevision?'invalid':revision,cases:[{id:'saldo-race',status:options.failed?'failed':'passed',evidence:options.noEvidence?[]:[{path:'artifacts/calidad/fixture.log',sha256:'simulated'}]}]};
 return {root,revision,scenarioConfig,deliveryReport,cleanup:()=>fs.rmSync(root,{recursive:true,force:true})};
}
function run(options={}){
 const f=fixture(options);try{return validateLearning(f);}finally{f.cleanup()}
}
check('registro vacío pasa solo control estructural',()=>assert.equal(run({empty:true}).passed,true));
check('incidente comprobado y caso informado pasa el validador de estructura',()=>assert.equal(run().passed,true));
check('crítico abierto bloquea salida',()=>{const r=run({incident:{status:'open',severity:'critical',rootCause:'',evidenceLevel:'INFERIDO'}});assert.equal(r.passed,false);assert(r.errors.some(e=>e.includes('BLOQUEA ENTREGA')));});
check('alto abierto también bloquea',()=>assert.equal(run({incident:{status:'open',severity:'high',rootCause:''}}).passed,false));
check('medio abierto permite seguimiento sin certificar cierre',()=>assert.equal(run({incident:{status:'open',severity:'medium',rootCause:'',evidenceLevel:'INFERIDO',regressionCaseIds:[]}}).passed,true));
check('duplicación de incidente falla',()=>assert.equal(run({duplicate:true}).passed,false));
check('no existe documento => falla',()=>assert.equal(run({noDoc:true}).passed,false));
check('sin reproducción previa => falla',()=>assert.equal(run({noRed:true}).passed,false));
check('evidencia inferida no cierra como reproducida',()=>assert.equal(run({incident:{evidenceLevel:'INFERIDO'}}).passed,false));
check('sin pruebas de regresión => falla',()=>assert.equal(run({incident:{regressionCaseIds:[]}}).passed,false));
check('prueba no aplicable => falla',()=>assert.equal(run({unwired:true}).passed,false));
check('resultado de prueba fallido => falla',()=>assert.equal(run({failed:true}).passed,false));
check('evidencia de ejecución vacía => falla',()=>assert.equal(run({noEvidence:true}).passed,false));
check('otra revisión => falla',()=>assert.equal(run({badRevision:true}).passed,false));
check('sin revisor => falla',()=>assert.equal(run({incident:{reviewer:''}}).passed,false));
check('recomendación no se contabiliza como defecto',()=>assert.equal(run({incident:{classification:'RECOMENDACION'}}).passed,false));
check('falso positivo exige refutación',()=>assert.equal(run({incident:{status:'false_positive'}}).passed,false));
check('falso positivo con refutación registrada pasa estructura',()=>assert.equal(run({refutation:true,incident:{status:'false_positive',refutationFile:'docs/incidentes/pruebas/INC-001-refutacion.md'}}).passed,true));
check('ruta fuera del repo se rechaza',()=>assert.equal(run({incident:{reproductionFile:'../../secretos.txt'}}).passed,false));
check('archivo de prueba alterado desde commit se rechaza',()=>{const f=fixture();try{fs.appendFileSync(path.join(f.root,'docs/incidentes/INC-001.md'),'modificado localmente');assert.equal(validateLearning(f).passed,false)}finally{f.cleanup()}});
console.log(count+' validaciones del ciclo de aprendizaje con fixtures; NO constituyen pruebas de aplicación real.');
