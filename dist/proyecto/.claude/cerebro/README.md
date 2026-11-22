# Cerebro Uniline (prototipo)

El cerebro es la memoria estructurada del proyecto. Funciona como una calculadora: **con la misma entrada da el mismo resultado**. La IA pregunta y explica. Lo que se decide y el efecto de cada decisión lo aplica `cerebro.cjs`.

- **Archivo del proyecto:** `docs/cerebro.json`. Se crea con `init` y **nunca se edita a mano**.
- **Biblioteca:** `biblioteca/entidades/*.json` guarda los campos propuestos, cada uno con su **por qué** y su fuente (CR-XX, norma o investigación).
- **Ganchos:** `biblioteca/ganchos.json` guarda las preguntas que cruzan módulos (multiempresa, CFDI, lotes…). Se responden una vez.
- **Recetas:** `recetas/*.json` cubre los cambios grandes (por ahora `lotes`). Cada una trae preguntas de negocio, restricciones y la lista exacta de cambios según cada respuesta.
- **Salidas:** las migraciones SQL aditivas (`docs/migraciones/`), los documentos por módulo y el impacto se generan del cerebro.

## Cómo se trabaja

1. **Mapa general (una vez).** `init`, luego `ganchos` + `condicion` para cada respuesta, después `proceso-agregar` y `modulo-agregar` con sus dependencias.
2. **Un mundo a la vez.**
   - `proponer producto --modulo productos` muestra la tabla numerada con el porqué de cada campo y las decisiones "¿tabla o lista?".
   - El dueño responde con `quitar`, `agregar`, `obligatorio`, `dividir` y `decidir`.
   - Si elige "tabla", el catálogo se crea en el mismo mundo y entra a la fila.
   - **Cualquier campo nuevo puede alimentarse de otra tabla:** `agregar pacientes aseguradora --tipo referencia --de aseguradora --por-que "..."`. Si esa tabla existe, se conecta. Si no, queda la pregunta "¿tabla o lista?". Si eliges tabla, se crea con la plantilla de la biblioteca o, si no hay plantilla, como catálogo genérico (nombre, orden, es_sistema; CR-03).
   - Al final: `aprobar` cada tabla y `cerrar-modulo`.
   - `migracion <nombre>` genera el SQL.
3. **Cambios después.**
   - `receta lotes` muestra las preguntas.
   - `aplicar-receta lotes --resp …` enseña el impacto **sin guardar nada**.
   - Con `--confirmar` se aplica: reabre el mundo, agrega los campos y las tablas, registra las reglas y deja **compromisos** para módulos que aún no existen (cuando se cree `ventas_detalle`, el lote se agrega solo).
4. **La biblioteca crece sola.** Al aprobar una tabla sin plantilla, el script sugiere `guardar-plantilla <tabla>`. Desde ahí, `proponer <entidad>` en el siguiente proyecto da esos campos con su porqué. Las referencias se vuelven a decidir con el criterio del nuevo proyecto. Los campos que agrega una receta no se guardan en la plantilla, porque los pone la receta. Para reemplazar una plantilla existente hay que pasar `--reemplazar`.
5. `impacto <tabla>` lista quién usa la tabla, de qué depende y qué está comprometido.

El recorrido completo, con la salida real, está en `.claude/ejemplos/cerebro-productos/recorrido.md`.

## Garantías (con pruebas en `pruebas/cerebro.test.cjs`)

- Misma secuencia de comandos = mismo `cerebro.json` y mismas migraciones, byte por byte.
- Ningún campo entra sin `--por-que`.
- No se aprueba una tabla ni se cierra un mundo con decisiones pendientes.
- Un campo que se alimenta de una tabla inexistente pregunta "¿tabla o lista?" antes de crearla.
- Una plantilla guardada se vuelve a proponer igual en otro proyecto. No se sobrescribe sin `--reemplazar`.
- La vista previa de una receta no guarda nada, y las respuestas incompatibles se rechazan.
- Las migraciones solo agregan. Un campo quitado que ya estaba en la BD **no** genera DROP: se avisa y exige `CONFIRMO`.
- Cambiar un gancho ya respondido cuando hay tablas creadas se detiene como contradicción.

Para correr las pruebas: `node --test .claude/cerebro/pruebas/cerebro.test.cjs`. Para regenerar el ejemplo: `node .claude/cerebro/pruebas/demo.cjs`.

## Límites actuales (prototipo)

- La biblioteca arranca con producto, categoría, marca y unidad, y crece con cada `guardar-plantilla`. Ojo: en un proyecto que se sincroniza con la plantilla central, lo guardado queda en ese repo. Para que llegue a todos los proyectos hay que subirlo también a la plantilla central.
- Solo existe la receta de lotes.
- El SQL no incluye políticas RLS. Se generan con la skill `rls-multiempresa`.
- Los agentes todavía no lo usan por defecto. Para eso hay que agregar la skill `cerebro` al flujo del arquitecto.
- El impacto solo ve las relaciones registradas en el cerebro.
