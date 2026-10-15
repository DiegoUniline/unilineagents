---
description: Prepara el proyecto para trabajar con los agentes Uniline (crea /docs y CLAUDE.md)
---
{{BASE}}

## Tarea: iniciar proyecto
1. Revisa la raíz del proyecto (sin modificar nada) e identifica el stack: Supabase/Lovable/React, AppSheet/Apps Script u otro.
2. Si NO existe /docs, créalo con: 00-estado.md (plantilla de abajo), bitacora.md, investigacion-giro.md, 00-vision.md, 00-mapa.md, preguntas.md, decisiones.md, riesgos.md, glosario.md y carpeta modulos/ — con encabezados vacíos según las convenciones.
   Si ya existe, no sobrescribas nada: solo crea los archivos que falten.
3. Si NO existe CLAUDE.md en la raíz, créalo con el bloque de abajo. Si existe, muéstrame el bloque y pregúntame si lo agrego al final (no lo reescribas).
4. Responde en 3 líneas: stack detectado, qué creaste, siguiente paso sugerido (/inventario si hay código, /disenar si es nuevo).

Plantilla 00-estado.md:
{{TPL:00-estado}}

Bloque CLAUDE.md:
```
# Reglas del proyecto (Uniline)
- Al iniciar lee /docs/00-estado.md y continúa desde ahí; actualízalo después de cada respuesta, decisión o cambio.
- Antes de cualquier cambio lee /docs/00-mapa.md y /docs/modulos/<modulo>.md.
- Nunca supongas reglas de negocio: pregunta, una pregunta a la vez.
- Nunca borres, sobrescribas ni ejecutes nada destructivo sin "CONFIRMO <acción>" del dueño.
- Cambio mínimo, verificado con evidencia, y /docs actualizado en el mismo cambio.
- Comandos: /disenar /modulo /proponer /inventario /auditar /reauditar /cambio /corregir /probar /respuestas /estado
```
