/** 连招谱：战斗里自己冒出来的组合。第一次打出来时慢镜头报名字，记进图鉴；没发现的只给一句提示。名字和说明在语言包 L.ui.combos 里
 * Combo book: combinations that emerge in battle. The first time one happens, slow motion announces its name and it goes into the codex; undiscovered ones show only a hint. Names and text live in L.ui.combos */
export interface ComboDef {
  id: string;
  /** 报名字和图鉴里用的颜色 / colour for the announcement and codex */
  c: string;
  /** 图鉴分组：反应 / 大招 / 构筑 / codex group: reaction / ultimate / build */
  g: 'rx' | 'ult' | 'build';
}

export const COMBOS: ComboDef[] = [
  { id: 'rx_melt', c: '#ff9a5a', g: 'rx' },
  { id: 'rx_shatter', c: '#c2f4ff', g: 'rx' },
  { id: 'rx_overload', c: '#fee761', g: 'rx' },
  { id: 'rx_toxic', c: '#b8f060', g: 'rx' },
  { id: 'rx_super', c: '#9ad8ff', g: 'rx' },
  { id: 'ult_blade', c: '#fff4cf', g: 'ult' },
  { id: 'ult_fire', c: '#ff8a5b', g: 'ult' },
  { id: 'ult_ice', c: '#73eff7', g: 'ult' },
  { id: 'ult_volt', c: '#fee761', g: 'ult' },
  { id: 'ult_mech', c: '#ffd166', g: 'ult' },
  { id: 'ult_poison', c: '#a7f070', g: 'ult' },
  { id: 'rx4', c: '#ff95dc', g: 'build' },
  { id: 'duet', c: '#ffb37a', g: 'build' },
  { id: 'echo8', c: '#c38cff', g: 'build' },
  { id: 'frenzy100', c: '#ff5a8a', g: 'build' },
];
export const COMBO = Object.fromEntries(COMBOS.map((d) => [d.id, d])) as Record<string, ComboDef>;
