#!/usr/bin/env bash
# 用三種語言的 agent-scan 掃同一批目錄，確認 stdout 與 exit code 逐字相同。
# 用法：./run-all.sh [DIR ...]   （不給參數就產生 fixtures 到暫存目錄並逐一掃描）
set -euo pipefail
cd "$(dirname "$0")"

tmp=$(mktemp -d)
trap 'rm -rf "$tmp"' EXIT

(cd go && go build -o "$tmp/agent-scan-go" .)

targets=("$@")
if [ ${#targets[@]} -eq 0 ]; then
  # fixtures 含模擬的注入內容，只產生在 repo 外的暫存目錄
  python3 -I fixtures/make_fixtures.py "$tmp/fixtures"
  targets=("$tmp/fixtures/benign" "$tmp/fixtures/poisoned" "$tmp/fixtures/home" "$tmp/fixtures/edge")
fi

status=0
for t in "${targets[@]}"; do
  set +e
  python3 -I py/agent_scan.py "$t" > "$tmp/out-py"; py=$?
  "$tmp/agent-scan-go" "$t" > "$tmp/out-go"; go=$?
  node ts/agent-scan.ts "$t" > "$tmp/out-ts"; ts=$?
  set -e
  name=${t#"$tmp/"}
  if cmp -s "$tmp/out-py" "$tmp/out-go" && cmp -s "$tmp/out-py" "$tmp/out-ts" && [ "$py" = "$go" ] && [ "$py" = "$ts" ]; then
    echo "OK    $name  (exit $py, $(tail -n 1 "$tmp/out-py"))"
  else
    echo "DIFF  $name  (exit py=$py go=$go ts=$ts)"
    diff "$tmp/out-py" "$tmp/out-go" || true
    diff "$tmp/out-py" "$tmp/out-ts" || true
    status=1
  fi
done
exit $status
