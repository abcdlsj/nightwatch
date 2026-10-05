/** 敌情：每夜除了剧情点名的敌人，其余出怪从这里抽 1~3 套。
 * comps 是三档编队（第 1~3 夜 / 第 4~6 夜 / 第 7 夜起），一档不填表示这一档不出现；
 * 每套编队打多少组按被换掉的那包的强度折算，所以编队本身不用凑强度。名字 n 和说明 d 在语言包里
 * Threats: apart from the enemies the story names, each night draws 1~3 of these for the rest of its spawns.
 * comps are three tiers of squads (nights 1~3 / 4~6 / 7+); an empty tier never appears. How many squads spawn is converted
 * from the strength of the pack being replaced, so squads need not be balanced by hand. Name n and description d live in the locale pack
 */
export interface ThreatDef {
  comps: (Record<string, number> | null)[];
  /** 抽中的权重 / draw weight */
  w: number;
  /** 强度修正：实测比估算强就填大于 1，组数按它除（不填为 1） / strength correction: above 1 if it plays stronger than estimated; squad count is divided by it (default 1) */
  pw?: number;
  n: string;
  d: string;
}

export const THREATS: Record<string, ThreatDef> = {
  /* 蜂群：又多又软 / Swarm: many and soft */
  swarm: { comps: [{ slime: 6 }, { bug: 3, slime: 4 }, { slime: 6, bug: 3, mimic: 1 }], w: 1, pw: 1.35 },
  /* 空袭：快，冲到墙下就炸 / Air raid: fast, explodes at the wall */
  air: { comps: [{ bat: 5 }, { bat: 4, bomber: 2 }, { bat: 5, bomber: 3 }], w: 1, pw: 0.75 },
  /* 重甲：护甲厚，怕穿甲、怕毒 / Heavy armor: thick armor, weak to pierce and poison */
  armor: { comps: [{ skel: 3, shieldb: 1 }, { skel: 2, shieldb: 2 }, { golem: 1, shieldb: 2 }], w: 1, pw: 1.15 },
  /* 亡灵：死灵法师会把倒下的拉起来 / Undead: necromancers raise the fallen */
  undead: { comps: [{ skel: 4 }, { skel: 3, necro: 1 }, { skel: 3, necro: 1, ghost: 2 }], w: 1, pw: 1.45 },
  /* 冲锋：鼓手催着狂战士往前冲 / Charge: drummers drive berserkers forward */
  charge: { comps: [null, { berserker: 2, drummer: 1 }, { berserker: 3, drummer: 1 }], w: 1, pw: 1.35 },
  /* 雾魂：从半路的雾里冒出来 / Mist: they rise out of the fog midway */
  mist: { comps: [{ ghost: 2 }, { ghost: 3, bat: 2 }, { ghost: 4, bomber: 1 }], w: 0.9, pw: 1.15 },
  /* 巫祝：萨满给身边的回血 / Rite: shamans heal those nearby */
  rite: { comps: [null, { skel: 3, shaman: 1 }, { golem: 1, shaman: 1, skel: 2 }], w: 0.9, pw: 0.9 },
  /* 火药：炸弹鼠成群 / Powder: bomb rats in packs */
  blast: { comps: [{ bomber: 3 }, { bomber: 3, bug: 2 }, { bomber: 4, berserker: 1 }], w: 0.8, pw: 0.55 },
} as never;
