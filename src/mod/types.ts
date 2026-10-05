/* 模组包的结构。一个模组是 mods/<名字>/index.ts 默认导出的一个 ModPack。
 * 数据和文字写在一起（模组只写一种语言就行）；字段含义见 docs/modding.md。
 * The mod pack shape. A mod is a ModPack default-exported from mods/<name>/index.ts. Data and text are written together (a mod only needs one language); field meanings are in docs/modding.md.
 */
import type { ItemDef, RelicDef, TalentDef, EnemyDef, HeroDef, KitDef } from '../data/types';
import type { PathDef } from '../data/heroes';
import type { CardHook, X } from '../sim/hooks';

/** 新人物：基本数据 + 起手套 + 流派 + 剧情 / new heroes: base data + opening sets + archetypes + story */
export interface ModHero {
  def: HeroDef;
  kits: KitDef[];
  paths: PathDef[];
  /** 人物剧情，结构和 src/locales/zh-CN/story/ayla.ts 一样，可以只写一部分 / hero story, same shape as src/locales/zh-CN/story/ayla.ts; partial is fine */
  story?: Record<string, any>;
}

export interface ModPack {
  /** 模组的唯一名字（英文、数字、短横线） / the mod's unique name (lowercase letters, digits, hyphens) */
  id: string;
  /** 显示在工坊里的名字 / the name shown on the Workshop page */
  name: string;
  author?: string;
  version?: string;
  /** 一句话介绍 / a one-line description */
  desc?: string;
  /** 允许用同名的东西覆盖原版（默认不允许，重名会报错跳过） / allow same-name entries to override the base game (off by default; collisions are reported and skipped) */
  override?: boolean;
  /** 像素图：名字 → 字母矩阵（字母见 src/data/art/palette.ts，'.' 是透明） / sprites: name → letter matrix (letters in src/data/art/palette.ts; '.' is transparent) */
  sprites?: Record<string, string[]>;
  cards?: Record<string, ItemDef>;
  relics?: Record<string, RelicDef>;
  talents?: Record<string, TalentDef>;
  /** 敌人和首领；首领写 boss: 1、fixed: 1，再写 final: 1 就会进第九夜的轮换 / enemies and bosses; a boss with boss: 1 and fixed: 1 joins the night-9 rotation if it also sets final: 1 */
  enemies?: Record<string, EnemyDef>;
  heroes?: Record<string, ModHero>;
  /** 剧情里的说话人：头像（像素图名字）、颜色、名字 / story speakers: portrait (sprite name), color, name */
  voices?: Record<string, { img: string; c: string; n: string }>;
  /** 公共剧情的补充（新首领的当夜剧情、台词、黎明第一句……），按 src/locales/zh-CN/story.ts 的结构合并 / additions to the shared story (a new boss's night scene, barks, dawn's first line…), merged in the shape of src/locales/zh-CN/story.ts */
  story?: Record<string, any>;
  /** 写代码的效果（fork 之后可以随便写）：卡牌、遗物、天赋的触发钩子 / code-based effects (anything goes after forking): trigger hooks for cards, relics and talents */
  hooks?: {
    cards?: Record<string, CardHook>;
    relics?: Record<string, Record<string, (n: number, x: X) => void>>;
    talents?: Record<string, Record<string, (x: X) => void>>;
  };
}

/** 加载结果：哪些模组生效了、哪些东西有问题被跳过了 / load result: which mods took effect and which entries were skipped as invalid */
export interface ModReport {
  id: string;
  name: string;
  author?: string;
  desc?: string;
  added: Record<string, number>;
  errors: string[];
}
