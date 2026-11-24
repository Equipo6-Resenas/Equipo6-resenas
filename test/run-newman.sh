#!/usr/bin/env bash
# ============================================================
# Script para ejecutar la colección Postman con Newman
# Genera reporte HTML + JSON + salida CLI
# ============================================================
# Uso:
#   ./run-newman.sh                    # Ejecución completa con reporte HTML
#   ./run-newman.sh --json-only        # Solo reporte JSON (para CI)
#   ./run-newman.sh --bail             # Para en primer fallo
#   ./run-newman.sh --folder "I1"      # Ejecutar solo una carpeta
#   ./run-newman.sh --separate         # Ejecutar cada carpeta por separado con reportes en subdirectorios
# ============================================================

set -euo pipefail

# Configuración
COLLECTION_FILE="test/Entrega4-Integraciones.postman_collection.json"
ENV_FILE="test/workstation.postman_environment.json"
REPORT_DIR="test/newman-reports"
TIMESTAMP=$(date +"%Y%m%d-%H%M%S")

# Colores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Funciones helper
log_info() { echo -e "${BLUE}[INFO]${NC} $*"; }
log_ok()   { echo -e "${GREEN}[OK]${NC} $*"; }
log_warn() { echo -e "${YELLOW}[WARN]${NC} $*"; }
log_err()  { echo -e "${RED}[ERROR]${NC} $*"; }

# Verificar que newman está instalado
if ! command -v newman &> /dev/null; then
    log_err "Newman no está instalado. Instálalo con: npm install -g newman newman-reporter-htmlextra"
    exit 1
fi

# Verificar que existe la colección
if [[ ! -f "$COLLECTION_FILE" ]]; then
    log_err "No se encuentra la colección: $COLLECTION_FILE"
    exit 1
fi

# Crear directorio base de reportes
mkdir -p "$REPORT_DIR"

# Función para determinar nombre de subdirectorio
get_report_subdir() {
    local fname="$1"
    if [[ -n "$fname" ]]; then
        echo "$fname" | sed 's/[^a-zA-Z0-9_-]/-/g' | sed 's/--*/-/g' | sed 's/^-//;s/-$//'
    else
        echo "all"
    fi
}

# Parsear argumentos
FOLDER=""
BAIL=false
JSON_ONLY=false
SEPARATE=false

while [[ $# -gt 0 ]]; do
    case $1 in
        --folder)
            FOLDER="$2"
            shift 2
            ;;
        --bail)
            BAIL=true
            shift
            ;;
        --json-only)
            JSON_ONLY=true
            shift
            ;;
        --separate|--per-folder)
            SEPARATE=true
            shift
            ;;
        --env)
            ENV_FILE="$2"
            shift 2
            ;;
        --help|-h)
            echo "Uso: $0 [opciones]"
            echo "Opciones:"
            echo "  --folder <nombre>     Ejecutar solo una carpeta (ej: 'I1 - Auth')"
            echo "  --separate            Ejecutar cada carpeta por separado con reportes en subdirectorios"
            echo "  --bail                Detener en primer fallo"
            echo "  --json-only           Solo generar reporte JSON (para CI)"
            echo "  --env <archivo>       Archivo de environment Postman (.json)"
            echo "  --help                Mostrar esta ayuda"
            exit 0
            ;;
        *)
            log_err "Opción desconocida: $1"
            exit 1
            ;;
    esac
done

# Mostrar configuración
log_info "=========================================="
log_info "Entrega 4 - Newman Test Runner"
log_info "=========================================="
log_info "Colección: $COLLECTION_FILE"
log_info "Directorio base reportes: $REPORT_DIR"
[[ -n "$FOLDER" ]] && log_info "Carpeta filtrada: $FOLDER"
[[ "$SEPARATE" == true ]] && log_info "Modo: --separate (subdirectorios por carpeta)"
[[ "$BAIL" == true ]] && log_info "Modo: --bail (para en primer fallo)"
[[ "$JSON_ONLY" == true ]] && log_info "Modo: --json-only"
[[ -n "$ENV_FILE" ]] && log_info "Environment: $ENV_FILE"
log_info "=========================================="

# Variables de entorno por defecto para workstation
export gateway_url="${gateway_url:-http://localhost:8080}"
export backend_url="${backend_url:-http://localhost:5000}"
export evento_id="${evento_id:-evt-101}"

log_info "Variables de entorno:"
log_info "  gateway_url = $gateway_url"
log_info "  backend_url = $backend_url"
log_info "  evento_id   = $evento_id"
log_info "=========================================="

