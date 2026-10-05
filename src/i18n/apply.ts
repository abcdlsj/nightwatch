/* 把语言包里的内容文字填进数据表。数据表里只有机制字段，文字字段由这里补齐 / Fill locale content into the data tables. The tables hold mechanics only; text fields are filled here */
import { ITEMS, ADJ, TIERS, GT, UPS } from '../data/cards';
import { RELICS } from '../data/relics';
import { TALENTS, TCAT } from '../data/talents';
import { EN, FOESETS } from '../data/enemies';
import { EVENTS } from '../data/events';
import { HEROES, KITS, PATHS } from '../data/heroes';
import { ACH, WAGERS } from '../data/meta';
import { VOICES } from '../data/voices';
import type { LocalePack } from './index';

const fill = (reg: Record<string, any>, text: Record<string, any>) => {
  for (const k in reg) if (text[k]) Object.assign(reg[k], text[k]);
};

export function applyLocale(P: LocalePack) {
  fill(ITEMS, P.cards);
  fill(RELICS, P.relics);
  fill(TALENTS, P.talents);
  fill(EVENTS, P.events);
  fill(ADJ, P.terms.adj);
  fill(WAGERS, P.meta.wagers);
  for (const k in EN) {
    const tx = (P.enemies as any)[k] || {};
    const e = EN[k];
    e.n = tx.n;
    e.tip = tx.tip;
    e.intro = tx.intro || null;
    if (e.intents) e.intents.forEach((it, i) => Object.assign(it, tx.intents?.[i]));
  }
  for (const k in HEROES) Object.assign(HEROES[k], (P.heroes.heroes as any)[k]);
  for (const k in KITS) KITS[k].forEach((kit, i) => Object.assign(kit, (P.heroes.kits as any)[k]?.[i]));
  for (const k in PATHS) for (const p of PATHS[k]) Object.assign(p, (P.heroes as any).paths?.[k]?.[p.id]);
  for (const a of ACH) Object.assign(a, (P.meta.ach as any)[a.id]);
  TIERS.forEach((t, i) => (t.n = P.terms.tiers[i]));
  GT.forEach((t, i) => (t.n = P.terms.relicGrades[i]));
  for (const k in UPS) UPS[k].t = (P.terms.ups as any)[k];
  for (const k in TCAT) TCAT[k].n = (P.terms.tcat as any)[k];
  for (const k in FOESETS) FOESETS[k].n = (P.terms.foesets as any)[k];
  for (const k in VOICES) VOICES[k].n = (P.terms.voices as any)[k];
}
