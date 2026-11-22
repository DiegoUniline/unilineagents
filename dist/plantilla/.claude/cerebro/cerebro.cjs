#!/usr/bin/env node
'use strict';
/*
 * Cerebro Uniline — memoria estructurada y determinista del proyecto.
 *
 * Regla de oro: docs/cerebro.json SOLO se modifica con estos comandos.
 * Misma entrada => mismo cerebro, mismas propuestas y mismo SQL.
 * La IA pregunta y explica; las decisiones y su efecto los aplica este script.
 *
 * Uso: node .claude/cerebro/cerebro.cjs <comando> [argumentos] [--archivo docs/cerebro.json]
 *      node .claude/cerebro/cerebro.cjs ayuda
 */
const fs = require('fs');
const path = require('path');

const RAIZ = __dirname;
// CEREBRO_BIBLIOTECA permite usar otra carpeta de biblioteca (pruebas o biblioteca compartida).
const dirEntidades = () => path.join(process.env.CEREBRO_BIBLIOTECA || path.join(RAIZ, 'biblioteca'), 'entidades');
const DIR_RECETAS = path.join(RAIZ, 'recetas');
const ARCHIVO_GANCHOS = path.join(RAIZ, 'biblioteca', 'ganchos.json');

const TIPOS = {
  texto: { sql: 'text', simple: 'texto' },
  texto_largo: { sql: 'text', simple: 'texto largo' },
  entero: { sql: 'integer', simple: 'número entero' },
  decimal: { sql: 'numeric(14,4)', simple: 'número con decimales' },
  dinero: { sql: 'numeric(14,2)', simple: 'dinero' },
  cantidad: { sql: 'numeric(14,4)', simple: 'cantidad' },
  fecha: { sql: 'date', simple: 'fecha' },
  fecha_hora: { sql: 'timestamptz', simple: 'fecha y hora' },
  si_no: { sql: 'boolean', simple: 'sí / no' },
  lista: { sql: 'text', simple: 'lista fija' },
  referencia: { sql: 'uuid', simple: 'referencia' },
  archivo: { sql: 'text', simple: 'archivo (ruta en Storage)' },
};

class ErrorCerebro extends Error {}
const fallar = (msg) => { throw new ErrorCerebro(msg); };

// ---------- utilidades ----------
const hoy = () => process.env.CEREBRO_FECHA || new Date().toISOString().slice(0, 10);
const clonar = (o) => JSON.parse(JSON.stringify(o));
const leerJSON = (f) => JSON.parse(fs.readFileSync(f, 'utf8'));
const pad = (n, w = 3) => String(n).padStart(w, '0');
const si = (v) => ['si', 'sí', 'true', '1'].includes(String(v).toLowerCase());

function parsearArgs(argv) {
  const pos = []; const opt = {};
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a.startsWith('--')) {
      const k = a.slice(2);
      const sig = argv[i + 1];
      if (sig === undefined || sig.startsWith('--')) opt[k] = true; else { opt[k] = sig; i++; }
    } else pos.push(a);
  }
  return { pos, opt };
}

function cargarEntidad(entidad) {
  const f = path.join(dirEntidades(), `${entidad}.json`);
  return fs.existsSync(f) ? leerJSON(f) : null;
}
function cargarReceta(id) {
  const f = path.join(DIR_RECETAS, `${id}.json`);
  if (!fs.existsSync(f)) fallar(`No existe la receta «${id}». Recetas: ${listarRecetas().join(', ') || 'ninguna'}`);
  return leerJSON(f);
}
const plural = (e) => (/[aeiouáéó]$/.test(e) ? `${e}s` : `${e}es`);
const listarRecetas = () => fs.readdirSync(DIR_RECETAS).filter((f) => f.endsWith('.json')).map((f) => f.slice(0, -5)).sort();
const cargarGanchos = () => leerJSON(ARCHIVO_GANCHOS).ganchos;

// ---------- cerebro: estructura ----------
function nuevoCerebro(nombre, giro) {
  return {
    version: 1,
    proyecto: { nombre, giro: giro || null, creado: hoy() },
    condiciones: {},
    mapa: { procesos: [], modulos: [] },
    tablas: {},
    pendientes: [],
    compromisos: [],
    reglas: [],
    decisiones: [],
    recetas_aplicadas: [],
    sql_emitido: [],
    migraciones: [],
    contadores: { decision: 0, pendiente: 0, regla: 0, historial: 0 },
    historial: [],
  };
}

function registrar(c, comando, args) {
  c.contadores.historial += 1;
  c.historial.push({ n: c.contadores.historial, fecha: hoy(), comando, args });
}
function decidir(c, texto, origen, modulo) {
  c.contadores.decision += 1;
  const id = `D-${pad(c.contadores.decision)}`;
  c.decisiones.push({ id, fecha: hoy(), modulo: modulo || null, texto, origen });
  return id;
}
function agregarPendiente(c, p) {
  c.contadores.pendiente += 1;
  const id = `PEN-${pad(c.contadores.pendiente)}`;
  c.pendientes.push({ id, ...p });
  return id;
}

const modulo = (c, id) => c.mapa.modulos.find((m) => m.id === id);
function tabla(c, nombre) {
  const t = c.tablas[nombre];
  if (!t) fallar(`No existe la tabla «${nombre}». Tablas: ${Object.keys(c.tablas).join(', ') || 'ninguna'}`);
  return t;
}
const tablaDeEntidad = (c, entidad) => Object.keys(c.tablas).find((n) => c.tablas[n].entidad === entidad) || null;

function resolverCampo(t, ref) {
  const vivos = t.campos.filter((f) => f.estado !== 'quitado');
  if (/^\d+$/.test(String(ref))) {
    const f = vivos[Number(ref) - 1];
    if (!f) fallar(`No hay campo #${ref} (la tabla tiene ${vivos.length}).`);
    return f;
  }
  const f = vivos.find((x) => x.nombre === ref || x.nombre === `${ref}_id`);
  if (!f) fallar(`No existe el campo «${ref}». Campos: ${vivos.map((x) => x.nombre).join(', ')}`);
  return f;
}

function validarTipo(tipo) {
  if (!TIPOS[tipo]) fallar(`Tipo «${tipo}» no válido. Tipos: ${Object.keys(TIPOS).join(', ')}`);
}

function cumple(cond, valores) {
  return !cond || Object.entries(cond).every(([k, v]) => valores[k] === v);
}

/** Cualquier cambio a una tabla de un módulo cerrado lo reabre de forma visible. */
function tocarTabla(c, nombreTabla, avisos) {
  const t = tabla(c, nombreTabla);
  if (t.estado === 'aprobada') t.estado = 'propuesta';
  const m = modulo(c, t.modulo);
  if (m && m.estado === 'cerrado') {
    m.estado = 'reabierto';
    avisos.push(`🔓 Módulo «${m.id}» reabierto por cambio en «${nombreTabla}». Vuelve a aprobar y cerrar.`);
  }
  return t;
}

