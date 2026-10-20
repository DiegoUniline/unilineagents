#!/usr/bin/env node
'use strict';
const assert=require('node:assert/strict');
const {validate,categories}=require('./quality-gate.cjs');
const fixture=()=>({
 schemaVersion:1,project:'SIMULADO — no es producto real',revision:'fixture-test',evaluatedAt:'2026-10-19',
 globalBlockingFailures:[],
 areas:categories.map(id=>({id,score:95,casesPlanned:2,casesRun:2,blockingFailures:[],
 evidence:[{type:'observed',ref:'fixture://no-real',description:'Escenario unitario SIMULADO; NO acreditar calidad real'}]}))
});
let passed=0;const check=(name,fn)=>{fn();passed++;console.log('OK '+name)};
check('fixture estructural',()=>assert.equal(validate(fixture()).passed,true));
check('rechaza 94',()=>{let f=fixture();f.areas[0].score=94;assert.equal(validate(f).passed,false)});
check('rechaza sin evidencia',()=>{let f=fixture();f.areas[0].evidence=[];assert.equal(validate(f).passed,false)});
check('rechaza cobertura incompleta',()=>{let f=fixture();f.areas[0].casesRun=1;assert.equal(validate(f).passed,false)});
check('rechaza bloqueos',()=>{let f=fixture();f.areas[0].blockingFailures=['error crítico'];assert.equal(validate(f).passed,false)});
check('rechaza dimensión ausente',()=>{let f=fixture();f.areas.pop();assert.equal(validate(f).passed,false)});
check('rechaza promedio que oculta 60',()=>{let f=fixture();f.areas[2].score=60;assert.equal(validate(f).passed,false)});
check('rechaza reportes vacíos',()=>assert.equal(validate({}).passed,false));
console.log(passed+' tests de validador de expedientes simulados; NO prueba desempeño real de Claude.');
