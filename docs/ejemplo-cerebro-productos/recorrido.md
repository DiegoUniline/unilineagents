# Recorrido real del cerebro · Ferretería Demo

> Generado por `node .claude/cerebro/pruebas/demo.cjs`. Cada bloque es la salida literal del script.

## Arranque

```
$ cerebro init "Ferretería Demo" --giro ferreteria
```

🧠 Cerebro creado para «Ferretería Demo». Siguiente: ganchos.

## Mapa general: preguntas gancho

```
$ cerebro ganchos
```

| Clave | Pregunta | Opciones | Respuesta | Afecta |
|---|---|---|---|---|
| multiempresa | ¿Lo vas a rentar a varias empresas o es para un solo negocio? | si = Varias empresas (rentar) · no = Un solo negocio | ❓ (recomendado: si) | empresa_id en todas las tablas; catálogos por empresa (CR-03) o lista fija (CR-04); unicidad por empresa (CR-14) |
| sucursales | ¿Tiene varias sucursales o sedes? | si = Sí · no = No | ❓ (recomendado: no) | sucursal_id en documentos y folios por sucursal (CR-11) |
| almacenes | ¿El inventario se controla en más de un almacén? | si = Sí, varios almacenes · no = Un solo inventario | ❓ (recomendado: no) | existencias por almacén; traspasos entre almacenes |
| lotes | ¿Algún producto se controla por lote (con o sin caducidad)? | si = Sí · no = No | ❓ (recomendado: no) | productos, inventario, compras y ventas |
| listas_precios | ¿Manejas varios precios para un mismo producto (mayoreo, menudeo, por cliente)? | si = Sí, varias listas · no = Un solo precio | ❓ (recomendado: no) | precio en productos o tabla de listas de precios |
| cfdi | ¿Vas a facturar CFDI desde el sistema? | si = Sí · no = No | ❓ (recomendado: si) | claves SAT en productos y unidades; datos fiscales de clientes (skill cfdi-mexico) |

## El dueño: «la voy a rentar»

```
$ cerebro condicion multiempresa si
```

Anotado (D-001): multiempresa = si.

## El dueño: «sí facturo»

```
$ cerebro condicion cfdi si
```

Anotado (D-002): cfdi = si.

## El dueño: «un solo almacén»

```
$ cerebro condicion almacenes no
```

Anotado (D-003): almacenes = no.

## Procesos que contó

```
$ cerebro proceso-agregar "ventas en mostrador"
```

Proceso anotado: ventas en mostrador

```
$ cerebro proceso-agregar "compras a proveedores"
```

Proceso anotado: compras a proveedores

## Módulos del mapa

```
$ cerebro modulo-agregar productos --nombre Productos
```

Módulo «productos» agregado al mapa.

```
$ cerebro modulo-agregar clientes --nombre Clientes
```

Módulo «clientes» agregado al mapa.

```
$ cerebro modulo-agregar ventas --nombre Ventas --depende productos,clientes
```

Módulo «ventas» agregado al mapa.

```
$ cerebro mapa
```

## Ferretería Demo · ferreteria

Procesos: ventas en mostrador · compras a proveedores

| Módulo | Nombre | Estado | Depende de | Tablas |
|---|---|---|---|---|
| productos | Productos | pendiente | — | — |
| clientes | Clientes | pendiente | — | — |
| ventas | Ventas | pendiente | productos, clientes | — |

❓ Ganchos sin responder: sucursales, lotes, listas_precios

## Mundo productos: propuesta

```
$ cerebro proponer producto --modulo productos
```

### productos · módulo productos · propuesta

| # | Campo | Tipo | Oblig. | Por qué |
|---|---|---|---|---|
| 1 | codigo | texto | sí | Identifica el producto sin ambigüedad (SKU) en ventas, compras e inventario (CR-14) |
| 2 | nombre | texto | sí | Lo que ve el usuario en pantallas y tickets (base) |
| 3 | descripcion | texto largo | no | Detalle para cotizaciones o catálogo (base) |
| 4 | codigo_barras | texto | no | Venta rápida con lector; único para no confundir productos (CR-14) |
| 5 | categoria | ❓ tabla o lista | no | Agrupar para reportes y búsqueda (base) |
| 6 | marca | ❓ tabla o lista | no | Filtrar y reportar por fabricante (base) |
| 7 | unidad | ❓ tabla o lista | sí | Cómo se mide (pieza, kg, litro); necesaria para inventario y factura (base) |
| 8 | precio_venta | dinero | sí | Precio base que se copia a la venta al momento; nunca se lee el precio vivo (CR-10 / CR-12) |
| 9 | costo | dinero | no | Calcular utilidad; se actualiza con las compras (CR-12) |
| 10 | tasa_iva | lista: 16, 8, 0, exento | sí | Impuesto explícito por producto; valores fijos de ley (CR-01 / CR-12) |
| 11 | clave_prod_serv_sat | texto | sí | Obligatoria en cada concepto del CFDI 4.0 (cfdi-mexico) |
| 12 | imagen | archivo (ruta en Storage) | no | Foto en catálogo y POS; se guarda en Storage, no en BD (base fija: archivos) |

