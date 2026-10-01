/* 敌人套：霜潮按角色替换原来那套 */
import { FOESETS } from '../data/enemies';
import { G } from './state';

export const foeKey = (k: string) => (FOESETS[G.foeSet] || FOESETS.dark).map[k] || k;

/** 第八夜首领是不是深渊母巢 */
export const bossNight = (r: number) => r === 8 && G.boss8 === 'brood';
