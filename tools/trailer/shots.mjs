/* 宣传片镜头：每个镜头一个函数，单独重录。用法：node tools/trailer/shots.mjs 镜头名...（不给就全录）
 * 帧和音效时间点写到 .local/trailer/clips/<镜头名>/
 * Trailer shots: one function per shot, re-recordable on its own. Usage: node tools/trailer/shots.mjs name... (none = all). Frames and SFX timings go to .local/trailer/clips/<name>/
 */
import { openGame, stage, fight, tick, record, center, dragPlan, both } from './lib.mjs';

/** 进商店并把货架换成指定的卡 / enter the shop and replace its offers with the given cards */
async function shop(pg, offers) {
  await pg.evaluate(async (offers) => {
    const g = window.__game, G = g.G;
    g.enterEvent('shop');
    const { ITEMS } = await import('/src/data/cards.ts');
    G.prep.cur.offers = offers.map(([key, tier, price]) => ({ card: { key, tier, adj: null, size: ITEMS[key].size }, price: price ?? 5, sold: false }));
    g.renderPrep();
  }, offers);
  await tick(pg, 700);
}
const offerAt = (pg, n) => center(pg, `#pbody .offer:nth-of-type(${n + 1}) .card`).then((p) => p || center(pg, `#pbody .offer >> nth=${n}`));
async function offerCard(pg, n) {
  return pg.evaluate((n) => {
    const r = document.querySelectorAll('#pbody .offer .card')[n].getBoundingClientRect();
    return { x: r.x + r.width / 2, y: r.y + r.height / 2 };
  }, n);
}
async function cell(pg, i) {
  return pg.evaluate((i) => {
    const r = [...document.querySelectorAll('#board .cell')].sort((a, b) => a.getBoundingClientRect().x - b.getBoundingClientRect().x)[i].getBoundingClientRect();
    return { x: r.x + r.width / 2, y: r.y + r.height / 2 };
  }, i);
}
async function boardCard(pg, key) {
  return pg.evaluate((key) => {
    const c = window.__game.G.cards.find((c) => c.loc === 'board' && c.key === key);
    const cells = [...document.querySelectorAll('#board .cell')].sort((a, b) => a.getBoundingClientRect().x - b.getBoundingClientRect().x);
    const a = cells[c.idx].getBoundingClientRect(), b = cells[c.idx + c.size - 1].getBoundingClientRect();
    return { x: (a.x + b.x + b.width) / 2, y: a.y + a.height / 2 };
  }, key);
}

const SHOTS = {
  /** 从商店拖一张卡放到棋盘上，贴着主力 / drag a card from the shop onto the board, next to the carry */
  async place(pg) {
    await stage(pg, 'blade', 3, { board: [['dagger', 1], ['oathsword', 1]] });
    await shop(pg, [['arrowrain', 1], ['warhorn', 1], ['axe', 1]]);
    const from = await offerCard(pg, 1), to = await cell(pg, 3);
    await record(pg, 'place', 4.5, dragPlan(pg, from, to, 0.8, 0.9));
  },
  /** 同名卡拖上去合成，连合两次：铜→银→金 / drop same-name cards on top to merge, twice: bronze→silver→gold */
  async merge(pg) {
    /* 第 4 夜预告里有精英名，用第 2 夜 / night 4's forecast names the elite, so use night 2 */
    await stage(pg, 'blade', 2, { board: [['oathsword', 1], ['warhorn', 1], ['dagger', 0]] });
    await shop(pg, [['dagger', 0], ['dagger', 1], ['axe', 1]]);
    const a = await offerCard(pg, 0), b = await offerCard(pg, 1), to = await boardCard(pg, 'dagger');
    await record(pg, 'merge', 6, both(dragPlan(pg, a, to, 0.6, 0.8), dragPlan(pg, b, to, 3.2, 0.8)));
  },
  /** 开头钩子：满屏怪潮压到墙前，卡牌齐射 / the hook: a full-screen horde at the wall, every card firing */
  async horde(pg) {
    await stage(pg, 'meteor', 8);
    await fight(pg);
    await tick(pg, 10500);
    await record(pg, 'horde', 4);
  },
  /** 火：灼烧蔓延 / fire spreading */
  async fire(pg) {
    await stage(pg, 'fire', 8);
    await fight(pg);
    await tick(pg, 9000);
    await record(pg, 'fire', 3.5);
  },
  /** 雷：连锁闪电 / chain lightning */
  async volt(pg) {
    await stage(pg, 'volt', 8);
    await fight(pg);
    await tick(pg, 9000);
    await record(pg, 'volt', 3.5);
  },
  /** 刀：连锁出手、暴击 / blades: chained shots and crits */
  async blade(pg) {
    await stage(pg, 'blade', 8);
    await fight(pg);
    await tick(pg, 7000);
    await record(pg, 'blade', 3.5);
  },
  /** 爆竹 / firecrackers */
  async cracker(pg) {
    await stage(pg, 'cracker', 8);
    await fight(pg);
    await tick(pg, 9000);
    await record(pg, 'cracker', 3.5);
  },
  /** 首领：第九夜开场，只露一下 / the boss: night 9's opening, just a glimpse */
  async boss(pg) {
    await stage(pg, 'meteor', 9);
    await fight(pg);
    await tick(pg, 2500);
    await record(pg, 'boss', 4);
  },
  /** 备战三扇门 / prep's three doors */
  async doors(pg) {
    /* 单数夜有夜谈、第 4 夜预告里有精英名，挑第 2 夜 / odd nights have a night talk and night 4's forecast names the elite, so use night 2 */
    await stage(pg, 'cracker', 2);
    await record(pg, 'doors', 3);
  },
  /** 工坊：从标题页点开，展示怎么加模组和已装的模组 / workshop: opened from the title screen, showing how to add mods and which are installed */
  async workshop(pg) {
    /* 官方模组还没装进游戏，「装了 0 个模组」那栏藏掉，只留怎么做模组 / the official mods aren't installed yet, so hide the '0 mods installed' list and keep only how to make one */
    await pg.addStyleTag({ content: '.sh .hs-h,.sh .tlist{display:none!important}' });
    const at = await center(pg, '#wsBtn');
    await record(pg, 'workshop', 4, async (i, t) => {
      if (i === 6) await pg.mouse.click(at.x, at.y);
    });
  },
  /** 标题画面，做结尾标版底图 / the title screen, as the end-slate background */
  async title(pg) {
    /* 只留标志和标语，按钮和规则列表藏掉，下面空出来放字 / keep only the logo and tagline; hide buttons and rules so the lower half is free for text */
    await pg.addStyleTag({ content: '#screen .rules,#screen .btn,#screen .t-grid{visibility:hidden!important}' });
    await record(pg, 'title', 6);
  },
};

const pick = process.argv.slice(2);
for (const name of pick.length ? pick : Object.keys(SHOTS)) {
  const g = await openGame();
  try {
    await SHOTS[name](g.pg);
  } finally {
    await g.close();
  }
}
