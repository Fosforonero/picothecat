#!/usr/bin/env bash
# Deploy UI PicoClaw: build locale (Node 20 + Vite) e sync su Raspberry Pi.
# Opzionale: deploy/push-ui.local.env (vedi push-ui.local.env.example) per SSH da Cursor.
set -e

trap 'echo "" >&2; echo "ERRORE: deploy fallito (ultimo comando con exit code diverso da 0)." >&2' ERR

require_cmd() {
  local name="$1"
  if ! command -v "${name}" >/dev/null 2>&1; then
    echo "ERRORE: \"${name}\" non trovato nel PATH. Installalo o aggiorna PATH." >&2
    exit 1
  fi
}

echo "Deploy UI PicoClaw iniziato..."
echo ""

# Percorsi (script in PicoClaw/deploy/ — gestisce spazi nei path)
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PICOCLAW_ROOT="$(cd "${SCRIPT_DIR}/.." && pwd)"
UI_DIR="${PICOCLAW_ROOT}/code/ui"
DIST_DIR="${UI_DIR}/dist"

LOCAL_ENV="${SCRIPT_DIR}/push-ui.local.env"
if [[ -f "${LOCAL_ENV}" ]]; then
  echo "      Caricamento config: ${LOCAL_ENV}"
  set -a
  # shellcheck source=/dev/null
  source "${LOCAL_ENV}"
  set +a
  echo ""
fi

SSH_USER_HOST="${PICOCLAW_SSH_USER_HOST:-matteo@192.168.2.136}"
REMOTE_DIST="/home/matteo/picoclaw-ui/dist/"
HTTP_CHECK_URL="${PICOCLAW_HTTP_CHECK_URL:-http://192.168.2.136:3000/}"

# Argomenti extra per ssh/rsync -e (Cursor: spesso serve -i + IdentitiesOnly=yes)
RSYNC_SSH_CMD=(ssh)
if [[ -n "${PICOCLAW_SSH_CONFIG:-}" ]]; then
  if [[ ! -f "${PICOCLAW_SSH_CONFIG}" ]]; then
    echo "ERRORE: PICOCLAW_SSH_CONFIG punta a un file inesistente: \"${PICOCLAW_SSH_CONFIG}\"" >&2
    exit 1
  fi
  RSYNC_SSH_CMD+=(-F "${PICOCLAW_SSH_CONFIG}")
fi
if [[ -n "${PICOCLAW_SSH_IDENTITY_FILE:-}" ]]; then
  if [[ ! -f "${PICOCLAW_SSH_IDENTITY_FILE}" ]]; then
    echo "ERRORE: PICOCLAW_SSH_IDENTITY_FILE punta a un file inesistente: \"${PICOCLAW_SSH_IDENTITY_FILE}\"" >&2
    exit 1
  fi
  RSYNC_SSH_CMD+=(-i "${PICOCLAW_SSH_IDENTITY_FILE}" -o IdentitiesOnly=yes)
fi

# Stringa per rsync -e (quoting sicuro per path con spazi)
RSYNC_SSH_STRING=$(printf '%q ' "${RSYNC_SSH_CMD[@]}")
RSYNC_SSH_STRING="${RSYNC_SSH_STRING% }"

ssh_deploy() {
  if [[ ${#RSYNC_SSH_CMD[@]} -gt 1 ]]; then
    "${RSYNC_SSH_CMD[@]}" "$@"
  else
    ssh "$@"
  fi
}

echo "[1/5] Verifica strumenti: ssh, rsync..."
require_cmd ssh
require_cmd rsync
echo ""

echo "[2/5] Caricamento nvm e selezione Node 20..."
export NVM_DIR="${NVM_DIR:-$HOME/.nvm}"
if [[ ! -s "${NVM_DIR}/nvm.sh" ]]; then
  echo "ERRORE: nvm non trovato in \"${NVM_DIR}/nvm.sh\". Installa nvm o imposta NVM_DIR." >&2
  exit 1
fi
# shellcheck source=/dev/null
source "${NVM_DIR}/nvm.sh"
nvm use 20
require_cmd node
require_cmd npm
echo "      Node attivo: $(command -v node) ($(node -v))"
echo ""

echo "[3/5] Build UI (npm run build) in \"${UI_DIR}\"..."
cd "${UI_DIR}"
npm run build
if [[ ! -d "${DIST_DIR}" ]]; then
  echo "ERRORE: cartella dist non trovata dopo la build: \"${DIST_DIR}\"" >&2
  exit 1
fi
echo ""

echo "[4/5] Rsync dist → ${SSH_USER_HOST}:${REMOTE_DIST} (-av --delete)..."
if [[ ${#RSYNC_SSH_CMD[@]} -gt 1 ]]; then
  echo "      rsync usa: ${RSYNC_SSH_STRING}"
  rsync -av --delete -e "${RSYNC_SSH_STRING}" "${DIST_DIR}/" "${SSH_USER_HOST}:${REMOTE_DIST}"
else
  rsync -av --delete "${DIST_DIR}/" "${SSH_USER_HOST}:${REMOTE_DIST}"
fi
echo ""

echo "[5/5] Riavvio servizio picoclaw-ui via SSH..."
ssh_deploy "${SSH_USER_HOST}" 'sudo systemctl restart picoclaw-ui'
echo "      systemctl restart picoclaw-ui completato."
echo ""

echo "Verifica endpoint: ${HTTP_CHECK_URL}"
require_cmd curl
if ! curl -fsS --connect-timeout 5 --max-time 15 -o /dev/null "${HTTP_CHECK_URL}"; then
  echo "" >&2
  echo "ERRORE: il servizio su ${HTTP_CHECK_URL} non risponde (o risposta HTTP non valida)." >&2
  echo "        Controlla picoclaw-ui (systemctl status), firewall e che la porta 3000 sia in ascolto." >&2
  exit 1
fi
echo "      HTTP OK."
echo ""

echo "Deploy completato"
