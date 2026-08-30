#!/usr/bin/env bash
# Cria (ou atualiza) o proxy host do blog no nginx-proxy-manager.
#
#   NPM_USER='admin@exemplo' NPM_PASS='senha' ./npm-proxy-host.sh
#
# Idempotente: se o domínio já existir, só ajusta destino e flags.
# Não imprime a senha em lugar nenhum. O login também não fica embutido aqui:
# este repositório tem remoto, e credencial de painel não entra em histórico.
set -euo pipefail

API=http://127.0.0.1:81/api
DOMAIN=${DOMAIN:-blog.solveweb.com.br}
TARGET_HOST=${TARGET_HOST:-blog}
TARGET_PORT=${TARGET_PORT:-3000}
: "${NPM_USER:?defina NPM_USER}"
: "${NPM_PASS:?defina NPM_PASS}"
IDENTITY=$NPM_USER
LE_EMAIL=${LE_EMAIL:-$IDENTITY}

export NPM_USER_IDENT="$IDENTITY"
TOKEN=$(curl -s -X POST "$API/tokens" -H 'Content-Type: application/json' \
  -d "$(python3 -c 'import json,os;print(json.dumps({"identity":os.environ["NPM_USER_IDENT"],"secret":os.environ["NPM_PASS"]}))')" \
  | python3 -c 'import sys,json;print(json.load(sys.stdin).get("token",""))')
[ -n "$TOKEN" ] || { echo "FALHA no login do NPM (senha inválida?)"; exit 1; }
echo "login OK"

export D="$DOMAIN" TH="$TARGET_HOST" TP="$TARGET_PORT" LE="$LE_EMAIL"

existing=$(curl -s "$API/nginx/proxy-hosts" -H "Authorization: Bearer $TOKEN" \
  | python3 -c "
import sys, json, os
d = json.load(sys.stdin)
print(next((str(h['id']) for h in d if os.environ['D'] in h['domain_names']), ''))")

# Flags de segurança. Ficam num PUT separado de propósito: ao CRIAR um host
# pedindo certificado novo, o NPM grava o host antes de o Let's Encrypt
# responder e descarta ssl_forced/http2/hsts do corpo. Reenviar depois, com o
# certificado já emitido, é o que faz o Force SSL valer.
flags() {
python3 -c "
import json, os
print(json.dumps({
  'domain_names': [os.environ['D']],
  'forward_scheme': 'http',
  'forward_host': os.environ['TH'],
  'forward_port': int(os.environ['TP']),
  'access_list_id': 0,
  'ssl_forced': True,
  'http2_support': True,
  'hsts_enabled': True,
  'hsts_subdomains': False,
  'caching_enabled': False,
  'block_exploits': True,
  'allow_websocket_upgrade': True,
  'advanced_config': '',
  'locations': [],
  'meta': {'letsencrypt_agree': True, 'dns_challenge': False, 'letsencrypt_email': os.environ['LE']},
}))"
}

if [ -z "$existing" ]; then
  echo "criando $DOMAIN -> $TARGET_HOST:$TARGET_PORT (certificado Let's Encrypt)"
  body=$(flags | python3 -c 'import sys,json;d=json.load(sys.stdin);d["certificate_id"]="new";print(json.dumps(d))')
  curl -s -X POST "$API/nginx/proxy-hosts" -H "Authorization: Bearer $TOKEN" \
    -H 'Content-Type: application/json' -d "$body" -o /tmp/npm-resp.json -w "  HTTP %{http_code}\n"
  existing=$(python3 -c "
import json
d = json.load(open('/tmp/npm-resp.json'))
print(d.get('id') or '')
import sys
msg = d.get('error', {}).get('message', '')
if msg: print('  erro:', msg, file=sys.stderr)")
  rm -f /tmp/npm-resp.json
  [ -n "$existing" ] || { echo "não criou o host"; exit 1; }
  echo "  id $existing"
else
  echo "$DOMAIN já existe (id $existing)"
fi

echo "reenviando flags (Force SSL / HTTP2 / HSTS) no host $existing"
curl -s -X PUT "$API/nginx/proxy-hosts/$existing" -H "Authorization: Bearer $TOKEN" \
  -H 'Content-Type: application/json' -d "$(flags)" -o /tmp/npm-put.json -w "  HTTP %{http_code}\n"
python3 -c "
import json
d = json.load(open('/tmp/npm-put.json'))
print('  cert', d.get('certificate_id'), '| ssl_forced', d.get('ssl_forced'),
      '| http2', d.get('http2_support'), '| hsts', d.get('hsts_enabled'))"
rm -f /tmp/npm-put.json
