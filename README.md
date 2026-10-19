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
