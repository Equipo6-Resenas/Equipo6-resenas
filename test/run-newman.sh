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
# ============================================================

set -euo pipefail

# Configuración
COLLECTION_FILE="test/Entrega4-Integraciones.postman_collection.json"
ENV_FILE="test/workstation.postman_environment.json"  # Opcional: archivo de environment .postman_environment.json
REPORT_DIR="test/newman-reports"
TIMESTAMP=$(date +"%Y%m%d-%H%M%S")
REPORT_HTML="${REPORT_DIR}/newman-report-${TIMESTAMP}.html"
REPORT_JSON="${REPORT_DIR}/newman-report-${TIMESTAMP}.json"
REPORT_JUNIT="${REPORT_DIR}/newman-junit-${TIMESTAMP}.xml"

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

# Crear directorio de reportes
mkdir -p "$REPORT_DIR"

# Parsear argumentos
NEWMAN_ARGS=(
    run "$COLLECTION_FILE"
    --reporters cli,htmlextra,json,junit
    --reporter-htmlextra-export "$REPORT_HTML"
    --reporter-htmlextra-title "Entrega 4 - Pruebas Integración Reseñas"
    --reporter-htmlextra-logs true
    --reporter-htmlextra-testPaging true
    --reporter-json-export "$REPORT_JSON"
    --reporter-junit-export "$REPORT_JUNIT"
    --color on
    --bail false
)

FOLDER=""
BAIL=false
JSON_ONLY=false

while [[ $# -gt 0 ]]; do
    case $1 in
        --folder)
            FOLDER="$2"
            NEWMAN_ARGS+=(--folder "$FOLDER")
            shift 2
            ;;
        --bail)
            BAIL=true
            NEWMAN_ARGS+=(--bail)
            shift
            ;;
        --json-only)
            JSON_ONLY=true
            NEWMAN_ARGS=(run "$COLLECTION_FILE" --reporters json --reporter-json-export "$REPORT_JSON")
            shift
            ;;
        --env)
            ENV_FILE="$2"
            NEWMAN_ARGS+=(--environment "$ENV_FILE")
            shift 2
            ;;
        --help|-h)
            echo "Uso: $0 [opciones]"
            echo "Opciones:"
            echo "  --folder <nombre>   Ejecutar solo una carpeta (ej: 'I1 - Auth')"
            echo "  --bail              Detener en primer fallo"
            echo "  --json-only         Solo generar reporte JSON (para CI)"
            echo "  --env <archivo>     Archivo de environment Postman (.json)"
            echo "  --help              Mostrar esta ayuda"
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
log_info "Directorio reportes: $REPORT_DIR"
[[ -n "$FOLDER" ]] && log_info "Carpeta filtrada: $FOLDER"
[[ "$BAIL" == true ]] && log_info "Modo: --bail (para en primer fallo)"
[[ "$JSON_ONLY" == true ]] && log_info "Modo: --json-only"
[[ -n "$ENV_FILE" ]] && log_info "Environment: $ENV_FILE"
log_info "=========================================="

# Variables de entorno por defecto para workstation
# (Newman las usa como variables globales si no hay environment file)
export gateway_url="${gateway_url:-http://localhost:8080}"
export backend_url="${backend_url:-http://localhost:5000}"
export evento_id="${evento_id:-evt-101}"

log_info "Variables de entorno:"
log_info "  gateway_url = $gateway_url"
log_info "  backend_url = $backend_url"
log_info "  evento_id   = $evento_id"
log_info "=========================================="

# Ejecutar newman
log_info "Iniciando ejecución de pruebas..."
echo ""

if newman "${NEWMAN_ARGS[@]}"; then
    echo ""
    log_ok "=========================================="
    log_ok "EJECUCIÓN COMPLETADA EXITOSAMENTE"
    log_ok "=========================================="
    [[ "$JSON_ONLY" != true ]] && log_ok "Reporte HTML: $REPORT_HTML"
    log_ok "Reporte JSON: $REPORT_JSON"
    [[ "$JSON_ONLY" != true ]] && log_ok "Reporte JUnit: $REPORT_JUNIT"

    # Resumen rápido del JSON
    if command -v jq &> /dev/null && [[ -f "$REPORT_JSON" ]]; then
        echo ""
        log_info "Resumen de resultados:"
        jq -r '
          .run.stats as $s |
          "  Iteraciones: \($s.iterations.total) (fallidas: \($s.iterations.failed))",
          "  Requests:    \($s.requests.total) (fallidas: \($s.requests.failed))",
          "  Tests:       \($s.tests.total) (fallidos: \($s.tests.failed))",
          "  Assertions:  \($s.assertions.total) (fallidas: \($s.assertions.failed))"
        ' "$REPORT_JSON"
    fi

    exit 0
else
    EXIT_CODE=$?
    echo ""
    log_err "=========================================="
    log_err "EJECUCIÓN FALLÓ (código: $EXIT_CODE)"
    log_err "=========================================="
    [[ "$JSON_ONLY" != true ]] && log_err "Reporte HTML: $REPORT_HTML"
    log_err "Reporte JSON: $REPORT_JSON"
    [[ "$JSON_ONLY" != true ]] && log_err "Reporte JUnit: $REPORT_JUNIT"
    exit $EXIT_CODE
fi