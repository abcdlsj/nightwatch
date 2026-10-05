/* 每个守夜人自己的剧情：几套夜晚（每局轮一套）、首领夜、完整游戏线。
 * 结构见 src/game/story.ts；没写的部分用 ../story.ts 里的公共剧情兜底。
 * Each watcher's own story: several night sets (one per run), boss nights and the full game line. See src/game/story.ts for the shape; anything missing falls back to the shared story in ../story.ts.
 */
import ayla from './ayla';
import mo from './mo';
import ying from './ying';
import jun from './jun';
import li from './li';

export default { ayla, mo, ying, jun, li } as Record<string, any>;
