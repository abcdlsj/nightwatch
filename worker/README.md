# 接口：埋点、每日挑战成绩、排行榜

Cloudflare Worker + D1。游戏在构建时通过 `VITE_API_BASE` 拿到接口地址；不配就不发统计、排行榜显示「还没开放」，游戏本身照常玩。

## 接口

| 方法 | 路径 | 说明 |
|---|---|---|
| POST | `/e` | 埋点，一次最多 50 条：`{uid, sid, v, plat, lang, ev: [{n, t, p}]}` |
| POST | `/score` | 每日挑战成绩：`{day, uid, name, hero, heat, nights, wall, kills, won}`，每人每天只记第一次 |
| GET | `/board?day=YYYY-MM-DD&uid=...` | 当天前 100 名；带 uid 时附上自己的名次 |

请求体都是 `text/plain` 的 JSON，浏览器不发预检，`sendBeacon` 也能用。校验规则在 `src/logic.ts`，单测在 `tests/unit/worker.test.ts`。

## 第一次部署

```bash
cd worker
npm install
npx wrangler login
npx wrangler d1 create nightwatch        # 把输出里的 database_id 填进 wrangler.toml
npm run db:init                          # 建表
npm run deploy                           # 输出里有接口地址，比如 https://nightwatch-api.<你的子域>.workers.dev
```

然后在 Vercel 项目的 Settings → Environment Variables 加 `VITE_API_BASE=上面的地址`，重新部署一次游戏。本地开发可以在仓库根目录建 `.env.local` 写同一行。

上线后把 `wrangler.toml` 里的 `ALLOWED_ORIGINS` 改成游戏的域名（逗号分隔），再 `npm run deploy`。

## 记了哪些事件

| 事件 | 什么时候 | 主要字段 |
|---|---|---|
| `open` | 打开游戏 | `runs` 玩过几局、屏幕宽高 |
| `tutorial` | 新手教学结束 | `step` 看到第几步、`done` 是否看完 |
| `run_start` | 开局 | `hero` `heat` `kit` `full` `omen` `rot` `daily` `mast` |
| `night_end` | 每场战斗结束（含拦路） | `r` 第几夜、`win`、`ambush`、`wall`、`kills`、`t` 战斗秒数 |
| `run_end` | 一局结束 | `win` `quit` `r` `hero` `heat` `daily` `endless` `kills` `relics` |
| `daily_end` / `daily_submit` / `board_view` | 每日挑战结算、提交成绩、看排行榜 | `day` 等 |

每行还带 `uid`（本机随机生成的匿名 ID）、`sid`（这次打开的会话）、`v` 版本、`plat`（web / pwa / ios / android）、`lang`。不收集任何个人信息；玩家可以在设置里关掉「匿名统计」。

## 常用查询

```bash
npx wrangler d1 execute nightwatch --remote --command "<SQL>"
```

```sql
-- 每天的活跃人数和新玩家开局数
SELECT day, COUNT(DISTINCT uid) AS dau FROM events WHERE name = 'open' GROUP BY day ORDER BY day DESC LIMIT 14;

-- 新手教学看完率
SELECT json_extract(props, '$.done') AS done, COUNT(*) FROM events WHERE name = 'tutorial' GROUP BY done;

-- 每一夜的守住率（普通局、不含拦路）
SELECT json_extract(props, '$.r') AS night, COUNT(*) AS fights,
       ROUND(AVG(json_extract(props, '$.win')) * 100, 1) AS win_pct
FROM events WHERE name = 'night_end' AND json_extract(props, '$.ambush') = 0 AND json_extract(props, '$.daily') = 0
GROUP BY night ORDER BY night;

-- 各人物的开局数和通关率
SELECT json_extract(props, '$.hero') AS hero, COUNT(*) AS runs, ROUND(AVG(json_extract(props, '$.win')) * 100, 1) AS win_pct
FROM events WHERE name = 'run_end' AND json_extract(props, '$.endless') = 0 GROUP BY hero;

-- 次日留存：某天第一次出现的玩家，第二天还打开的比例
WITH first AS (SELECT uid, MIN(day) AS d0 FROM events WHERE name = 'open' GROUP BY uid)
SELECT f.d0, COUNT(*) AS new_users,
       ROUND(100.0 * SUM(EXISTS (SELECT 1 FROM events e WHERE e.uid = f.uid AND e.name = 'open' AND e.day = date(f.d0, '+1 day'))) / COUNT(*), 1) AS d1_pct
FROM first f GROUP BY f.d0 ORDER BY f.d0 DESC LIMIT 14;
```

## 已知的限制

- 防作弊只做了基础校验（每人每天第一次、数值范围、守到黎明必须 9 夜）。改本地代码可以伪造成绩。以后可以让客户端上传每一步操作，服务器用同一个种子重放来校验：战斗模拟本来就可复现，但备战操作的记录和服务器上的重放还没做。
- 没有按 IP 限流。需要时在 Cloudflare 后台给这个 Worker 加一条 Rate Limiting 规则。
- 每日挑战战斗中途关掉游戏会按失守结算，包括打赢之后停在战报页时关掉（那时存档还停在开战前）。
