/* 语言包完整性：代码里用到的界面文字键都要在 zh-CN 里；数据表的每一项都要有文案 / Locale completeness: every UI string key used in code must exist in zh-CN, and every data-table entry must have text */
import { describe, it, expect } from 'vitest';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
import zh from '../../src/locales/zh-CN';
import { ITEMS } from '../../src/data/cards';
import { RELICS } from '../../src/data/relics';
import { TALENTS } from '../../src/data/talents';
import { EN } from '../../src/data/enemies';
import { EVENTS } from '../../src/data/events';
import { HEROES } from '../../src/data/heroes';
import { ACH } from '../../src/data/meta';

const walk = (d: string): string[] => readdirSync(d).flatMap((f) => (statSync(join(d, f)).isDirectory() ? walk(join(d, f)) : f.endsWith('.ts') ? [join(d, f)] : []));
const get = (o: any, k: string) => k.split('.').reduce((x, p) => (x == null ? x : x[p]), o);

describe('zh-CN 语言包', () => {
  it('t() 用到的键都存在', () => {
    const missing: string[] = [];
    for (const f of walk('src')) {
      const src = readFileSync(f, 'utf8');
      for (const m of src.matchAll(/\bt\('([a-zA-Z0-9_.]+)'/g)) if (typeof get(zh.ui, m[1]) !== 'string') missing.push(`${f}: ${m[1]}`);
    }
    expect(missing).toEqual([]);
  });
  it('每张卡、遗物、天赋、敌人、事件、人物、成就都有名字', () => {
    const lack = (reg: Record<string, unknown>, text: Record<string, any>, f = 'n') => Object.keys(reg).filter((k) => !text[k]?.[f]);
    expect(lack(ITEMS, zh.cards)).toEqual([]);
    expect(lack(ITEMS, zh.cards, 'd')).toEqual([]);
    expect(lack(RELICS, zh.relics)).toEqual([]);
    expect(lack(TALENTS, zh.talents)).toEqual([]);
    expect(lack(EN, zh.enemies)).toEqual([]);
    expect(lack(EVENTS, zh.events)).toEqual([]);
    expect(lack(HEROES, zh.heroes.heroes)).toEqual([]);
    expect(ACH.filter((a) => !(zh.meta.ach as any)[a.id]?.n)).toEqual([]);
  });
  it('按人物区分的台词覆盖所有人物（新加人物时别漏）', () => {
    const miss: string[] = [];
    const walk = (v: any, path: string) => {
      if (v && typeof v === 'object' && !Array.isArray(v)) {
        if ('ayla' in v && 'mo' in v) {
          for (const h of Object.keys(HEROES)) if (v[h] == null) miss.push(`${path} 缺 ${h}`);
          return;
        }
        for (const k in v) walk(v[k], path + '.' + k);
      } else if (Array.isArray(v)) v.forEach((x, i) => walk(x, `${path}[${i}]`));
    };
    walk(zh.story, 'story');
    walk(zh.ui, 'ui');
    expect(miss).toEqual([]);
  });

  it('数据文件里没有夹带中文（文案都在语言包里）', () => {
    const bad: string[] = [];
    for (const f of walk('src/data'))
      readFileSync(f, 'utf8')
        .split('\n')
        .forEach((line, i) => {
          const code = line.replace(/\/\*.*?\*\/|\/\/.*$|\/\*\*.*$|^\s*\*.*$/g, '');
          if (/[一-鿿]/.test(code)) bad.push(`${f}:${i + 1}`);
        });
    expect(bad).toEqual([]);
  });
});
