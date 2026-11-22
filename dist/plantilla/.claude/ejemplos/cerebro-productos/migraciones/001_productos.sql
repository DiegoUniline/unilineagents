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
