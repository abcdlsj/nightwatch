/* 敌人套：霜潮按角色替换原来那套 */
import { FOESETS } from '../data/enemies';
import { G } from './state';

export const foeKey = (k: string) => (FOESETS[G.foeSet] || FOESETS.dark).map[k] || k;
