# INC-001 — ejemplo ficticio, NO es un defecto probado de ningún proyecto

Este archivo es una REFERENCIA de formato. Nunca registrarlo como incidente real sin evidencia propia.

## Síntoma y contexto
Una operación concurrente hipotética excedió un saldo disponible. Identificar fecha, ambiente, actor, documento, revisión de código y precondiciones.

## Causa
Determinar causa de implementación, política no definida y ausencia de pruebas sin atribuir culpas automáticas. Referencias exactas a código y decisiones.

## Impactos
Módulos consumidores y relaciones inversas verificadas. No inventar dependencias.

## Reproducción anterior a la corrección
Documentar entrada, identidad, pasos, resultado observado, resultado esperado y evidencia del fallo anterior (ej. `docs/incidentes/pruebas/INC-001-red.md`). No documentar secretos ni datos de clientes.

## Corrección
Citar revisión versionada, archivos cambiados, invariantes y autorización. Corregir sin suprimir controles de seguridad.

## Verificación
Indicar ID del caso en `calidad/escenarios.json`, prueba real contra API/BD aislada, evidencia emitida en `artifacts/calidad/entrega.json`, riesgos no verificados y firma del revisor independiente.

## Aprendizaje reutilizable
Registrar la regla *generalizable* con alcance y cuándo recuperar la relación en `docs/contexto/relaciones.json`. No repetir el contenido de todo el módulo; enlazar a fuente vigente.
