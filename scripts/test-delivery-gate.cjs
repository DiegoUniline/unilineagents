#!/usr/bin/env node
'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs'),os=require('node:os'),path=require('node:path');
const {execFileSync}=require('node:child_process');
const {validate,run,REQUIRED}=require('../templates/calidad/verificar-entrega.cjs');
let count=0;const check=(name,fn)=>{fn();console.log('OK '+name);count++;};
function fixture(options={}) {
 const root=fs.mkdtempSync(path.join(os.tmpdir(),'uniline-gate-'));
 const write=(p,s)=>{fs.mkdirSync(path.dirname(path.join(root,p)),{recursive:true});fs.writeFileSync(path.join(root,p),s);};
 write('.gitignore','artifacts/\n');write('decision.md','SIMULATED fixture decision; not real project evidence.');
 write('calidad/aprendizajes.json',JSON.stringify({schemaVersion:1,incidents:[]}));
 const adapter=`const fs=require('node:fs');const x=JSON.parse(fs.readFileSync(0,'utf8'));${options.fail?'process.exit(2);':''}fs.mkdirSync('artifacts/calidad',{recursive:true});fs.writeFileSync('artifacts/calidad/probe.log','SIMULATED TEST ONLY');${options.stale?"fs.utimesSync('artifacts/calidad/probe.log',1,1);":''}${options.mutate?"fs.writeFileSync('decision.md','tampered');":''}console.log(JSON.stringify({kind:'application-observation',actual:{value:${options.wrong?2:1}},evidence:${options.noEvidence?'[]':"['artifacts/calidad/probe.log']"}}));`;
 write('adapter.cjs',options.outside?adapter.replaceAll('artifacts/calidad','artifacts/other'):adapter);
 const config={schemaVersion:1,cases:REQUIRED.map((id,i)=>i===0?{id,applicable:true,adapter:'adapter.cjs',input:{},expected:{value:1}}:{id,applicable:false,exception:{reason:'Simulated case outside fixture scope only',decisionFile:'decision.md'}})};
 if(options.modify)options.modify(config);
 write('config.json',JSON.stringify(config));
 const git=(...args)=>execFileSync('git',args,{cwd:root,stdio:'pipe'});
 git('init','-q');git('add','.');git('-c','user.name=Gate test','-c','user.email=test@example.invalid','commit','-qm','simulated fixture');
 return {root,config,write,cleanup:()=>fs.rmSync(root,{recursive:true,force:true})};
}
function execute(options={}){const f=fixture(options);try{return run(f.root,'config.json',path.join(f.root,'artifacts/calidad/report.json'));}finally{f.cleanup();}}
check('complete simulated execution passes',()=>assert.equal(execute().passed,true));
check('missing learning registry fails closed',()=>{const f=fixture();try{fs.unlinkSync(path.join(f.root,'calidad/aprendizajes.json'));const x=run(f.root,'config.json',path.join(f.root,'artifacts/calidad/report.json'));assert.equal(x.passed,false);assert(x.errors.some(e=>e.includes('Registro no disponible')));}finally{f.cleanup();}});
check('wrong observed value rejected',()=>assert.equal(execute({wrong:true}).passed,false));
check('process failure rejected',()=>assert.equal(execute({fail:true}).passed,false));
check('missing evidence rejected',()=>assert.equal(execute({noEvidence:true}).passed,false));
check('stale evidence rejected',()=>assert.equal(execute({stale:true}).passed,false));
check('tracked changes during execution rejected',()=>assert.equal(execute({mutate:true}).passed,false));
check('missing scenario rejected',()=>assert.equal(execute({modify:c=>c.cases.pop()}).passed,false));
check('duplicate scenario rejected',()=>assert.equal(execute({modify:c=>c.cases.push(c.cases[0])}).passed,false));
check('unwired adapter rejected',()=>assert.equal(execute({modify:c=>c.cases[0].adapter=null}).passed,false));
check('missing decision file rejected',()=>assert.equal(execute({modify:c=>c.cases[1].exception.decisionFile='absent.md'}).passed,false));
check('path escape rejected',()=>assert.equal(execute({modify:c=>c.cases[0].adapter='../outside.cjs'}).passed,false));
check('all excluded rejected',()=>assert.equal(execute({modify:c=>c.cases[0]={id:REQUIRED[0],applicable:false,exception:{reason:'Simulated exclusion for this test only',decisionFile:'decision.md'}}}).passed,false));
check('dirty revision rejected',()=>{const f=fixture();try{f.write('untracked.txt','x');assert.equal(run(f.root,'config.json',path.join(f.root,'artifacts/report.json')).passed,false);}finally{f.cleanup();}});
check('template defaults fail closed',()=>assert.ok(validate(JSON.parse(fs.readFileSync(path.join(__dirname,'../templates/calidad/escenarios.json')))).length>0));
check('ignored adapter rejected',()=>{const f=fixture({modify:c=>c.cases[0].adapter='artifacts/adapter.cjs'});try{f.write('artifacts/adapter.cjs',fs.readFileSync(path.join(f.root,'adapter.cjs')));assert.equal(run(f.root,'config.json',path.join(f.root,'artifacts/report.json')).passed,false);}finally{f.cleanup();}});
check('ignored config rejected',()=>{const f=fixture();try{f.write('artifacts/config.json',JSON.stringify(f.config));assert.equal(run(f.root,'artifacts/config.json',path.join(f.root,'artifacts/report.json')).passed,false);}finally{f.cleanup();}});
check('ignored decision rejected',()=>{const f=fixture({modify:c=>c.cases[1].exception.decisionFile='artifacts/decision.md'});try{f.write('artifacts/decision.md','ignored decision');assert.equal(run(f.root,'config.json',path.join(f.root,'artifacts/report.json')).passed,false);}finally{f.cleanup();}});
check('shared evidence log preserved per case',()=>{const f=fixture({modify:c=>c.cases[1]={...c.cases[0],id:REQUIRED[1]}});try{const report=run(f.root,'config.json',path.join(f.root,'artifacts/report.json'));assert.equal(report.passed,true);assert.notEqual(report.cases[0].evidence[0].path,report.cases[1].evidence[0].path);for(const c of report.cases.slice(0,2))assert.equal(fs.readFileSync(path.join(f.root,c.evidence[0].path),'utf8'),'SIMULATED TEST ONLY');}finally{f.cleanup();}});
check('evidence outside upload directory is copied into artifact',()=>{const f=fixture({outside:true});try{const report=run(f.root,'config.json',path.join(f.root,'artifacts/report.json'));assert.equal(report.passed,true);const e=report.cases[0].evidence[0];assert.ok(e.path.startsWith('artifacts/calidad/evidence/'));assert.equal(e.source,'artifacts/other/probe.log');assert.ok(fs.existsSync(path.join(f.root,e.path)));}finally{f.cleanup();}});
check('malformed config rejected',()=>assert.ok(validate({}).length>0));
console.log(count+' executable validator tests passed; SIMULATED fixtures, not application quality evidence.');
