# Método Uniline — de la idea al sistema funcionando

Reglas que aplican en TODOS los pasos: una pregunta por mensaje · opciones con clic y recomendación · selección múltiple preguntando "¿cuáles quitas?" · contradicción = alto total · nada inventado · todo se guarda en /docs (main) después de cada respuesta · /docs/00-estado.md dice siempre dónde vamos.

## A. Entender el negocio (una vez por sistema)
| # | Paso | Qué hace el agente | Qué te pide | Qué obtienes |
|---|---|---|---|---|
| 1 | Arranque | Prepara /docs | "Quiero un sistema para…" | Proyecto listo |
| 2 | Investigación del giro | Busca en internet cómo opera el giro, documentos, dinero, regulación, términos, software líder y sus quejas, volúmenes | Nada | `investigacion-giro.md` + resumen de 5 líneas |
| 3 | Visión | Te entrevista | ¿Multiempresa o tuyo? ¿Sucursales? ¿Quién lo usa? ¿Canales? ¿Cobro/factura? ¿Qué problema paga el cliente? ¿Qué no entra en la v1? ¿Integraciones? ¿Tecnología? | `00-vision.md`, `glosario.md` |
| 4 | Catálogo de funciones | Propone muchas funciones por módulo (de la investigación) | ¿Cuáles quitas o mandas para después? ¿Agregas alguna? | `funciones.md`, lista de módulos y orden |

## B. Diseñar los datos (una vez por sistema, se actualiza)
| # | Paso | Qué hace el agente | Qué te pide | Qué obtienes |
|---|---|---|---|---|
| 5 | Mapa de tablas | Propone todas las tablas y para qué sirven | ¿Quitas, agregas o cambias alguna? | `00-mapa.md` |
| 6 | Diagrama entidad-relación | Dibuja cómo se conectan | Revisarlo | `diagrama-er.md` |
| 7 | Relaciones y reglas | Pregunta como consultor | ¿Uno o varios? ¿A quién le llega, por separado o con copia? ¿Se edita después de aceptado? ¿Quién? ¿Regla fija o permiso configurable? ¿Versión nueva o sobrescribir? | Decisiones `D-XXX` |

## C. Por cada tabla
| # | Paso | Qué hace el agente | Qué te pide | Qué obtienes |
|---|---|---|---|---|
| 8 | Campos | Propone campos con tipo y si es obligatorio (lo ya decidido sale ✅ bloqueado) | ¿Cuáles quitas? ¿Agregas? | Diccionario de datos en `modulos/<m>.md` |
| 9 | Comportamiento de campos | Pregunta solo los que tienen decisión | ¿Se puede repetir? ¿Se puede cambiar después? ¿Quién? ¿Lista fija o configurable? ¿Valor por defecto? | Reglas por campo |
| 10 | Procesos | Recorre alta, edición, baja, reactivación, permisos y mínimo 8 "qué pasa si" | ¿Qué pasa si cancelan, si dos lo hacen al mismo tiempo, si falla el pago…? | Procesos y casos borde |
| 11 | Resumen de la tabla | Resume en 5 líneas | ¿Así queda? | Tabla cerrada |

## D. Cómo se ve (una vez por sistema)
| # | Paso | Qué hace el agente | Qué te pide | Qué obtienes |
|---|---|---|---|---|
| 12 | Sistema de diseño | Propone paleta (con colores de estado), letra y reglas de formularios, tablas, botones y mensajes, con vista previa | ¿Logo y colores? ¿Estilo? ¿Cuáles cambias? | `sistema-diseno.md` |

## E. Por cada módulo
| # | Paso | Qué hace el agente | Qué te pide | Qué obtienes |
|---|---|---|---|---|
| 13 | Pantallas y flujos | Propone pantallas, qué muestran, botones y flujo de punta a punta, con boceto | ¿Quitas o agregas pantallas? ¿Qué se ve? ¿Celular o computadora? | Pantallas y flujos en el módulo |
| 14 | Reportes, avisos e integraciones | Propone reportes, avisos y conexiones | ¿Qué números? ¿Quién ve? ¿Aviso por app, correo o WhatsApp? ¿Cuándo? ¿Qué pasa si falla? | Reportes, avisos, integraciones |
| 15 | Cierre del módulo | Resuelve contradicciones y te pasa todo lo propuesto para palomear | Confirmar | 0 contradicciones y ≥90% confirmado por ti |
| 16 | Propuesta y aprobación | Resumen de tablas, lo propuesto y lo pendiente | Escribir `APROBADO <módulo>` | Diseño del módulo cerrado |

## F. Construir (por módulo aprobado)
| # | Paso | Qué hace el agente | Qué te pide | Qué obtienes |
|---|---|---|---|---|
| 17 | Base de datos | Genera la migración: tablas, reglas, seguridad por empresa, funciones, catálogos iniciales | Nada | Migración SQL |
| 18 | Plan de construcción | Divide el módulo en órdenes de trabajo pequeñas y ordenadas | OK al plan | `plan-construccion.md` |
| 19 | Orden por orden | Por cada orden: "haría esto, esto y esto" + preguntas de programador (canal, a quién, cuándo, fijo o configurable) → orden final | Contestar y dar OK | Código hecho y verificado, `ordenes/OT-XXX.md` ✅ |
| 20 | Pruebas (QA) | Prueba reglas, permisos, que ninguna empresa vea datos de otra, "qué pasa si" y criterios | Nada | Reporte ✅/❌ |

## G. Mantener (siempre)
| # | Paso | Qué hace el agente | Qué te pide | Qué obtienes |
|---|---|---|---|---|
| 21 | Cambios y errores | Tú hablas normal; él lo convierte en orden, pregunta y ejecuta | Contestar y dar OK | Cambio mínimo, verificado y documentado |
| 22 | Reauditoría | Compara lo documentado contra el código real | Contestar dudas | % de conocimiento, riesgos, nada se desvía |
