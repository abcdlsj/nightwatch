/* 一局的流程：开局 → 备战 → 开战 → 战报 / 拦路结算 / 城破 → 黎明 → 无尽 */
import { ITEMS, TIERS } from '../data/cards';
import { EN, FOESETS } from '../data/enemies';
import { HEROES } from '../data/heroes';
import { RELICS } from '../data/relics';
import { WAGERS } from '../data/meta';
import { L, t } from '../i18n';
import { pick, reseed, newSeed, rng } from '../core/rng';
import { G, freshRun, type PrepStop } from '../game/state';
import { recalcMods } from '../game/mods';
import { boardCards } from '../game/cards';
import { codexSweep, runWon, mastStart, nextBoss, markBoss } from '../game/meta';
import { NIGHTS, nightKind, lastNight, finalBosses } from '../game/plan';
import { rollDoors, hordeWave, ambushWave, ambushGold, placeKit } from '../game/prep';
import { rollGear, withFit } from '../game/loot';
import { nightInfo } from '../game/nights';
import { nightRewards } from '../game/rewards';
import { saveGame, loadSave, restoreSave } from '../game/save';
import { makeWave } from '../sim/waves';
import { B, startBattle as simStart, settleWin, clearBattle, setOnEnd } from '../sim/battle';
import { world } from '../sim/world';
import type { Battle } from '../sim/types';
import { setScene } from '../render/background';
import { F, resizeField, clearFieldFx, clientToFieldX } from '../render/field';
import { FX } from '../render/overlay';
import { SFX } from '../audio/sfx';
import { $, restart } from '../ui/dom';
import { elOf, renderOwned, repaint, clearCardEls, clearCharges } from '../ui/card-view';
import { updateHUD, renderRelics, toast, banner, resetGoldBump } from '../ui/hud';
import { say, clearVO } from '../ui/voice';
import { closeSheet } from '../ui/sheets';
import { playPrologue, playWin, playLose } from '../ui/story';
import { showReport, type Row } from '../ui/report';
import { prepBossbar } from '../ui/battle-view';
import { renderPreview, renderPrep } from './prep/view';
import { relicChoice, gainRelic } from './prep/actions';
import { cancelDrag } from './prep/drag';
import { setDrawer, UI_drawer } from './prep/drawer';
import { pickKit, endScreen, heroSelect } from './screens';

/** 网址里带 ?seed=123 时用固定种子（测试和复现问题用） */
function seedFromUrl() {
  const s = new URLSearchParams(location.search).get('seed');
  return s != null && /^\d+$/.test(s) ? +s >>> 0 : null;
}

/* ---------------- 开局 ---------------- */
export function newGame(hero: string) {
  clearCardEls();
  G.seed = seedFromUrl() ?? newSeed();
  reseed(G.seed);
  G.hero = hero || G.hero;
  const H = HEROES[G.hero];

  Object.assign(G, {
    heat: 0, run: freshRun(), round: 1, maxRound: NIGHTS, endless: false, lock: null, fightWave: null, gold: H.gold, wall: H.wall, wallMax: H.wall,
    cards: [], relics: [], skills: [], bestChain: 0, secret: {}, foeSet: pick(Object.keys(FOESETS)), full: false, gems: {}, arc: 0,
  });
  G.boss9 = nextBoss(G.hero);
  G.boss12 = pick(finalBosses().filter((k) => k !== G.boss9));
  recalcMods();
  renderRelics();
  pickKit((kit, hh) => {
    /* 长夜难度在起手页里选：第 4 档起城墙上限 -15% */
    G.heat = hh;
    G.wall = G.wallMax = Math.round(H.wall * (hh >= 4 ? 0.85 : 1));
    placeKit(kit.cards);
    if (kit.gold) G.gold = Math.max(0, G.gold + kit.gold);
    mastStart();
    renderRelics(G.relics.length);
    resetGoldBump();
    renderOwned();
    updateHUD();
    G.firstPrep = true;
    playPrologue(() => toPrep());
  });
}

/** 接着上回的存档 */
export function resumeSave() {
  const s = loadSave();
  clearCardEls();
  if (!restoreSave(s)) {
    heroSelect();
    return;
  }
  renderRelics();
  resetGoldBump();
  renderOwned();
  updateHUD();
  toPrep();
  toast(t('flow.resumed', { r: G.round }));
}

