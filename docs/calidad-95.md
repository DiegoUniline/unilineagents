# Uniline Agents — Estándar de calidad 9.5/10 (objetivo, no puntuación actual)

## Clasificación justa antes de cualquier calificación
La skill `clasificacion-hallazgos` distingue defectos reproducidos, inferencias, riesgos de diseño, decisiones de negocio pendientes, recomendaciones, brechas de prueba y desviaciones de proceso. El auditor atribuye responsabilidad a arquitectura/desarrollo/QA/auditoría/negocio **según causa y evidencia**. No resta puntos por una preferencia técnica o comercial válida aún por decidir. No descuenta dos veces el mismo defecto dentro de una dimensión. Vulnerabilidad reproducida conserva bloqueo aunque exista una decisión comercial pendiente. Las evaluaciones numéricas necesitan rúbrica previa y evidencia; meta ≥95 no se impone por decreto.


## Diferenciar cuatro resultados
1. **Integración documental**: la skill existe y se distribuye.
2. **Ejecución de controles**: hooks/pruebas de integridad pasan en una máquina.
3. **Evaluación con un modelo real**: el agente respondió a fixtures y un auditor revisó trazas/artefactos.
4. **Resultado de producto**: la app está operativamente correcta, accesible y fue probada en entornos reales o representativos.

Un pase de CI solo prueba los primeros dos. **No significa que el agente ya valga 9.5/10.**

## Dimensiones de evaluación obligatorias
- Contexto e interpretación de requisitos.
- Especialización/arquitectura de agentes.
- Arquitectura de datos y Supabase cuando aplique.
- UX/UI de SaaS.
- Experiencia móvil.
- Seguridad y autorizaciones.
- Memoria, dependencias y continuidad.
- Eficiencia real de tokens/tiempo (si hay datos de proveedor).
- Calidad de evaluación y verificaciones.

Para una disciplina no aplicable a la tarea individual, el expediente del sistema puede usar un escenario separado; no inventar puntuación al omitirla.

## Regla de aprobación
El objetivo de excelencia es **mínimo 95/100 en cada dimensión**, cobertura de pruebas planificadas 100% para la versión del expediente, evidencias trazables realmente observadas y **ningún bloqueo crítico**. No promediar una dimensión de 100 con otra de 60 para afirmar 9.5 global. Sin datos reales: «NO EVALUADA». El gate valida el expediente, NO comprueba la veracidad de los enlaces; el auditor verifica las fuentes.

## Flujo de evaluación
1. Preparar escenarios y criterios antes de conocer resultados.
2. Fijar versión/commit, modelo/configuración, herramientas y fixtures.
3. Ejecutar los mismos casos en versión A y B, capturando trazas, outputs, cambios y tokens reales si hay observabilidad.
4. Auditor independiente verifica los criterios, descubre contradicciones y documenta incertidumbre.
5. Registrar reporte JSON. Ejecutar `node scripts/quality-gate.cjs ruta/reporte.json`.
6. Corregir, repetir, revisar regresiones. Publicar el resultado numérico solo cuando haya cobertura y evidencias suficientes.

## Riesgos que bloquean aprobación
- Fuga de datos entre empresas o permiso incorrecto.
- Pérdida de inventario/pagos/saldos por regresión.
- Declarar pruebas o despliegues inexistentes.
- UI móvil que oculte acciones o datos esenciales.
- Falta de verificación crítica exigida por el alcance.
- Repetición idempotente insegura de pagos/operaciones.
- Medición inventada de latencia, costo o tokens.

## Formato esperado de informe
`schemaVersion: 1`, `project`, `revision`, `evaluatedAt`, `areas` con id, `score` numérico 0-100, `casesRun`, `casesPlanned`, `evidence` con al menos `type: "observed"` y `ref` por dimensión, `blockingFailures` por área; `globalBlockingFailures`.
No registrar log ni token de acceso en el expediente.

## Cómo demostrar ahorro de contexto
Medir tokens (input, output, cache read/write si el proveedor los expone), calidad final, latencia, número de intentos y coste hasta completar la misma tarea. Reducir caracteres de CLAUDE.md no demuestra automáticamente ahorro facturable.

## Memoria de errores con regresiones ejecutables
La skill `aprendizaje-verificable` añade `calidad/aprendizajes.json` y obliga a registrar incidentes reales en `docs/incidentes/INC-XXX.md` con causa, evidencia anterior, prueba de regresión y revisor. `calidad/verificar-entrega.cjs` ejecuta escenarios de aplicación y cruza los incidentes resueltos con los casos exitosos; defectos críticos/altos abiertos bloquean entrega. Que el registro esté vacío no demuestra que la app carece de fallos: auditor y QA deben investigar activamente. Ni el gate estructural ni las puntuaciones 95 sustituyen escenarios reales y revisión independiente.