# Función para ejecutar newman
run_newman() {
    local folder_name="$1"
    local extra_args=("${@:2}")

    # Subdirectorio para esta carpeta
    local subdir=$(get_report_subdir "$folder_name")
    local FOLDER_REPORT_DIR="${REPORT_DIR}/${subdir}"
    mkdir -p "$FOLDER_REPORT_DIR"

    local report_html="${FOLDER_REPORT_DIR}/newman-report-${TIMESTAMP}.html"
    local report_json="${FOLDER_REPORT_DIR}/newman-report-${TIMESTAMP}.json"
    local report_junit="${FOLDER_REPORT_DIR}/newman-junit-${TIMESTAMP}.xml"

    local args=(
        run "$COLLECTION_FILE"
        --reporters cli,htmlextra,json,junit
        --reporter-htmlextra-export "$report_html"
        --reporter-htmlextra-title "Entrega 4 - Pruebas Integración Reseñas${folder_name:+ - $folder_name}"
        --reporter-htmlextra-logs true
        --reporter-htmlextra-testPaging true
        --reporter-json-export "$report_json"
        --reporter-junit-export "$report_junit"
        --color on
        --bail "$BAIL"
    )

    [[ -n "$folder_name" ]] && args+=(--folder "$folder_name")
    [[ -n "$ENV_FILE" ]] && args+=(--environment "$ENV_FILE")
    args+=("${extra_args[@]}")

    if newman "${args[@]}"; then
        echo ""
        log_ok "=========================================="
        [[ -n "$folder_name" ]] && log_ok "CARPETA: $folder_name"
        log_ok "EJECUCIÓN COMPLETADA EXITOSAMENTE"
        log_ok "=========================================="
        [[ "$JSON_ONLY" != true ]] && log_ok "Reporte HTML: $report_html"
        log_ok "Reporte JSON: $report_json"
        [[ "$JSON_ONLY" != true ]] && log_ok "Reporte JUnit: $report_junit"

        if command -v jq &> /dev/null && [[ -f "$report_json" ]]; then
            echo ""
            log_info "Resumen de resultados:"
            jq -r '
              .run.stats as $s |
              "  Iteraciones: \($s.iterations.total) (fallidas: \($s.iterations.failed))",
              "  Requests:    \($s.requests.total) (fallidas: \($s.requests.failed))",
              "  Tests:       \($s.tests.total) (fallidos: \($s.tests.failed))",
              "  Assertions:  \($s.assertions.total) (fallidas: \($s.assertions.failed))"
            ' "$report_json"
        fi
        return 0
    else
        EXIT_CODE=$?
        echo ""
        log_err "=========================================="
        [[ -n "$folder_name" ]] && log_err "CARPETA: $folder_name"
        log_err "EJECUCIÓN FALLÓ (código: $EXIT_CODE)"
        log_err "=========================================="
        [[ "$JSON_ONLY" != true ]] && log_err "Reporte HTML: $report_html"
        log_err "Reporte JSON: $report_json"
        [[ "$JSON_ONLY" != true ]] && log_err "Reporte JUnit: $report_junit"
        return $EXIT_CODE
    fi
}

# Ejecutar
log_info "Iniciando ejecución de pruebas..."
echo ""

if [[ "$SEPARATE" == true ]]; then
    # Modo separado: obtener carpetas y ejecutar cada una en su subdirectorio
    FOLDERS=$(node -e "console.log(JSON.parse(require('fs').readFileSync('$COLLECTION_FILE', 'utf8')).item.map(i => i.name).join('\n'))" 2>/dev/null || echo "")
    if [[ -z "$FOLDERS" ]]; then
        log_err "No se pudieron obtener las carpetas de la colección"
        exit 1
    fi

    OVERALL_EXIT=0
    while IFS= read -r folder; do
        [[ -z "$folder" ]] && continue
        log_info "=== Ejecutando carpeta: $folder ==="
        run_newman "$folder" || OVERALL_EXIT=$?
        echo ""
    done <<< "$FOLDERS"

    if [[ $OVERALL_EXIT -eq 0 ]]; then
        log_ok "=========================================="
        log_ok "TODAS LAS CARPETAS COMPLETADAS EXITOSAMENTE"
        log_ok "=========================================="
        exit 0
    else
        log_err "=========================================="
        log_err "ALGUNAS CARPETAS FALLARON"
        log_err "=========================================="
        exit $OVERALL_EXIT
    fi
else
    # Modo normal (ejecución única en test/newman-reports/all/)
    run_newman "$FOLDER"
    exit $?
fi