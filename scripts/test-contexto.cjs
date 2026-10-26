#!/usr/bin/env node
'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs'),os=require('node:os'),path=require('node:path'),crypto=require('node:crypto');
const {spawnSync,execFileSync}=require('node:child_process');
const router=path.join(__dirname,'contexto.cjs');
const dir=fs.mkdtempSync(path.join(os.tmpdir(),'uniline-contexto-'));
const file=(p,content)=>{const f=path.join(dir,p);fs.mkdirSync(path.dirname(f),{recursive:true});fs.writeFileSync(f,content);};
function cmd(...args){
 const r=spawnSync(process.execPath,[router,...args,'--json'],{cwd:dir,env:{...process.env,UNILINE_PROJECT_DIR:dir},encoding:'utf8'});
 assert.equal(r.status,0,r.stderr);return JSON.parse(r.stdout);
}
let tested=0;
const check=(title,fn)=>{fn();tested++;console.log('PASS '+title)};
try{
 file('docs/modulos/ventas.md','# Ventas');
 file('docs/modulos/inventario.md','# Inventario');
 file('docs/modulos/caja.md','# Caja');
 file('docs/modulos/marketing.md','# Marketing NO relacionado');
 file('src/ventas.ts','original');
 const hash=crypto.createHash('sha256').update(fs.readFileSync(path.join(dir,'src/ventas.ts'))).digest('hex');
 const graph={version:1,modules:[
  {id:'ventas',doc:'docs/modulos/ventas.md',aliases:['pos'],links:[{to:'inventario',evidence:'src/ventas.ts:venta',sourcePath:'src/ventas.ts',sourceSha256:hash,critical:true}]},
  {id:'inventario',doc:'docs/modulos/inventario.md',aliases:[],links:[{to:'caja',evidence:'D-001',critical:false}]},
  {id:'caja',doc:'docs/modulos/caja.md',aliases:[],links:[]},
  {id:'marketing',doc:'docs/modulos/marketing.md',aliases:[],links:[]}
 ]};
 file('docs/contexto/relaciones.json',JSON.stringify(graph,null,2));
 check('consulta puntual solo 1 módulo',()=>{const x=cmd('route','ventas','--risk','low');assert.deepEqual(x.paths.map(p=>p.module),['ventas']);});
 check('relación directa y sin lectura de marketing',()=>{const x=cmd('route','ventas');assert.deepEqual(x.paths.map(p=>p.module),['ventas','inventario']);assert(!x.paths.some(y=>y.module==='marketing'))});
 check('alias recupera módulo exacto',()=>{const x=cmd('route','pos');assert.equal(x.module,'ventas')});
 check('alto riesgo sigue dos saltos',()=>{const x=cmd('route','ventas','--risk','high');assert.deepEqual(x.paths.map(p=>p.module),['ventas','inventario','caja']);});
 check('relaciones inversas detectadas',()=>{const x=cmd('route','inventario');assert(x.links.some(y=>y.direction==='entrante'&&y.to==='ventas'));});
 check('huella vigente',()=>{const x=cmd('route','ventas');assert(x.links.some(y=>y.status==='VIGENTE'));});
 file('src/ventas.ts','cambio material');
 check('invalidación de huella',()=>{const x=cmd('route','ventas');assert(x.links.some(y=>y.status==='STALE'));});
 check('módulo no existente NO implica ausencia de dependencias',()=>{const x=cmd('route','desconocido');assert.equal(x.ok,false);});
 check('index ausente cae a módulo verificable y advierte',()=>{fs.unlinkSync(path.join(dir,'docs/contexto/relaciones.json'));const x=cmd('route','ventas');assert.equal(x.ok,true);assert.equal(x.indexMissing,true);assert(x.warnings.some(w=>/NO inferir/.test(w)));});
 check('grafo vacío advierte cobertura incompleta',()=>{file('docs/contexto/relaciones.json',JSON.stringify({version:1,modules:[]}));const x=cmd('route','ventas');assert(x.warnings.some(w=>w.includes('NO inferir')));});
 check('rechaza traversal en rutas del grafo',()=>{file('docs/contexto/relaciones.json',JSON.stringify({version:1,modules:[{id:'ventas',doc:'../secreto',links:[]}]}));const r=spawnSync(process.execPath,[router,'route','ventas'],{cwd:dir,env:{...process.env,UNILINE_PROJECT_DIR:dir},encoding:'utf8'});assert.notEqual(r.status,0);});
 file('docs/contexto/relaciones.json',JSON.stringify(graph));
 execFileSync('git',['init','-q'],{cwd:dir});
 execFileSync('git',['add','.'],{cwd:dir});
 execFileSync('git',['-c','user.name=Test','-c','user.email=test@example.com','commit','-qm','baseline'],{cwd:dir});
 file('src/ventas.ts','changed tracked');
 check('check sin documentación pertinente advierte',()=>{const x=cmd('check','--base','HEAD');assert(x.warnings.some(w=>w.includes('Revisar doc de ventas')));});
 file('docs/modulos/ventas.md','# Actualizado');
 check('check con doc actualizado no exige segundo cambio',()=>{const x=cmd('check','--base','HEAD');assert(!x.warnings.some(w=>w.includes('Revisar doc de ventas')));});
 console.log(tested+' escenarios de enrutamiento determinista. NO pruebas de modelos ni tokens facturados.');
}finally{fs.rmSync(dir,{recursive:true,force:true});}
