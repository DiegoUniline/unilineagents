---
name: cerebro
description: Diseño determinista por mundos (módulo por módulo) con el cerebro del proyecto (docs/cerebro.json). Úsala al proponer tablas y campos, decidir tabla o lista, aplicar cambios grandes como lotes o revisar impacto, para que las decisiones salgan de la biblioteca y del script y no de la improvisación.
---

# Cerebro — la IA pregunta, el script decide el efecto

Herramienta: `node .claude/cerebro/cerebro.cjs <comando>` (con `ayuda` se ven todos). Detalle en `.claude/cerebro/README.md`.

## Reglas
1. **`docs/cerebro.json` nunca se edita a mano**, solo con comandos. Si el dueño pide algo, tradúcelo a comandos y ejecútalos.
2. **No inventes campos.** Propón lo que devuelve `proponer`. Si el dueño pide un campo que la biblioteca no tiene, usa `agregar` con su `--por-que` en palabras del dueño. Un campo que se te ocurra a ti va como 💡 con su razón, y entra solo si el dueño lo aprueba.
3. **Muestra la salida del script tal cual** (tabla numerada con el porqué) y pregunta: "¿Cuáles quitas o cambias? ¿Agregas alguno?". El dueño puede responder con números ("quita 12, divide 2").
4. **Si el dueño dice que un campo "se alimenta de otra tabla"**, usa `agregar … --tipo referencia --de <entidad>`. El script crea la pregunta "¿tabla o lista?" y, si elige tabla, crea el catálogo.
5. **Al aprobar una tabla sin plantilla**, pregúntale al dueño si la guardas en la biblioteca (`guardar-plantilla <tabla>`). Así el siguiente proyecto la propone igual. Nunca uses `--reemplazar` sin su OK.
6. **Las decisiones "¿tabla o lista?"** salen de `pendientes`: una por mensaje, con la recomendación del script. Si elige tabla, el catálogo entra al mismo mundo y se propone enseguida.
7. **Cambios grandes ("ocupo lotes")** van con `receta <id>`. Haz sus preguntas una a la vez, luego `aplicar-receta … ` **sin** `--confirmar` para mostrar el impacto. Solo con el OK del dueño se ejecuta con `--confirmar`. Si no hay receta, dilo y arma el cambio con `agregar`/`tabla-nueva`, mostrando `impacto` antes.
8. **Orden:** primero el mapa general (`ganchos` respondidos, procesos y módulos), luego un mundo a la vez. `cerrar-modulo` solo con todo aprobado.
9. **SQL:** solo `migracion <nombre>`. Nunca escribas a mano el SQL de tablas que están en el cerebro. Sigue haciendo falta `APROBADO R<n>` / `CONFIRMO` según las reglas del proyecto para ejecutarlo en una BD.
10. Si un comando falla con ❌, explícale al dueño el motivo en una línea y pregunta lo que falte. No le des la vuelta.
