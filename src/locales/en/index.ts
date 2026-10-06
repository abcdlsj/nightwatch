import type { LocalePack } from '../../i18n';
import cards from './cards';
import relics from './relics';
import talents from './talents';
import enemies from './enemies';
import events from './events';
import heroes from './heroes';
import terms from './terms';
import meta from './meta';
import story from './story';
import ui from './ui';
import heroStory from './story/index';

const pack: LocalePack = { cards, relics, talents, enemies, events, heroes, terms, meta, story, ui, heroStory };
export default pack;
