#!/bin/bash
set -e

# Carrega les credencials FTP des del fitxer .env (no es pujarà a GitHub)
set -a
if [ -f .env ]; then
  source .env
fi
set +a

if [ -z "$FTP_HOST" ] || [ -z "$FTP_USER" ] || [ -z "$FTP_PASS" ]; then
  echo "Falten credencials FTP."
  echo "Crea un fitxer .env al directori arrel del projecte amb aquest contingut:"
  echo ""
  echo "FTP_HOST=ftp.mayordomo.dev"
  echo "FTP_USER=ftp.mayordomo.dev"
  echo "FTP_PASS=la_teva_contrasenya"
  echo ""
  exit 1
fi

BRANCH=$(git branch --show-current)
SAFE_BRANCH=$(echo "$BRANCH" | tr '/' '-')

# Per defecte es desplega a /safari/opencode/ (URL principal).
# Si vols una versió per branca, defineix DEPLOY_SUBDIR, però el servidor
# ha de estar configurat per servir subcarpetes noves.
SUBDIR=${DEPLOY_SUBDIR:-}
if [ -n "$SUBDIR" ]; then
  REMOTE_DIR="/var/www/mayordomo.dev/safari/opencode/$SUBDIR/"
  DEPLOY_PATH="/safari/opencode/$SUBDIR/"
  URL="https://mayordomo.dev/safari/opencode/$SUBDIR/"
else
  REMOTE_DIR="/var/www/mayordomo.dev/safari/opencode/"
  DEPLOY_PATH="/safari/opencode/"
  URL="https://mayordomo.dev/safari/opencode/"
fi

echo "Desplegant branca '$BRANCH' a $URL"

DEPLOY_PATH="$DEPLOY_PATH" npx vite build --config vite.opencode.config.ts

lftp -u "$FTP_USER,$FTP_PASS" "$FTP_HOST" -e "
  set ssl:verify-certificate no
  set ftp:ssl-allow no
  mirror -R --delete dist-opencode/ $REMOTE_DIR
  bye
"

echo "Desplegament complet: $URL"
