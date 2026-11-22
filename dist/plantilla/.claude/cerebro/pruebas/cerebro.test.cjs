'use strict';
// Pruebas del cerebro: node --test .claude/cerebro/pruebas/
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { ejecutar, ErrorCerebro } = require('../cerebro.cjs');

process.env.CEREBRO_FECHA = '2026-11-22';

function nuevoProyecto() {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'cerebro-'));
  const archivo = path.join(dir, 'cerebro.json');
  const run = (linea) => ejecutar(linea, { archivo });
  return { dir, archivo, run };
}

/** Recorrido completo del mundo de productos + receta de lotes. */
function recorrido(run) {
  run(['init', 'Demo', '--giro', 'ferreteria']);
  run(['condicion', 'multiempresa', 'si']);
  run(['condicion', 'cfdi', 'si']);
  run(['modulo-agregar', 'productos', '--nombre', 'Productos']);
  run(['modulo-agregar', 'ventas', '--nombre', 'Ventas', '--depende', 'productos']);
  run(['proponer', 'producto', '--modulo', 'productos']);
  run(['decidir', 'productos', 'categoria', 'tabla']);
  run(['decidir', 'productos', 'marca', 'lista', '--valores', 'truper,urrea']);
  run(['decidir', 'productos', 'unidad', 'tabla']);
  for (const t of ['categorias', 'unidades', 'productos']) run(['aprobar', t]);
  run(['cerrar-modulo', 'productos']);
  run(['migracion', 'inicial']);
  run(['aplicar-receta', 'lotes', '--resp', 'alcance=algunos,caducidad=si,salida=fefo,negativos=no', '--confirmar']);
  run(['aprobar', 'productos']);
  run(['aprobar', 'lotes']);
  run(['cerrar-modulo', 'productos']);
  run(['migracion', 'lotes']);
}

test('misma entrada produce exactamente el mismo cerebro y las mismas migraciones', () => {
  const a = nuevoProyecto(); const b = nuevoProyecto();
  recorrido(a.run); recorrido(b.run);
  assert.equal(fs.readFileSync(a.archivo, 'utf8'), fs.readFileSync(b.archivo, 'utf8'));
  for (const m of ['001_inicial.sql', '002_lotes.sql']) {
    assert.equal(fs.readFileSync(path.join(a.dir, 'migraciones', m), 'utf8'), fs.readFileSync(path.join(b.dir, 'migraciones', m), 'utf8'));
  }
});

test('decidir "tabla" crea el catálogo en el mismo mundo y convierte el campo en referencia', () => {
  const { run } = nuevoProyecto();
  run(['init', 'Demo']); run(['condicion', 'multiempresa', 'si']);
  run(['modulo-agregar', 'productos', '--nombre', 'Productos']);
  run(['proponer', 'producto', '--modulo', 'productos']);
  const { cerebro } = run(['decidir', 'productos', 'categoria', 'tabla']);
  assert.equal(cerebro.tablas.categorias.modulo, 'productos');
  const campo = cerebro.tablas.productos.campos.find((f) => f.nombre === 'categoria_id');
  assert.equal(campo.ref, 'categorias');
  assert.ok(!cerebro.pendientes.some((p) => p.campo === 'categoria'));
});

test('los campos condicionados a un gancho solo aparecen si el gancho lo pide', () => {
  const con = nuevoProyecto(); const sin = nuevoProyecto();
  for (const [p, cfdi] of [[con, 'si'], [sin, 'no']]) {
    p.run(['init', 'Demo']); p.run(['condicion', 'multiempresa', 'no']); p.run(['condicion', 'cfdi', cfdi]);
    p.run(['modulo-agregar', 'productos', '--nombre', 'Productos']);
    p.run(['proponer', 'producto', '--modulo', 'productos']);
  }
  const nombres = (p) => JSON.parse(fs.readFileSync(p.archivo, 'utf8')).tablas.productos.campos.map((f) => f.nombre);
  assert.ok(nombres(con).includes('clave_prod_serv_sat'));
  assert.ok(!nombres(sin).includes('clave_prod_serv_sat'));
});

