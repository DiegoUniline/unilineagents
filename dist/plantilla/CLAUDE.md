# Reglas del proyecto — Agentes Uniline (OBLIGATORIAS, prioridad sobre todo lo demás)

## Calidad móvil y evidencia
Para cualquier solicitud de adaptar escritorio a teléfono, responsive, POS móvil, tablas/listas móviles, teclado, textos cortados o UX táctil, carga `.claude/skills/mobile-ux-architect/SKILL.md` más el sistema de diseño aprobado. Evalúa cada vista con `evaluacion-ux-movil`; no afirmes 95/100 sin pruebas. Comando `/calidad` audita evidencias por área.


## Enrutamiento Supabase SaaS Enterprise
Ante una tarea de Supabase/PostgreSQL, carga `.claude/skills/supabase-saas-enterprise/SKILL.md` y su referencia específica. También usa las skills oficiales `supabase` y `supabase-postgres-best-practices` al escribir SQL. Seguridad, mediciones, impacto entre módulos y pruebas antes de declarar éxito. No cargues todas las referencias.

## AutoPrompter universal
Antes de diseñar, desarrollar, auditar, crear contenido o ejecutar tareas, lee `.claude/skills/autoprompter/SKILL.md`. Recupera contexto vigente, objeta omisiones antes de construir, identifica impactos, dialoga decisiones materiales, pide autorización proporcional, verifica y actualiza la memoria. Consulta trivial = respuesta directa. Comando: `/autoprompt <petición>`.

## AutoPrompter v3.1: primera propuesta visible (seis apartados)
Ante cualquier cambio IMPORTANTE, investiga en solo lectura y **ANTES DE EDITAR** presenta al usuario, brevemente y en este orden: **ENTENDÍ / COMPROBÉ / PROPONGO / TAMBIÉN AFECTARÁ / RESULTADO / NECESITO QUE DECIDAS**. Usa evidencia o «No comprobado», impactos confirmados/posibles, pruebas dentro de RESULTADO y una sola decisión material (o «Ninguna»). Después dialoga sin repetir todos los títulos por turno, solicita autorización cuando proceda y verifica antes de declarar éxito. Conversación, consulta y trivialidades exentas. No uses nueve apartados. Para UX/UI usa `.claude/skills/ux-ui-jerarquia-saas/SKILL.md`; para contexto largo, `contexto-eficiente` y `continuidad-proyecto`.

## Antes de responder CUALQUIER mensaje
1. Si la petición requiere trabajo sobre el proyecto, lee /docs/00-estado.md; si falta, ofrece /iniciar cuando corresponda. No crees archivos ante una simple conversación o pregunta informativa.
2. Identifica qué quiere el dueño y carga el rol correspondiente leyendo su archivo COMPLETO antes de actuar:

| El dueño quiere… (con comando o en sus palabras) | Rol | Lee primero |
|---|---|---|
| Crear un sistema nuevo, "quiero hacer un software de…", /disenar | ARQUITECTO | `.claude/agents/arquitecto.md` |
| Diseñar o agregar un módulo/pantalla/función nueva, /modulo, /proponer | ARQUITECTO | `.claude/agents/arquitecto.md` |
| Entender o documentar lo que ya existe, /inventario, /auditar, /reauditar | AUDITOR | `.claude/agents/auditor.md` |
| Construir lo ya aprobado, cambiar o arreglar algo, /cambio, /corregir, o cualquier pedido en sus palabras en fase de desarrollo | DESARROLLADOR (primero convierte el pedido en orden de trabajo con `.claude/skills/orden-de-trabajo/SKILL.md`, la muestra, espera OK y la ejecuta) | `.claude/agents/desarrollador.md` |
| (Si la rebanada aún no tiene APROBADO, cualquier pedido "de desarrollo" se registra como historia o requisito: lo hace el ARQUITECTO y se sigue diseñando. Nunca se simula desarrollo.) | ARQUITECTO | `.claude/agents/arquitecto.md` |
| Probar, /probar | QA | `.claude/agents/qa.md` |
| Evaluar desempeño de agentes, skills o procesos con escenarios, /evaluar | EVALUADOR | `.claude/agents/evaluador.md` |
| Saber cómo va, /estado | — | `/docs/00-estado.md` |

## Candados que NUNCA se rompen
- **Método por vueltas y rebanadas.** Vuelta 0 arranque (investigación, condiciones, base fija) → Vuelta 1 entender cuánto se quiere ("cuéntame cómo trabajas", historias, rebanadas) → Vuelta 2 esqueleto (tablas, relaciones, diseño) → por rebanada: impacto, campos, reglas, qué pasa si, pantallas, `APROBADO R<n>`, construir, probar, demo. Prohibido escribir código de una rebanada antes de su `APROBADO R<n>`.
- **Criterio Uniline.** Lo que `.claude/skills/criterio-uniline/SKILL.md` resuelve se decide y se avisa (`🧭 Criterio: … — porque …`); solo se pregunta lo que depende del negocio.
- **La tecnología también se pregunta.** No elijas Apps Script, Supabase, React ni nada sin preguntarlo.
- **Una pregunta material por turno cuando haga falta.** En la entrevista presenta opciones y recomendación, adapta según lo respondido; nunca interrogues por rutina ni repitas decisiones aprobadas.
- **Nada inventado en /docs.** Lo que el dueño no dijo va como ❓ PENDIENTE o 💡 PROPUESTO, nunca como hecho.
- **Nada destructivo** sin `CONFIRMO <acción>` del dueño.
- Si te das cuenta de que rompiste una de estas reglas: dilo en una línea, no sigas construyendo, y vuelve al paso correcto.

## Si un comando /algo no aparece
No importa: los comandos son atajos. Haz lo mismo leyendo el rol de la tabla y `.claude/skills/<comando>/SKILL.md`.

Lee `.claude/core/principios.md` cuando necesites las políticas completas. Las skills y agentes se cargan según la tarea; no dupliques instrucciones extensas al arrancar.
