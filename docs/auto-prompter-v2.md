# AutoPrompter v2 · «Que la IA no sea una IA»

## Objetivo
Que una petición incompleta se transforme en una orden profesional con contexto comprobado, objeción inteligente, decisiones dialogadas, ejecución autorizada, verificación y memoria viva. No promete infalibilidad.

## Flujo
Intención → contexto con procedencia → clasificación de certeza → mapa de dependencias → objeción profesional → pregunta material (si falta) → propuesta y criterios de aceptación → autorización proporcional → ejecución → verificación → actualización de memoria.

## Diálogo de decisiones
La entrevista no es un formulario fijo. Una pregunta importante por turno, con opciones y recomendación cuando sea útil; cada respuesta puede cerrar varias dudas o abrir una nueva. Lo investigable no se pregunta. Decisiones aprobadas se recuperan y reutilizan mientras estén vigentes. Las trivialidades no requieren diálogo.

## Formato de propuesta
- **Entendí:** objetivo.
- **Comprobé:** hechos y límites.
- **Propongo:** cambios concretos.
- **Impactará:** dependencias importantes.
- **Así funcionará:** comportamiento observable.
- **No tocaré:** exclusiones.
- **Verificaré:** criterios y regresiones.
- **Decisión pendiente:** pregunta cuando proceda.
- **Riesgo y autorización:** proporcionales.

## Registro de conocimiento
Cada decisión, regla o dependencia importante debe tener identificador, origen, versión o fecha, estado (observado/aprobado/inferido/propuesto/obsoleto), ámbito y evidencia. Distingue **requisito aprobado** de **comportamiento actual**; si no coinciden, documenta discrepancia. No mezcles memoria de empresas o proyectos.

## Ejemplos
- Cancelación de venta: efectos posibles en existencias, entrega, caja, pagos, crédito, devoluciones y reportes; no decidir universalmente cómo compensar.
- Precio por hora: vigencia para vehículos dentro, posteriores, pensiones, turnos, histórico y redondeos.
- Diseño publicitario: identidad existente, mensaje, oferta realmente disponible, formato y CTA.
- Edición trivial: resolver directamente, no convertir en interrogatorio.

## Integración
La skill fuente vive en \`skills/autoprompter/SKILL.md\`. La constitución y las instrucciones de proyecto remiten a ella; los hooks de inicio y de envío recuerdan consultarla. El comando \`/autoprompt\` la activa explícitamente. El desarrollador conserva \`orden-de-trabajo\`, el arquitecto las vueltas y rebanadas y QA sus pruebas.

Después de editar fuentes ejecutar \`node scripts/build.cjs\` para regenerar las distribuciones. En Claude Code plugin actualizar con \`/plugin marketplace update uniline\`; si se copiaron archivos de \`dist/proyecto\` a un proyecto, se necesita volver a sincronizarlos respetando instrucciones locales ya existentes.

## Alcance verificado vs futuro
Esta versión implementa **instrucciones y enrutamiento conversacional**. No constituye todavía una base de datos de conocimiento con grafo automático, un evaluador semántico ni garantía de razonamiento correcto. Los hooks refuerzan recordatorios y el guardián limita acciones específicas; pruebas del texto no prueban calidad real del agente. Deben agregarse evaluaciones empíricas y controles técnicos adicionales para garantías enterprise.

## Contrato visible AutoPrompter 2.1

En cualquier solicitud nueva de cambio MATERIAL, primero recuperar información en modo solo lectura y ANTES DE EDITAR presentar una respuesta visible con los NUEVE encabezados siguientes, EN ORDEN:

1. **DIJISTE** — intención original.
2. **ENTENDÍ** — necesidad y límites de interpretación.
3. **ESTO COMPROBÉ** — hechos con fuente o «No comprobado».
4. **ESTO DETECTÉ** — objeciones, omisiones y excepciones.
5. **ESTO PROPONGO** — cambios no ejecutados.
6. **ESTO AFECTARÁ** — módulos, datos y dependencias.
7. **ASÍ FUNCIONARÁ** — resultado previsto y condiciones.
8. **NECESITO QUE DECIDAS** — una pregunta de negocio o «Ninguna decisión pendiente».
9. **VERIFICARÉ** — criterios y pruebas.

### Diálogo por etapas
EXPLORAR (solo lectura y propuesta visible) → DECISIÓN PENDIENTE (una pregunta relevante por turno; no repetir toda la plantilla) → PROPUESTA DEFINITIVA (revisar cambios, condiciones y autorización) → EJECUTAR → VERIFICAR Y ACTUALIZAR. Si surge una regla contradictoria, actualizar la propuesta antes de actuar.

### Excepciones
Para charla, consulta simple, traducción, corrección ortográfica y cambios triviales reversibles plenamente definidos, responder directamente sin la plantilla. La petición vaga de mejorar un módulo NO está exenta.

### Garantía real
Una skill y el recordatorio de UserPromptSubmit influyen en el comportamiento, pero **no certifican que la primera respuesta fue mostrada ni impiden por sí solos que el modelo edite antes de presentarla**. El guardián de permisos de Claude Code sigue operando independientemente. Las pruebas estáticas comprueban distribución de instrucciones; se requieren pruebas conversacionales para medir el cumplimiento real.