/** Construye un campo de la tabla a partir de una definición de biblioteca/receta. */
function construirCampo(c, def, origenTabla) {
  const campo = {
    nombre: def.nombre,
    tipo: def.tipo,
    obligatorio: !!def.obligatorio,
    por_que: def.por_que || null,
    fuente: def.fuente || null,
    estado: 'propuesto',
  };
  if (def.unico) campo.unico = true;
  if (def.default !== undefined) campo.default = def.default;
  if (def.valores) campo.valores = def.valores.slice();
  if (def.solo_si) campo.solo_si = clonar(def.solo_si);
  if (def.tipo === 'referencia') {
    if (def.decision) {
      campo.tipo = 'pendiente';
      campo.decision = clonar(def.decision);
    } else {
      const destino = def.ref || (def.ref_entidad && tablaDeEntidad(c, def.ref_entidad));
      if (!destino) fallar(`El campo «${def.nombre}» de «${origenTabla}» apunta a «${def.ref_entidad || def.ref}», que aún no existe.`);
      campo.nombre = def.nombre.endsWith('_id') ? def.nombre : `${def.nombre}_id`;
      campo.ref = destino;
    }
  }
  return campo;
}

function recomendar(c, decision) {
  const r = decision.recomendacion;
  if (typeof r === 'string') return r;
  if (c.condiciones.multiempresa === undefined) return null;
  return c.condiciones.multiempresa === 'si' ? r.si_multiempresa : r.si_no;
}

/** Crea una tabla en el cerebro (desde biblioteca o definición inline). */
function crearTabla(c, { entidad, tabla: nombre, modulo: mod, campos, unicos, origen }, avisos) {
  if (c.tablas[nombre]) fallar(`La tabla «${nombre}» ya existe.`);
  if (!modulo(c, mod)) fallar(`El módulo «${mod}» no está en el mapa. Agrégalo con: modulo-agregar ${mod} --nombre "..."`);
  const t = { entidad, modulo: mod, estado: 'propuesta', origen, campos: [], unicos: unicos ? clonar(unicos) : [] };
  c.tablas[nombre] = t;
  for (const def of campos) {
    if (!cumple(def.solo_si, c.condiciones)) {
      if (def.solo_si && Object.keys(def.solo_si).some((k) => c.condiciones[k] === undefined)) {
        avisos.push(`❓ «${def.nombre}» depende del gancho ${Object.keys(def.solo_si).join(', ')}, sin responder: no se incluyó.`);
      }
      continue;
    }
    const campo = construirCampo(c, def, nombre);
    t.campos.push(campo);
    if (campo.tipo === 'pendiente') {
      const rec = recomendar(c, campo.decision);
      agregarPendiente(c, { tipo: 'decidir', tabla: nombre, campo: campo.nombre, texto: campo.decision.pregunta, recomendado: rec, regla: campo.decision.regla });
    }
  }
  // Compromisos de recetas anteriores para esta entidad: el cerebro "se acuerda".
  for (const comp of c.compromisos.filter((x) => x.entidad === entidad && !x.cumplido)) {
    const campo = construirCampo(c, comp.campo, nombre);
    t.campos.push(campo);
    comp.cumplido = hoy();
    avisos.push(`🧠 Se agregó «${campo.nombre}» a «${nombre}» por compromiso de la receta «${comp.origen}».`);
  }
  const m = modulo(c, mod);
  if (m.estado === 'pendiente') m.estado = 'en_curso';
  return t;
}

// ---------- formato ----------
function tablaMd(filas, encabezados) {
  const esc = (v) => String(v === undefined || v === null ? '' : v).replace(/\|/g, '\\|');
  return [
    `| ${encabezados.join(' | ')} |`,
    `|${encabezados.map(() => '---').join('|')}|`,
    ...filas.map((f) => `| ${f.map(esc).join(' | ')} |`),
  ].join('\n');
}

function tipoSimple(f) {
  if (f.tipo === 'pendiente') return '❓ tabla o lista';
  if (f.tipo === 'referencia') return `→ ${f.ref}`;
  if (f.tipo === 'lista') return `lista: ${f.valores.join(', ')}`;
  return TIPOS[f.tipo].simple;
}

function tecnicos(c) {
  const t = ['id'];
  if (c.condiciones.multiempresa === 'si') t.push('empresa_id');
  t.push('activo', 'created_at', 'created_by', 'updated_at', 'updated_by');
  return t;
}

function verTabla(c, nombre) {
  const t = tabla(c, nombre);
  const vivos = t.campos.filter((f) => f.estado !== 'quitado');
  const filas = vivos.map((f, i) => [
    i + 1, f.nombre, tipoSimple(f), f.obligatorio ? 'sí' : 'no',
    [f.por_que, f.fuente ? `(${f.fuente})` : ''].filter(Boolean).join(' '),
  ]);
  const out = [`### ${nombre} · módulo ${t.modulo} · ${t.estado}`, '', tablaMd(filas, ['#', 'Campo', 'Tipo', 'Oblig.', 'Por qué'])];
  out.push('', `Técnicos automáticos (CR-16 / CR-09): ${tecnicos(c).join(', ')}`);
  const unicos = vivos.filter((f) => f.unico).map((f) => f.nombre).concat(t.unicos.map((u) => `(${u.join(', ')})`));
  if (unicos.length) out.push(`Únicos${c.condiciones.multiempresa === 'si' ? ' por empresa' : ''}: ${unicos.join(', ')}`);
  const quitados = t.campos.filter((f) => f.estado === 'quitado');
  if (quitados.length) out.push(`⚠️ Quitados ya emitidos en SQL (requieren CONFIRMO para borrar en BD): ${quitados.map((f) => f.nombre).join(', ')}`);
  const pend = c.pendientes.filter((p) => p.tabla === nombre);
  if (pend.length) {
    out.push('', 'Por decidir:');
    for (const p of pend) out.push(`- ${p.id} · ${p.campo}: ${p.texto} Recomendado: ${p.recomendado || '— responde antes el gancho multiempresa'} (${p.regla})`);
  }
  return out.join('\n');
}

// ---------- SQL ----------
function ordenarPorDependencias(c, nombres) {
  const res = []; const visit = new Set(); const enCurso = new Set();
  const visitar = (n) => {
    if (visit.has(n)) return;
    if (enCurso.has(n)) fallar(`Ciclo de referencias en «${n}».`);
    enCurso.add(n);
    for (const f of c.tablas[n].campos) if (f.ref && f.ref !== n && nombres.includes(f.ref)) visitar(f.ref);
    enCurso.delete(n); visit.add(n); res.push(n);
  };
  nombres.forEach(visitar);
  return res;
}

function columnaSql(c, f, { paraAlter = false } = {}) {
  let tipo = TIPOS[f.tipo].sql;
  let s = `${f.nombre} ${tipo}`;
  const dflt = f.default !== undefined ? (f.tipo === 'lista' || f.tipo === 'texto' ? `'${f.default}'` : f.default) : null;
  // Al agregar una columna obligatoria sin default a una tabla con datos, va nullable y se avisa.
  const notNull = f.obligatorio && !(paraAlter && dflt === null);
  if (notNull) s += ' not null';
  if (dflt !== null) s += ` default ${dflt}`;
  if (f.tipo === 'referencia') s += ` references public.${f.ref}(id)`;
  if (f.tipo === 'lista') s += ` check (${f.nombre} in (${f.valores.map((v) => `'${v}'`).join(', ')}))`;
  if (paraAlter && f.obligatorio && dflt === null) s += ' -- OBLIGATORIO: rellenar datos existentes y luego SET NOT NULL';
  return s;
}

