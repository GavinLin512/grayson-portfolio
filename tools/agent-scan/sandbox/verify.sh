#!/usr/bin/env bash
# 驗證沙箱的 6 個保證。用法：./verify.sh [額外的 compose 檔，例如 compose.ccr.yml]
set -uo pipefail
cd "$(dirname "$0")"
files=(-f docker-compose.yml)
[ $# -gt 0 ] && files+=(-f "$1")
dc() { docker compose "${files[@]}" "$@"; }
run() { dc run --rm -T agent "$@"; }

dc up -d --build --wait egress-proxy >/dev/null 2>&1 || dc up -d --build egress-proxy

echo "== 1. 經 proxy 連 allowlist 內的 registry.npmjs.org"
run node --no-warnings -e 'fetch("https://registry.npmjs.org/").then(r => console.log("HTTP", r.status), e => console.log("FAIL", e.cause?.code ?? e.message))'

echo "== 2. 經 proxy 連不在 allowlist 的網域（proxy 應回 403）"
run node --no-warnings -e '
const http = require("node:http");
for (const target of ["github.com:443", "example.com:443"]) {
  http.request({ host: "egress-proxy", port: 3128, method: "CONNECT", path: target })
    .on("connect", (res) => { console.log(target, "->", res.statusCode, res.statusMessage); res.socket.destroy(); })
    .on("error", (e) => console.log(target, "-> error", e.code)).end();
}'

echo "== 3. 不經 proxy 直接連外（拿掉 proxy 環境變數；internal 網路沒有對外路由）"
run env -u HTTP_PROXY -u HTTPS_PROXY -u NODE_USE_ENV_PROXY node --no-warnings -e '
const net = require("node:net");
fetch("https://registry.npmjs.org/", { signal: AbortSignal.timeout(5000) }).then(r => console.log("fetch", r.status), e => console.log("fetch (no proxy) FAIL", e.cause?.code ?? e.name));
net.connect({ host: "104.16.4.34", port: 443, timeout: 5000 })
  .on("connect", function () { console.log("raw IP connect OK (unexpected)"); this.destroy(); })
  .on("timeout", function () { console.log("raw IP connect FAIL timeout"); this.destroy(); })
  .on("error", (e) => console.log("raw IP connect FAIL", e.code));' \
  2>&1 | sed 's/^/   /'

echo "== 4. 只有 /workspace 與 tmpfs（/tmp、/home/node）可寫"
run sh -c 'for p in /workspace/probe /tmp/probe /home/node/probe /etc/probe /usr/local/bin/probe; do
  if touch "$p" 2>/dev/null; then echo "writable  $p"; rm -f "$p"; else echo "read-only $p"; fi; done'

echo "== 5. 非 root"
run id

echo "== 6. capabilities 全部清空、禁止提權"
run sh -c 'grep -E "^(CapInh|CapPrm|CapEff|CapBnd|CapAmb|NoNewPrivs)" /proc/self/status'

echo "== proxy access log（最後幾筆）"
dc exec -T egress-proxy tail -n 6 /var/log/squid/access.log
