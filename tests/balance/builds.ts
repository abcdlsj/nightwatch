/* 各流派的成型阵容：到第 N 夜大概会有哪些卡、什么品质、哪些遗物和天赋。
 * 卡按棋盘顺序写（辅助卡贴着主力），[从第几夜有, 卡, 词缀?]；任务卡在完成后换成新卡。
 * Assembled lineups per archetype: roughly which cards, at what tier, with which relics and talents by night N. Cards are written in board order (supports hug the carry), [from which night, card, affix?]; quest cards become new cards on completion.
 */
import { ITEMS } from '../../src/data/cards';
import { RELICS } from '../../src/data/relics';

/** [从第几夜有, 卡, 词缀?, 到第几夜为止?] / [from which night, card, affix?, until which night?] */
type Slot = [number, string, string?, number?];
interface Arch {
  hero: string;
  board: Slot[];
  relics: string[];
  talents: string[];
  /** 任务卡：第几夜起变成什么 / quest cards: what they become from which night */
  quests?: Record<string, [number, string]>;
  /** C 位候选（按优先级，棋盘上有哪张就立哪张；第 3 夜跃迁事件之后才有） / carry candidates (by priority; whichever is on the board becomes the carry; only available after the night-3 leap event) */
  carry?: string[];
}

export const ARCHS: Record<string, Arch> = {
  volt: {
    hero: 'mo',
    board: [[1, 'appwand'], [1, 'arcbottle'], [3, 'resonate'], [2, 'stormflask'], [4, 'tesla'], [6, 'thunder']],
    quests: { appwand: [3, 'thunderking'] },
    relics: ['wire', 'cloud', 'notes', 'stormeye', 'coil', 'medal'],
    talents: ['mo_20', 'quick', 'mo_21', 'mo_22'],
  },
  fire: {
    hero: 'mo',
    board: [[1, 'vial'], [1, 'icicle', undefined, 4], [2, 'prism'], [3, 'dualflask'], [4, 'frost', undefined, 5], [6, 'sunflare']],
    relics: ['tinder', 'oil', 'wisp', 'powder', 'dragonheart', 'medal'],
    talents: ['mo_00', 'quick', 'mo_01', 'mo_02'],
  },
  blade: {
    hero: 'ayla',
    board: [[1, 'dagger'], [1, 'oathsword'], [3, 'warhorn'], [2, 'arrowrain'], [4, 'axe']],
    quests: { oathsword: [4, 'nightsword'] },
    relics: ['whet', 'spike', 'scope', 'fang', 'medal', 'venom'],
    talents: ['ayla_10', 'sharp', 'ayla_11', 'ayla_12'],
  },
  ice: {
    hero: 'mo',
    board: [[1, 'condenser'], [1, 'vial'], [2, 'dualflask'], [3, 'rime'], [5, 'icebomb']],
    relics: ['icepack', 'charm', 'permafrost', 'medal', 'timer', 'glass'],
    talents: ['mo_10', 'quick', 'mo_11', 'mo_12'],
  },
  poison: {
    hero: 'mo',
    board: [[1, 'needle'], [1, 'acidvial', undefined, 4], [2, 'plague'], [2, 'snakekiss', undefined, 4], [3, 'concentrate'], [5, 'miasma']],
    relics: ['expired', 'medal', 'timer', 'scope', 'fang', 'shard'],
    talents: ['quick', 'sharp', 'heavy', 'early'],
  },
  mech: {
    hero: 'ying',
    board: [[1, 'gear'], [1, 'windup', undefined, 3], [2, 'clockwork'], [3, 'anvil'], [4, 'pendulum']],
    relics: ['grease', 'heart', 'earring', 'medal', 'pocketwatch', 'box'],
    talents: ['ying_10', 'ying_11', 'quick', 'ying_12'],
  },
  drill: {
    hero: 'ayla',
    board: [[1, 'pike'], [1, 'warhorn'], [2, 'shieldwall'], [3, 'rally'], [4, 'executioner'], [6, 'banner']],
    relics: ['whet', 'spike', 'medal', 'scope', 'fang', 'venom'],
    talents: ['ayla_10', 'sharp', 'ayla_11', 'ayla_12'],
    carry: ['shieldwall', 'executioner'],
  },
  cracker: {
    hero: 'ying',
    board: [[1, 'matchbox'], [1, 'crackers'], [2, 'stall'], [1, 'rocket'], [4, 'fireworks']],
    relics: ['tinder', 'fusebox', 'medal', 'powder', 'oilcan', 'lampbook'],
    talents: ['ying_20', 'ying_21', 'quick', 'ying_22'],
    carry: ['fireworks', 'stall'],
  },
  turret: {
    hero: 'jun',
    board: [[2, 'caltrop'], [1, 'scaffold'], [1, 'turret'], [3, 'shellman'], [5, 'bigcannon']],
    relics: ['plumb', 'blueprint', 'mortarboard', 'medal', 'grease', 'citadel'],
    talents: ['jun_10', 'jun_11', 'jun_20', 'jun_12'],
    carry: ['bigcannon', 'turret'],
  },
  works: {
    hero: 'jun',
    board: [[1, 'palisade'], [1, 'caltrop', undefined, 4], [1, 'watchtower'], [3, 'mortar'], [5, 'bastion']],
    relics: ['blueprint', 'plumb', 'spike', 'medal', 'mortarboard', 'citadel'],
    talents: ['jun_00', 'jun_01', 'jun_10', 'jun_02'],
    carry: ['watchtower', 'mortar'],
  },
  chart: {
    hero: 'li',
    board: [[1, 'astrolabe'], [1, 'starseed'], [3, 'lens'], [2, 'comet'], [5, 'orrery']],
    relics: ['telescope', 'starchart', 'compass', 'medal', 'fang', 'polaris'],
    talents: ['li_00', 'li_01', 'li_20', 'li_02'],
    carry: ['comet', 'starseed'],
  },
  frostar: {
    hero: 'li',
    board: [[1, 'frostar'], [1, 'starseed'], [2, 'rimelance'], [3, 'astrolabe'], [5, 'glacier']],
    relics: ['icepack', 'starchart', 'charm', 'telescope', 'permafrost', 'polaris'],
    talents: ['li_10', 'li_11', 'li_00', 'li_12'],
    carry: ['rimelance', 'glacier'],
  },
  meteor: {
    hero: 'li',
    board: [[1, 'stardust'], [1, 'astrolabe'], [2, 'pulsar'], [3, 'fallstar'], [4, 'starfire']],
    relics: ['telescope', 'wire', 'starchart', 'medal', 'compass', 'polaris'],
    talents: ['li_20', 'li_21', 'li_00', 'li_22'],
    carry: ['starfire', 'pulsar'],
  },
  line: {
    hero: 'jun',
    board: [[1, 'powderkeg'], [1, 'beacontower'], [2, 'beehive'], [3, 'gunner'], [5, 'trebuchet']],
    relics: ['plumb', 'blueprint', 'mortarboard', 'medal', 'grease', 'citadel'],
    talents: ['jun_20', 'jun_21', 'jun_10', 'jun_22'],
    carry: ['trebuchet', 'beehive'],
  },
  bulwark: {
    hero: 'jun',
    board: [[1, 'palisade'], [1, 'sling'], [2, 'spikewall'], [3, 'mason'], [4, 'moat']],
    relics: ['blueprint', 'plumb', 'spike', 'medal', 'mortarboard', 'citadel'],
    talents: ['jun_00', 'jun_01', 'jun_10', 'jun_02'],
    carry: ['spikewall', 'moat'],
  },
  scope: {
    hero: 'li',
    board: [[1, 'starseed'], [1, 'astrolabe'], [2, 'comet'], [3, 'spyglass'], [4, 'wishstar'], [5, 'northstar']],
    relics: ['telescope', 'starchart', 'compass', 'medal', 'fang', 'polaris'],
    talents: ['li_00', 'li_01', 'li_20', 'li_02'],
    carry: ['comet', 'starseed'],
  },
  aurora: {
    hero: 'li',
    board: [[1, 'frostar'], [1, 'starseed'], [2, 'icemoon'], [3, 'rimeglass'], [5, 'aurora']],
    relics: ['icepack', 'starchart', 'charm', 'telescope', 'permafrost', 'polaris'],
    talents: ['li_10', 'li_11', 'li_00', 'li_12'],
    carry: ['icemoon', 'aurora'],
  },
  nova: {
    hero: 'li',
    board: [[1, 'fallstar'], [1, 'astrolabe'], [2, 'nova'], [4, 'galaxy']],
    relics: ['telescope', 'wire', 'starchart', 'medal', 'compass', 'polaris'],
    talents: ['li_20', 'li_21', 'li_00', 'li_22'],
    carry: ['galaxy', 'nova'],
  },
  lamp: {
    hero: 'ying',
    board: [[1, 'oilspill'], [1, 'lamps'], [2, 'firefly'], [2, 'marquee'], [3, 'oilpot'], [4, 'skylantern']],
    relics: ['jarflies', 'oilcan', 'tinder', 'medal', 'lampbook', 'pocketwatch'],
    talents: ['ying_00', 'ying_01', 'quick', 'ying_02'],
  },
};