function crearTablaSql(c, nombre) {
  const t = c.tablas[nombre];
  const me = c.condiciones.multiempresa === 'si';
  const cols = ['id uuid primary key default gen_random_uuid()'];
  if (me) cols.push('empresa_id uuid not null references public.empresas(id)');
  for (const f of t.campos.filter((x) => x.estado !== 'quitado')) cols.push(columnaSql(c, f));
  cols.push('activo boolean not null default true', 'created_at timestamptz not null default now()', 'created_by uuid', 'updated_at timestamptz', 'updated_by uuid');
  const lineas = [`create table if not exists public.${nombre} (`, cols.map((x) => `  ${x}`).join(',\n'), ');'];
  lineas.push(...extrasSql(c, nombre, t.campos.filter((x) => x.estado !== 'quitado'), t.unicos));
  lineas.push(`alter table public.${nombre} enable row level security;`);
  lineas.push(`-- Políticas RLS de ${nombre}: generar con la skill rls-multiempresa (no incluidas aquí).`);
  return lineas.join('\n');
}

function extrasSql(c, nombre, campos, unicosCompuestos) {
  const me = c.condiciones.multiempresa === 'si';
  const out = [];
  for (const f of campos) {
    if (f.unico) out.push(`create unique index if not exists ux_${nombre}_${f.nombre} on public.${nombre} (${me ? 'empresa_id, ' : ''}${f.nombre});`);
    if (f.tipo === 'referencia') out.push(`create index if not exists ix_${nombre}_${f.nombre} on public.${nombre} (${f.nombre});`);
  }
  for (const u of unicosCompuestos || []) out.push(`create unique index if not exists ux_${nombre}_${u.join('_')} on public.${nombre} (${me ? 'empresa_id, ' : ''}${u.join(', ')});`);
  return out;
}

function requisitosSql(c) {
  if (c.condiciones.multiempresa === undefined) fallar('Responde primero el gancho «multiempresa» (condicion multiempresa si|no).');
  const sinAprobar = Object.keys(c.tablas).filter((n) => c.tablas[n].estado !== 'aprobada');
  return { aprobadas: ordenarPorDependencias(c, Object.keys(c.tablas).filter((n) => c.tablas[n].estado === 'aprobada')), sinAprobar };
}

function encabezadoSql(c, titulo, sinAprobar) {
  const out = [`-- ${titulo}`, `-- Proyecto: ${c.proyecto.nombre} · generado por cerebro.cjs desde docs/cerebro.json (no editar a mano)`];
  if (c.condiciones.multiempresa === 'si') out.push('-- Requiere la base fija: public.empresas');
  if (sinAprobar.length) out.push(`-- Sin aprobar (no incluidas): ${sinAprobar.join(', ')}`);
  return out;
}

// ---------- comandos ----------
const C = {};

C.ayuda = () => `Cerebro Uniline — comandos

Mapa general
  init <nombre> [--giro <giro>]
  ganchos                                 preguntas que cruzan módulos y sus respuestas
  condicion <clave> <valor>               responde un gancho (ej. condicion multiempresa si)
  proceso-agregar "<proceso>"
  modulo-agregar <id> --nombre "<Nombre>" [--depende a,b]
  mapa

Un mundo a la vez
  proponer <entidad> --modulo <id>        propone la tabla desde la biblioteca
  tabla-nueva <tabla> --entidad <e> --modulo <id> --por-que "<razón>"   tabla sin plantilla
  ver <tabla>
  pendientes [--modulo <id>]
  decidir <tabla> <campo> tabla|lista [--valores a,b,c] [--tabla <nombre>]
  agregar <tabla> <campo> --tipo <tipo> --por-que "<razón>" [--obligatorio si|no] [--valores a,b] [--unico]
      referencia: --de <entidad> (si no existe, queda «¿tabla o lista?») o --ref <tabla_existente>
  quitar <tabla> <campo|#>
  obligatorio <tabla> <campo|#> si|no
  dividir <tabla> <campo|#> <nuevo1,nuevo2,...> [--obligatorios a,b]
  aprobar <tabla>
  cerrar-modulo <id>
  guardar-plantilla <tabla> [--descripcion "..."] [--reemplazar]   la tabla aprobada pasa a la biblioteca

Cambios grandes
  recetas | receta <id>
  aplicar-receta <id> --resp clave=valor,clave=valor [--confirmar]   sin --confirmar solo muestra el impacto
  impacto <tabla>[.<campo>]

Salidas
  sql                                     esquema completo de lo aprobado (vista previa)
  migracion <nombre>                      SQL aditivo de lo nuevo; nunca DROP
  doc <modulo> [--escribir]
  historial

Tipos: ${Object.keys(TIPOS).join(', ')}
Archivo: --archivo <ruta> o CEREBRO_ARCHIVO (por defecto docs/cerebro.json)`;

C.init = (c, { pos, opt }, ctx) => {
  if (c) fallar(`Ya existe un cerebro en ${ctx.archivo}.`);
  if (!pos[0]) fallar('Uso: init <nombre> [--giro <giro>]');
  const nuevo = nuevoCerebro(pos[0], opt.giro);
  registrar(nuevo, 'init', { nombre: pos[0], giro: opt.giro || null });
  ctx.nuevo = nuevo;
  return `🧠 Cerebro creado para «${pos[0]}». Siguiente: ganchos.`;
};

C.ganchos = (c) => {
  const filas = cargarGanchos().map((g) => [
    g.clave, g.pregunta, Object.entries(g.opciones).map(([k, v]) => `${k} = ${v}`).join(' · '),
    c.condiciones[g.clave] !== undefined ? `✅ ${c.condiciones[g.clave]}` : `❓ (recomendado: ${g.recomendado})`, g.afecta,
  ]);
  return tablaMd(filas, ['Clave', 'Pregunta', 'Opciones', 'Respuesta', 'Afecta']);
};

C.condicion = (c, { pos }) => {
  const [clave, valor] = pos;
  const g = cargarGanchos().find((x) => x.clave === clave);
  if (!g) fallar(`Gancho «${clave}» no existe. Ganchos: ${cargarGanchos().map((x) => x.clave).join(', ')}`);
  if (!g.opciones[valor]) fallar(`Valor «${valor}» no válido para ${clave}. Opciones: ${Object.keys(g.opciones).join(', ')}`);
  const anterior = c.condiciones[clave];
  if (anterior !== undefined && anterior !== valor && Object.keys(c.tablas).length) {
    fallar(`⛔ Contradicción: «${clave}» ya era «${anterior}» y hay tablas creadas. Cambiarlo exige revisar impacto; no se aplica automáticamente.`);
  }
  c.condiciones[clave] = valor;
  const d = decidir(c, `${g.pregunta} → ${g.opciones[valor]}`, `gancho ${clave}`);
  registrar(c, 'condicion', { clave, valor });
  let msg = `Anotado (${d}): ${clave} = ${valor}.`;
  if (g.receta && valor === 'si') msg += ` 💡 Cuando exista el módulo de productos, aplica la receta «${g.receta}».`;
  return msg;
};

