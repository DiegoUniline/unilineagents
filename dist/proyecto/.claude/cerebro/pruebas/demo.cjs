'use strict';
// Regenera el ejemplo .claude/ejemplos/cerebro-productos/ con un recorrido real del script.
// Uso: node .claude/cerebro/pruebas/demo.cjs [carpeta_destino]
const fs = require('fs');
const path = require('path');
const { ejecutar } = require('../cerebro.cjs');

process.env.CEREBRO_FECHA = '2026-11-22';
// Destino: argumento opcional (repo central: docs/ejemplo-cerebro-productos); por defecto .claude/ejemplos/cerebro-productos.
const destino = path.resolve(process.argv[2] || path.join(__dirname, '..', '..', 'ejemplos', 'cerebro-productos'));
fs.rmSync(destino, { recursive: true, force: true });
fs.mkdirSync(destino, { recursive: true });
const archivo = path.join(destino, 'cerebro.json');

const pasos = [
  ['Arranque', ['init', 'Ferretería Demo', '--giro', 'ferreteria']],
  ['Mapa general: preguntas gancho', ['ganchos']],
  ['El dueño: «la voy a rentar»', ['condicion', 'multiempresa', 'si']],
  ['El dueño: «sí facturo»', ['condicion', 'cfdi', 'si']],
  ['El dueño: «un solo almacén»', ['condicion', 'almacenes', 'no']],
  ['Procesos que contó', ['proceso-agregar', 'ventas en mostrador']],
  [null, ['proceso-agregar', 'compras a proveedores']],
  ['Módulos del mapa', ['modulo-agregar', 'productos', '--nombre', 'Productos']],
  [null, ['modulo-agregar', 'clientes', '--nombre', 'Clientes']],
  [null, ['modulo-agregar', 'ventas', '--nombre', 'Ventas', '--depende', 'productos,clientes']],
  [null, ['mapa']],
  ['Mundo productos: propuesta', ['proponer', 'producto', '--modulo', 'productos']],
  ['El dueño: «categoría como tabla»', ['decidir', 'productos', 'categoria', 'tabla']],
  ['El dueño: «marca, lista fija»', ['decidir', 'productos', 'marca', 'lista', '--valores', 'truper,urrea,generica']],
  ['El dueño: «unidad como tabla»', ['decidir', 'productos', 'unidad', 'tabla']],
  ['El dueño: «quita la imagen»', ['quitar', 'productos', 'imagen']],
  ['El dueño: «agrega stock mínimo»', ['agregar', 'productos', 'stock_minimo', '--tipo', 'cantidad', '--por-que', 'Avisar cuándo reordenar']],
  ['Aprobación', ['aprobar', 'categorias']],
  [null, ['aprobar', 'unidades']],
  [null, ['aprobar', 'productos']],
  [null, ['cerrar-modulo', 'productos']],
  ['SQL del mundo cerrado', ['migracion', 'productos']],
  ['Después: «ocupo manejar lotes»', ['receta', 'lotes']],
  ['Vista previa del impacto (no guarda)', ['aplicar-receta', 'lotes', '--resp', 'alcance=algunos,caducidad=si,salida=fefo,negativos=no']],
  ['El dueño aprueba', ['aplicar-receta', 'lotes', '--resp', 'alcance=algunos,caducidad=si,salida=fefo,negativos=no', '--confirmar']],
  [null, ['aprobar', 'productos']],
  [null, ['aprobar', 'lotes']],
  [null, ['cerrar-modulo', 'productos']],
  ['Migración aditiva de lotes', ['migracion', 'lotes']],
  ['Semanas después, mundo ventas: el cerebro se acuerda del lote', ['tabla-nueva', 'ventas_detalle', '--entidad', 'venta_detalle', '--modulo', 'ventas', '--por-que', 'Partidas de cada venta']],
  ['Impacto si se toca productos', ['impacto', 'productos']],
];

const out = ['# Recorrido real del cerebro · Ferretería Demo', '', '> Generado por `node .claude/cerebro/pruebas/demo.cjs`. Cada bloque es la salida literal del script.', ''];
for (const [titulo, argv] of pasos) {
  if (titulo) out.push(`## ${titulo}`, '');
  out.push(`\`\`\`\n$ cerebro ${argv.map((a) => (/\s/.test(a) ? `"${a}"` : a)).join(' ')}\n\`\`\``, '');
  out.push(ejecutar(argv, { archivo }).salida, '');
}
fs.writeFileSync(path.join(destino, 'recorrido.md'), `${out.join('\n')}\n`);
console.log(`Ejemplo regenerado en ${destino}`);
