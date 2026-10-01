/* 分层约束：规则层和模拟层不碰界面，换渲染、换平台时只动上层 */
import { describe, it, expect } from 'vitest';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';

const walk = (d: string): string[] => readdirSync(d).flatMap((f) => (statSync(join(d, f)).isDirectory() ? walk(join(d, f)) : f.endsWith('.ts') ? [join(d, f)] : []));
const RULES: Record<string, string[]> = {
  /* 目录: 不许 import 的目录 */
  'src/core': ['data', 'game', 'sim', 'ui', 'render', 'audio', 'app', 'platform', 'i18n'],
  'src/data': ['game', 'sim', 'ui', 'render', 'audio', 'app', 'platform', 'i18n'],
  'src/i18n': ['game', 'sim', 'ui', 'render', 'audio', 'app', 'platform'],
  'src/game': ['sim', 'ui', 'render', 'audio', 'app'],
  'src/sim': ['ui', 'render', 'audio', 'app'],
};

describe('分层', () => {
  for (const [dir, banned] of Object.entries(RULES))
    it(`${dir} 不依赖 ${banned.join('/')}，也不碰 DOM`, () => {
      const bad: string[] = [];
      for (const f of walk(dir)) {
        const src = readFileSync(f, 'utf8');
        for (const m of src.matchAll(/from '([^']+)'/g)) {
          const p = m[1];
          if (banned.some((b) => new RegExp(`(^|/)\\.\\.?/(\\.\\./)*${b}(/|$)`).test(p) || p.includes(`/${b}/`))) bad.push(`${f} → ${p}`);
        }
        if (/\bdocument\.|\bwindow\.|getBoundingClientRect|classList/.test(src.replace(/\/\*[\s\S]*?\*\//g, ''))) bad.push(`${f} 用到了 DOM`);
      }
      expect(bad).toEqual([]);
    });
});
