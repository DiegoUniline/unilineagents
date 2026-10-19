# Especialización Supabase SaaS Enterprise en Uniline Agents

Actualización orientada a conocimientos y agentes. **No modifica bases de datos, proyectos Supabase ni aplicaciones de clientes.**

## Lo que ya existía
Las skills `supabase` (oficial), `supabase-postgres-best-practices`, `modelado-supabase`, `rls-multiempresa`, `rendimiento-escalabilidad`, `migraciones-seguras`, `que-pasa-si` y `verificacion`. Se conservan para evitar duplicación.

## Nueva especialización
`skills/supabase-saas-enterprise/SKILL.md`: agente coordinador que orienta al especialista hacia archivos de referencia que sólo carga cuando se necesiten.

| Cobertura | Archivo |
|---|---|
| PostgreSQL, modelos, APIs/RPC, transacciones, multitenancy, escala | references/arquitectura-datos.md |
| Consultas, Realtime, caché, observabilidad | references/rendimiento-realtime.md |
| Auth, RLS, Storage, Edge Functions, pruebas de permisos | references/seguridad-acceso.md |
| CLI, migraciones, entornos, backups, cron/queues, escalado | references/operacion-entrega.md |
| POS, ventas, caja, devoluciones, inventario, offline, hotel/RH/rutas | references/flujos-empresariales.md |
| Cinco evaluaciones de la disciplina | references/evaluaciones.md |

## Auditor independiente de evaluaciones
Rol `evaluador` y comando `/evaluar` para comprobar si un agente realmente aplica instrucciones de forma correcta. Vinculado con `evaluacion-agente` y pruebas específicas de Supabase. Reporta separación clara de validación estática, simulada y real.

## Principios
- Distinguir código observado de operaciones medidas en producción.
- Consultar documentos/changelog oficial y versión real antes de recomendar.
- Evitar `SELECT *`, N+1, polling y recargas masivas si son innecesarios, sin romper consistencia.
- RLS + GRANT + aislamiento tenant y permisos: probar allow/deny; no usar `service_role` en frontend.
- Transacciones, concurrencia, idempotencia y reconciliación en operaciones críticas.
- No optimizar sin línea base, ni asumir que todo es offline.
- Proteger migraciones/producción, backups/restauración y cambios destructivos.

## Seguridad y alcance
Todos los cambios son de instrucciones, skills, comandos o tests dentro de Uniline Agents. No ejecutar ninguna acción SQL, migración remota, cambio de RLS o desplegar apps de negocio para instalar la especialización.

## Pruebas
`node scripts/build.cjs`, `node scripts/test-guardian.cjs`, `node scripts/test-autoprompter.cjs` y prueba nueva `node scripts/test-supabase-enterprise.cjs`.
Las pruebas estáticas demuestran que los archivos están completos/distribuidos. No pueden demostrar que el modelo sea experto; eso requiere ensayos ejecutados con Claude y evaluación humana.

## Fuentes de referencia
https://supabase.com/docs
https://supabase.com/changelog
https://www.postgresql.org/docs/
