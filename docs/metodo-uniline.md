# Método Uniline v3 — por vueltas y rebanadas

**Idea central:** lo estructural se piensa desde el inicio; el detalle se descubre rebanada por rebanada, con el cliente viendo cosas funcionando. Base: Story Mapping (Jeff Patton), walking skeleton (Alistair Cockburn), diseño evolutivo de base de datos (Fowler y Sadalage), cono de incertidumbre (Boehm y McConnell).

**Reglas en todo momento:** una pregunta por mensaje con opciones · "¿cuáles quitas?" · criterio Uniline aplicado y avisado (🧭) · contradicción = alto · nada inventado · todo en /docs (main).

## Vuelta 0 · Arranque (una vez)
| Paso | Qué hace el agente | Qué te pide | Qué obtienes |
|---|---|---|---|
| 0.1 Arranque | Prepara /docs | "Quiero un sistema para…" | Proyecto listo |
| 0.2 Investigación | Estudia el giro en internet | Nada | Investigación y resumen de 5 líneas |
| 0.3 Condiciones | Lo que decide todo | ¿Rentar o propio? ¿Cuántos usuarios y roles? ¿Sucursales? ¿Dinero/CFDI? ¿Dónde se usa? ¿Tecnología? | Visión con condiciones |
| 0.4 Base fija | Pone la base que siempre va según las condiciones | ¿Quitas algo? | Usuarios, roles, permisos, configuración, bitácora… |

## Vuelta 1 · Entender cuánto se quiere
| Paso | Qué hace el agente | Qué te pide | Qué obtienes |
|---|---|---|---|
| 1.1 Cuéntame cómo trabajas | Escucha cada proceso y lo vuelve historias | Que le cuentes tu día y cada proceso | historias.md |
| 1.2 Funciones | Propone funciones por proceso | ¿Cuáles quitas o mandas para después? | funciones.md |
| 1.3 Rebanadas | Arma el mapa: R1 = lo mínimo que ya sirve de punta a punta | ¿Qué entra en R1? | rebanadas.md |

## Vuelta 2 · Esqueleto (lo caro de cambiar)
| Paso | Qué hace el agente | Qué te pide | Qué obtienes |
|---|---|---|---|
| 2.1 Tablas y diagrama | Entidades principales y diagrama ER, marcadas por rebanada | ¿Quitas o agregas? | Mapa y diagrama |
| 2.2 Relaciones clave | Uno o varios, sucursal o empresa… | Respuestas de consultor | Estructura firme |
| 2.3 Sistema de diseño | Paleta, letra, reglas de formularios y listados, con vista previa | ¿Qué cambias? | sistema-diseno.md |

## Por cada rebanada (R1, R2, R3…)
| Paso | Qué hace el agente | Qué te pide | Qué obtienes |
|---|---|---|---|
| R.1 Impacto | Revisa la rebanada contra lo hecho y lo que viene | ¿Qué afecta? ¿Qué beneficia? ¿Qué pasa si…? | Impacto registrado |
| R.2 Campos | Propone campos aplicando criterio | ¿Cuáles quitas? ¿Agregas? | Diccionario de datos |
| R.3 Comportamiento | Solo lo que el criterio no resuelve | ¿Se repite? ¿Se cambia? ¿Quién? | Reglas por campo |
| R.4 Procesos | Alta, baja, permisos, 8+ qué pasa si, cruces con otras rebanadas | Respuestas puntuales | Procesos y casos borde |
| R.5 Pantallas | Bocetos con el sistema de diseño | ¿Qué cambias? | Pantallas aprobadas |
| R.6 Avisos y reportes | Solo los de la rebanada | Canal, a quién, cuándo | Avisos y reportes |
| R.7 Aprobación | Cero contradicciones, 100% confirmado | `APROBADO R1` | Rebanada cerrada |
| R.8 Base de datos | Migración que suma a lo existente | Nada | BD lista |
| R.9 Plan | Órdenes de trabajo en orden | OK | Plan |
| R.10–11 Construir y probar | Desarrollador orden por orden; QA prueba | Preguntas de programador + OK | Funcionando y verificado |
| R.12 Demo | Tú o tu cliente lo usan | ¿Qué funcionó, qué cambiarías, qué faltó? | Ajustes, historias nuevas, siguiente rebanada |

## Siempre
| Qué | Quién |
|---|---|
| Cambios y errores (hablas normal → orden de trabajo → OK) | Desarrollador |
| Revisar que nada se desvíe | Auditor (`/reauditar`) |
