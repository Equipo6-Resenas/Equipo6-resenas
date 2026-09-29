# Pruebas de funcionalidad (manuales) – Módulo Reseñas

Equipo 6 · Taller de Integración Tecnológica 2026-2 · Evaluación 1 (ítem CA1)

- **Fecha de ejecución:** __ / __ / 2026
- **Ejecutadas por:** ______________________
- **Entorno:** aplicación en modo local (`npm run dev`, http://localhost:3000)
- **Evidencias:** capturas en `docs/pruebas/capturas/` (nombre del archivo = ID del caso, por ejemplo `PF-01.png`)

## Cómo leer este documento

Cada caso indica qué se prueba, los pasos, el resultado esperado y el resultado obtenido al ejecutarlo. El estado puede ser:

- **Aprobado:** el resultado obtenido coincide con el esperado.
- **Fallido:** el resultado obtenido difiere del esperado (se describe la diferencia).
- **No implementada:** la funcionalidad aún no existe en esta entrega.
- **Pendiente:** el caso todavía no se ha ejecutado.

## Datos de prueba

| Usuario de prueba | Descripción |
|---|---|
| Cliente A | Rol cliente, con check-in confirmado en el evento de prueba |
| Cliente B | Rol cliente, **sin** check-in en el evento de prueba |
| Organizador A | Rol organizador, dueño del evento de prueba |
| Organizador B | Rol organizador, dueño de otro evento |
| Sin sesión | Visitante sin iniciar sesión |

| Evento de prueba | Descripción |
|---|---|
| Evento 1 | Evento pagado, con reseñas |
| Evento 2 | Evento gratuito |
| Evento 3 | Evento sin reseñas |

## HU-01 · Calificar un evento con estrellas y comentario opcional

| ID | Caso de prueba | Pasos | Resultado esperado | Resultado obtenido | Estado | Evidencia |
|---|---|---|---|---|---|---|
| PF-01 | Crear reseña con calificación y comentario | 1. Ingresar como Cliente A. 2. Abrir el Evento 1. 3. Elegir 5 estrellas y escribir un comentario. 4. Publicar | La reseña se publica correctamente | | Pendiente | |
| PF-02 | Crear reseña solo con calificación (comentario opcional) | 1. Ingresar como Cliente A. 2. Elegir estrellas sin escribir comentario. 3. Publicar | La reseña se publica sin comentario | | Pendiente | |
| PF-03 | Crear reseña sin calificación | 1. Ingresar como Cliente A. 2. Escribir solo un comentario. 3. Intentar publicar | Se muestra un mensaje de error y no se publica | | Pendiente | |
| PF-04 | Segunda reseña del mismo usuario para el mismo evento | 1. Con Cliente A que ya reseñó el Evento 1, intentar publicar otra reseña | Se rechaza la reseña duplicada con un mensaje claro | | Pendiente | |
| PF-05 | Reseñar sin asistencia confirmada | 1. Ingresar como Cliente B. 2. Intentar publicar una reseña del Evento 1 | Se rechaza por falta de check-in con un mensaje claro | | Pendiente | |
| PF-06 | Reseñar sin iniciar sesión | 1. Sin sesión, intentar publicar una reseña | Se solicita iniciar sesión o se rechaza la acción | | Pendiente | |
| PF-07 | Reseña en evento gratuito | 1. Ingresar como Cliente A con check-in en el Evento 2. 2. Publicar una reseña | La reseña se publica igual que en un evento pagado | | Pendiente | |
| PF-08 | Reseña visible una vez publicada | 1. Publicar una reseña. 2. Abrir el detalle del evento | La reseña aparece en el listado del evento | | Pendiente | |

## HU-02 · Ver listado de reseñas y calificación promedio

| ID | Caso de prueba | Pasos | Resultado esperado | Resultado obtenido | Estado | Evidencia |
|---|---|---|---|---|---|---|
| PF-09 | Promedio con varias reseñas | 1. Registrar dos reseñas con 5 y 3 estrellas en un mismo evento. 2. Abrir el detalle del evento | Se muestra el promedio correcto (4,0) | | Pendiente | |
| PF-10 | Orden del listado | 1. Registrar dos reseñas en momentos distintos. 2. Abrir el detalle del evento | Las reseñas aparecen de la más reciente a la más antigua | | Pendiente | |
| PF-11 | Evento sin reseñas | 1. Abrir el detalle del Evento 3 | Se muestra un estado vacío, sin errores ni pantalla en blanco | | Pendiente | |
| PF-12 | Promedio se actualiza con una reseña nueva | 1. Anotar el promedio actual. 2. Publicar una reseña nueva. 3. Volver al detalle | El promedio y la cantidad de reseñas se actualizan | | Pendiente | |

## HU-03 · Reportar y eliminar una reseña

| ID | Caso de prueba | Pasos | Resultado esperado | Resultado obtenido | Estado | Evidencia |
|---|---|---|---|---|---|---|
| PF-13 | Reportar una reseña con motivo | 1. Ingresar como Organizador A. 2. Elegir una reseña del Evento 1. 3. Reportar indicando un motivo | El reporte se registra correctamente | | Pendiente | |
| PF-14 | Reportar una reseña sin motivo | 1. Intentar reportar sin escribir el motivo | Se muestra un error y no se registra el reporte | | Pendiente | |
| PF-15 | Eliminar una reseña reportada | 1. Como Organizador A, eliminar una reseña ya reportada | La reseña deja de mostrarse en la plataforma | | Pendiente | |
| PF-16 | Eliminar una reseña sin reporte previo | 1. Como Organizador A, intentar eliminar una reseña que no ha sido reportada | Se rechaza la acción con un mensaje claro | | Pendiente | |
| PF-17 | El reporte queda registrado con sus datos | 1. Reportar una reseña. 2. Revisar el registro del reporte (base de datos o respuesta del servicio) | El registro incluye evento, reseña y organizador que reportó | | Pendiente | |
| PF-18 | Cliente intenta reportar | 1. Ingresar como Cliente A. 2. Intentar reportar una reseña | La acción no está disponible o se rechaza por falta de permiso | | Pendiente | |
| PF-19 | Organizador de otro evento intenta reportar | 1. Ingresar como Organizador B. 2. Intentar reportar una reseña del Evento 1 | Se rechaza por falta de permiso | | Pendiente | |
| PF-20 | Promedio recalculado tras eliminar | 1. Anotar el promedio. 2. Eliminar una reseña reportada. 3. Revisar el promedio | El promedio y la cantidad de reseñas se recalculan | | Pendiente | |

## HU-04 · Responder públicamente las reseñas

| ID | Caso de prueba | Pasos | Resultado esperado | Resultado obtenido | Estado | Evidencia |
|---|---|---|---|---|---|---|
| PF-21 | Responder una reseña | 1. Ingresar como Organizador A. 2. Elegir una reseña del Evento 1. 3. Escribir una respuesta y publicar | La respuesta se publica correctamente | | Pendiente | |
| PF-22 | Respuesta visible junto a la reseña | 1. Publicar una respuesta. 2. Abrir el detalle del evento como cualquier usuario | La respuesta aparece junto a la reseña correspondiente | | Pendiente | |
| PF-23 | Respuesta vacía | 1. Intentar publicar una respuesta sin texto | Se muestra un error y no se publica | | Pendiente | |
| PF-24 | Cliente intenta responder | 1. Ingresar como Cliente A. 2. Intentar responder una reseña | La acción no está disponible o se rechaza por falta de permiso | | Pendiente | |
| PF-25 | Organizador de otro evento intenta responder | 1. Ingresar como Organizador B. 2. Intentar responder una reseña del Evento 1 | Se rechaza por falta de permiso | | Pendiente | |

## HU-05 · Adjuntar una imagen opcional a la reseña

| ID | Caso de prueba | Pasos | Resultado esperado | Resultado obtenido | Estado | Evidencia |
|---|---|---|---|---|---|---|
| PF-26 | Reseña con imagen JPG | 1. Ingresar como Cliente A. 2. Publicar una reseña adjuntando una imagen JPG válida | La reseña se publica con la imagen | | Pendiente | |
| PF-27 | Reseña con imagen PNG | 1. Publicar una reseña adjuntando una imagen PNG válida | La reseña se publica con la imagen | | Pendiente | |
| PF-28 | Reseña sin imagen | 1. Publicar una reseña sin adjuntar imagen | La reseña se publica normalmente | | Pendiente | |
| PF-29 | Formato no permitido | 1. Intentar adjuntar un archivo GIF o PDF | Se rechaza el archivo con un mensaje claro | | Pendiente | |
| PF-30 | Tamaño máximo excedido | 1. Intentar adjuntar una imagen mayor al tamaño máximo definido (5 MB) | Se rechaza la imagen con un mensaje claro | | Pendiente | |
| PF-31 | Imagen que no pasa la validación de contenido | 1. Adjuntar una imagen que incumple la validación | Se notifica al cliente y la reseña no se publica hasta corregir o eliminar la imagen | | Pendiente | |
| PF-32 | Más de una imagen | 1. Intentar adjuntar dos imágenes a la misma reseña | Solo se permite una imagen por reseña | | Pendiente | |
| PF-33 | Eliminar la imagen antes de publicar | 1. Adjuntar una imagen. 2. Quitarla. 3. Publicar | La reseña se publica sin imagen | | Pendiente | |
| PF-34 | Imagen visible junto a la reseña | 1. Publicar una reseña con imagen. 2. Abrir el detalle del evento | La imagen se muestra junto a la reseña | | Pendiente | |
| PF-35 | No se puede editar la imagen tras publicar | 1. Abrir una reseña ya publicada con imagen. 2. Buscar la opción de cambiar o quitar la imagen | No existe la opción de editar la imagen | | Pendiente | |
| PF-36 | Adjuntar imagen sin check-in | 1. Ingresar como Cliente B. 2. Intentar publicar una reseña con imagen | Se rechaza por falta de check-in | | Pendiente | |

## Resumen de resultados

| Historia | Casos | Aprobados | Fallidos | No implementados | Pendientes |
|---|---|---|---|---|---|
| HU-01 | 8 | | | | |
| HU-02 | 4 | | | | |
| HU-03 | 8 | | | | |
| HU-04 | 5 | | | | |
| HU-05 | 11 | | | | |
| **Total** | **36** | | | | |