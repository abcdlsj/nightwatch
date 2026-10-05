/* 字体子集只收了 tools/font-chars.txt 里的字。文案里出现新字时提醒重新跑 npm run fonts
 * （缺的字会用系统字体顶上，不影响运行，所以这里只提醒不报错）。
 * 屏幕上的字都在 src/locales、mods 和 index.html 里，代码注释不算
 * The font subset only contains the characters in tools/font-chars.txt. When new characters appear in text, remind to rerun npm run fonts (missing glyphs fall back to system fonts and do not break anything, so this only warns). On-screen text lives in src/locales, mods and index.html; code comments do not count
 */
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';

const have = new Set(readFileSync('tools/font-chars.txt', 'utf8'));
const walk = (d) => readdirSync(d).flatMap((f) => (statSync(join(d, f)).isDirectory() ? walk(join(d, f)) : [join(d, f)]));
/* 模组（mods/）里的文字也会显示在屏幕上 / text inside mods (mods/) also shows on screen */
const files = [...walk('src/locales'), ...walk('mods').filter((f) => f.endsWith('.ts')), 'index.html'];
const miss = new Set();
const noComments = (s) => s.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '');
for (const f of files) for (const c of noComments(readFileSync(f, 'utf8'))) if (c.charCodeAt(0) > 0x7f && !have.has(c)) miss.add(c);
if (miss.size) console.log(`提醒：字体里缺 ${miss.size} 个字（${[...miss].slice(0, 20).join('')}），跑一下 npm run fonts`);
