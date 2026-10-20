---
description: Informe independiente de calidad 9.5 por competencia basado en evidencias; no entrega puntuaciones inventadas
argument-hint: <proyecto | agente | módulo | todo>
---
{{BASE}}
{{ROL:evaluador}}

Evalúa el alcance solicitado: $ARGUMENTS
Carga `evaluacion-agente` y para móvil `evaluacion-ux-movil`; para memoria `continuidad-proyecto`. Consulta `docs/calidad-95.md` si está disponible.
Prepara escenarios reproducibles, identifica evidencias reales y bloqueos. Distingue tests estáticos, simulaciones y evaluaciones con Claude/app real. NO autocalifiques 9.5 por tener skills. Si faltan pruebas, estado NO EVALUADA y plan concreto. Un expediente documentado puede validarse con `node scripts/quality-gate.cjs ruta/reporte.json` sin tocar producción.
