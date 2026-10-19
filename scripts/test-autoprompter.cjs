#!/usr/bin/env node
'use strict';
const fs=require('fs'),path=require('path');
const read=p=>fs.readFileSync(path.join(__dirname,'..',p),'utf8');
const checks=[
 ['skill AutoPrompter',()=>read('skills/autoprompter/SKILL.md').includes('name: autoprompter')],
 ['objeción anterior',()=>read('skills/autoprompter/SKILL.md').includes('Objeción profesional ANTES de construir')],
 ['diálogo adaptativo',()=>read('skills/autoprompter/SKILL.md').includes('Una pregunta prioritaria por turno')],
 ['verificación',()=>read('skills/autoprompter/SKILL.md').includes('Verificar con evidencia')],
 ['memoria viva',()=>read('skills/autoprompter/SKILL.md').includes('Memoria viva')],
 ['comando de entrada',()=>read('src/commands/autoprompt.md').includes('autoprompter')],
 ['constitución enlazada',()=>read('core/principios.md').includes('autoprompter')],
 ['enrutador enlazado',()=>read('src/claude-md-encabezado.md').includes('autoprompter')],
 ['desarrollador enlazado',()=>read('core/desarrollador.md').includes('autoprompter')],
 ['hook recordatorio',()=>read('hooks/recordatorio.cjs').includes('AutoPrompter')],
 ['instrucción multiplataforma',()=>read('src/instrucciones-cortas.md').includes('AutoPrompter')]
];
let fails=0;for(const [name,fn] of checks){const ok=fn();console.log((ok?'OK ':'FAIL ')+name);if(!ok)fails++;}
console.log('NOTA: integración documental, NO validación semántica del modelo.');process.exit(fails?1:0);