C['proceso-agregar'] = (c, { pos }) => {
  const p = pos.join(' ').trim();
  if (!p) fallar('Uso: proceso-agregar "<proceso>"');
  if (!c.mapa.procesos.includes(p)) c.mapa.procesos.push(p);
  registrar(c, 'proceso-agregar', { proceso: p });
  return `Proceso anotado: ${p}`;
};

C['modulo-agregar'] = (c, { pos, opt }) => {
  const id = pos[0];
  if (!id || !opt.nombre) fallar('Uso: modulo-agregar <id> --nombre "<Nombre>" [--depende a,b]');
  if (modulo(c, id)) fallar(`El módulo «${id}» ya existe.`);
  const depende = opt.depende ? String(opt.depende).split(',').map((s) => s.trim()) : [];
  for (const d of depende) if (!modulo(c, d)) fallar(`«${id}» depende de «${d}», que no está en el mapa.`);
  c.mapa.modulos.push({ id, nombre: opt.nombre, estado: 'pendiente', depende_de: depende });
  registrar(c, 'modulo-agregar', { id, nombre: opt.nombre, depende });
  return `Módulo «${id}» agregado al mapa.`;
};

C.mapa = (c) => {
  const out = [`## ${c.proyecto.nombre}${c.proyecto.giro ? ` · ${c.proyecto.giro}` : ''}`, ''];
  if (c.mapa.procesos.length) out.push(`Procesos: ${c.mapa.procesos.join(' · ')}`, '');
  const filas = c.mapa.modulos.map((m) => {
    const tablas = Object.keys(c.tablas).filter((n) => c.tablas[n].modulo === m.id);
    return [m.id, m.nombre, m.estado, m.depende_de.join(', ') || '—', tablas.join(', ') || '—'];
  });
  out.push(tablaMd(filas, ['Módulo', 'Nombre', 'Estado', 'Depende de', 'Tablas']));
  const faltan = cargarGanchos().filter((g) => c.condiciones[g.clave] === undefined).map((g) => g.clave);
  if (faltan.length) out.push('', `❓ Ganchos sin responder: ${faltan.join(', ')}`);
  return out.join('\n');
};

C.proponer = (c, { pos, opt }) => {
  const entidad = pos[0];
  if (!entidad || !opt.modulo) fallar('Uso: proponer <entidad> --modulo <id>');
  const lib = cargarEntidad(entidad);
  if (!lib) fallar(`La biblioteca no tiene «${entidad}». Crea la tabla con agregar campo por campo o agrega la entidad a biblioteca/entidades.`);
  const m = modulo(c, opt.modulo);
  if (m) for (const d of m.depende_de) if (modulo(c, d).estado !== 'cerrado') {
    ctxAvisos.push(`⚠️ «${opt.modulo}» depende de «${d}», que aún no está cerrado.`);
  }
  crearTabla(c, { entidad, tabla: lib.tabla, modulo: opt.modulo, campos: lib.campos, unicos: lib.unicos, origen: `biblioteca:${entidad}` }, ctxAvisos);
  registrar(c, 'proponer', { entidad, modulo: opt.modulo });
  return `${verTabla(c, lib.tabla)}\n\n¿Cuáles quitas o cambias? ¿Agregas alguno? (sin respuesta = se quedan todos)`;
};

C['tabla-nueva'] = (c, { pos, opt }) => {
  const nombre = pos[0];
  if (!nombre || !opt.entidad || !opt.modulo || !opt['por-que']) fallar('Uso: tabla-nueva <tabla> --entidad <entidad> --modulo <id> --por-que "<razón>"');
  if (!/^[a-z][a-z0-9_]*$/.test(nombre)) fallar('Nombre de tabla en snake_case y plural (ej. ventas_detalle).');
  if (tablaDeEntidad(c, opt.entidad)) fallar(`Ya hay una tabla para la entidad «${opt.entidad}».`);
  crearTabla(c, { entidad: opt.entidad, tabla: nombre, modulo: opt.modulo, campos: [], origen: 'dueño' }, ctxAvisos);
  const d = decidir(c, `Tabla nueva ${nombre} (${opt.entidad}) — ${opt['por-que']}`, 'dueño', opt.modulo);
  registrar(c, 'tabla-nueva', { tabla: nombre, entidad: opt.entidad, modulo: opt.modulo, por_que: opt['por-que'] });
  return `Anotado (${d}). Tabla sin plantilla en la biblioteca: agrega sus campos uno por uno.\n\n${verTabla(c, nombre)}`;
};

C.ver = (c, { pos }) => verTabla(c, pos[0]);

C.pendientes = (c, { opt }) => {
  let p = c.pendientes;
  if (opt.modulo) p = p.filter((x) => c.tablas[x.tabla] && c.tablas[x.tabla].modulo === opt.modulo);
  if (!p.length) return '✅ Sin pendientes.';
  return tablaMd(p.map((x) => [x.id, x.tabla, x.campo, x.texto, x.recomendado || '—', x.regla]), ['Id', 'Tabla', 'Campo', 'Pregunta', 'Recomendado', 'Regla']);
};

C.decidir = (c, { pos, opt }) => {
  const [nombreTabla, ref, opcion] = pos;
  if (!['tabla', 'lista'].includes(opcion)) fallar('Uso: decidir <tabla> <campo> tabla|lista [--valores a,b,c]');
  const t = tocarTabla(c, nombreTabla, ctxAvisos);
  const f = resolverCampo(t, ref);
  if (f.tipo !== 'pendiente') fallar(`«${f.nombre}» no tiene decisión pendiente.`);
  const dec = f.decision;
  const idx = c.pendientes.findIndex((p) => p.tabla === nombreTabla && p.campo === f.nombre);
  const rec = idx >= 0 ? c.pendientes[idx].recomendado : null;
  let salida;
  if (opcion === 'tabla') {
    let destino = tablaDeEntidad(c, dec.entidad);
    const nombreOriginal = f.nombre;
    if (!destino) {
      const lib = cargarEntidad(dec.entidad);
      if (lib) {
        crearTabla(c, { entidad: dec.entidad, tabla: lib.tabla, modulo: t.modulo, campos: lib.campos, unicos: lib.unicos, origen: `biblioteca:${dec.entidad}` }, ctxAvisos);
        destino = lib.tabla;
      } else {
        destino = opt.tabla && opt.tabla !== true ? opt.tabla : (dec.tabla || plural(dec.entidad));
        if (!/^[a-z][a-z0-9_]*$/.test(destino)) fallar('Nombre de tabla en snake_case (usa --tabla <nombre>).');
        if (c.tablas[destino]) fallar(`Ya existe una tabla «${destino}»; usa --tabla <otro_nombre>.`);
        crearTabla(c, { entidad: dec.entidad, tabla: destino, modulo: t.modulo, campos: cargarEntidad('_catalogo').campos, origen: 'catalogo-generico' }, ctxAvisos);
        ctxAvisos.push(`ℹ️ «${dec.entidad}» no tiene plantilla: se creó como catálogo genérico (CR-03). Agrega lo que le falte.`);
      }
      salida = `Tabla «${destino}» creada en el módulo «${t.modulo}» y agregada a la fila del mundo.\n\n${verTabla(c, destino)}`;
    } else salida = `«${nombreOriginal}» apunta a la tabla existente «${destino}».`;
    f.tipo = 'referencia'; f.ref = destino; f.nombre = `${nombreOriginal}_id`;
  } else {
    const valores = opt.valores ? String(opt.valores).split(',').map((s) => s.trim()).filter(Boolean) : dec.valores_sugeridos;
    if (!valores || !valores.length) fallar('Indica los valores: --valores a,b,c');
    f.tipo = 'lista'; f.valores = valores;
    salida = `«${f.nombre}» queda como lista fija: ${valores.join(', ')}.`;
  }
  delete f.decision;
  if (idx >= 0) c.pendientes.splice(idx, 1);
  const d = decidir(c, `${nombreTabla}.${ref}: ${opcion}${rec && rec !== opcion ? ` (se recomendaba ${rec})` : ''} — ${dec.regla}`, 'dueño', t.modulo);
  registrar(c, 'decidir', { tabla: nombreTabla, campo: ref, opcion, valores: opt.valores || null });
  return `Anotado (${d}). ${salida}`;
};

