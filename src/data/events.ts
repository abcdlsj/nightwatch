/* 从旧版数据迁移而来，直接在这里改 / migrated from the old data format; edit here directly */
import type { EventDef } from './types';

export const EVENTS: Record<string, EventDef> = {
 "shop": {
  "ico": "bag",
  "cat": "shop",
  "w": 3,
  "rar": 0
 },
 "smith": {
  "ico": "axe",
  "cat": "shop",
  "w": 1,
  "rar": 0
 },
 "forge": {
  "ico": "spark",
  "cat": "shop",
  "w": 1,
  "rar": 0
 },
 "storm": {
  "ico": "bolt",
  "cat": "shop",
  "w": 1,
  "rar": 0
 },
 "frostshop": {
  "ico": "frost",
  "cat": "shop",
  "w": 1,
  "rar": 0
 },
 "giant": {
  "ico": "colossus",
  "cat": "shop",
  "w": 0.6,
  "minR": 2,
  "rar": 1
 },
 "black": {
  "ico": "mask",
  "cat": "shop",
  "w": 0.3,
  "minR": 3,
  "black": 1,
  "rar": 2
 },
 "chest": {
  "ico": "chest",
  "cat": "free",
  "w": 1.1,
  "rar": 0
 },
 "field": {
  "ico": "dagger",
  "cat": "free",
  "w": 1.1,
  "rar": 0
 },
 "altar": {
  "ico": "altar",
  "cat": "relic",
  "w": 0.6,
  "rar": 1
 },
 "grocer": {
  "ico": "potion:P",
  "cat": "relic",
  "w": 1,
  "rar": 0
 },
 "parcel": {
  "ico": "book:N",
  "cat": "free",
  "w": 0.6,
  "rar": 1
 },
 "enchant": {
  "ico": "wand",
  "cat": "up",
  "w": 0.6,
  "rar": 1
 },
 "train": {
  "ico": "dummy",
  "cat": "up",
  "w": 1,
  "rar": 0
 },
 "gamble": {
  "ico": "dice",
  "cat": "misc",
  "w": 0.6,
  "rar": 1
 },
 "spring": {
  "ico": "drop",
  "cat": "misc",
  "w": 1,
  "rar": 0
 },
 "job": {
  "ico": "lantern",
  "cat": "misc",
  "w": 1,
  "rar": 0
 },
 "furnace": {
  "ico": "furnace",
  "cat": "relic",
  "w": 0.3,
  "minR": 2,
  "rar": 2
 },
 "bank": {
  "ico": "r_purse",
  "cat": "misc",
  "w": 0.6,
  "minR": 2,
  "rar": 1
 },
 "armory": {
  "ico": "xbow",
  "cat": "shop",
  "w": 1,
  "rar": 0
 },
 "apothecary": {
  "ico": "potion:P",
  "cat": "shop",
  "w": 1,
  "rar": 0
 },
 "mentor": {
  "ico": "book:P",
  "cat": "rare",
  "w": 0.12,
  "rar": 3
 },
 "manual": {
  "ico": "scroll:P",
  "cat": "rare",
  "w": 0.12,
  "minR": 2,
  "rar": 3
 },
 "ambush": {
  "ico": "berserker",
  "cat": "fight",
  "w": 0.6,
  "minR": 2,
  "rar": 1
 },
 "s_letter": {
  "ico": "book:y",
  "cat": "rare",
  "w": 0,
  "rar": 3
 },
 "s_karl": {
  "ico": "oathsword",
  "cat": "rare",
  "w": 0,
  "rar": 3
 },
 "refugee": {
  "ico": "drop",
  "cat": "misc",
  "w": 0.6,
  "rar": 1
 },
 "auction": {
  "ico": "mask",
  "cat": "shop",
  "w": 0.3,
  "minR": 3,
  "rar": 2
 },
 "ritual": {
  "ico": "altar",
  "cat": "relic",
  "w": 0.3,
  "minR": 2,
  "rar": 2
 },
 "recycle": {
  "ico": "bag",
  "cat": "misc",
  "w": 1,
  "rar": 0
 },
 "hone": {
  "ico": "whetstone",
  "cat": "up",
  "w": 0.6,
  "rar": 1
 },
 "pilgrim": {
  "ico": "lantern",
  "cat": "free",
  "w": 0.6,
  "rar": 1
 },
 "swap": {
  "ico": "dice",
  "cat": "up",
  "w": 0.3,
  "minR": 2,
  "rar": 2
 },
 "tutor": {
  "ico": "wand",
  "cat": "up",
  "w": 0.3,
  "minR": 2,
  "rar": 2
 },
 "camp": {
  "ico": "furnace",
  "cat": "misc",
  "w": 1,
  "rar": 0
 },
 "drill": {
  "ico": "dummy",
  "cat": "up",
  "w": 0.6,
  "rar": 1
 },
 "rule": {
  "ico": "book:P",
  "cat": "relic",
  "w": 0,
  "rar": 3
 },
 "inscribe": {
  "ico": "wand",
  "cat": "up",
  "rar": 1,
  "w": 0.6
 },
 "quench": {
  "ico": "furnace",
  "cat": "up",
  "minR": 2,
  "rar": 1,
  "w": 0.6
 },
 "scrap": {
  "ico": "bag",
  "cat": "misc",
  "rar": 0,
  "w": 1
 },
 "graft": {
  "ico": "dice",
  "cat": "up",
  "minR": 2,
  "rar": 2,
  "w": 0.3
 },
 "mirror": {
  "ico": "gem:C",
  "cat": "rare",
  "minR": 3,
  "rar": 3,
  "w": 0.12
 },
 "oracle": {
  "ico": "book:P",
  "cat": "rare",
  "minR": 2,
  "rar": 3,
  "w": 0.12
 }
} as unknown as Record<string, EventDef>;
