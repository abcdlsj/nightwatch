/* 示例模组：一个新人物「苇」、她的五张专属卡、一个第九夜首领「芦苇王」、一件遗物、一个说话人和一小段剧情。
 * 用法：把整个目录复制成 mods/你的模组名/（目录名不能以下划线开头），改里面的内容，npm run dev 就能在游戏里看到。
 * 说明见 docs/modding.md。
 * Sample mod: a new hero 'Wei', her five exclusive cards, a night-9 boss 'Reed King', a relic, a speaker and a short story. Usage: copy this whole directory to mods/your-mod-name/ (the name must not start with an underscore), edit the contents, and npm run dev will show it in-game. See docs/modding.md.
 */
import type { ModPack } from '../../src/mod/types';

const pack: ModPack = {
  id: 'example-ferry',
  name: '渡口',
  author: '你的名字',
  version: '1.0.0',
  desc: '水门底下摆渡的苇，和从芦苇荡里走出来的东西。',

  /* ---------------- 像素图：字母见 src/data/art/palette.ts，'.' 是透明 ----------------
   * 卡牌 16×16，立绘 32×32，首领 32~48。图的名字要和卡牌、人物立绘、敌人的 spr 对上
   * ---------------- Sprites: letters in src/data/art/palette.ts; '.' is transparent ---------------- / cards are 16×16, portraits 32×32, bosses 32–48. Sprite names must match the cards', portraits' and enemies' spr fields
   */
  sprites: {
    p_wei: [
      '...............kk...............',
      '..............kNNk..............',
      '............kkNNNNkkk...........',
      '..........kkNNNNNNNNmk..........',
      '.........kNNNNNNNNNNNNk.........',
      '.......kkNNNNNNNNNNNNNNkk.......',
      '.....kkNNNNNNNNNNNNNNNNNNkk.....',
      '....kNNNNNNNNNNNNNNNNNNNNNNk....',
      '...kNNNNNNNNNNNNNNNNNNNNNNNNkk..',
      '..knnnnnnnnnnnnnnnnnnnnnnnnnnnk.',
      '...kmkkmxxmffmffmffmFFmxxmkkmk..',
      '....k.kmxxffffffffffFFFxxxk.k...',
      '......kmxxfkwkffffkwkFFxxxk.....',
      '......kmxxfkkkffffkkkFFxxxk.....',
      '......kmxxfFFffffffFFFFxxxk.....',
      '......kmxxffffffFfffFFFxxxk.....',
      '.......kmxffffffFfffFFFxxk......',
      '.......kmxxfffffffffFFxxxk......',
      '........kmxffffrrrffFFxxk.......',
      '.........kmxffffffffFxxk........',
      '.........kkmxfffffffxxk.........',
      '........kllttFFfffFttGlk........',
      '......kklGGttFFFFFFttGGlkk......',
      '.....kllGGGGttttttttGGGGllk.....',
      '....klGGGGGGttttttttGGGGGGlk....',
      '...klGGGGGGGttttttttGGGGGGGlk...',
      '...klGGGGGGGGttttttGGGGGGGGtk...',
      '..klGGGGGGGGGttttttGGGGGGGGGlk..',
      '..klGGGGGGGGGGGGGGGGGGGGGGGGtk..',
      '..klGGGGGGGGGGGGGGGGGGGGGGGGtk..',
      '.klGGGGGGGGGGGGGGGGGGGGGGGGGGlk.',
      '.kltttttttttttttttttttttttttttk.',
    ],
    p_boatman: [
      '................................',
      '............kkkkkkkk............',
      '..........kkwwwwwwwwkk..........',
      '.........kwwwwwwwwwwwwk.........',
      '........kwwwwwwwwwwwwwwk........',
      '.......kwwwwwwwwwwwwwwwwk.......',
      '.......kwwwgggwwwwwggwwgk.......',
      '.......kwwgkkkffffFkkwwgk.......',
      '.......kwwwwwwwwwwwwwwwwwk......',
      '.......kwkkkffffffffFkkwk.......',
      '........k.kfffffffffFFkk........',
      '.........kffffffffffFFFk........',
      '.........kfkwkffffkwkFFk........',
      '.........kfkkkffffkkkFFk........',
      '.........kfFFffffffFFFFk........',
      '.........kffffffFfffFFFk........',
      '.........kwfffffFfffFFwk........',
      '.........kwfffffffffFFwk........',
      '..........kwwwrrrrrwwwk.........',
      '...........kwwwwwwwwwk..........',
      '.........kkkwwwwwwwwwkk.........',
      '........kGGlGwwwwwwGGGGk........',
      '......kkGttGGwwwwwwGGttGkk......',
      '.....kGGttttGGGGGGGGttttGGk.....',
      '....kGttttttGGGGGGGGttttttGk....',
      '...kGtttttttGGGGGGGGtttttttGk...',
      '...kGttttttttGGGGGGtttttttttk...',
      '..kGtttttttttGGGGGGtttttttttGk..',
      '..kGtttttttttttttttttttttttttk..',
      '..kGtttttttttttttttttttttttttk..',
      '.kGttttttttttttttttttttttttttGk.',
      '.kGtttttttttttttttttttttttttttk.',
    ],
    oar: [
      '............kkyk',
      '...........kyynk',
      '..........kyNNnk',
      '...........kyNnk',
      '...........kyNnk',
      '..........kNnnk.',
      '.........kNnkk..',
      '........kNnk....',
      '.......kNnk.....',
      '......kNnk......',
      '.....kNnk.......',
      '....kNnk........',
      '...kNnk.........',
      '..kNnk..........',
      '...kk...........',
      '................',
    ],
    net: [
      '..k..k..k..k..k.',
      '.kwkkwkkwkkwkkwk',
      'kwgwwgwwgwwgwwsk',
      '.kwkkwkkwkkwkkwk',
      '.kwkkwkkwkkwkkwk',
      'kwgwwgwwgwwgwwsk',
      '.kwkkwkkwkkwkkwk',
      '.kwkkwkkwkkwkkwk',
      'kwgwwgwwgwwgwwsk',
      '.kwkkwkkwkkwkkwk',
      '.kwkkwkkwkkwkkwk',
      'kwgwwgwwgwwgwwsk',
      '.kwkkwkkwkkwssdk',
      '.kwkkwkkwkkwssdk',
      'kwswwswwswwsdddk',
      '.kkkkkkkkkkkkkk.',
    ],
    boatlamp: [
      '.......k........',
      '......ksk.......',
      '......ksk.......',
      '.....kkskkk.....',
      '....kssdsssk....',
      '....ksyyyydk....',
      '....ksyyyydk....',
      '....ksywyydk....',
      '....ksyyyydk....',
      '....ksyyyydk....',
      '....ksyyyydk....',
      '....ksdddddk....',
      '...kNnnnnnnNk...',
      '...kNmmmmmmmk...',
      '....kkkkkkkk....',
      '................',
    ],
    tide: [
      '................',
      '................',
      '............k...',
      '...........kgkkk',
      '....kkkkkkkkwwww',
      'kkkkwwwwwwwwkkkk',
      'wwwwkkkkkkkkkkkk',
      'kkkkkkkkkkkkCCCC',
      'kkkkCCCCCCCCkkkk',
      'CCCCkkkkkkkkkkkk',
      'kkkkkkkkkkkkwwww',
      'kkkkwwwwwwwwkkkk',
      'wwwwkkkkkkkk....',
      'kkkk............',
      '................',
      '................',
    ],
    buoybell: [
      '................',
      '................',
      '.......kk.......',
      '......kYYk......',
      '.....kYyyYk.....',
      '.....kYyyNk.....',
      '.....kYyyNk.....',
      '.....kYyyNk.....',
      '.....kYyyNkk....',
      '....koyyyyook...',
      '...koRRwRRRRok..',
      '..koRRRRRRRRRok.',
      '...koRRRRRRRrk..',
      '..kkkoRRRRRrkkk.',
      '.kCCCbbbbbbbCCCk',
      '..kkkkkkkkkkkkk.',
    ],
    b_reed: [
      '................................',
      '................................',
      '................................',
      '................................',
      '...............kk...............',
      '..............kllk..............',
      '.............klGGlk.............',
      '.............klGGtkk............',
      '............klGGGGlyk...........',
      '...........klGGGGGGGyk..........',
      '...........klGGGGGGGnk....k.....',
      '.......k..klGGGGGGGGtk...kyk....',
      '......kykkltGGGGGGGGGlk.kyNyk...',
      '.....kyNykkkytttttttnk..kyNnk...',
      '.....kyNnkkGtttttttttGk.kyNnk...',
      '.....kyNnkGtttttttttttGk.kyk....',
      '......kykkGttYYtttYYtttk.kGk....',
      '......klykGttYYtttYYtttk.kGk....',
      '..k...kyNGtttttttttttttGkytk....',
      '.kyk..kyNNtttttttttttttkyNtk....',
      'kyNyk.kyNntttttttttttttkyNtk....',
      'kyNnk.klnkGttttttttttttkyNtk....',
      'kyNnk.kltkkGttttttttttk.kytGk...',
      '.kyk.klkGk.kltttttttttk.klkGk...',
      '.kGk.klkGk.klkGttklkkGk.klkGk...',
      '.kGk.klkGGkklkkGkklkkGk.klkGk...',
      '.kGGkklkkGkklkkGkklkkGkklkkGk...',
      '..kGkklkkGkklkkGkklkkGkklkkGk...',
      '..kGkklkkGkklkkGkklkkGkklkkGk...',
      '..kGkklkkGkklkkGkklkkGkklkkGk...',
      '..kGkklkkGkklkkGkklkkGkklkkGk...',
      '..kGkklkkGkklkkGkklkkGkklkkGk...',
    ],
  },

  /* ---------------- 卡牌：hero 写人物名字就是专属卡，不写就是通用卡 ---------------- / ---------------- Cards: setting hero to a hero's name makes it exclusive; omitting it makes it generic ---------------- */
  cards: {
    oar: { size: 1, tag: 'blade', t: 0, up: 'cd', cd: 1.1, dmg: 6, fx: 'knife', kind: 'weapon', hero: 'wei', kb: 0.03,
      n: '船桨', d: '一桨拍过去，命中时把敌人推回去一点。', f: '撑了三十年船，手上的力气都在桨上。' },
    net: { size: 2, tag: 'mech', t: 1, up: 'mix', cd: 2.6, dmg: 8, fx: 'sweep', kind: 'gadget', hero: 'wei', slow: 0.4,
      n: '渔网', d: '横着撒出去，网住目标那一排的敌人，减速40%。', f: '网眼是按鱼的大小打的。怪物比鱼大。' },
    boatlamp: { size: 1, tag: 'fire', t: 0, up: 'dmg', cd: 1.4, dmg: 5, fx: 'spark', kind: 'lamp', hero: 'wei', burn: 2, per: { kind: 'lamp', pct: 0.15 },
      n: '船灯', d: '点燃目标。每有一张其他【灯具】卡，伤害+15%。', f: '船头一盏，船尾一盏。夜里看见两点光，就知道是苇的船。' },
    tide: { size: 3, tag: 'ice', t: 2, up: 'dmg', cd: 4.2, dmg: 22, fx: 'blizzard', kind: 'sky', hero: 'wei', slow: 0.35,
      n: '涨潮', d: '潮水漫过射程内所有敌人，减速35%。', f: '水门外的河，七百年没涨过潮。今晚涨了。' },
    /* 写代码的效果见下面 hooks.cards.buoybell / see hooks.cards.buoybell below for the code-based effect */
    buoybell: { size: 1, tag: 'mech', t: 1, up: 'mix', cd: 0, dmg: 0, fx: 'none', kind: 'gadget', hero: 'wei', passive: 1,
      n: '浮标铃', d: '没有冷却。每当有敌人被击杀，左右相邻的卡充能6%。', f: '风一吹就响。苇说，那是河在数数。' },
  },

  /* ---------------- 遗物：m 是修正项，键见 src/data/mods.ts ---------------- / ---------------- Relics: m holds modifiers; keys are in src/data/mods.ts ---------------- */
  relics: {
    oldrope: { t: 1, ico: 'ring:N', hero: 'wei', m: { s1: 0.12, slow: 0.2 }, n: '旧缆绳', f: '绑过船，也绑过人。' },
  },

  /* ---------------- 敌人和首领：final: 1 的首领会进第九夜的轮换 ---------------- / ---------------- Enemies and bosses: a boss with final: 1 joins the night-9 rotation ---------------- */
  enemies: {
    reedking: {
      final: 1, boss: 1, fixed: 1, hp: 9000, spd: 0.012, armor: 2, wall: 99, spr: 'b_reed', sc: 1, col: '#38b764', faction: 'swamp',
      n: '芦苇王', tip: '躲在雾里，一边招来成群的虫子，一边让小怪往前冲。',
      intents: [
        { t: 6, a: 'veil', v: 4, n: '起雾', d: '4秒内射程线往城墙压' },
        { t: 8, a: 'brood', v: 5, k: 'bug', n: '分蘖', d: '生出5只裂殖虫' },
        { t: 9, a: 'lure', v: 2, n: '风过', d: '所有小怪冲锋2秒' },
      ],
    },
  },

  /* ---------------- 剧情里的说话人 ---------------- / ---------------- Story speakers ---------------- */
  voices: {
    boatman: { img: 'p_boatman', c: '#7ee8a2', n: '老船公' },
  },

  /* ---------------- 人物 ---------------- / ---------------- Heroes ---------------- */
  heroes: {
    wei: {
      def: {
        col: '#7ee8a2', portrait: 'p_wei', wall: 26, gold: 10, jump: 'ayla', start: [],
        n: '苇', title: '摆渡人', tag: '擅长减速与推回', desc: '水门底下摆了一辈子渡船。把敌人推回去、拖慢下来，墙就挨得少。',
        intro: '水门开着的时候，我渡人进城。水门关了，我就渡他们走。',
      },
      kits: [{ cards: [['oar', 0], ['boatlamp', 0]], path: 'ferry', n: '一桨一灯', d: '船桨推，船灯烧。' }],
      paths: [{ id: 'ferry', mast: 0, cards: ['oar', 'net', 'boatlamp', 'tide', 'buoybell'], n: '摆渡', d: '推回、减速、慢慢烧' }],
      /* 人物剧情：结构和 src/locales/zh-CN/story/ayla.ts 一样，可以只写一部分，没写的用公共剧情 / hero story: same shape as src/locales/zh-CN/story/ayla.ts; partial is fine, with the shared story filling the rest */
      story: {
        arcs: [
          {
            n: '渡口',
            intro: [{ who: 'boatman', t: '苇丫头，今晚河上起雾了。船别出去。' }],
            nights: {
              1: [[9, 'hero', '河上的雾跟墙外的雾，是一样的雾。'], [24, 'boatman', '船我拴好了。你在墙上看着点水门。']],
            },
            talks: {
              1: {
                title: '水门', who: 'boatman',
                lines: [
                  ['boatman', '我在这水门底下摆了五十年船。'],
                  ['boatman', '七百年前，城里的人就是从这儿坐船跑的。跑出去的，一个都没回来。'],
                ],
                q: '老船公把桨递给你。',
                ans: [
                  { cat: 'atk', t: '这回不跑了。', re: '好。那这把桨你拿着。' },
                  { cat: 'def', t: '水门我守着。', re: '守着好。门守住了，船就不用开。' },
                  { cat: 'eco', t: '今晚渡几个人？船钱我先收了。', re: '收吧收吧，反正也没人坐。' },
                ],
              },
            },
          },
        ],
      },
    },
  },

  /* ---------------- 公共剧情的补充：新首领第九夜的标题、节拍、台词、黎明第一句 ---------------- / ---------------- Additions to the shared story: the new boss's night-9 title, beats, barks and dawn's first line ---------------- */
  story: {
    bossNights: {
      reedking: {
        title: '芦苇王',
        beats: [
          [1, 'narr', '河上的芦苇一夜之间长到了墙那么高。风一吹，整片芦苇荡都在往城里走。'],
          [20, 'bellman', '芦苇……芦苇在走路！'],
        ],
      },
    },
    winBy: { reedking: '芦苇荡倒伏下去，像被风吹平了。河面上，第一次映出了一线灰白。' },
    foe: {
      reedking: {
        spawn: '（沙沙，沙沙。）',
        intent: { veil: '（芦苇里升起雾来。）', brood: '（根底下钻出一窝虫。）', lure: '（风过，芦苇一齐弯腰。）' },
        low: '（芦苇在往回退。）',
        heroLow: '退了？那就追着打。',
        die: '（整片芦苇荡倒了下去。）',
      },
    },
  },

  /* ---------------- 写代码的效果：fork 之后随便写 ----------------
   * 事件：start 开战 · use 任意卡触发 · hit 命中 · crit 暴击 · burn/poison/freeze 施加状态 · bounce 闪电弹跳
   *      kill 击杀 · wall 城墙受击 · charge 某卡被充能 · chain 连锁到 5 的倍数
   * 卡牌钩子收到 (这张卡, 上下文)，上下文里有 e（敌人）、src（出手的卡）等，见 src/sim/hooks.ts
   * ---------------- Code-based effects: anything goes after forking ---------------- / Events: start battle start · use any card triggers · hit on hit · crit on crit · burn/poison/freeze applying a status · bounce lightning bounce · kill on kill · wall wall hit · charge a card charged · chain chain reaches a multiple of 5 / Card hooks receive (this card, context), where context has e (enemy), src (the firing card) and more; see src/sim/hooks.ts
   */
  hooks: {
    cards: {
      buoybell: {
        on: {
          kill: (c) => {
            for (const n of c.nb || []) n.charge = Math.min(1.5, n.charge + 0.06);
          },
        },
      },
    },
  },
};

export default pack;
