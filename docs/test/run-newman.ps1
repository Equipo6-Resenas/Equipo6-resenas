<#
.SYNOPSIS
    Ejecuta la colección Postman con Newman y genera reportes (HTML, JSON, JUnit)
    Versión PowerShell para Windows

.DESCRIPTION
    Script para ejecutar las pruebas de integración de la Entrega 4 (módulo Reseñas)
    usando Newman. Genera reporte HTML visual, JSON para parsing y JUnit para CI.

.PARAMETER Folder
    Nombre de la carpeta a ejecutar (ej: "I1 - Auth", "I2 - Catálogo", "I3 - RabbitMQ")

.PARAMETER Bail
    Detener en el primer fallo

.PARAMETER JsonOnly
    Solo generar reporte JSON (útil para CI/CD)

.PARAMETER EnvironmentFile
    Archivo de environment de Postman (.postman_environment.json)

.EXAMPLE
    .\run-newman.ps1
    .\run-newman.ps1 -Folder "I1 - Auth"
    .\run-newman.ps1 -Bail
    .\run-newman.ps1 -JsonOnly
    .\run-newman.ps1 -EnvironmentFile "docs/test/workstation.postman_environment.json"
#>

param(
    [string]$Folder = "",
    [switch]$Bail,
    [switch]$JsonOnly,
    [string]$EnvironmentFile = ""
)

# Configuración
$CollectionFile = "docs/test/Entrega4-Integraciones.postman_collection.json"
$ReportDir = "docs/test/newman-reports"
$Timestamp = Get-Date -Format "yyyyMMdd-HHmmss"
$ReportHtml = "$ReportDir/newman-report-$Timestamp.html"
$ReportJson = "$ReportDir/newman-report-$Timestamp.json"
$ReportJunit = "$ReportDir/newman-junit-$Timestamp.xml"

# Colores
$Red = [ConsoleColor]::Red
$Green = [ConsoleColor]::Green
$Yellow = [ConsoleColor]::Yellow
$Cyan = [ConsoleColor]::Cyan
$Gray = [ConsoleColor]::DarkGray

function Log-Info { param($msg) Write-Host "[INFO] $msg" -ForegroundColor $Cyan }
function Log-Ok   { param($msg) Write-Host "[OK]   $msg" -ForegroundColor $Green }
function Log-Warn { param($msg) Write-Host "[WARN] $msg" -ForegroundColor $Yellow }
function Log-Err  { param($msg) Write-Host "[ERR]  $msg" -ForegroundColor $Red }

# Verificar newman
if (-not (Get-Command newman -ErrorAction SilentlyContinue)) {
    Log-Err "Newman no está instalado. Ejecuta: npm install -g newman newman-reporter-htmlextra"
    exit 1
}

# Verificar colección
if (-not (Test-Path $CollectionFile)) {
    Log-Err "No se encuentra la colección: $CollectionFile"
    exit 1
}

# Crear directorio reportes
if (-not (Test-Path $ReportDir)) { New-Item -ItemType Directory -Path $ReportDir | Out-Null }

# Construir argumentos de newman
$newmanArgs = @(
    "run", $CollectionFile
)

if ($JsonOnly) {
    $newmanArgs += @("--reporters", "json", "--reporter-json-export", $ReportJson)
} else {
    $newmanArgs += @(
        "--reporters", "cli,htmlextra,json,junit"
        "--reporter-htmlextra-export", $ReportHtml
        "--reporter-htmlextra-title", "Entrega 4 - Pruebas Integración Reseñas"
        "--reporter-htmlextra-logs", "true"
        "--reporter-htmlextra-testPaging", "true"
        "--reporter-json-export", $ReportJson
        "--reporter-junit-export", $ReportJunit
        "--color", "on"
    )
}

if ($Folder) {
    $newmanArgs += @("--folder", $Folder)
}
if ($Bail) {
    $newmanArgs += @("--bail")
}
if ($EnvironmentFile) {
    if (-not (Test-Path $EnvironmentFile)) {
        Log-Err "Environment file no encontrado: $EnvironmentFile"
        exit 1
    }
    $newmanArgs += @("--environment", $EnvironmentFile)
}

# Variables de entorno por defecto para workstation
$env:gateway_url = $env:gateway_url ?? "http://localhost:8080"
$env:backend_url = $env:backend_url ?? "http://localhost:5000"
$env:evento_id   = $env:evento_id ?? "evt-101"

# Mostrar configuración
Log-Info "=========================================="
Log-Info "Entrega 4 - Newman Test Runner (PowerShell)"
Log-Info "=========================================="
Log-Info "Colección: $CollectionFile"
Log-Info "Reportes en: $ReportDir"
if ($Folder) { Log-Info "Carpeta: $Folder" }
if ($Bail)   { Log-Info "Modo: --bail" }
if ($JsonOnly) { Log-Info "Modo: --json-only" }
if ($EnvironmentFile) { Log-Info "Environment: $EnvironmentFile" }
Log-Info "Variables:"
Log-Info "  gateway_url = $env:gateway_url"
Log-Info "  backend_url = $env:backend_url"
Log-Info "  evento_id   = $env:evento_id"
Log-Info "=========================================="

# Ejecutar
Log-Info "Iniciando pruebas..."
Write-Host ""

try {
    $exitCode = & newman @newmanArgs

    Write-Host ""
    Log-Ok "=========================================="
    Log-Ok "EJECUCIÓN COMPLETADA EXITOSAMENTE"
    Log-Ok "=========================================="
    if (-not $JsonOnly) { Log-Ok "Reporte HTML:  $ReportHtml" }
    Log-Ok "Reporte JSON:  $ReportJson"
    if (-not $JsonOnly) { Log-Ok "Reporte JUnit: $ReportJunit" }

    # Resumen rápido si jq está disponible
    if (Get-Command jq -ErrorAction SilentlyContinue) {
        if (Test-Path $ReportJson) {
            Write-Host ""
            Log-Info "Resumen de resultados:"
            $summary = jq -r '
              .run.stats as $s |
              "  Iteraciones: \($s.iterations.total) (fallidas: \($s.iterations.failed))",
              "  Requests:    \($s.requests.total) (fallidas: \($s.requests.failed))",
              "  Tests:       \($s.tests.total) (fallidos: \($s.tests.failed))",
              "  Assertions:  \($s.assertions.total) (fallidas: \($s.assertions.failed))"
            ' $ReportJson
            Write-Host $summary
        }
    }

    exit 0
}
catch {
    Write-Host ""
    Log-Err "=========================================="
    Log-Err "EJECUCIÓN FALLÓ"
    Log-Err "=========================================="
    if (-not $JsonOnly) { Log-Err "Reporte HTML:  $ReportHtml" }
    Log-Err "Reporte JSON:  $ReportJson"
    if (-not $JsonOnly) { Log-Err "Reporte JUnit: $ReportJunit" }
    exit $LASTEXITCODE
}