/** 第 N 夜的大致品质：前两夜铜/银，中期银，后期金，最后两夜主力一张钻 / rough tiers by night N: bronze/silver in the first two, silver mid-game, gold late, and one diamond carry in the last two nights */
const TIER = [0, 0, 1, 1, 1, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2];

export function boardFor(arch: string, r: number): [string, number, string?][] {
  const A = ARCHS[arch];
  const out: [string, number, string?][] = [];
  let used = 0;
  const mult = MODE === 'mult';
  A.board.forEach(([from, key0, adj0, until], i) => {
    if (r < from || (until && r > until)) return;
    /* 凑乘区：第 5 夜起主力旁边两张输出卡带回响 / stack multipliers: from night 5, the two damage cards beside the carry have echo */
    const adj = adj0 || (mult && r >= 5 && (i === 1 || i === 2) ? 'echo' : undefined);
    let key = key0;
    const q = A.quests?.[key0];
    if (q && r >= q[0]) key = q[1];
    const it = ITEMS[key];
    if (used + it.size > 8) return;
    used += it.size;
    /* 晚拿到的卡品质低一档；最后两夜第一张主力是钻 / cards obtained late are one tier lower; in the final two nights the first carry is diamond */
    let tier = Math.max(it.t, TIER[r - 1] - (r - from >= 2 ? 0 : 1));
    /* 凑乘区：第 7 夜起第一张主力是钻；完整线第 10 夜起每两夜再多一张钻（多出来的夜晚够合成） / stack multipliers: from night 7 the first carry is diamond; from full-line night 10 one more diamond every two nights (the extra nights allow merging) */
    if (mult && r >= 7 && out.length < 1 + Math.max(0, Math.floor((r - 8) / 2))) tier = 3;
    out.push([key, Math.min(mult ? 3 : 2, tier), it.dmg > 0 || !adj ? adj : undefined]);
  });
  return out;
}