/* ---------------- 备战 ---------------- */
export function toPrep() {
  /* 存档里记的是进入备战之前的随机数状态：读档回来，今晚的出怪和三站跟存档时一样 */
  const rs = rng.state;
  setTimeout(() => saveGame(rs), 0);
  G.phase = 'prep';
  clearBattle();
  setScene('shop');
  $('#report').hidden = true;
  $('#bossbar').hidden = true;
  F.cv.style.display = 'none';
  G.prep = { step: 0, cur: null, doors: [], talk: G.round % 2 === 1 };
  G.nextWave = makeWave(G.round);
  clearCharges();
  for (const c of G.cards) {
    c.nb = null;
    c.right = null;
  }
  rollDoors();
  renderPreview();
  $('#prep').hidden = false;
  renderPrep();
  renderOwned();
  updateHUD();
  if (G.firstPrep && !G.prep.talk) G.firstPrep = false;
}

/* ---------------- 开战 ---------------- */
/** 战场大小变了（转屏、抽屉开合）：重排画布，战斗中重新量卡牌出手位置 */
export function fitField() {
  resizeField();
  if (B) for (const c of boardCards()) c.ox = world.originX(c);
}

export function startBattle() {
  if (!boardCards().length) {
    toast(L.ui.battle.noCards);
    SFX.play('bad');
    return;
  }
  cancelDrag();
  closeSheet();
  if (UI_drawer()) setDrawer(false);
  G.phase = 'battle';
  codexSweep();
  const amb = !!G.fightWave;
  let wave = G.fightWave || G.nextWave!;
  if (!amb && G.prep.wager === 'horde') wave = hordeWave(wave);
  setScene(wave.some((s) => EN[s.type].boss) ? 'boss' : 'battle');
  if (!amb && G.round === NIGHTS && !G.endless) markBoss(G.hero, G.boss9);
  clearVO();
  clearFieldFx();
  $('#prep').hidden = true;
  $('#report').hidden = true;
  F.cv.style.display = 'block';
  const bd = wave.map((s) => EN[s.type]).find((d) => d.intents);
  world.top = Math.ceil(prepBossbar(bd) / F.s);
  world.originX = (c) => {
    const el = elOf(c);
    return el ? clientToFieldX(el) : ((c.idx + c.size / 2) / 8) * world.W;
  };
  updateHUD();
  const nk = nightKind(G.round);
  const hard = amb || nk === 'boss' || nk === 'hidden';
  banner(amb ? t('battle.ambushTitle', { n: bd!.n }) : nightInfo(G.round).title, hard ? '#ff6b5b' : nk === 'elite' ? '#ffb37a' : '#fff');
  SFX.play(hard || nk === 'elite' ? 'intent' : 'ui');
  simStart({ wave, ambush: amb, wager: amb ? null : G.prep.wager || null, beats: amb ? [] : nightInfo(G.round).beats });
  updateHUD();
}

/* ---------------- 收尾 ---------------- */
export function initFlow() {
  setOnEnd((b) => {
    if (b.ambush) return b.result === 'win' ? ambushWin(b) : ambushLose(b);
    return b.result === 'win' ? winBattle(b) : loseBattle(b);
  });
}

/** 任务完成：卡变成新卡 */
function showQuests(done: ReturnType<typeof settleWin>) {
  for (const { c, from } of done) {
    repaint(c);
    toast(t('flow.questDone', { a: from, b: ITEMS[c.key].n }));
    setTimeout(() => {
      const el = elOf(c);
      if (!el) return;
      restart(el, 'merge');
      FX.burstAt(el, '#ffd166', 30);
    }, 60);
  }
}

function winBattle(b: Battle) {
  G.phase = 'report';
  $('#bossbar').hidden = true;
  SFX.play('win');
  say('hero', L.story.barks.win, 2);
  showQuests(settleWin());
  clearCharges();
  const was = G.round;
  if (was >= G.maxRound) {
    if (b.wager && G.run) G.run.wagers++;
    runWon();
    banner(L.ui.flow.dawn, '#ffe79a');
    setScene('shop');
    setTimeout(() => playWin(() => endScreen(true)), 1400);
    return;
  }
  updateHUD();
  const T = L.ui.flow;
  const rows: Row[] = nightRewards(was, b.wallLost).map(([k, v]) => [T[k], v]);
  if (b.greed) rows.push([T.dropped, 0, b.greed]);
  rows.push(...wagerPay(b));
  const total = rows.reduce((s, r) => s + r[1], 0);
  codexSweep();
  showReport(b, was, rows, total, () => {
    G.gold += total;
    G.round++;
    $('#report').hidden = true;
    toPrep();
  });
}

