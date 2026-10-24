# Uniline Agents · Auditoría causal, clasificación y asignación de responsabilidades

## Problema corregido
El evaluador podía confundir una política de negocio no definida o una preferencia técnica con un defecto de programación, inflando reproches y poniendo puntuaciones sin denominadores verificables. La corrección también debe evitar el extremo opuesto: llamar «recomendación» a una vulnerabilidad de autorización o integridad real.

## Fuente canónica
`skills/clasificacion-hallazgos/SKILL.md` coordina el procedimiento y `references/rubrica.md` contiene campos, ejemplos y criterios. No clonar su contenido en cada agente/hook; los roles y enrutadores solo referencian la skill.

## Secuencia
1. Recuperar reglas y decisiones D-XXX vigentes + garantías técnicas.
2. Identificar evidencia REAL, INFERIDA o NO VERIFICADA.
3. Separar: defecto reproducido, defecto inferido, riesgo arquitectónico, decisión de negocio pendiente, recomendación, brecha de verificación, desviación de proceso y falso positivo.
4. Precisar severidad por riesgo, independiente de la categoría y del responsable.
5. Distribuir responsabilidades por fase: arquitectura, implementación, QA, auditoría y negocio; no buscar un único culpable.
6. Para decisiones pendientes: consultar UNA por turno, recomendar sin sustituir al dueño.
7. Defecto técnico confirmado: reproducir y crear prueba de regresión antes de cerrar. Falla crítica bloquea release independientemente de la nota.
8. Reportar scores solo con rúbrica previa, cobertura, evidencia y limitaciones; no reajustar cifras para alcanzar la meta 9.5.

## Ejemplo REFIX · Tipo de cambio
**No es automáticamente un bug** permitir que un usuario autorizado introduzca TC distinto. Eso exige decisión comercial y límites. **Sí es una debilidad técnica real** aceptar TC arbitrario enviado por un cajero si permite alterar importes sin verificación de servidor/permiso; hay que distinguir comportamiento reproducido, precondiciones y severidad. Falta de aclaración corresponde al arquitecto; omisión de prueba adversarial corresponde a QA; ausencia de validación en la frontera de confianza corresponde a implementación.

## Verificación
La CI comprobará que roles y distribuciones contienen la referencia a la nueva skill y que los escenarios de clasificación y separación de responsabilidades están documentados. Estas comprobaciones estáticas NO demuestran automáticamente buena clasificación por Claude. Evaluación semántica en sesiones del modelo sigue siendo necesaria.