/** plain：只靠加法（不拿传说遗物、不用回响、最高金品质）；mult：凑出独立乘区和连锁 / plain: additive only (no legendary relics, no echo, gold tier at most); mult: built for independent multipliers and chains */
export const MODE = (process.env.BUILD || 'plain') as 'plain' | 'mult';
const LEGEND: Record<string, string> = { volt: 'shard', fire: 'dragonheart', blade: 'venom', ice: 'oath', poison: 'shard', mech: 'box', lamp: 'lampbook', drill: 'venom', cracker: 'lampbook', turret: 'citadel', works: 'citadel', chart: 'polaris', frostar: 'polaris', meteor: 'polaris', line: 'citadel', bulwark: 'citadel', scope: 'polaris', aurora: 'polaris', nova: 'polaris' };

export function relicsFor(arch: string, r: number) {
  const n = [0, 1, 1, 2, 3, 4, 5, 6, 6, 7, 7, 8, 8, 9, 9][r - 1];
  const ok = (k: string) => RELICS[k] && (!RELICS[k].hero || RELICS[k].hero === ARCHS[arch].hero) && RELICS[k].t < 3 && k !== 'glass';
  const list = ARCHS[arch].relics.filter(ok).slice(0, n);
  if (MODE === 'mult' && r >= 6) list.push(LEGEND[arch]);
  /* 完整线后半程：再多一件传说（玻璃大炮这类通用的） / second half of the full line: one more legendary (a generic one like Glass Cannon) */
  if (MODE === 'mult' && r >= 12) list.push(LEGEND[arch] === 'shard' ? 'oath' : 'shard');
  return list;
}
export const talentsFor = (arch: string, r: number) => ARCHS[arch].talents.slice(0, Math.ceil(r / 2));
/** C 位：第 3 夜起有（跃迁事件）；璃每经过一次跃迁再点一颗星 / carry: present from night 3 (the leap event); Li lights another star after each leap */
export function carryFor(arch: string, r: number, keys: string[]): { key: string; star: number } | null {
  if (r < 3) return null;
  const A = ARCHS[arch];
  const order = [...(A.carry || []), ...keys];
  const key = order.find((k) => keys.includes(k));
  if (!key) return null;
  return { key, star: A.hero === 'li' ? [3, 5, 7, 11].filter((n) => n <= r).length : 0 };
}
