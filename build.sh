#!/usr/bin/env bash
# 把 src/ 下的分片按文件名顺序拼接成单文件可玩版本 dist/index.html
set -euo pipefail
cd "$(dirname "$0")"
mkdir -p dist
cat src/01-shell.html $(ls src/*.js | LC_ALL=C sort) > dist/index.html
# 语法检查：抽出 <script> 内的 JS 交给 node 检查
sed -n '/<script>/,/<\/script>/p' dist/index.html | sed '1d;$d' > /tmp/_chain_check.js
node --check /tmp/_chain_check.js
echo "built dist/index.html ($(wc -c < dist/index.html) bytes)"
