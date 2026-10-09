-- 守夜人接口的表。初始化：npx wrangler d1 execute nightwatch --remote --file=schema.sql
-- Tables for the Night Watch API. Init: npx wrangler d1 execute nightwatch --remote --file=schema.sql

-- 埋点：一行一个事件；props 是 JSON 文本 / analytics: one row per event; props is JSON text
CREATE TABLE IF NOT EXISTS events (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  ts INTEGER NOT NULL,
  day TEXT NOT NULL,
  uid TEXT NOT NULL,
  sid TEXT NOT NULL DEFAULT '',
  name TEXT NOT NULL,
  v TEXT NOT NULL DEFAULT '',
  plat TEXT NOT NULL DEFAULT '',
  lang TEXT NOT NULL DEFAULT '',
  props TEXT NOT NULL DEFAULT '{}'
);
CREATE INDEX IF NOT EXISTS events_day_name ON events (day, name);
CREATE INDEX IF NOT EXISTS events_uid ON events (uid, ts);

-- 每日挑战成绩：每人每天一行，只记第一次 / daily-challenge scores: one row per player per day, first submission only
CREATE TABLE IF NOT EXISTS scores (
  day TEXT NOT NULL,
  uid TEXT NOT NULL,
  name TEXT NOT NULL,
  hero TEXT NOT NULL,
  heat INTEGER NOT NULL,
  nights INTEGER NOT NULL,
  wall INTEGER NOT NULL,
  kills INTEGER NOT NULL,
  won INTEGER NOT NULL,
  ts INTEGER NOT NULL,
  PRIMARY KEY (day, uid)
);
CREATE INDEX IF NOT EXISTS scores_rank ON scores (day, nights DESC, wall DESC, kills DESC, ts ASC);
