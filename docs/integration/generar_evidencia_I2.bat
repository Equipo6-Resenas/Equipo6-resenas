@echo off
rem Ejecutar desde la RAIZ del repositorio, con el backend de Resenas corriendo en el puerto 5000
rem y el contenedor postgres-resenas arriba. Genera logs y consulta SQL de I2 con fecha.

set LOGS=docs\integration\I2\logs
set DB=docs\integration\I2\database
set F=%LOGS%\2026-11-04_I2_curl.txt

if not exist %LOGS% mkdir %LOGS%
if not exist %DB% mkdir %DB%

echo %date% %time% - Evidencia I2 (GET /api/v1/resenas/evento) > %F%

echo. >> %F%
echo ===== I2-01 Evento con resenas: evt-101 ===== >> %F%
curl.exe -i -s http://localhost:5000/api/v1/resenas/evento/evt-101 >> %F%

echo. >> %F%
echo. >> %F%
echo ===== I2-02 Evento sin resenas: evt-103 ===== >> %F%
curl.exe -i -s http://localhost:5000/api/v1/resenas/evento/evt-103 >> %F%

echo. >> %F%
echo. >> %F%
echo ===== I2-03 Error, formato de id invalido: 1 ===== >> %F%
curl.exe -i -s http://localhost:5000/api/v1/resenas/evento/1 >> %F%

echo. >> %F%
echo. >> %F%
echo ===== I2-04 Evento desconocido para Resenas: evt-999 ===== >> %F%
curl.exe -i -s http://localhost:5000/api/v1/resenas/evento/evt-999 >> %F%

echo.
echo Logs guardados en %F%

rem Consulta a la base de datos (requiere docs\integration\I2\database\consulta_I2.sql)
if exist %DB%\consulta_I2.sql (
  docker exec -i postgres-resenas psql -U postgres -d resenas < %DB%\consulta_I2.sql > %DB%\resultado_I2_2026-11-04.txt
  echo Consulta SQL guardada en %DB%\resultado_I2_2026-11-04.txt
) else (
  echo No se encontro %DB%\consulta_I2.sql, se omitio la consulta SQL.
)