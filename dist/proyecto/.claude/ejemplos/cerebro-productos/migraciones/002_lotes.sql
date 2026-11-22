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
