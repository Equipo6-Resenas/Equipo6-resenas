# Pruebas de funcionalidad (manuales) – Módulo Reseñas

Equipo 6 · Taller de Integración Tecnológica 2026-2 · Evaluación 1 (ítem CA1)

- **Fecha de ejecución:** 29 / 09 / 2026
- **Ejecutadas por:** Constanza Díaz
- **Entorno:** front end en `http://localhost:3000` (en modo local). Indicar si se ejecutó con datos simulados o con el back end real: datos simulados
- **Evidencias:** capturas en `docs/pruebas-de-funcionalidad/screenshot/` (nombre del archivo = ID del caso, por ejemplo `PF-01.png`)

## Alcance de esta entrega

En el sprint de esta entrega se implementa la historia **HU-01 (Calificar un evento con estrellas y comentario opcional)**. Las pruebas de este documento corresponden a esa historia. Las demás historias están planificadas para sprints posteriores y se listan al final, sin ejecución.

## Cómo leer este documento

Cada caso indica qué se prueba, los pasos, el resultado esperado y el resultado obtenido al ejecutarlo. El estado puede ser:

- **Aprobado:** el resultado obtenido coincide con el esperado.
- **Fallido:** el resultado obtenido difiere del esperado (se describe la diferencia).
- **Pendiente:** el caso todavía no se ha ejecutado.

## Datos de prueba

| Usuario de prueba | Descripción |
|---|---|
| Cliente A | Rol cliente, con check-in confirmado en el evento de prueba |
| Cliente B | Rol cliente, **sin** check-in en el evento de prueba |
| Sin sesión | Visitante sin iniciar sesión |

## HU-01 · Calificar un evento con estrellas y comentario opcional

| ID | Caso de prueba | Pasos | Resultado esperado | Resultado obtenido | Estado | Evidencia |
|---|---|---|---|---|---|---|
| PF-01 | Crear reseña con calificación y comentario | 1. Ingresar como Cliente A. 2. Abrir el Evento. 3. Elegir 5 estrellas y escribir un comentario. 4. Publicar | La reseña se publica correctamente | Se permite al usuario publicar una reseña en el evento asistido, logrando calificar con estrellas y con un comentario,mostrandose junto con las demás| Aprobado | [PF-01](https://github.com/Equipo6-Resenas/Equipo6-resenas/tree/main/docs/pruebas-de-funcionalidad/screenshot/PF-01) |
| PF-02 | Crear reseña solo con calificación (comentario opcional) | 1. Ingresar como Cliente A. 2. Elegir estrellas sin escribir comentario. 3. Publicar | La reseña se publica sin comentario | Se permite realizar una reseña sin necesidad de agregar un comentario | Aprobado | [PF-02](https://github.com/Equipo6-Resenas/Equipo6-resenas/tree/main/docs/pruebas-de-funcionalidad/screenshot/PF-02) |
| PF-03 | Crear reseña sin calificación | 1. Ingresar como Cliente A. 2. Escribir solo un comentario. 3. Intentar publicar | Se muestra un mensaje de error y no se publica | Al intentar crear una reseña con solo un comentario, sin calificación, se entrega un mensaje de error  | Aprobado | [PF-03](https://github.com/Equipo6-Resenas/Equipo6-resenas/tree/main/docs/pruebas-de-funcionalidad/screenshot/PF-03) |
| PF-04 | Segunda reseña del mismo usuario para el mismo evento | 1. Con Cliente A que ya reseñó el Evento, intentar publicar otra reseña | Se rechaza la reseña duplicada con un mensaje claro | Al momento  de realizar una reseña, no se permite volver a publicar otra dentro del mismo evento | Aprobado | [PF-04](https://github.com/Equipo6-Resenas/Equipo6-resenas/tree/main/docs/pruebas-de-funcionalidad/screenshot/PF-04) |
| PF-05 | Reseñar sin asistencia confirmada | 1. Ingresar como Cliente B. 2. Intentar publicar una reseña del Evento | Se rechaza por falta de check-in con un mensaje claro | Se indica por un mensaje en pantalla, que si no cuenta con check-in no se puede realizar una reseña | Aprobado | [PF-05](https://github.com/Equipo6-Resenas/Equipo6-resenas/tree/main/docs/pruebas-de-funcionalidad/screenshot/PF-05) |

## Resumen de resultados

| Historia | Casos | Aprobados | Fallidos | Pendientes |
|---|---|---|---|---|
| HU-01 | 5 | 5 | 0 | 0 |

## Historias planificadas para próximos sprints

Estas historias están documentadas como issues en GitHub, con su sprint y responsable asignados. No se ejecutan pruebas sobre ellas en esta entrega.

| Historia | Descripción | Sprint planificado |
|---|---|---|
| HU-02 | Ver calificación promedio | Comienzo en sprint 3  y término en sprint final |
| HU-03 | Reportar y eliminar una reseña | Comienzo y término en sprint 2 |
| HU-04 | Responder públicamente las reseñas | Comienzo en sprint 1 y término en sprint 2 |
| HU-05 | Adjuntar una imagen opcional a la reseña | Comienzo en sprint 3  y término en sprint final |

*Es posible que en alguna áreas ciertas historias de usuario se encuentren avanzadas en sprints distintos al señalado, pero la fecha que se indica en la planificación es la fecha de término oficial en donde debe estar implementada en todas sus áreas (front-end, back-end, base de datos e integración) además de contar con la revisión de calidad correspondiente.