test('la recomendación de tabla o lista sigue el criterio CR-03 / CR-04', () => {
  const renta = nuevoProyecto(); const propio = nuevoProyecto();
  for (const [p, me] of [[renta, 'si'], [propio, 'no']]) {
    p.run(['init', 'Demo']); p.run(['condicion', 'multiempresa', me]);
    p.run(['modulo-agregar', 'productos', '--nombre', 'Productos']);
    p.run(['proponer', 'producto', '--modulo', 'productos']);
  }
  const rec = (p, campo) => JSON.parse(fs.readFileSync(p.archivo, 'utf8')).pendientes.find((x) => x.campo === campo).recomendado;
  assert.equal(rec(renta, 'categoria'), 'tabla');
  assert.equal(rec(propio, 'categoria'), 'lista');
  assert.equal(rec(propio, 'unidad'), 'tabla'); // CR-06 sin importar el gancho
});

test('dividir reemplaza el campo en su lugar y conserva la razón', () => {
  const { run } = nuevoProyecto();
  run(['init', 'Demo']); run(['condicion', 'multiempresa', 'no']);
  run(['modulo-agregar', 'pacientes', '--nombre', 'Pacientes']);
  run(['tabla-nueva', 'pacientes', '--entidad', 'paciente', '--modulo', 'pacientes', '--por-que', 'Personas atendidas']);
  run(['agregar', 'pacientes', 'nombre', '--tipo', 'texto', '--obligatorio', 'si', '--por-que', 'Identificar al paciente']);
  run(['agregar', 'pacientes', 'telefono', '--tipo', 'texto', '--por-que', 'Contacto']);
  const { cerebro } = run(['dividir', 'pacientes', '1', 'nombre,apellido_paterno,apellido_materno', '--obligatorios', 'nombre,apellido_paterno']);
  const campos = cerebro.tablas.pacientes.campos;
  assert.deepEqual(campos.map((f) => f.nombre), ['nombre', 'apellido_paterno', 'apellido_materno', 'telefono']);
  assert.deepEqual(campos.slice(0, 3).map((f) => f.obligatorio), [true, true, false]);
  assert.match(campos[2].por_que, /Dividido de «nombre»/);
});

test('ningún campo entra sin razón', () => {
  const { run } = nuevoProyecto();
  run(['init', 'Demo']); run(['modulo-agregar', 'x', '--nombre', 'X']);
  run(['tabla-nueva', 'cosas', '--entidad', 'cosa', '--modulo', 'x', '--por-que', 'prueba']);
  assert.throws(() => run(['agregar', 'cosas', 'campo', '--tipo', 'texto']), ErrorCerebro);
});

test('no se aprueba una tabla ni se cierra un mundo con decisiones pendientes', () => {
  const { run } = nuevoProyecto();
  run(['init', 'Demo']); run(['condicion', 'multiempresa', 'si']);
  run(['modulo-agregar', 'productos', '--nombre', 'Productos']);
  run(['proponer', 'producto', '--modulo', 'productos']);
  assert.throws(() => run(['aprobar', 'productos']), /pendientes/);
  assert.throws(() => run(['cerrar-modulo', 'productos']), /falta aprobar/);
});

test('la vista previa de una receta no guarda nada', () => {
  const { archivo, run } = nuevoProyecto();
  run(['init', 'Demo']); run(['condicion', 'multiempresa', 'si']);
  run(['modulo-agregar', 'productos', '--nombre', 'Productos']);
  run(['proponer', 'producto', '--modulo', 'productos']);
  const antes = fs.readFileSync(archivo, 'utf8');
  const { salida } = run(['aplicar-receta', 'lotes', '--resp', 'alcance=todos,caducidad=si,salida=fefo,negativos=no']);
  assert.match(salida, /Nada se ha guardado/);
  assert.equal(fs.readFileSync(archivo, 'utf8'), antes);
});

