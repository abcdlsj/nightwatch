#!/usr/bin/env bash
# 把 src/ 下的分片按文件名顺序拼接成单文件可玩版本 dist/index.html，字体拷到 dist/fonts/
set -euo pipefail
cd "$(dirname "$0")"
mkdir -p dist/fonts
cat src/01-shell.html $(ls src/*.js | LC_ALL=C sort) > dist/index.html
cp assets/fonts/*.woff2 dist/fonts/
# 语法检查：抽出 <script> 内的 JS 交给 node 检查
sed -n '/<script>/,/<\/script>/p' dist/index.html | sed '1d;$d' > /tmp/_chain_check.js
node --check /tmp/_chain_check.js
# 字体子集只收了 assets/fonts/chars.txt 里的字；文案里出现新字时提醒重新跑 tools/fontsub.py（缺的字会用系统字体顶上，不影响运行）
node -e '
const fs=require("fs");const have=new Set(fs.readFileSync("assets/fonts/chars.txt","utf8"));
const miss=new Set();for(const f of fs.readdirSync("src"))if(!f.startsWith("02e"))for(const c of fs.readFileSync("src/"+f,"utf8"))if(c.charCodeAt(0)>0x7f&&!have.has(c))miss.add(c);
if(miss.size)console.log("提醒：字体里缺 "+miss.size+" 个字（"+[...miss].slice(0,20).join("")+"），跑一下 python3 tools/fontsub.py");'
echo "built dist/index.html ($(wc -c < dist/index.html) bytes)"
