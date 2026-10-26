# Control de entrega de la aplicación

Ejecutar `node calidad/verificar-entrega.cjs` desde la raíz, en un checkout limpio. El workflow `Uniline quality` ejecuta este comando en cada pull request y push a main. La plantilla SIN aplicación debe fallar con «prueba sin conectar»; no es una certificación ni se omite el control para mostrar verde.

## Conectar el proyecto
1. Arquitecto/QA revisan `escenarios.json`: adaptar entradas y resultados esperados a las decisiones aprobadas. Mantener los IDs base; agregar escenarios propios. Para un caso ajeno al alcance, usar `applicable: false` con `exception: {reason, decisionFile}` y una decisión versionada. No usar excepciones para pruebas pendientes. Permisos, aislamiento y persistencia son críticos cuando el cambio los afecta.
2. Implementar adaptadores `.cjs` por escenario, usando la aplicación y una base/entorno de pruebas aislado. El proceso recibe JSON por stdin `{id,input,revision}`. Ejecutar las acciones reales, consultar resultados persistidos y emitir SOLO JSON por stdout: `{kind:"application-observation",actual:...,evidence:["artifacts/calidad/caso.log"]}`. Enviar diagnóstico a stderr, devolver código no cero si hay fallo. La evidencia debe ser archivos reales no vacíos creados en esa ejecución; el ejecutor conserva una copia por caso dentro del artefacto de CI, sin secretos/datos personales; `actual` debe tener la misma estructura que `expected`.
3. Instalar dependencias y preparar servicios de prueba en el workflow antes del control. No usar credenciales productivas. Para PRs externos sin credenciales, documentar el bloqueo; nunca ejecutar código no confiable con secretos mediante `pull_request_target`.
4. QA mantiene expectativas fuera de los adaptadores. Auditor revisa que los adaptadores consultan la aplicación y no devuelven constantes, mocks o resultados copiados del esperado. Los fixtures del validador no cuentan como pruebas del producto.
5. Versionar configuración, adaptadores y decisiones antes de ejecutar; el ejecutor compara sus bytes contra la revisión Git, incluso si están en rutas ignoradas. `artifacts/` se ignora; el informe guarda revisión, tiempos y hashes de configuración, adaptadores y evidencia. La ejecución es nueva cada vez; no se acepta cargar un informe viejo como aprobación.
6. Añadir checks de build/tipos/lint propios del stack y condiciones de fallo. No cambiar expectativas para esconder defectos.

El ejecutor falla ante configuración ausente, caso faltante/duplicado, excepción incompleta, prueba desconectada, error, timeout, evidencia vacía, observación diferente o ninguna prueba ejecutada. No puede probar por sí mismo que un adaptador dice la verdad: requiere revisión independiente y acceso a evidencia. Una prueba pasada cubre sus condiciones, no todos los posibles fallos.

## Bloqueo efectivo de entrega
El workflow genera un check fallido cuando el control falla. Para impedir merges, configurar en GitHub un ruleset/protección para main que exija `application-delivery`, sin bypass ordinario. Para impedir despliegues, hacer que el job de despliegue dependa de ese job con `needs`, o exigir el mismo control en el proveedor. Un archivo workflow NO configura protección de rama ni controla despliegues externos automáticamente. Revisar también permisos de push directo.

El repositorio de agentes tiene su propio check `package-verification`; comprueba el paquete, nunca la calidad de una aplicación. No sustituir `application-delivery` por ese check.

## Incidentes con regresión obligatoria
El proyecto trae `calidad/aprendizajes.json` vacío y `calidad/validar-aprendizajes.cjs`. Cuando se identifica un defecto, registrar `INC-XXX` y su causa en `docs/incidentes/INC-XXX.md`. Al corregirlo, no marcar `verified` hasta aportar prueba de reproducción anterior al arreglo, referencia del escenario/adaptador real en `calidad/escenarios.json`, evidencia nueva de ejecución y revisión independiente. La ejecución principal `node calidad/verificar-entrega.cjs` cruza automáticamente esas pruebas con el registro y falla si hay defectos altos/críticos abiertos o correcciones sin regresión.

**No equivale a detectar todos los errores:** el registro es declarativo y puede omitir incidentes; QA y auditoría deben buscar fallos fuera de él. Tampoco prueba que los adaptadores consulten la aplicación real: auditoría independiente continúa siendo necesaria. Mantener expectativas y pruebas separadas del desarrollador, sin relajar el caso para que pase. Ver `calidad/ejemplo-incidente.md` para formato y `.claude/skills/aprendizaje-verificable/references/registro.md`.

## Incidentes y aprendizaje
Cada incidente importante debe dejar en `docs/incidentes/` fecha, revisión afectada, reproducción, causa, alcance, corrección, caso de regresión y evidencia de verificación. Revisar otros consumidores del mismo patrón. Registrar la decisión y actualizar `docs/00-estado.md`. Reejecutar el caso antes de cerrar. Una nota de chat no es memoria duradera.

El revisor debe recuperar requisitos y comprobar resultados por su cuenta, sin tomar la conclusión del desarrollador como prueba. Para continuidad, una sesión nueva retoma decisiones versionadas y explica el siguiente paso sin inventar hechos. Para recuperación, restaurar datos ficticios en un destino aislado y comprobarlos: tener un archivo de backup no basta.

Medir por revisión: escenarios ejecutados/fallidos/omitidos con motivo, defectos escapados, incidentes repetidos e intervenciones necesarias del dueño. No inventar métricas; conservar resultados y comparar condiciones equivalentes.