C.agregar = (c, { pos, opt }) => {
  const [nombreTabla, nombre] = pos;
  if (!nombreTabla || !nombre || !opt.tipo) fallar('Uso: agregar <tabla> <campo> --tipo <tipo> --por-que "<razón>" [--obligatorio si|no]');
  validarTipo(opt.tipo);
  if (!opt['por-que'] || opt['por-que'] === true) fallar('Todo campo necesita --por-que: sin razón no entra al cerebro.');
  const t = tocarTabla(c, nombreTabla, ctxAvisos);
  if (t.campos.some((f) => f.estado !== 'quitado' && (f.nombre === nombre || f.nombre === `${nombre}_id`))) fallar(`«${nombre}» ya existe en «${nombreTabla}».`);
  const def = { nombre, tipo: opt.tipo, obligatorio: opt.obligatorio ? si(opt.obligatorio) : false, por_que: opt['por-que'], fuente: 'dueño' };
  let pendienteNuevo = false;
  if (opt.tipo === 'referencia') {
    if (opt.ref && opt.ref !== true) { tabla(c, opt.ref); def.ref = opt.ref; }
    else if (opt.de && opt.de !== true) {
      const existente = tablaDeEntidad(c, opt.de);
      if (existente) def.ref = existente;
      else {
        const lib = cargarEntidad(opt.de);
        def.decision = {
          entidad: opt.de,
          pregunta: `¿«${nombre}» es tabla (se agregan valores propios) o lista fija?`,
          recomendacion: lib ? 'tabla' : { si_multiempresa: 'tabla', si_no: 'lista' },
          regla: lib ? 'existe plantilla en la biblioteca' : 'CR-03 / CR-04',
        };
        if (opt.tabla && opt.tabla !== true) def.decision.tabla = opt.tabla;
        pendienteNuevo = true;
      }
    } else fallar('Una referencia necesita --de <entidad> (se crea si no existe) o --ref <tabla_existente>.');
  }
  if (opt.tipo === 'lista') { if (!opt.valores) fallar('Una lista necesita --valores a,b,c'); def.valores = String(opt.valores).split(',').map((s) => s.trim()); }
  if (opt.unico) def.unico = true;
  if (opt.default !== undefined) def.default = opt.default;
  const campo = construirCampo(c, def, nombreTabla);
  t.campos.push(campo);
  if (pendienteNuevo) {
    agregarPendiente(c, { tipo: 'decidir', tabla: nombreTabla, campo: campo.nombre, texto: campo.decision.pregunta, recomendado: recomendar(c, campo.decision), regla: campo.decision.regla });
  }
  const d = decidir(c, `${nombreTabla}: agregar ${campo.nombre} (${opt.tipo}) — ${opt['por-que']}`, 'dueño', t.modulo);
  registrar(c, 'agregar', { tabla: nombreTabla, campo: nombre, tipo: opt.tipo, obligatorio: def.obligatorio, por_que: opt['por-que'], ref: opt.ref || null, de: opt.de || null, valores: opt.valores || null });
  return `Anotado (${d}).\n\n${verTabla(c, nombreTabla)}`;
};

C.quitar = (c, { pos }) => {
  const [nombreTabla, ref] = pos;
  const t = tocarTabla(c, nombreTabla, ctxAvisos);
  const f = resolverCampo(t, ref);
  const usos = Object.keys(c.tablas).flatMap((n) => c.tablas[n].unicos.filter((u) => u.includes(f.nombre)).map(() => n));
  if (usos.length) fallar(`«${f.nombre}» forma parte de un único compuesto en ${usos.join(', ')}; ajústalo primero.`);
  const emitido = c.sql_emitido.includes(`${nombreTabla}.${f.nombre}`);
  if (emitido) f.estado = 'quitado'; else t.campos.splice(t.campos.indexOf(f), 1);
  c.pendientes = c.pendientes.filter((p) => !(p.tabla === nombreTabla && p.campo === f.nombre));
  const d = decidir(c, `${nombreTabla}: quitar ${f.nombre}`, 'dueño', t.modulo);
  registrar(c, 'quitar', { tabla: nombreTabla, campo: f.nombre });
  const aviso = emitido ? '\n⚠️ Ya existía en una migración: queda marcado como quitado, pero NO se genera DROP. Borrarlo en BD requiere CONFIRMO.' : '';
  return `Anotado (${d}).${aviso}\n\n${verTabla(c, nombreTabla)}`;
};

C.obligatorio = (c, { pos }) => {
  const [nombreTabla, ref, valor] = pos;
  if (valor === undefined) fallar('Uso: obligatorio <tabla> <campo> si|no');
  const t = tocarTabla(c, nombreTabla, ctxAvisos);
  const f = resolverCampo(t, ref);
  f.obligatorio = si(valor);
  const d = decidir(c, `${nombreTabla}.${f.nombre}: obligatorio = ${f.obligatorio ? 'sí' : 'no'}`, 'dueño', t.modulo);
  registrar(c, 'obligatorio', { tabla: nombreTabla, campo: f.nombre, valor: f.obligatorio });
  return `Anotado (${d}).\n\n${verTabla(c, nombreTabla)}`;
};

C.dividir = (c, { pos, opt }) => {
  const [nombreTabla, ref, lista] = pos;
  if (!lista) fallar('Uso: dividir <tabla> <campo> <nuevo1,nuevo2,...> [--obligatorios a,b]');
  const t = tocarTabla(c, nombreTabla, ctxAvisos);
  const f = resolverCampo(t, ref);
  if (['referencia', 'pendiente'].includes(f.tipo)) fallar('No se puede dividir una referencia.');
  const nuevos = lista.split(',').map((s) => s.trim()).filter(Boolean);
  if (nuevos.length < 2) fallar('Dividir necesita al menos dos campos nuevos.');
  for (const n of nuevos) if (t.campos.some((x) => x !== f && x.estado !== 'quitado' && x.nombre === n)) fallar(`«${n}» ya existe en «${nombreTabla}».`);
  const oblig = opt.obligatorios ? String(opt.obligatorios).split(',').map((s) => s.trim()) : null;
  const reemplazo = nuevos.map((n) => ({
    nombre: n, tipo: f.tipo, obligatorio: oblig ? oblig.includes(n) : f.obligatorio,
    por_que: `Dividido de «${f.nombre}»: ${f.por_que || ''}`.trim(), fuente: 'dueño', estado: 'propuesto',
  }));
  const i = t.campos.indexOf(f);
  if (c.sql_emitido.includes(`${nombreTabla}.${f.nombre}`)) { f.estado = 'quitado'; t.campos.splice(i + 1, 0, ...reemplazo); }
  else t.campos.splice(i, 1, ...reemplazo);
  const d = decidir(c, `${nombreTabla}: dividir ${f.nombre} en ${nuevos.join(', ')}`, 'dueño', t.modulo);
  registrar(c, 'dividir', { tabla: nombreTabla, campo: f.nombre, nuevos, obligatorios: oblig });
  return `Anotado (${d}).\n\n${verTabla(c, nombreTabla)}`;
};

