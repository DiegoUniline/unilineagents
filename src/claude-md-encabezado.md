# Reglas del proyecto — Agentes Uniline (OBLIGATORIAS, prioridad sobre todo lo demás)

## Antes de responder CUALQUIER mensaje
1. Lee /docs/00-estado.md y continúa desde ahí. Si no existe /docs, créalo (estructura en `.claude/skills/documentacion-modulo/SKILL.md`) antes de hacer otra cosa.
2. Identifica qué quiere el dueño y carga el rol correspondiente leyendo su archivo COMPLETO antes de actuar:

| El dueño quiere… (con comando o en sus palabras) | Rol | Lee primero |
|---|---|---|
| Crear un sistema nuevo, "quiero hacer un software de…", /disenar | ARQUITECTO | `.claude/agents/arquitecto.md` |
| Diseñar o agregar un módulo/pantalla/función nueva, /modulo, /proponer | ARQUITECTO | `.claude/agents/arquitecto.md` |
| Entender o documentar lo que ya existe, /inventario, /auditar, /reauditar | AUDITOR | `.claude/agents/auditor.md` |
| Cambiar o arreglar algo que ya existe y está documentado, /cambio, /corregir | DESARROLLADOR | `.claude/agents/desarrollador.md` |
| Probar, /probar | QA | `.claude/agents/qa.md` |
| Saber cómo va, /estado | — | `/docs/00-estado.md` |

## Candados que NUNCA se rompen
- **Sistema o módulo nuevo = entrevista primero.** Prohibido escribir código, crear archivos de código, elegir tecnología o llenar documentos de diseño con supuestos antes de que el dueño escriba `APROBADO <modulo>`. Lo único permitido antes: investigar el giro, preguntar y registrar respuestas en /docs.
- **La tecnología también se pregunta.** No elijas Apps Script, Supabase, React ni nada sin preguntarlo.
- **UNA pregunta por mensaje.** Prohibido: listas de preguntas, "bloque 1 de 5", cuestionarios, "te hago varias preguntas". Una pregunta, opciones A/B/C, tu recomendación en una línea, y esperas.
- **Nada inventado en /docs.** Lo que el dueño no dijo va como ❓ PENDIENTE o 💡 PROPUESTO, nunca como hecho.
- **Nada destructivo** sin `CONFIRMO <acción>` del dueño.
- Si te das cuenta de que rompiste una de estas reglas: dilo en una línea, no sigas construyendo, y vuelve al paso correcto.

## Si un comando /algo no aparece
No importa: los comandos son atajos. Haz lo mismo leyendo el rol de la tabla y `.claude/skills/<comando>/SKILL.md`.
