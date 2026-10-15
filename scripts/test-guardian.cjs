#!/usr/bin/env node
// Pruebas del guardián. Uso: node scripts/test-guardian.cjs
'use strict';
const { execFileSync } = require('child_process');
const fs = require('fs'), os = require('os'), path = require('path');

const G = path.join(__dirname, '..', 'hooks', 'guardian.cjs');
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'guardian-'));
fs.writeFileSync(path.join(tmp, 'existe.ts'), 'x');
fs.mkdirSync(path.join(tmp, 'docs')); fs.writeFileSync(path.join(tmp, 'docs', '00-estado.md'), 'x');
fs.mkdirSync(path.join(tmp, 'supabase', 'migrations'), { recursive: true });
fs.writeFileSync(path.join(tmp, 'supabase', 'migrations', '001.sql'), 'x');

const bash = c => ({ tool_name: 'Bash', tool_input: { command: c }, cwd: tmp });
const sql = q => ({ tool_name: 'mcp__Supabase__execute_sql', tool_input: { query: q } });
const casos = [
  // [entrada, esperado: ok | ask | deny]
  [bash('ls -la'), 'ok'],
  [bash('npm run build'), 'ok'],
  [bash('git status && git diff'), 'ok'],
  [bash('npm test 2>&1 | tail'), 'ok'],
  [bash('echo hola > nuevo.ts'), 'ok'],
  [bash('cat a >> existe.ts'), 'ok'],
  [bash('git push origin feature'), 'ok'],
  [bash('rm -rf /'), 'deny'],
  [bash('rm -rf .'), 'deny'],
  [bash('rm -rf ~'), 'deny'],
  [bash('git push --force origin main'), 'deny'],
  [bash('git push -f origin master'), 'deny'],
  [bash('rm src/old.ts'), 'ask'],
  [bash('find . -name "*.tmp" -delete'), 'ask'],
  [bash('mv a.ts b.ts'), 'ask'],
  [bash('git reset --hard HEAD~1'), 'ask'],
  [bash('git push -f origin feature'), 'ask'],
  [bash('git clean -fd'), 'ask'],
  [bash('git branch -D vieja'), 'ask'],
  [bash('supabase db push'), 'ask'],
  [bash('supabase db reset'), 'ask'],
  [bash('supabase functions deploy x'), 'ask'],
  [bash('clasp push'), 'ask'],
  [bash('npm uninstall react'), 'ask'],
  [bash(`psql -c 'DROP TABLE clientes'`), 'ask'],
  [bash(`psql -c "truncate pedidos"`), 'ask'],
  [bash('echo hola > existe.ts'), 'ask'],
  [sql(`select * from clientes where empresa_id='x'`), 'ok'],
  [sql('-- reversa: drop table x\nselect 1'), 'ok'],
  [sql(`select 'drop table x'`), 'ok'],
  [sql(`delete from clientes where id='x'`), 'ask'],
  [sql('update clientes set activo=false'), 'ask'],
  [sql(`update clientes set activo=false where id='1'`), 'ask'],
  [sql('alter table clientes drop column correo'), 'ask'],
  [sql('alter table clientes alter column precio type numeric(14,2)'), 'ask'],
  [sql('alter table clientes disable row level security'), 'ask'],
  [sql('drop schema public cascade'), 'deny'],
  [sql('drop database postgres'), 'deny'],
  [{ tool_name: 'mcp__Supabase__apply_migration', tool_input: { query: 'create table x(id int)' } }, 'ask'],
  [{ tool_name: 'mcp__Supabase__list_tables', tool_input: {} }, 'ok'],
  [{ tool_name: 'mcp__Google_Drive__trash_file', tool_input: {} }, 'ask'],
  [{ tool_name: 'Write', tool_input: { file_path: path.join(tmp, 'existe.ts') } }, 'ask'],
  [{ tool_name: 'Write', tool_input: { file_path: path.join(tmp, 'nuevo2.ts') } }, 'ok'],
  [{ tool_name: 'Write', tool_input: { file_path: path.join(tmp, 'docs', '00-estado.md') } }, 'ok'],
  [{ tool_name: 'Write', tool_input: { file_path: path.join(tmp, 'supabase', 'migrations', '001.sql') } }, 'ask'],
  [{ tool_name: 'Edit', tool_input: { file_path: path.join(tmp, 'supabase', 'migrations', '001.sql') } }, 'ask'],
  [{ tool_name: 'Edit', tool_input: { file_path: path.join(tmp, 'src', 'a.ts') } }, 'ok'],
];

let fallas = 0;
for (const [entrada, esperado] of casos) {
  const out = execFileSync('node', [G], { input: JSON.stringify(entrada) }).toString();
  const real = out ? JSON.parse(out).hookSpecificOutput.permissionDecision : 'ok';
  const etiqueta = entrada.tool_input.command || entrada.tool_input.query || `${entrada.tool_name} ${entrada.tool_input.file_path || ''}`;
  const bien = real === esperado;
  if (!bien) fallas++;
  console.log(`${bien ? '✅' : '❌'} ${real.padEnd(4)} (esperado ${esperado.padEnd(4)}) ${etiqueta.replace(/\n/g, ' ⏎ ').replace(tmp, '')}`);
}
fs.rmSync(tmp, { recursive: true, force: true });
console.log(`\n${casos.length - fallas}/${casos.length} correctas`);
process.exit(fallas ? 1 : 0);
