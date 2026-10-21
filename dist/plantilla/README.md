# Proyecto nuevo — Método Uniline

1. Abre este repo en Claude Code.
2. Escribe: **"Quiero un sistema para …"** (en tus palabras).
3. Contesta una pregunta a la vez. El agente investiga el giro, te pide que le cuentes cómo trabajas, arma las historias y construye contigo por rebanadas. Todo queda en `docs/`.

| Quieres | Escribe |
|---|---|
| Saber cómo va | `/estado` |
| Diseñar un módulo | `/modulo <nombre>` |
| Cerrar y aprobar una rebanada | `/proponer R1` |
| Cambiar o agregar algo (ya aprobado) | lo pides normal o `/cambio …` |
| Arreglar un error | `/corregir …` |
| Probar | `/probar <módulo>` |
| Revisar que nada se desvió | `/reauditar` |

Ejemplo completo de cómo queda todo: `.claude/ejemplos/`.

## Calidad antes de entregar
El control `application-delivery` ejecuta `calidad/verificar-entrega.cjs`. Una plantilla sin producto queda pendiente: conectar adaptadores reales siguiendo `calidad/README.md`. No confundir el check del paquete con pruebas de la aplicación. Configurar protección de rama y dependencia del despliegue para bloquear publicación efectivamente.