C.aprobar = (c, { pos }) => {
  const t = tabla(c, pos[0]);
  const pend = c.pendientes.filter((p) => p.tabla === pos[0]);
  if (pend.length) fallar(`«${pos[0]}» tiene decisiones pendientes: ${pend.map((p) => `${p.id} (${p.campo})`).join(', ')}.`);
  t.campos.forEach((f) => { if (f.estado === 'propuesto') f.estado = 'aprobado'; });
  t.estado = 'aprobada';
  const d = decidir(c, `Tabla ${pos[0]} aprobada (${t.campos.filter((f) => f.estado === 'aprobado').length} campos)`, 'dueño', t.modulo);
  registrar(c, 'aprobar', { tabla: pos[0] });
  const otras = Object.keys(c.tablas).filter((n) => c.tablas[n].modulo === t.modulo && c.tablas[n].estado !== 'aprobada');
  const sugerencia = !cargarEntidad(t.entidad) && !String(t.origen).startsWith('receta:') ? `\n💡 «${t.entidad}» no tiene plantilla en la biblioteca. ¿La guardo para próximos proyectos? → guardar-plantilla ${pos[0]}` : '';
  return `✅ ${pos[0]} aprobada (${d}).${otras.length ? ` Siguen en este mundo: ${otras.join(', ')}.` : ` Mundo «${t.modulo}» listo para cerrar-modulo.`}${sugerencia}`;
};

C['cerrar-modulo'] = (c, { pos }) => {
  const m = modulo(c, pos[0]);
  if (!m) fallar(`No existe el módulo «${pos[0]}».`);
  const tablas = Object.keys(c.tablas).filter((n) => c.tablas[n].modulo === m.id);
  if (!tablas.length) fallar(`El módulo «${m.id}» no tiene tablas.`);
  const sin = tablas.filter((n) => c.tablas[n].estado !== 'aprobada');
  if (sin.length) fallar(`No se puede cerrar: falta aprobar ${sin.join(', ')}.`);
  const pend = c.pendientes.filter((p) => tablas.includes(p.tabla));
  if (pend.length) fallar(`No se puede cerrar: pendientes ${pend.map((p) => p.id).join(', ')}.`);
  m.estado = 'cerrado';
  const d = decidir(c, `Módulo ${m.id} cerrado: ${tablas.join(', ')}`, 'dueño', m.id);
  registrar(c, 'cerrar-modulo', { id: m.id });
  const sig = c.mapa.modulos.find((x) => x.estado === 'pendiente' && x.depende_de.every((dd) => modulo(c, dd).estado === 'cerrado'));
  return `🔒 Mundo «${m.id}» cerrado (${d}): ${tablas.join(', ')}.${sig ? ` Siguiente sugerido: «${sig.id}».` : ''}`;
};

C['guardar-plantilla'] = (c, { pos, opt }, ctx) => {
  const nombre = pos[0];
  const t = tabla(c, nombre);
  if (t.estado !== 'aprobada') fallar(`Solo se guarda como plantilla una tabla aprobada; «${nombre}» está ${t.estado}.`);
  if (t.entidad.startsWith('_')) fallar('Entidad reservada.');
  const f = path.join(dirEntidades(), `${t.entidad}.json`);
  if (fs.existsSync(f) && !opt.reemplazar) fallar(`Ya existe la plantilla «${t.entidad}». Reemplazarla requiere --reemplazar (sobrescribe la anterior).`);
  const campos = [];
  const omitidos = [];
  for (const x of t.campos.filter((y) => y.estado !== 'quitado')) {
    if (x.fuente && x.fuente.startsWith('receta')) { omitidos.push(x.nombre); continue; } // los pone la receta
    const def = { nombre: x.nombre, tipo: x.tipo, obligatorio: x.obligatorio };
    if (x.unico) def.unico = true;
    if (x.default !== undefined) def.default = x.default;
    if (x.valores) def.valores = x.valores.slice();
    if (x.solo_si) def.solo_si = clonar(x.solo_si);
    def.por_que = x.por_que; def.fuente = x.fuente;
    if (x.tipo === 'referencia') {
      // En otro proyecto se vuelve a decidir tabla o lista.
      const entidadRef = c.tablas[x.ref].entidad;
      def.nombre = x.nombre.replace(/_id$/, '');
      def.decision = { entidad: entidadRef, pregunta: `¿«${def.nombre}» es tabla o lista fija?`, recomendacion: { si_multiempresa: 'tabla', si_no: 'lista' }, regla: 'CR-03 / CR-04' };
    }
    campos.push(def);
  }
  const plantilla = { entidad: t.entidad, tabla: nombre, descripcion: (opt.descripcion && opt.descripcion !== true) ? opt.descripcion : `Guardada desde «${c.proyecto.nombre}» el ${hoy()}`, origen: { proyecto: c.proyecto.nombre, fecha: hoy() }, campos };
  if (t.unicos.length) plantilla.unicos = clonar(t.unicos);
  ctx.plantilla = { archivo: f, contenido: `${JSON.stringify(plantilla, null, 2)}\n` };
  const d = decidir(c, `Plantilla «${t.entidad}» guardada en la biblioteca (${campos.length} campos)`, 'dueño', t.modulo);
  registrar(c, 'guardar-plantilla', { tabla: nombre, reemplazar: !!opt.reemplazar });
  return `📚 Plantilla «${t.entidad}» guardada (${d}): ${campos.map((x) => x.nombre).join(', ')}.${omitidos.length ? ` No se incluyen (los agrega su receta): ${omitidos.join(', ')}.` : ''}\nEn el siguiente proyecto: proponer ${t.entidad} --modulo <id>`;
};

C.recetas = () => tablaMd(listarRecetas().map((id) => { const r = cargarReceta(id); return [id, r.nombre, r.descripcion]; }), ['Id', 'Nombre', 'Qué hace']);

C.receta = (c, { pos }) => {
  const r = cargarReceta(pos[0]);
  const out = [`## Receta: ${r.nombre}`, r.descripcion, '', 'Preguntas (una a la vez):'];
  r.preguntas.forEach((p, i) => out.push(`${i + 1}. ${p.texto} — ${Object.entries(p.opciones).map(([k, v]) => `${k} = ${v}${k === p.recomendado ? ' (Recomendado)' : ''}`).join(' · ')}`));
  out.push('', `Aplicar: aplicar-receta ${r.id} --resp ${r.preguntas.map((p) => `${p.clave}=${p.recomendado}`).join(',')}`);
  return out.join('\n');
};