test('una receta rechaza respuestas incompatibles', () => {
  const { run } = nuevoProyecto();
  run(['init', 'Demo']); run(['condicion', 'multiempresa', 'si']);
  run(['modulo-agregar', 'productos', '--nombre', 'Productos']);
  run(['proponer', 'producto', '--modulo', 'productos']);
  assert.throws(() => run(['aplicar-receta', 'lotes', '--resp', 'alcance=todos,caducidad=no,salida=fefo,negativos=no']), /caducidad/);
  assert.throws(() => run(['aplicar-receta', 'lotes', '--resp', 'alcance=todos']), /Falta responder/);
});

test('la receta reabre el mundo cerrado y deja compromisos que se cumplen al crear la tabla después', () => {
  const { archivo, run } = nuevoProyecto();
  recorrido(run);
  let c = JSON.parse(fs.readFileSync(archivo, 'utf8'));
  assert.ok(c.tablas.productos.campos.some((f) => f.nombre === 'maneja_lote'));
  assert.ok(c.tablas.lotes.campos.some((f) => f.nombre === 'fecha_caducidad'));
  assert.equal(c.compromisos.filter((x) => !x.cumplido).length, 3);
  run(['tabla-nueva', 'ventas_detalle', '--entidad', 'venta_detalle', '--modulo', 'ventas', '--por-que', 'Partidas']);
  c = JSON.parse(fs.readFileSync(archivo, 'utf8'));
  const lote = c.tablas.ventas_detalle.campos.find((f) => f.nombre === 'lote_id');
  assert.equal(lote.ref, 'lotes');
  assert.equal(c.compromisos.filter((x) => !x.cumplido).length, 2);
});

test('la migración es aditiva: solo lo nuevo y nunca DROP', () => {
  const { dir, run } = nuevoProyecto();
  recorrido(run);
  const m2 = fs.readFileSync(path.join(dir, 'migraciones', '002_lotes.sql'), 'utf8');
  assert.match(m2, /alter table public\.productos add column if not exists maneja_lote boolean not null default false/);
  assert.match(m2, /create table if not exists public\.lotes/);
  assert.doesNotMatch(m2, /create table if not exists public\.productos/);
  run(['quitar', 'productos', 'costo']);
  run(['aprobar', 'productos']);
  run(['agregar', 'productos', 'stock_minimo', '--tipo', 'cantidad', '--por-que', 'Reorden']);
  run(['aprobar', 'productos']);
  run(['migracion', 'tercera']);
  const m3 = fs.readFileSync(path.join(dir, 'migraciones', '003_tercera.sql'), 'utf8');
  assert.doesNotMatch(m3, /\bdrop\s+(table|column|index|constraint)\b/i);
  assert.match(m3, /NO se borran: productos\.costo/);
  assert.match(m3, /add column if not exists stock_minimo/);
  assert.match(run(['migracion', 'cuarta']).salida, /al día/);
  assert.ok(!fs.existsSync(path.join(dir, 'migraciones', '004_cuarta.sql')));
});

test('cambiar un gancho ya respondido con tablas creadas es contradicción', () => {
  const { run } = nuevoProyecto();
  run(['init', 'Demo']); run(['condicion', 'multiempresa', 'si']);
  run(['modulo-agregar', 'productos', '--nombre', 'Productos']);
  run(['proponer', 'producto', '--modulo', 'productos']);
  assert.throws(() => run(['condicion', 'multiempresa', 'no']), /Contradicción/);
});