Técnicos automáticos (CR-16 / CR-09): id, empresa_id, activo, created_at, created_by, updated_at, updated_by
Únicos por empresa: codigo, codigo_barras

Por decidir:
- PEN-001 · categoria: ¿Categoría es tabla (el cliente agrega las suyas) o lista fija? Recomendado: tabla (CR-03 / CR-04)
- PEN-002 · marca: ¿Marca es tabla o lista fija? Recomendado: tabla (CR-03 / CR-04)
- PEN-003 · unidad: ¿Unidad es tabla o lista fija? Recomendado: tabla (CR-06: tiene atributos propios (abreviatura, clave SAT))

¿Cuáles quitas o cambias? ¿Agregas alguno? (sin respuesta = se quedan todos)

## El dueño: «categoría como tabla»

```
$ cerebro decidir productos categoria tabla
```

Anotado (D-004). Tabla «categorias» creada en el módulo «productos» y agregada a la fila del mundo.

### categorias · módulo productos · propuesta

| # | Campo | Tipo | Oblig. | Por qué |
|---|---|---|---|---|
| 1 | nombre | texto | sí | Lo que se muestra; único para no duplicar categorías (CR-03 / CR-14) |
| 2 | color | texto | no | Chip de color en listados (CR-03) |
| 3 | orden | número entero | no | Orden en que aparece en las listas (CR-03) |
| 4 | es_sistema | sí / no | sí | Los valores iniciales del sistema no se borran (CR-03) |

Técnicos automáticos (CR-16 / CR-09): id, empresa_id, activo, created_at, created_by, updated_at, updated_by
Únicos por empresa: nombre

## El dueño: «marca, lista fija»

```
$ cerebro decidir productos marca lista --valores truper,urrea,generica
```

Anotado (D-005). «marca» queda como lista fija: truper, urrea, generica.

## El dueño: «unidad como tabla»

```
$ cerebro decidir productos unidad tabla
```

Anotado (D-006). Tabla «unidades» creada en el módulo «productos» y agregada a la fila del mundo.

### unidades · módulo productos · propuesta

| # | Campo | Tipo | Oblig. | Por qué |
|---|---|---|---|---|
| 1 | nombre | texto | sí | Nombre visible (Pieza, Kilogramo) (CR-14) |
| 2 | abreviatura | texto | sí | Se muestra junto a cantidades (pz, kg) (CR-06) |
| 3 | permite_decimales | sí / no | sí | Pieza no admite 1.5; kilo sí. Valida cantidades en ventas e inventario (CR-06) |
| 4 | clave_unidad_sat | texto | sí | Obligatoria en cada concepto del CFDI 4.0 (H87 pieza, KGM kilo) (cfdi-mexico) |
| 5 | es_sistema | sí / no | sí | Los valores iniciales del sistema no se borran (CR-03) |

Técnicos automáticos (CR-16 / CR-09): id, empresa_id, activo, created_at, created_by, updated_at, updated_by
Únicos por empresa: nombre

## El dueño: «quita la imagen»

```
$ cerebro quitar productos imagen
```

Anotado (D-007).

### productos · módulo productos · propuesta

| # | Campo | Tipo | Oblig. | Por qué |
|---|---|---|---|---|
| 1 | codigo | texto | sí | Identifica el producto sin ambigüedad (SKU) en ventas, compras e inventario (CR-14) |
| 2 | nombre | texto | sí | Lo que ve el usuario en pantallas y tickets (base) |
| 3 | descripcion | texto largo | no | Detalle para cotizaciones o catálogo (base) |
| 4 | codigo_barras | texto | no | Venta rápida con lector; único para no confundir productos (CR-14) |
| 5 | categoria_id | → categorias | no | Agrupar para reportes y búsqueda (base) |
| 6 | marca | lista: truper, urrea, generica | no | Filtrar y reportar por fabricante (base) |
| 7 | unidad_id | → unidades | sí | Cómo se mide (pieza, kg, litro); necesaria para inventario y factura (base) |
| 8 | precio_venta | dinero | sí | Precio base que se copia a la venta al momento; nunca se lee el precio vivo (CR-10 / CR-12) |
| 9 | costo | dinero | no | Calcular utilidad; se actualiza con las compras (CR-12) |
| 10 | tasa_iva | lista: 16, 8, 0, exento | sí | Impuesto explícito por producto; valores fijos de ley (CR-01 / CR-12) |
| 11 | clave_prod_serv_sat | texto | sí | Obligatoria en cada concepto del CFDI 4.0 (cfdi-mexico) |

