# uniline-agents (privado)

## Subir a GitHub (una vez)
```bash
(ya creado: github.com/DiegoUniline/unilineagents)
```

## Claude Code web / app (sin plugins)
Copiar `dist/proyecto/.claude/` y `dist/proyecto/AGENTS.md` a la raíz del repo del proyecto. Claude Code los carga solo al abrirlo.

## Claude Code
```
/plugin marketplace add DiegoUniline/unilineagents
/plugin install uniline-agents@uniline
```
Actualizar: `/plugin marketplace update uniline`

| Comando | Agente |
|---|---|
| `/iniciar` | prepara /docs y CLAUDE.md |
| `/disenar <sistema>` · `/modulo <m>` · `/proponer <m>` · `APROBADO <m>` | arquitecto |
| `/inventario` · `/auditar <m>` · `/reauditar` | auditor |
| `/cambio <qué>` · `/corregir <bug>` | desarrollador |
| `/probar <m\|todo>` | qa |
| `/respuestas P-001: A, …` · `/estado` | todos |

## Claude.ai
Settings → Capabilities → Skills: subir cada zip de `dist/claude-ai/zips/`.
Proyecto → Instrucciones: pegar `dist/claude-ai/instrucciones-proyecto.md`.

## ChatGPT
GPT personalizado → Instrucciones: `dist/chatgpt/instrucciones.md` · Conocimiento: `dist/chatgpt/uniline-conocimiento.md`.

## Lovable
Project settings → Knowledge: `dist/lovable/knowledge.md`. Copiar `dist/AGENTS.md` a la raíz del repo.

## Codex · Cursor · Gemini CLI · Windsurf
Copiar `dist/AGENTS.md` a la raíz del proyecto.

## Método completo
Ver `docs/metodo-uniline.md` (22 pasos: qué hace el agente, qué te pide y qué obtienes).

## Editar los agentes
Editar `core/`, `skills/`, `src/` → `node scripts/build.cjs` → `node scripts/test-guardian.cjs` → commit + push.


## AutoPrompter v2 · «Que la IA no sea una IA»

Skill transversal: `skills/autoprompter/SKILL.md`; comando: `/autoprompt <solicitud>`. Antes de construir comprueba contexto, objeta omisiones, identifica dependencias y dialoga decisiones materiales; después verifica y actualiza memoria. No interroga por tareas triviales.

- Detalle: `docs/auto-prompter-v2.md`.
- Prueba documental: `node scripts/test-autoprompter.cjs`.
- Para regenerar distribuciones: `node scripts/build.cjs`.
- Claude Code plugin: `/plugin marketplace update uniline`.
- En proyectos con `.claude/` copiada desde `dist/proyecto`, es necesario sincronizar los nuevos archivos, conservando instrucciones locales.


### Contrato visible AutoPrompter 2.1
Para toda solicitud nueva MATERIAL, la PRIMERA RESPUESTA VISIBLE antes de editar deberá mostrar: DIJISTE, ENTENDÍ, ESTO COMPROBÉ, ESTO DETECTÉ, ESTO PROPONGO, ESTO AFECTARÁ, ASÍ FUNCIONARÁ, NECESITO QUE DECIDAS y VERIFICARÉ. Después, seguir las decisiones pendientes sin repetir toda la plantilla. Consulta el contrato en `skills/autoprompter/SKILL.md`; no constituye una garantía determinista de cumplimiento.

## Uniline Agents v3 — conversación natural y UX/UI SaaS

- **AutoPrompter v3:** analiza internamente, explica lo necesario y adapta la profundidad al riesgo; nueve apartados ya NO son obligatorios en el diálogo.
- **ux-ui-jerarquia-saas:** dirección visual, jerarquía operativa, tokens y componentes existentes, modo claro/oscuro, responsive y WCAG 2.2. No reemplaza `sistema-diseno` de cada proyecto.
- **contexto-eficiente:** recuperación progresiva, menos lecturas duplicadas y uso selectivo de skills.
- **continuidad-proyecto:** checkpoint versionado de decisiones, pruebas y dependencias entre sesiones.
- **evaluacion-agente:** escenarios y métricas para medir comportamiento con Claude real.

Para sincronizar salidas de Claude Code, Claude.ai, ChatGPT y otras plataformas, ejecutar `node scripts/build.cjs`; validar con `node scripts/test-autoprompter.cjs` y `node scripts/test-guardian.cjs`. En proyectos que copiaron `.claude`, sincronizar esa carpeta sin borrar reglas particulares. El plugin instalado puede requerir actualización y una sesión nueva.

Los documentos principales se mantienen por proyecto; las skills se cargan bajo demanda. Las pruebas de presencia no demuestran calidad UX real ni ahorro de tokens medido.

## Supabase SaaS Enterprise y Auditor de Evaluación

La skill `skills/supabase-saas-enterprise/SKILL.md` especializa a los agentes en PostgreSQL, Auth, RLS, Data API/RPC, Realtime, caché, concurrencia, Edge Functions, Storage, operaciones, migraciones, backups, colas, POS y procesos empresariales. **Reutiliza la skill oficial** `supabase` y los módulos especializados existentes; las referencias se leen bajo demanda para ahorrar contexto.

El rol `evaluador` y el comando `/evaluar <agente|skill|módulo>` auditan resultados reales, omisiones, suposiciones, continuidad, eficiencia y pruebas. Siempre distinguen tests estáticos, simulaciones y evaluaciones ejecutadas con el modelo.

Actualización de paquetes: `node scripts/build.cjs`; pruebas `node scripts/test-supabase-enterprise.cjs` y `node scripts/test-guardian.cjs`. No modifica esquemas, datos ni aplicaciones de clientes.

## Mobile UX Architect y objetivo de calidad 9.5/10

- `mobile-ux-architect`: experiencia táctil empresarial, textos completos, listas compactas, teclado, safe area, responsive, claros/oscuros y accesibilidad, sin afectar el escritorio ni reglas de negocio.
- `evaluacion-ux-movil`: rúbrica 100 puntos por pantalla, con evidencia/cobertura y bloqueos; jamás puntuar 100 por defecto.
- `/calidad`: auditor independiente para comprobar las áreas de Uniline Agents y preparar un expediente de pruebas.
- `continuidad-proyecto/references/checkpoint-esquema.md`: memoria versionada de reglas y dependencias.
- `node scripts/quality-gate.cjs reporte.json`: validador de evidencia y cobertura; no evalúa por sí solo Claude ni autentica las fuentes externas.
- `node scripts/test-quality-gate.cjs`: pruebas unitarias sobre expedientes SIMULADOS.

El objetivo de 95/100 por competencia **requiere evaluaciones reales** con resultados observables; las pruebas de CI sólo validan integración y reglas técnicas. Ver `docs/calidad-95.md`.
