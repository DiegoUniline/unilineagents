# AutoPrompter v3 — «Que la IA no sea una IA»

## Filosofía
El usuario describe su intención; el agente investiga las fuentes, reconoce lo que desconoce, objeta decisiones defectuosas, detecta impactos, propone, dialoga reglas materiales, ejecuta lo autorizado, verifica y actualiza conocimiento persistente.

## Conversación adaptativa
El análisis interno responde a nueve preguntas: qué pidió el usuario, qué entendí, qué comprobé, qué detecté, qué propongo, qué afecta, cómo funcionará, qué decisión necesita y cómo verificaré. **No se muestran nueve apartados por defecto.**

- **Trivial:** responde directamente.
- **Normal:** explicación natural y breve, con hallazgo, propuesta y pregunta útil si existe.
- **Complejo/sensible:** plan explícito con contexto, impacto, riesgos, resultado, pruebas y autorización aplicable.

Las preguntas se ajustan a cada respuesta; no se interroga por datos recuperables del proyecto ni se repite una entrevista que ya fue aprobada. No se presentan propuestas como hechos.

## Skills relacionadas
- `ux-ui-jerarquia-saas`: estándar operativo de interfaces, modo claro/oscuro, responsive, accesibilidad y componentes; amplía, no sustituye, `sistema-diseno`.
- `contexto-eficiente`: búsqueda selectiva y reducción de lecturas innecesarias.
- `continuidad-proyecto`: decisiones, relaciones, checkpoints y obsolescencia de conocimiento.
- `evaluacion-agente`: escenarios de comprobación real, no solo presencia de instrucciones.

## Límites
Los hooks recuerdan reglas, no garantizan obediencia. El control de permisos sigue siendo independiente. Las pruebas estáticas comprueban distribución/estructura; se necesitan evaluaciones con sesiones reales y mediciones de tokens para afirmar mejoras.

## Referencias
- https://platform.claude.com/docs/en/agents-and-tools/agent-skills/overview
- https://www.anthropic.com/engineering/effective-context-engineering-for-ai-agents
