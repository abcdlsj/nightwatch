/* 从旧版数据迁移而来，直接在这里改 / migrated from the old data format; edit here directly */
import type { EventDef } from './types';

export const EVENTS: Record<string, EventDef> = {
 "shop": {
  "ico": "bag",
  "cat": "shop",
  "w": 3
 },
 "smith": {
  "ico": "axe",
  "cat": "shop",
  "w": 1
 },
 "forge": {
  "ico": "spark",
  "cat": "shop",
  "w": 1
 },
 "storm": {
  "ico": "bolt",
  "cat": "shop",
  "w": 1
 },
 "frostshop": {
  "ico": "frost",
  "cat": "shop",
  "w": 1
 },
 "giant": {
  "ico": "colossus",
  "cat": "shop",
  "w": 1,
  "minR": 2
 },
 "black": {
  "ico": "mask",
  "cat": "shop",
  "w": 0.8,
  "minR": 3,
  "black": 1
 },
 "chest": {
  "ico": "chest",
  "cat": "free",
  "w": 1.1
 },
 "field": {
  "ico": "dagger",
  "cat": "free",
  "w": 1.1
 },
 "altar": {
  "ico": "altar",
  "cat": "relic",
  "w": 1
 },
 "grocer": {
  "ico": "potion:P",
  "cat": "relic",
  "w": 1.3
 },
 "parcel": {
  "ico": "book:N",
  "cat": "free",
  "w": 0.8
 },
 "enchant": {
  "ico": "wand",
  "cat": "up",
  "w": 1
 },
 "train": {
  "ico": "dummy",
  "cat": "up",
  "w": 0.9
 },
 "gamble": {
  "ico": "dice",
  "cat": "misc",
  "w": 0.8
 },
 "spring": {
  "ico": "drop",
  "cat": "misc",
  "w": 0.9
 },
 "job": {
  "ico": "lantern",
  "cat": "misc",
  "w": 1
 },
 "furnace": {
  "ico": "furnace",
  "cat": "relic",
  "w": 0.7,
  "minR": 2
 },
 "bank": {
  "ico": "r_purse",
  "cat": "misc",
  "w": 0.8,
  "minR": 2
 },
 "armory": {
  "ico": "xbow",
  "cat": "shop",
  "w": 1
 },
 "apothecary": {
  "ico": "potion:P",
  "cat": "shop",
  "w": 0.9
 },
 "mentor": {
  "ico": "book:P",
  "cat": "rare",
  "w": 0.22
 },
 "manual": {
  "ico": "scroll:P",
  "cat": "rare",
  "w": 0.22,
  "minR": 2
 },
 "ambush": {
  "ico": "berserker",
  "cat": "fight",
  "w": 0.75,
  "minR": 2
 },
 "s_letter": {
  "ico": "book:y",
  "cat": "rare",
  "w": 0
 },
 "s_karl": {
  "ico": "oathsword",
  "cat": "rare",
  "w": 0
 },
 "refugee": {
  "ico": "drop",
  "cat": "misc",
  "w": 0.8
 },
 "auction": {
  "ico": "mask",
  "cat": "shop",
  "w": 0.6,
  "minR": 3
 },
 "ritual": {
  "ico": "altar",
  "cat": "relic",
  "w": 0.6,
  "minR": 2
 },
 "recycle": {
  "ico": "bag",
  "cat": "misc",
  "w": 0.6
 },
 "hone": {
  "ico": "whetstone",
  "cat": "up",
  "w": 0.8
 },
 "pilgrim": {
  "ico": "lantern",
  "cat": "free",
  "w": 0.7
 },
 "swap": {
  "ico": "dice",
  "cat": "up",
  "w": 0.7,
  "minR": 2
 },
 "tutor": {
  "ico": "wand",
  "cat": "up",
  "w": 0.6,
  "minR": 2
 },
 "camp": {
  "ico": "furnace",
  "cat": "misc",
  "w": 0.7
 },
 "drill": {
  "ico": "dummy",
  "cat": "up",
  "w": 0.7
 },
 "rule": {
  "ico": "book:P",
  "cat": "relic",
  "w": 0
 }
} as unknown as Record<string, EventDef>;
