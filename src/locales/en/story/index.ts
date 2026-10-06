/* Each watcher's own story: several night sets (one per run), boss nights and the full game line.
 * See src/game/story.ts for the shape; anything missing falls back to the shared story in ../story.ts.
 */
import ayla from './ayla';
import mo from './mo';
import ying from './ying';
import jun from './jun';
import li from './li';

export default { ayla, mo, ying, jun, li } as Record<string, any>;
