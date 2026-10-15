# uniline-agents (privado)

## Subir a GitHub (una vez)
```bash
gh repo create uniline-agents --private --source . --push
```

## Claude Code
```
/plugin marketplace add TU_USUARIO/uniline-agents
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

## Editar los agentes
Editar `core/`, `skills/`, `src/` → `node scripts/build.cjs` → `node scripts/test-guardian.cjs` → commit + push.
