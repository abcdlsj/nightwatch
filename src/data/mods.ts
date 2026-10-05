/* 从旧版数据迁移而来，直接在这里改 / migrated from the old data format; edit here directly */
/** 修正项：[显示方式, 越小越好]。显示方式 0 数值、1 百分比、2 只显示说明、3 独立乘区（键以 x 开头，多个来源相乘） / modifiers: [display mode, lower is better]. Display mode 0 number, 1 percentage, 2 description only, 3 independent multiplier (keys start with x and multiply across sources) */
export const MODL: Record<string, [number, number?]> = {
 "rx": [
  1
 ],
 "rx_melt": [
  1
 ],
 "rx_shatter": [
  1
 ],
 "rx_overload": [
  1
 ],
 "rx_toxic": [
  1
 ],
 "rx_super": [
  1
 ],
 "dmg": [
  1
 ],
 "tag_blade": [
  1
 ],
 "tag_fire": [
  1
 ],
 "tag_volt": [
  1
 ],
 "tag_ice": [
  1
 ],
 "tag_mech": [
  1
 ],
 "s1": [
  1
 ],
 "s2": [
  1
 ],
 "s3": [
  1
 ],
 "spd": [
  1
 ],
 "crit": [
  1
 ],
 "critDmg": [
  1
 ],
 "burn": [
  1
 ],
 "poison": [
  1
 ],
 "chain": [
  0
 ],
 "slow": [
  1
 ],
 "slowVuln": [
  1
 ],
 "pen": [
  0
 ],
 "wall": [
  0
 ],
 "shieldStart": [
  0
 ],
 "regen": [
  0
 ],
 "interest": [
  0
 ],
 "winGold": [
  0
 ],
 "killGold": [
  1
 ],
 "startCharge": [
  1
 ],
 "left": [
  1
 ],
 "right": [
  1
 ],
 "range": [
  1,
  1
 ],
 "aoe": [
  1
 ],
 "lonely": [
  1
 ],
 "full": [
  1
 ],
 "enemySpd": [
  1,
  1
 ],
 "tax": [
  0,
  1
 ],
 "shellChain": [
  2
 ],
 "ammo": [
  0
 ],
 "t_kindling": [
  2
 ],
 "t_icechain": [
  2
 ],
 "t_chain": [
  2
 ],
 "t_loot": [
  2
 ],
 "t_alch": [
  2
 ],
 "t_photo": [
  2
 ],
 "t_drum": [
  2
 ],
 "t_nail": [
  2
 ],
 "t_map": [
  2
 ],
 "t_opener": [
  2
 ],
 "t_bloodlust": [
  2
 ],
 "t_revenge": [
  2
 ],
 "t_last": [
  2
 ],
 "t_echo": [
  2
 ],
 "kspd_weapon": [
  1
 ],
 "kspd_lamp": [
  1
 ],
 "kspd_firearm": [
  1
 ],
 "tspd_volt": [
  1
 ],
 "s3spd": [
  1
 ],
 "ammoSpd": [
  1
 ],
 "growSpd": [
  1
 ],
 "t_splash": [
  2
 ],
 "t_groove": [
  2
 ],
 "t_growspd": [
  2
 ],
 "t_ember": [
  2
 ],
 "t_plague": [
  2
 ],
 "t_frostlens": [
  2
 ],
 "t_sweep": [
  2
 ],
 "tag_poison": [
  1
 ],
 "xdmg": [3],
 "xtag_blade": [3],
 "xtag_fire": [3],
 "xtag_ice": [3],
 "xtag_volt": [3],
 "xtag_mech": [3],
 "xtag_poison": [3],
 "xcarry": [3]
} as never;
