---
name: orden-de-trabajo
description: Convierte cualquier pedido del dueño en lenguaje normal ("quiero que…", "agrega…", "arregla…") en una orden de trabajo precisa (el prompt correcto) usando /docs, se la muestra para OK y luego la ejecuta. Úsala SIEMPRE en fase de desarrollo antes de programar cualquier cambio, función o corrección.
---

# Orden de trabajo — el dueño habla normal, tú escribes el prompt perfecto

El dueño no tiene que saber escribir prompts. Tú conviertes lo que dice en una instrucción técnica completa, se la enseñas en corto, y la ejecutas tal cual.

## Paso 1 — Entender con contexto
1. Lee /docs/00-estado.md, /docs/00-mapa.md, /docs/diagrama-er.md y los módulos que toca el pedido.
2. Identifica: qué módulo(s), qué tablas/campos, qué reglas y decisiones (D-XXX) aplican, qué pantallas y procesos se ven afectados.
3. Si el pedido es nuevo de negocio (una regla, campo o flujo que no está en /docs) → no es desarrollo todavía: es diseño. Haz las preguntas necesarias (una por mensaje, con clic si hay AskUserQuestion) y regístralas como D-XXX antes de armar la orden.
4. Si falta un dato para que la orden quede sin ambigüedad → UNA pregunta y espera.

## Paso 2 — Redactar la orden (archivo /docs/ordenes/OT-XXX.md)
```
# OT-XXX · <título corto> · <fecha>
Pedido original del dueño: "<texto tal cual>"

## Objetivo
<qué debe lograrse, en 1–2 líneas, en términos de negocio>

## Contexto
- Módulo(s): …
- Tablas/campos: …
- Decisiones que aplican: D-XXX, D-YYY
- Estado actual relevante: <lo que existe hoy, con archivo:línea si ya hay código>

## Alcance
Incluye:
- …
No incluye (explícito):
- …

## Cambios
- BD: <sin cambios | migración: qué agrega/cambia — aditiva y reversible>
- Backend / funciones: …
- Pantallas: …
- Permisos: <qué rol puede qué; regla fija o permiso configurable>

## Reglas que NO se pueden romper
- Multiempresa, historial, dinero en numeric, RLS, transacciones, errores visibles (constitución)
- <reglas específicas del módulo>

## Criterios de aceptación
- Dado … cuando … entonces …
- Dado … cuando … entonces …
- Qué pasa si … → …

## Verificación
- <cómo se va a probar cada criterio>

## Riesgo
BAJO | MEDIO | ALTO — <por qué>
```

## Paso 3 — Mostrarla al dueño en corto
No le pegues el archivo completo. Muéstrale:
```
📋 OT-XXX · <título>
Entendí: <1 línea>
Hará: <3–5 viñetas>
No hará: <1–3 viñetas>
Listo cuando: <2–3 criterios clave>
Riesgo: <nivel>
```
Y pregunta (con clic si hay AskUserQuestion): **A) OK, ejecútala (Recomendado)  B) Cambiar algo  C) Ver la orden completa**.

## Paso 4 — Ejecutar exactamente la orden
- Con OK: ejecuta siguiendo la orden como tu prompt, sin agregar nada fuera del alcance.
- Si a mitad del trabajo descubres que la orden está mal o incompleta: detente, explica en 2 líneas, propone el ajuste y espera OK. Actualiza la OT (sección "Cambios a la orden").
- Al terminar: verifica cada criterio de aceptación con evidencia, marca la OT como `✅ TERMINADA` con el resumen y la evidencia, actualiza /docs del módulo, 00-estado.md y bitacora.md, y haz commit.

## Reglas
- Una OT por pedido. Si el dueño pide varias cosas en un mensaje, sepáralas en varias OT y pregunta por cuál empezar.
- Pedidos grandes: divide en OT pequeñas que se puedan verificar una por una.
- Nunca ejecutes sin OK, salvo que el dueño haya dicho antes "las de riesgo BAJO ejecútalas directo" (regístralo como D-XXX).
- La OT es también el prompt que usarías para delegar a un subagente: debe poder entenderla alguien que no vio la conversación.
