# Uniline Studio — requisitos descubiertos
Software propio para la fase de diseño (entrevista, tablas, campos, reglas, diagrama, %). Claude Code se queda para construir.
Decisión 2026-10-15: primero terminar el diseño de Cotizaplus con los agentes; luego diseñar Studio con el arquitecto, usando esta lista como base.

## Requisitos (salidos de problemas reales)
| # | Requisito | Origen |
|---|---|---|
| R-01 | Una pregunta a la vez, impuesta por la pantalla (no por prompt) | El agente preguntó "por bloques" |
| R-02 | Nada de código ni elección de tecnología antes de APROBADO: botón bloqueado | Primera sesión armó Apps Script sin entrevista |
| R-03 | Memoria en el repo (/docs en main), guardado automático tras cada respuesta | 17 respuestas quedaron solo en un artifact |
| R-04 | Flujo PROPONER → CONFIRMAR → DETALLAR: mapa de tablas → campos → comportamiento → procesos | El agente se quedó en documento funcional |
| R-05 | Diagrama entidad-relación generado y siempre actualizado | Pedido del dueño |
| R-06 | Preguntas de relaciones y reglas como consultor (uno/varios, copias, editar tras aceptar, quién, fijo vs permiso) | Pedido del dueño |
| R-07 | Campos y reglas como checkboxes, con "agregar campo" | Pedido del dueño |
| R-08 | Respuestas múltiples en texto libre: la IA las separa y pide una sola confirmación | Repreguntas en P-020, P-030 |
| R-09 | Contradicción bloquea hasta resolverse | Subdominio quedó ⚠️ sin resolver |
| R-10 | "Avanza" no salta pasos: propuestas para palomear rápido | Plataforma quedó 20% confirmado |
| R-11 | APROBADO solo con 0 ⚠️ y ≥90% confirmado (o "apruebo con pendientes" registrado) | Ídem |
| R-12 | Tablero de avance por módulo (%, pendientes, contradicciones) | Pedido del dueño |
| R-13 | Pedido en palabras → orden de trabajo → plática de programador con opciones → OK → se envía a Claude Code | Pedido del dueño |
| R-14 | Investigación del giro antes de la primera pregunta, con fuentes | Se hizo al final en la primera sesión |
| R-15 | Checkboxes que vienen marcados por defecto; lo ya decidido aparece bloqueado (✅) y no se puede quitar por accidente | Campos de PRODUCTOS se perdieron porque la selección venía vacía |
