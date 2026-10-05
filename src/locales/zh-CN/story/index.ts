/* 每个守夜人自己的剧情：几套夜晚（每局轮一套）、首领夜、完整游戏线。
 * 结构见 src/game/story.ts；没写的部分用 ../story.ts 里的公共剧情兜底。 */
import ayla from './ayla';

export default { ayla } as Record<string, any>;