Técnicos automáticos (CR-16 / CR-09): id, empresa_id, activo, created_at, created_by, updated_at, updated_by
Únicos por empresa: codigo, codigo_barras

## El dueño: «agrega stock mínimo»

```
$ cerebro agregar productos stock_minimo --tipo cantidad --por-que "Avisar cuándo reordenar"
```

Anotado (D-008).

### productos · módulo productos · propuesta

| # | Campo | Tipo | Oblig. | Por qué |
|---|---|---|---|---|
| 1 | codigo | texto | sí | Identifica el producto sin ambigüedad (SKU) en ventas, compras e inventario (CR-14) |
| 2 | nombre | texto | sí | Lo que ve el usuario en pantallas y tickets (base) |
| 3 | descripcion | texto largo | no | Detalle para cotizaciones o catálogo (base) |
| 4 | codigo_barras | texto | no | Venta rápida con lector; único para no confundir productos (CR-14) |
| 5 | categoria_id | → categorias | no | Agrupar para reportes y búsqueda (base) |
| 6 | marca | lista: truper, urrea, generica | no | Filtrar y reportar por fabricante (base) |
| 7 | unidad_id | → unidades | sí | Cómo se mide (pieza, kg, litro); necesaria para inventario y factura (base) |
| 8 | precio_venta | dinero | sí | Precio base que se copia a la venta al momento; nunca se lee el precio vivo (CR-10 / CR-12) |
| 9 | costo | dinero | no | Calcular utilidad; se actualiza con las compras (CR-12) |
| 10 | tasa_iva | lista: 16, 8, 0, exento | sí | Impuesto explícito por producto; valores fijos de ley (CR-01 / CR-12) |
| 11 | clave_prod_serv_sat | texto | sí | Obligatoria en cada concepto del CFDI 4.0 (cfdi-mexico) |
| 12 | stock_minimo | cantidad | no | Avisar cuándo reordenar (dueño) |

Técnicos automáticos (CR-16 / CR-09): id, empresa_id, activo, created_at, created_by, updated_at, updated_by
Únicos por empresa: codigo, codigo_barras

## Aprobación

```
$ cerebro aprobar categorias
```

✅ categorias aprobada (D-009). Siguen en este mundo: productos, unidades.

```
$ cerebro aprobar unidades
```

✅ unidades aprobada (D-010). Siguen en este mundo: productos.

```
$ cerebro aprobar productos
```

✅ productos aprobada (D-011). Mundo «productos» listo para cerrar-modulo.

```
$ cerebro cerrar-modulo productos
```

🔒 Mundo «productos» cerrado (D-012): productos, categorias, unidades. Siguiente sugerido: «clientes».

## SQL del mundo cerrado

```
$ cerebro migracion productos
```

📄 migraciones/001_productos.sql (24 elementos nuevos)

-- Migración 001_productos · aditiva (sin DROP)
-- Proyecto: Ferretería Demo · generado por cerebro.cjs desde docs/cerebro.json (no editar a mano)
-- Requiere la base fija: public.empresas

begin;

create table if not exists public.categorias (
  id uuid primary key default gen_random_uuid(),
  empresa_id uuid not null references public.empresas(id),
  nombre text not null,
  color text,
  orden integer default 0,
  es_sistema boolean not null default false,
  activo boolean not null default true,
  created_at timestamptz not null default now(),
  created_by uuid,
  updated_at timestamptz,
  updated_by uuid
);
create unique index if not exists ux_categorias_nombre on public.categorias (empresa_id, nombre);
alter table public.categorias enable row level security;
-- Políticas RLS de categorias: generar con la skill rls-multiempresa (no incluidas aquí).

create table if not exists public.unidades (
  id uuid primary key default gen_random_uuid(),
  empresa_id uuid not null references public.empresas(id),
  nombre text not null,
  abreviatura text not null,
  permite_decimales boolean not null default false,
  clave_unidad_sat text not null,
  es_sistema boolean not null default false,
  activo boolean not null default true,
  created_at timestamptz not null default now(),
  created_by uuid,
  updated_at timestamptz,
  updated_by uuid
);
create unique index if not exists ux_unidades_nombre on public.unidades (empresa_id, nombre);
alter table public.unidades enable row level security;
-- Políticas RLS de unidades: generar con la skill rls-multiempresa (no incluidas aquí).