/** 加码守住了：发奖励，返回战报里的行 */
function wagerPay(b: Battle): Row[] {
  const W = WAGERS[b.wager!];
  if (!W) return [];
  G.run!.wagers++;
  const rows: Row[] = [];
  const lb = L.ui.flow.wagerPre + W.n;
  if (W.gold) rows.push([lb, W.gold]);
  if (W.heal) {
    G.wall = Math.min(G.wallMax, G.wall + W.heal);
    rows.push([L.ui.flow.wagerHeal, 0, 0, t('flow.wallPlus', { n: W.heal })]);
  }
  if (W.relic) {
    const r = rollGear(1, 1)[0];
    if (r) {
      gainRelic(r, true);
      rows.push([lb, 0, 0, RELICS[r].n]);
    }
  }
  if (W.up) {
    const c = pick(G.cards.filter((x) => x.loc === 'board' && x.tier < 2));
    if (c) {
      c.tier++;
      repaint(c);
      rows.push([lb, 0, 0, ITEMS[c.key].n + ' → ' + TIERS[c.tier].n]);
    } else rows.push([lb, 3]);
  }
  return rows;
}

function loseBattle(b: Battle) {
  if (G.run) G.run.kills += b.kills;
  G.phase = 'over';
  SFX.play('lose');
  G.bestChain = Math.max(G.bestChain, b.maxChain);
  banner(pickFall(), '#ff6b5b');
  setTimeout(() => playLose(() => endScreen(false)), 1400);
}
const pickFall = () => (L.story.report.fall as Record<string, string>)[G.hero];

/* ---------------- 拦路 ---------------- */
export function startAmbush(cur: PrepStop) {
  if (!boardCards().length) {
    toast(L.ui.battle.noCards);
    SFX.play('bad');
    return;
  }
  G.prep.fought = true;
  G.fightWave = ambushWave(cur.foe);
  startBattle();
}
/** 拦路打完（不论输赢）回到备战 */
function ambushEnd() {
  G.phase = 'prep';
  settleWin();
  SFX.play('win');
  clearCharges();
  G.fightWave = null;
  clearVO();
  setScene('shop');
  $('#bossbar').hidden = true;
  F.cv.style.display = 'none';
  $('#prep').hidden = false;
}
function ambushWin(b: Battle) {
  const fled = b.fled;
  ambushEnd();
  const cur = G.prep.cur!;
  G.gold += ambushGold();
  const T = L.ui.flow;
  if (fled) {
    Object.assign(cur, { mode: 'reward', text: t('flow.ambushFled', { n: ambushGold() }), apply: () => {} });
    renderOwned();
    renderPrep();
    updateHUD();
    return;
  }
  relicChoice(cur, t('flow.ambushWon', { n: ambushGold() }), withFit(rollGear(3, 3)));
  renderOwned();
  renderPrep();
  updateHUD();
  banner(T.held, '#ffe79a');
}
/** 拦路：墙快塌了就算输，墙最少留 1，这一站白走，但这局不算输 */
function ambushLose(_b: Battle) {
  ambushEnd();
  SFX.play('lose');
  const cur = G.prep.cur!;
  Object.assign(cur, { mode: 'reward', text: t('flow.ambushLost', { w: G.wall <= 1 ? L.ui.flow.wallLast : '' }), apply: () => {} });
  renderPrep();
  updateHUD();
  banner(L.ui.flow.notHeld, '#ff8a80');
}

/* ---------------- 无尽长夜 ---------------- */
export function continueEndless() {
  G.round = lastNight() + 1;
  G.endless = true;
  G.maxRound = 999;
  if (G.run) {
    G.run.got = [];
    G.run.newHeat = 0;
  }
  $('#screen').hidden = true;
  G.gold += 5;
  G.wall = Math.max(G.wall, Math.ceil(G.wallMax * 0.5));
  toPrep();
  toast(L.ui.flow.endlessGo);
}

