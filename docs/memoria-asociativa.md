# Memoria asociativa y contexto selectivo · Uniline

## Qué tomamos de la neurociencia
La teoría de indexación del hipocampo sugiere que una pista puede recuperar patrones de memoria distribuidos: **índice y asociación**. La consolidación reestructura conexiones. Son analogías para orientar diseño de software, NO evidencias de que un LLM o script funcione como un cerebro ni de que actualice sus pesos automáticamente.

Fuentes:
- Revisión de engramas e indexación: https://pmc.ncbi.nlm.nih.gov/articles/PMC10618102/
- Cronometría de recuperación de recuerdos: https://pubmed.ncbi.nlm.nih.gov/31672429/
- Contexto just-in-time: https://www.anthropic.com/research/effective-context-engineering-for-ai-agents
- Skills de carga progresiva: https://www.anthropic.com/research/equipping-agents-for-the-real-world-with-agent-skills
- Claude Cookbook sobre compactación, memoria y clearing: https://platform.claude.com/cookbook/tool-use-context-engineering-context-engineering-tools

## Modelo operativo
1. ENTRADA: «Cambiar estado de pago en ventas».
2. ÍNDICE: una petición localiza `ventas` a partir de un alias verificable, sin cargar todos los `docs/modulos`.
3. ASOCIACIONES: `docs/contexto/relaciones.json` documenta enlaces dirigidos a `pagos` / `caja` / `inventario` SOLO si existen pruebas en el proyecto. El enrutador muestra vecinos salientes y entrantes, con fuente y grado.
4. CONTEXTO DE TRABAJO: Claude abre solo el módulo y las referencias pertinentes. Riesgo mayor => radio de asociación mayor y revisión adversarial.
5. CONSOLIDAR: después de un cambio verificado, actualizar documentos y relaciones realmente alterados, decisiones, pruebas y referencias/hashes de evidencia.
6. INVALIDAR: fuentes obsoletas => `STALE`; nuevos símbolos sin índice => búsqueda en código; sin grafo => NO CONCLUIR que no hay dependencias.
7. EVALUAR: ensayos de precisión de recuperación, cobertura de impactos y cantidad real de tokens, no solo longitud de prompt.

## Instalación
El builder distribuye el script sin dependencias a `dist/proyecto/.claude/scripts/contexto.cjs` y a `dist/plantilla/.claude/scripts/contexto.cjs`. La skill vive en `skills/memoria-asociativa`. Los proyectos existentes necesitan sincronizar esos dos recursos. El índice vacío es correcto para un proyecto nuevo: conexiones se agregan solo después de verificar.

## Límites
El índice es parcial hasta registrar fuentes. El enrutador NO descubre dependencias dinámicamente en PostgreSQL, React o SQL; las aristas documentadas son pistas, no permisos de omitir análisis. No es una vector database, ni un modelo auto-entrenable, ni un guardián infalible.

## Métricas para aceptar la mejora
1. **Recall de dependencias críticas**: proporción de consecuencias reales encontradas antes de editar.
2. **Precision del contexto**: porcentaje de documentos leídos que eran necesarios.
3. **Calidad final**: pruebas adversariales, regresiones, decisión correcta de negocio y documentación vigente.
4. **Eficiencia total**: tokens/costo/latencia/reintentos por tarea correcta (medir en el proveedor si disponible).
5. **Frescura**: relaciones con prueba válida y docs actualizados por cambio material.

No fijar una cuota rígida de tokens o aristas cuando comprometa recall. Objetivo ≥9.5/10 en calidad DEMOSTRADA, no supuesta.