function ejecutarReceta(c, r, resp, avisos) {
  const lineas = [];
  for (const e of r.requiere_entidades || []) if (!tablaDeEntidad(c, e)) fallar(`La receta «${r.id}» necesita la tabla de «${e}». Propón primero ese mundo.`);
  for (const p of r.preguntas) {
    if (resp[p.clave] === undefined) fallar(`Falta responder «${p.clave}»: ${p.texto}`);
    if (!p.opciones[resp[p.clave]]) fallar(`«${resp[p.clave]}» no es opción de ${p.clave}. Opciones: ${Object.keys(p.opciones).join(', ')}`);
  }
  for (const x of r.restricciones || []) if (cumple(x.si, resp) && !cumple(x.requiere, resp)) fallar(`⛔ ${x.mensaje}`);
  for (const a of r.acciones) {
    if (!cumple(a.cuando, resp)) continue;
    if (a.tipo === 'crear_tabla') {
      const mod = c.tablas[tablaDeEntidad(c, a.modulo_igual_que)].modulo;
      if (tablaDeEntidad(c, a.entidad)) { lineas.push(`= «${a.tabla}» ya existe; no se duplica.`); continue; }
      crearTabla(c, { entidad: a.entidad, tabla: a.tabla, modulo: mod, campos: a.campos, unicos: a.unicos, origen: `receta:${r.id}` }, avisos);
      lineas.push(`+ Tabla nueva «${a.tabla}» en módulo «${mod}»: ${c.tablas[a.tabla].campos.map((f) => f.nombre).join(', ')}`);
      const m = modulo(c, mod);
      if (m.estado === 'cerrado') { m.estado = 'reabierto'; avisos.push(`🔓 Módulo «${mod}» reabierto por la receta.`); }
    } else if (a.tipo === 'agregar_campo') {
      const destino = tablaDeEntidad(c, a.entidad);
      if (destino) {
        const t = tocarTabla(c, destino, avisos);
        const nombreFinal = a.campo.tipo === 'referencia' && !a.campo.nombre.endsWith('_id') ? `${a.campo.nombre}_id` : a.campo.nombre;
        if (t.campos.some((f) => f.estado !== 'quitado' && f.nombre === nombreFinal)) { lineas.push(`= «${destino}.${nombreFinal}» ya existe.`); continue; }
        const campo = construirCampo(c, a.campo, destino);
        t.campos.push(campo);
        lineas.push(`+ «${destino}.${campo.nombre}» (${tipoSimple(campo)}, ${campo.obligatorio ? 'obligatorio' : 'opcional'})`);
      } else {
        c.compromisos.push({ entidad: a.entidad, campo: clonar(a.campo), origen: r.id, desde: hoy(), cumplido: null });
        lineas.push(`🧠 Compromiso: cuando exista «${a.entidad}» se le agrega «${a.campo.nombre}» (${a.campo.obligatorio ? 'obligatorio' : 'opcional'})`);
      }
    } else if (a.tipo === 'regla') {
      c.contadores.regla += 1;
      c.reglas.push({ id: `RN-${pad(c.contadores.regla)}`, texto: a.texto, origen: `receta:${r.id}`, desde: hoy() });
      lineas.push(`§ Regla RN-${pad(c.contadores.regla)}: ${a.texto}`);
    }
  }
  return lineas;
}

C['aplicar-receta'] = (c, { pos, opt }, ctx) => {
  const r = cargarReceta(pos[0]);
  if (c.recetas_aplicadas.some((x) => x.receta === r.id)) fallar(`La receta «${r.id}» ya se aplicó. Cambiar sus respuestas requiere revisar impacto.`);
  const resp = {};
  if (opt.resp && opt.resp !== true) for (const par of String(opt.resp).split(',')) { const [k, v] = par.split('='); resp[k.trim()] = (v || '').trim(); }
  const prueba = clonar(c);
  const avisos = [];
  const lineas = ejecutarReceta(prueba, r, resp, avisos);
  const cuerpo = [`## Impacto de la receta «${r.nombre}»`, '', 'Respuestas:', ...r.preguntas.map((p) => `- ${p.texto} → ${p.opciones[resp[p.clave]]}`), '', 'Cambios:', ...lineas];
  if (avisos.length) cuerpo.push('', ...avisos);
  if (!opt.confirmar) {
    cuerpo.push('', `Nada se ha guardado. Para aplicar: aplicar-receta ${r.id} --resp ${opt.resp} --confirmar`);
    ctx.sinCambios = true;
    return cuerpo.join('\n');
  }
  // Aplicar sobre el cerebro real (misma función => mismo resultado que la vista previa).
  ejecutarReceta(c, r, resp, []);
  c.recetas_aplicadas.push({ receta: r.id, respuestas: resp, fecha: hoy() });
  const d = decidir(c, `Receta ${r.id} aplicada: ${Object.entries(resp).map(([k, v]) => `${k}=${v}`).join(', ')}`, 'dueño');
  registrar(c, 'aplicar-receta', { receta: r.id, respuestas: resp });
  cuerpo.push('', `✅ Aplicada (${d}). Revisa y aprueba las tablas tocadas.`);
  return cuerpo.join('\n');
};

C.impacto = (c, { pos }) => {
  const [nombreTabla, campo] = String(pos[0] || '').split('.');
  const t = tabla(c, nombreTabla);
  const out = [`## Impacto de ${pos[0]}`, '', `Módulo: ${t.modulo} (${modulo(c, t.modulo).estado})`];
  const entrantes = [];
  for (const [n, x] of Object.entries(c.tablas)) for (const f of x.campos) if (f.ref === nombreTabla && f.estado !== 'quitado') entrantes.push(`${n}.${f.nombre}`);
  out.push(`Lo usan (referencias entrantes): ${entrantes.join(', ') || 'nadie todavía'}`);
  const salientes = t.campos.filter((f) => f.ref && f.estado !== 'quitado').map((f) => `${f.nombre} → ${f.ref}`);
  out.push(`Depende de: ${salientes.join(', ') || 'nada'}`);
  const mods = c.mapa.modulos.filter((m) => m.depende_de.includes(t.modulo)).map((m) => m.id);
  out.push(`Módulos que dependen de «${t.modulo}»: ${mods.join(', ') || 'ninguno'}`);
  const comp = c.compromisos.filter((x) => !x.cumplido).map((x) => `${x.entidad}.${x.campo.nombre} (receta ${x.origen})`);
  if (comp.length) out.push(`Compromisos pendientes del proyecto: ${comp.join(', ')}`);
  const reglas = c.reglas.filter((r) => r.texto.includes(nombreTabla.replace(/s$/, '')) || (campo && r.texto.includes(campo)));
  if (reglas.length) out.push('Reglas relacionadas:', ...reglas.map((r) => `- ${r.id}: ${r.texto}`));
  if (campo) {
    const f = resolverCampo(t, campo);
    out.push(`Campo ${f.nombre}: ${tipoSimple(f)}, ${f.obligatorio ? 'obligatorio' : 'opcional'}${c.sql_emitido.includes(`${nombreTabla}.${f.nombre}`) ? ', ya existe en BD (migración emitida)' : ', aún no está en BD'}`);
  }
  out.push('', 'ℹ️ El impacto solo incluye relaciones registradas en el cerebro.');
  return out.join('\n');
};