test('un campo nuevo que se alimenta de otra tabla pregunta tabla o lista y crea el catálogo', () => {
  const { run } = nuevoProyecto();
  run(['init', 'Dental']); run(['condicion', 'multiempresa', 'si']);
  run(['modulo-agregar', 'pacientes', '--nombre', 'Pacientes']);
  run(['tabla-nueva', 'pacientes', '--entidad', 'paciente', '--modulo', 'pacientes', '--por-que', 'Personas atendidas']);
  let { cerebro } = run(['agregar', 'pacientes', 'aseguradora', '--tipo', 'referencia', '--de', 'aseguradora', '--por-que', 'Quién paga el tratamiento']);
  const pen = cerebro.pendientes.find((p) => p.campo === 'aseguradora');
  assert.equal(pen.recomendado, 'tabla');
  assert.throws(() => run(['aprobar', 'pacientes']), /pendientes/);
  ({ cerebro } = run(['decidir', 'pacientes', 'aseguradora', 'tabla']));
  assert.equal(cerebro.tablas.aseguradoras.modulo, 'pacientes');
  assert.deepEqual(cerebro.tablas.aseguradoras.campos.map((f) => f.nombre), ['nombre', 'orden', 'es_sistema']);
  assert.equal(cerebro.tablas.pacientes.campos.find((f) => f.nombre === 'aseguradora_id').ref, 'aseguradoras');
  // Si la tabla ya existe, se conecta directo sin preguntar.
  ({ cerebro } = run(['agregar', 'pacientes', 'aseguradora_secundaria', '--tipo', 'referencia', '--de', 'aseguradora', '--por-que', 'Segundo seguro']));
  assert.equal(cerebro.tablas.pacientes.campos.find((f) => f.nombre === 'aseguradora_secundaria_id').ref, 'aseguradoras');
});

test('una tabla aprobada se guarda como plantilla y el siguiente proyecto la propone igual', () => {
  const bib = fs.mkdtempSync(path.join(os.tmpdir(), 'bib-'));
  fs.cpSync(path.join(__dirname, '..', 'biblioteca'), bib, { recursive: true });
  process.env.CEREBRO_BIBLIOTECA = bib;
  try {
    const uno = nuevoProyecto();
    uno.run(['init', 'Dental 1']); uno.run(['condicion', 'multiempresa', 'si']);
    uno.run(['modulo-agregar', 'pacientes', '--nombre', 'Pacientes']);
    uno.run(['tabla-nueva', 'pacientes', '--entidad', 'paciente', '--modulo', 'pacientes', '--por-que', 'Personas atendidas']);
    uno.run(['agregar', 'pacientes', 'nombre', '--tipo', 'texto', '--obligatorio', 'si', '--por-que', 'Identificar']);
    uno.run(['dividir', 'pacientes', 'nombre', 'nombre,apellido_paterno,apellido_materno', '--obligatorios', 'nombre,apellido_paterno']);
    uno.run(['agregar', 'pacientes', 'alergias', '--tipo', 'texto_largo', '--por-que', 'Evitar reacciones a anestesia']);
    uno.run(['agregar', 'pacientes', 'aseguradora', '--tipo', 'referencia', '--de', 'aseguradora', '--por-que', 'Quién paga']);
    uno.run(['decidir', 'pacientes', 'aseguradora', 'tabla']);
    const { salida } = uno.run(['aprobar', 'pacientes']);
    assert.match(salida, /guardar-plantilla pacientes/);
    assert.throws(() => uno.run(['guardar-plantilla', 'aseguradoras']), /aprobada/);
    uno.run(['guardar-plantilla', 'pacientes']);
    assert.throws(() => uno.run(['guardar-plantilla', 'pacientes']), /--reemplazar/);

    const dos = nuevoProyecto();
    dos.run(['init', 'Dental 2']); dos.run(['condicion', 'multiempresa', 'no']);
    dos.run(['modulo-agregar', 'pacientes', '--nombre', 'Pacientes']);
    const { cerebro } = dos.run(['proponer', 'paciente', '--modulo', 'pacientes']);
    const campos = cerebro.tablas.pacientes.campos;
    assert.deepEqual(campos.map((f) => f.nombre), ['nombre', 'apellido_paterno', 'apellido_materno', 'alergias', 'aseguradora']);
    assert.equal(campos.find((f) => f.nombre === 'alergias').por_que, 'Evitar reacciones a anestesia');
    // La referencia se vuelve a decidir en el nuevo proyecto, con la recomendación de SU criterio.
    assert.equal(cerebro.pendientes.find((p) => p.campo === 'aseguradora').recomendado, 'lista');
  } finally {
    delete process.env.CEREBRO_BIBLIOTECA;
  }
});