create table if not exists public.productos (
  id uuid primary key default gen_random_uuid(),
  empresa_id uuid not null references public.empresas(id),
  codigo text not null,
  nombre text not null,
  descripcion text,
  codigo_barras text,
  categoria_id uuid references public.categorias(id),
  marca text check (marca in ('truper', 'urrea', 'generica')),
  unidad_id uuid not null references public.unidades(id),
  precio_venta numeric(14,2) not null,
  costo numeric(14,2),
  tasa_iva text not null default '16' check (tasa_iva in ('16', '8', '0', 'exento')),
  clave_prod_serv_sat text not null,
  stock_minimo numeric(14,4),
  activo boolean not null default true,
  created_at timestamptz not null default now(),
  created_by uuid,
  updated_at timestamptz,
  updated_by uuid
);
create unique index if not exists ux_productos_codigo on public.productos (empresa_id, codigo);
create unique index if not exists ux_productos_codigo_barras on public.productos (empresa_id, codigo_barras);
create index if not exists ix_productos_categoria_id on public.productos (categoria_id);
create index if not exists ix_productos_unidad_id on public.productos (unidad_id);
alter table public.productos enable row level security;
-- Políticas RLS de productos: generar con la skill rls-multiempresa (no incluidas aquí).

commit;


## Después: «ocupo manejar lotes»

```
$ cerebro receta lotes
```

## Receta: Control por lotes
Rastrear existencias por lote (y caducidad) desde la compra hasta la venta.

Preguntas (una a la vez):
1. ¿Todos los productos se manejan por lote o solo algunos? — algunos = Solo algunos (se marca en cada producto) (Recomendado) · todos = Todos los productos
2. ¿Los lotes tienen fecha de caducidad? — si = Sí (Recomendado) · no = No
3. ¿Cómo se elige el lote al vender o sacar mercancía? — fefo = Automático: primero el que caduca antes (Recomendado) · fifo = Automático: primero el que entró antes · manual = Lo elige quien vende
4. ¿Se puede sacar más de lo que hay en un lote? — no = No, se bloquea (Recomendado) · si = Sí, queda en negativo

Aplicar: aplicar-receta lotes --resp alcance=algunos,caducidad=si,salida=fefo,negativos=no

## Vista previa del impacto (no guarda)

```
$ cerebro aplicar-receta lotes --resp alcance=algunos,caducidad=si,salida=fefo,negativos=no
```

## Impacto de la receta «Control por lotes»

Respuestas:
- ¿Todos los productos se manejan por lote o solo algunos? → Solo algunos (se marca en cada producto)
- ¿Los lotes tienen fecha de caducidad? → Sí
- ¿Cómo se elige el lote al vender o sacar mercancía? → Automático: primero el que caduca antes
- ¿Se puede sacar más de lo que hay en un lote? → No, se bloquea

Cambios:
+ «productos.maneja_lote» (sí / no, obligatorio)
+ Tabla nueva «lotes» en módulo «productos»: producto_id, numero, fecha_entrada
+ «lotes.fecha_caducidad» (fecha, obligatorio)
🧠 Compromiso: cuando exista «movimiento_inventario» se le agrega «lote» (opcional)
🧠 Compromiso: cuando exista «compra_detalle» se le agrega «lote» (opcional)
🧠 Compromiso: cuando exista «venta_detalle» se le agrega «lote» (opcional)
§ Regla RN-001: Si el producto tiene maneja_lote = sí, el lote es obligatorio en compras, inventario y ventas; se valida en la función SQL, no solo en pantalla.
§ Regla RN-002: Al vender, el sistema asigna el lote con caducidad más próxima que tenga existencia (FEFO).
§ Regla RN-003: No se permite sacar más de la existencia del lote; se bloquea en la función SQL.
§ Regla RN-004: No se venden lotes caducados.

🔓 Módulo «productos» reabierto por cambio en «productos». Vuelve a aprobar y cerrar.

Nada se ha guardado. Para aplicar: aplicar-receta lotes --resp alcance=algunos,caducidad=si,salida=fefo,negativos=no --confirmar

## El dueño aprueba

```
$ cerebro aplicar-receta lotes --resp alcance=algunos,caducidad=si,salida=fefo,negativos=no --confirmar
```

## Impacto de la receta «Control por lotes»