C.sql = (c) => {
  const { aprobadas, sinAprobar } = requisitosSql(c);
  if (!aprobadas.length) fallar('No hay tablas aprobadas.');
  return [...encabezadoSql(c, 'Esquema completo (vista previa)', sinAprobar), '', aprobadas.map((n) => crearTablaSql(c, n)).join('\n\n')].join('\n');
};

C.migracion = (c, { pos }, ctx) => {
  const nombre = pos[0];
  if (!nombre || !/^[a-z0-9_]+$/.test(nombre)) fallar('Uso: migracion <nombre_en_snake_case>');
  const { aprobadas, sinAprobar } = requisitosSql(c);
  const bloques = []; const emitidos = [];
  for (const n of aprobadas) {
    const t = c.tablas[n];
    const vivos = t.campos.filter((f) => f.estado !== 'quitado');
    if (!c.sql_emitido.includes(n)) {
      bloques.push(crearTablaSql(c, n));
      emitidos.push(n, ...vivos.map((f) => `${n}.${f.nombre}`));
    } else {
      const nuevos = vivos.filter((f) => !c.sql_emitido.includes(`${n}.${f.nombre}`));
      if (nuevos.length) {
        bloques.push([
          ...nuevos.map((f) => `alter table public.${n} add column if not exists ${columnaSql(c, f, { paraAlter: true })};`),
          ...extrasSql(c, n, nuevos, (t.unicos || []).filter((u) => u.some((col) => nuevos.some((f) => f.nombre === col)))),
        ].join('\n'));
        emitidos.push(...nuevos.map((f) => `${n}.${f.nombre}`));
      }
      const quitados = t.campos.filter((f) => f.estado === 'quitado').map((f) => f.nombre);
      if (quitados.length) bloques.push(`-- ⚠️ Quitados en el cerebro, NO se borran: ${n}.${quitados.join(`, ${n}.`)} (requiere CONFIRMO y migración manual)`);
    }
  }
  if (!emitidos.length) { ctx.sinCambios = true; return '✅ La BD ya está al día con el cerebro: no hay nada nuevo.'; }
  const numero = pad(c.migraciones.length + 1);
  const relativa = path.join('migraciones', `${numero}_${nombre}.sql`);
  const contenido = [...encabezadoSql(c, `Migración ${numero}_${nombre} · aditiva (sin DROP)`, sinAprobar), '', 'begin;', '', bloques.join('\n\n'), '', 'commit;', ''].join('\n');
  ctx.escribir.push({ relativa, contenido });
  c.sql_emitido.push(...emitidos);
  c.migraciones.push({ numero, nombre, archivo: relativa, fecha: hoy(), elementos: emitidos.length });
  registrar(c, 'migracion', { nombre });
  return `📄 ${relativa} (${emitidos.length} elementos nuevos)\n\n${contenido}`;
};

C.doc = (c, { pos, opt }, ctx) => {
  const m = modulo(c, pos[0]);
  if (!m) fallar(`No existe el módulo «${pos[0]}».`);
  const tablas = Object.keys(c.tablas).filter((n) => c.tablas[n].modulo === m.id);
  const out = [`# Módulo: ${m.nombre}`, `> Generado desde docs/cerebro.json · estado: ${m.estado} · no editar a mano`, ''];
  for (const n of tablas) out.push(verTabla(c, n), '');
  const decs = c.decisiones.filter((d) => d.modulo === m.id);
  if (decs.length) out.push('## Decisiones', ...decs.map((d) => `- ${d.id} · ${d.fecha} · ${d.texto}`), '');
  if (c.reglas.length) out.push('## Reglas del proyecto', ...c.reglas.map((r) => `- ${r.id}: ${r.texto} (${r.origen})`), '');
  const txt = out.join('\n');
  if (opt.escribir) { ctx.escribir.push({ relativa: path.join('cerebro', `${m.id}.md`), contenido: `${txt}\n` }); ctx.sinCambios = true; }
  else ctx.sinCambios = true;
  return txt;
};

C.historial = (c, _a, ctx) => { ctx.sinCambios = true; return c.historial.map((h) => `${h.n}. ${h.fecha} · ${h.comando} ${JSON.stringify(h.args)}`).join('\n'); };

const SOLO_LECTURA = new Set(['ayuda', 'ganchos', 'mapa', 'ver', 'pendientes', 'recetas', 'receta', 'impacto', 'sql', 'doc', 'historial']);

let ctxAvisos = [];

/** Ejecuta un comando. Devuelve { salida, cerebro }. Exportado para pruebas. */
function ejecutar(argv, { archivo } = {}) {
  const [comando, ...resto] = argv;
  const args = parsearArgs(resto);
  const ruta = path.resolve(args.opt.archivo || archivo || process.env.CEREBRO_ARCHIVO || path.join('docs', 'cerebro.json'));
  delete args.opt.archivo;
  if (!comando || comando === 'ayuda' || comando === '--help') return { salida: C.ayuda() };
  const fn = C[comando];
  if (!fn) fallar(`Comando «${comando}» no existe. Usa: ayuda`);
  const existe = fs.existsSync(ruta);
  if (!existe && comando !== 'init') fallar(`No hay cerebro en ${ruta}. Empieza con: init <nombre>`);
  const cerebro = existe ? leerJSON(ruta) : null;
  const ctx = { archivo: ruta, escribir: [], nuevo: null, sinCambios: false };
  ctxAvisos = [];
  let salida = fn(cerebro, args, ctx);
  if (ctxAvisos.length) salida = `${ctxAvisos.join('\n')}\n\n${salida}`;
  const final = ctx.nuevo || cerebro;
  // Verificar destinos ANTES de guardar, para no dejar el cerebro adelantado a sus archivos.
  for (const w of ctx.escribir) {
    const destino = path.join(path.dirname(ruta), w.relativa);
    if (fs.existsSync(destino) && w.relativa.startsWith('migraciones')) fallar(`Ya existe ${destino}; no se sobrescribe.`);
  }
  if (!SOLO_LECTURA.has(comando) && !ctx.sinCambios) {
    fs.mkdirSync(path.dirname(ruta), { recursive: true });
    fs.writeFileSync(ruta, `${JSON.stringify(final, null, 2)}\n`);
  }
  if (ctx.plantilla) fs.writeFileSync(ctx.plantilla.archivo, ctx.plantilla.contenido);
  for (const w of ctx.escribir) {
    const destino = path.join(path.dirname(ruta), w.relativa);
    fs.mkdirSync(path.dirname(destino), { recursive: true });
    fs.writeFileSync(destino, w.contenido);
  }
  return { salida, cerebro: final };
}

module.exports = { ejecutar, ErrorCerebro };

if (require.main === module) {
  try {
    process.stdout.write(`${ejecutar(process.argv.slice(2)).salida}\n`);
  } catch (e) {
    if (e instanceof ErrorCerebro) { process.stderr.write(`❌ ${e.message}\n`); process.exit(1); }
    throw e;
  }
}
