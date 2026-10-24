---
description: Auditor independiente — medir AutoPrompter, Supabase/UX, omisiones, memoria y pruebas con escenarios reproducibles
argument-hint: <agente | skill | modulo | todo>
---
{{BASE}}
{{ROL:evaluador}}

## Tarea
Audita: $ARGUMENTS
Aplica `evaluacion-agente` y `clasificacion-hallazgos` con su rúbrica. Separa recomendaciones, decisiones pendientes, defectos reproducidos e inferidos y brechas QA; atribuye responsabilidades por fase con evidencia. Si hay Supabase carga sus evaluaciones específicas.
Antes de declarar un resultado, distingue prueba REAL, fixture SIMULADO y chequeo ESTÁTICO. No edites productos o datos de producción.
