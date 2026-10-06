/* 平衡旋钮：几处关键系数集中在这里，平衡测试（npm run bench）可以用 TUNE='{"combo":0.1}' 临时覆盖 / Balance knobs: the key coefficients live here; balance tests (npm run bench) can override temporarily with TUNE='{"combo":0.1}' */
export const TUNE = {
  /** 连锁倍率：每深一层 +多少 / chain multiplier: how much each extra depth adds */
  combo: 0.1,
  /** 连锁倍率最多算几层 / maximum chain depth counted */
  comboMax: 8,
  /** 普朗克时间：同一张卡两次触发至少隔这么久（秒）。冷却、回响、齐鸣、遗物带动都算，每秒最多 4 次 / Planck time: the minimum gap between two triggers of the same card (seconds). Cooldowns, echoes, choruses and relic-driven hits all count; at most 4 per second */
  planck: 0.25,
  /** C 位的独立乘区 / the carry's independent multiplier */
  carry: 1.25,
  /** 狼牙拍这类「护盾转伤害」的卡，护盾最多算多少点 / for 'shield-to-damage' cards like the Wolf-Tooth Flail, the maximum shield points counted */
  shieldDmgCap: 40,
  /** 城墙护盾最多叠到城墙上限的几倍（石钧的工事靠无限叠盾硬扛，压一压） / wall shield stacks to at most this multiple of max wall (Jun's works tanked by stacking shields without limit) */
  shieldCap: 1.2,
  /** 星辉每层 / starlight per stack */
  star: 0.1,
  /** 钻品质的独立乘区 / the diamond tier's independent multiplier */
  diamond: 1.25,
  /** 闪电第一跳的伤害比例、之后每跳的衰减 / the lightning chain's first-hop damage ratio and the decay on each later hop */
  bounceFirst: 0.6,
  bounceDecay: 0.8,
  /** 敌人血量每夜成长倍率 / enemy HP growth multiplier per night */
  hpGrowth: 1.34,
  /** 第 6 夜起每夜额外的血量倍率（后期没有乘区就打不动） / extra HP multiplier per night from night 6 (late game is unwinnable without multipliers) */
  lateHp: 1.14,
  /** 选目标时精英和首领「往前算」多少（0~1 的路程） / how far elites and bosses count as 'further forward' when targeting (0–1 of the path) */
  eliteFocus: 0.12,
  /** 首领血量倍率 / boss HP multiplier */
  bossHp: 1.6,
  /** 第 8、9 夜普通敌人血量是第 7 夜的几倍 / how many times night 7's normal-enemy HP nights 8 and 9 have */
  hp8: 1.25,
  hp9: 1.5,
  /** 完整线、无尽（第 9 夜以后）普通敌人的起算倍率，和第 9 夜分开调：第 9 夜放松了，完整线不跟着变简单 / the base multiplier for normal enemies after night 9 (full line, endless), tuned apart from night 9 so easing night 9 does not make the full line easier */
  hpFull: 1.77,
  /** 第 9 夜以后（完整线、无尽）普通敌人每夜血量倍率（取代上面两项） / normal-enemy HP multiplier per night after night 9 (full line, endless); replaces the two above */
  afterHp: 1.15,
  /** 隐藏首领的血量按早几夜的倍率算（它还会不停叫小怪挡在前面） / the hidden boss's HP uses an earlier night's multiplier (it also keeps summoning adds as shields) */
  hiddenEase: 3,
  /** 第 9 夜以后首领血量每夜倍率 / boss HP multiplier per night after night 9 */
  bossAfter: 1.17,
  /** 雾母的雾幕把射程线往下压多少（0~1 的路程） / how far the Fog Mother's mist lowers the range line (0–1 of the path) */
  veil: 0.14,
  /** 元素反应：追加效果的整体系数、同一个敌人两次反应至少隔多久（秒） / elemental reactions: the overall coefficient for bonus effects, and the minimum gap between two reactions on the same enemy (seconds) */
  rx: 1,
  rxCd: 0.5,
  /** 流派连招：同元素在多少秒内出手几次触发，触发后这个元素冷却多久 / archetype combo: how many hits of the same element within how many seconds trigger it, and that element's cooldown afterwards */
  streakWin: 3,
  streakN: 4,
  streakCd: 14,
  /** 连杀分级加速的秒数倍率（0 关掉） / kill-streak speed-up duration multiplier (0 disables) */
  frenzy: 1,
  /** 联动（双羁绊）倍率（0 关掉） / dual-synergy link multiplier (0 disables) */
  syn2: 1,
};
