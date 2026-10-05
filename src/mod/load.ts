/* 读 mods/ 目录：每个子目录的 index.ts 默认导出一个模组包，构建时打进游戏。
 * 下划线开头的目录（比如 mods/_example）不加载，只当示例看。 */
import type { ModPack, ModReport } from './types';
import { applyMod } from './apply';

const found = import.meta.glob<{ default: ModPack }>(['../../mods/*/index.ts', '!../../mods/_*/index.ts'], { eager: true });

/** 加载结果（工坊页显示） */
export const MOD_REPORTS: ModReport[] = [];

export function loadMods() {
  const packs = Object.entries(found)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([path, m]) => ({ path, pack: m.default }));
  for (const { path, pack } of packs) {
    if (!pack || typeof pack !== 'object') {
      MOD_REPORTS.push({ id: path, name: path, added: {}, errors: ['index.ts 没有默认导出一个模组包（export default { id, name, ... }）'] });
      continue;
    }
    const r = applyMod(pack);
    MOD_REPORTS.push(r);
    if (r.errors.length) console.warn(`[模组 ${r.id}]`, r.errors.join('\n'));
  }
  return MOD_REPORTS;
}