Respuestas:
- ¿Todos los productos se manejan por lote o solo algunos? → Solo algunos (se marca en cada producto)
- ¿Los lotes tienen fecha de caducidad? → Sí
- ¿Cómo se elige el lote al vender o sacar mercancía? → Automático: primero el que caduca antes
- ¿Se puede sacar más de lo que hay en un lote? → No, se bloquea

Cambios:
+ «productos.maneja_lote» (sí / no, obligatorio)
+ Tabla nueva «lotes» en módulo «productos»: producto_id, numero, fecha_entrada
+ «lotes.fecha_caducidad» (fecha, obligatorio)
🧠 Compromiso: cuando exista «movimiento_inventario» se le agrega «lote» (opcional)
🧠 Compromiso: cuando exista «compra_detalle» se le agrega «lote» (opcional)
🧠 Compromiso: cuando exista «venta_detalle» se le agrega «lote» (opcional)
§ Regla RN-001: Si el producto tiene maneja_lote = sí, el lote es obligatorio en compras, inventario y ventas; se valida en la función SQL, no solo en pantalla.
§ Regla RN-002: Al vender, el sistema asigna el lote con caducidad más próxima que tenga existencia (FEFO).
§ Regla RN-003: No se permite sacar más de la existencia del lote; se bloquea en la función SQL.
§ Regla RN-004: No se venden lotes caducados.

🔓 Módulo «productos» reabierto por cambio en «productos». Vuelve a aprobar y cerrar.

✅ Aplicada (D-013). Revisa y aprueba las tablas tocadas.

```
$ cerebro aprobar productos
```

✅ productos aprobada (D-014). Siguen en este mundo: lotes.

```
$ cerebro aprobar lotes
```

✅ lotes aprobada (D-015). Mundo «productos» listo para cerrar-modulo.

```
$ cerebro cerrar-modulo productos
```

🔒 Mundo «productos» cerrado (D-016): productos, categorias, unidades, lotes. Siguiente sugerido: «clientes».

## Migración aditiva de lotes

```
$ cerebro migracion lotes
```

📄 migraciones/002_lotes.sql (6 elementos nuevos)

-- Migración 002_lotes · aditiva (sin DROP)
-- Proyecto: Ferretería Demo · generado por cerebro.cjs desde docs/cerebro.json (no editar a mano)
-- Requiere la base fija: public.empresas

begin;

alter table public.productos add column if not exists maneja_lote boolean not null default false;

create table if not exists public.lotes (
  id uuid primary key default gen_random_uuid(),
  empresa_id uuid not null references public.empresas(id),
  producto_id uuid not null references public.productos(id),
  numero text not null,
  fecha_entrada date not null,
  fecha_caducidad date not null,
  activo boolean not null default true,
  created_at timestamptz not null default now(),
  created_by uuid,
  updated_at timestamptz,
  updated_by uuid
);
create index if not exists ix_lotes_producto_id on public.lotes (producto_id);
create unique index if not exists ux_lotes_producto_id_numero on public.lotes (empresa_id, producto_id, numero);
alter table public.lotes enable row level security;
-- Políticas RLS de lotes: generar con la skill rls-multiempresa (no incluidas aquí).

commit;


## Semanas después, mundo ventas: el cerebro se acuerda del lote

```
$ cerebro tabla-nueva ventas_detalle --entidad venta_detalle --modulo ventas --por-que "Partidas de cada venta"
```

🧠 Se agregó «lote_id» a «ventas_detalle» por compromiso de la receta «lotes».

Anotado (D-017). Tabla sin plantilla en la biblioteca: agrega sus campos uno por uno.

### ventas_detalle · módulo ventas · propuesta

| # | Campo | Tipo | Oblig. | Por qué |
|---|---|---|---|---|
| 1 | lote_id | → lotes | no | Lote vendido; exigido si el producto maneja lote (receta lotes) |

Técnicos automáticos (CR-16 / CR-09): id, empresa_id, activo, created_at, created_by, updated_at, updated_by

## Impacto si se toca productos

```
$ cerebro impacto productos
```

## Impacto de productos

Módulo: productos (cerrado)
Lo usan (referencias entrantes): lotes.producto_id
Depende de: categoria_id → categorias, unidad_id → unidades
Módulos que dependen de «productos»: ventas
Compromisos pendientes del proyecto: movimiento_inventario.lote (receta lotes), compra_detalle.lote (receta lotes)
Reglas relacionadas:
- RN-001: Si el producto tiene maneja_lote = sí, el lote es obligatorio en compras, inventario y ventas; se valida en la función SQL, no solo en pantalla.

ℹ️ El impacto solo incluye relaciones registradas en el cerebro.

