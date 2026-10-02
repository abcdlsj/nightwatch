/* 换色图：用现有像素图换几种颜色，得到新卡的图标和新人物的立绘（[底图, {原色字母: 新色字母}]） */
const RED2BLUE = { R: 'c', r: 'b', o: 'C', e: 'd' };
const GRAY2GOLD = { g: 'Y', s: 'y', w: 'v', d: 'N' };
const BROWN2GRAY = { N: 'g', n: 's', m: 'd' };
const GRAY2BRONZE = { s: 'n', g: 'N', d: 'm', w: 'y' };
const FIRE2ICE = { o: 'C', R: 'c', y: 'w', Y: 'C', r: 'b' };
const FIRE2PURPLE = { R: 'P', r: 'p', o: 'P', e: 'a' };
const ICE2FIRE = { C: 'o', c: 'R', b: 'r', w: 'y' };
const GOLD2BLUE = { Y: 'C', y: 'c', N: 'b', n: 'd' };

export const ALIAS: Record<string, [string, Record<string, string>]> = {
  /* 艾拉 · 军令 */
  banner: ['flagpole', RED2BLUE],
  shieldwall: ['oathsword', GRAY2GOLD],
  pike: ['dagger', GRAY2GOLD],
  tower: ['xbow', BROWN2GRAY],
  /* 萤 · 爆竹 */
  rocket: ['firecracker', FIRE2PURPLE],
  fireworks: ['dragonlantern', FIRE2PURPLE],
  matchbox: ['fuse', BROWN2GRAY],
  stall: ['crackers', { R: 'o', r: 'R', o: 'Y' }],
  /* 钧 */
  turret: ['cannon', GRAY2BRONZE],
  scaffold: ['windup', GRAY2BRONZE],
  bigcannon: ['cannon', { s: 'd', g: 's', w: 'g' }],
  mortar: ['icebomb', ICE2FIRE],
  shellman: ['armorer', BROWN2GRAY],
  palisade: ['dummy', { N: 'n', n: 'm' }],
  caltrop: ['needle', { G: 's', l: 'g' }],
  watchtower: ['ballista', BROWN2GRAY],
  bastion: ['bell', { y: 'g', Y: 'w', N: 's', n: 'd' }],
  powderkeg: ['oilbarrel', BROWN2GRAY],
  crossbows: ['arrowrain', GRAY2GOLD],
  cogline: ['clock', GOLD2BLUE],
  /* 璃 */
  astrolabe: ['clock', { Y: 'w', y: 'C', N: 'b', n: 'd' }],
  lens: ['prism', { C: 'Y', c: 'y' }],
  comet: ['starfall', FIRE2ICE],
  starseed: ['icicle', { C: 'Y', c: 'y', b: 'N' }],
  orrery: ['musicbox', GOLD2BLUE],
  frostar: ['sunflare', FIRE2ICE],
  glacier: ['blizzard', { C: 'w', c: 'C' }],
  rimelance: ['greatsword', { w: 'C', g: 'c', y: 'b' }],
  stardust: ['spark', FIRE2ICE],
  starfire: ['phoenix', FIRE2PURPLE],
  pulsar: ['thunder', { Y: 'C', g: 'b', s: 'd', w: 'c' }],
};
