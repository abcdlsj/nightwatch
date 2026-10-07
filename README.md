# 守夜人 Night Watch

[中文](README.md) · [English](README.en.md)

竖屏像素风自动战斗构筑卡牌游戏：在 8 格棋盘上摆卡、合成升品质、靠相邻协同与连锁触发，守住城墙撑过九个长夜。

同一份构建产物可发布为网页（Vercel），也可装进 Capacitor 原生壳上架 iOS / Android。

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2Fabcdlsj%2Fnightwatch&project-name=nightwatch&repository-name=nightwatch)

## 特性

- 8 格棋盘，卡牌分小 / 中 / 大（占 1 / 2 / 3 格），相邻与站位影响协同。
- 品质合成：铜 → 银 → 金 → 钻，升级方向分伤害型 / 冷却型 / 混合型。
- 每夜 3 站随机事件，第 4、8、9 夜为精英与首领；第九夜首领五人轮换。
- 5 个人物（艾拉 / 墨 / 萤 / 石钧 / 星遥），每人 3 个流派与专属剧情。
- 无尽长夜、熟练度、8 档长夜难度、图鉴、31 项成就。
- 一个人物三个流派都守到黎明、长夜解锁到 5 档后，可以开「异象」（开局三选一的整局规则）和「流派轮换」（少一个本家流派，请一个外乡流派客串）。
- 规则随机数可复现，同种子同操作结果一致；战斗模拟不依赖界面。
- 多语言语言包、PWA 离线、Capacitor 原生壳。

## 技术栈

TypeScript + Vite，界面用原生 DOM，战场用 Canvas 2D（低分辨率像素画布放大显示），音乐音效全部 WebAudio 现场合成。

## 运行

需要 Node 20.19 以上。

```bash
npm install
npm run dev        # 开发服务器，改代码自动刷新
npm run build      # 构建到 dist/（Vercel 用的就是这个）
npm run preview    # 本地预览构建结果（端口 4317）
npm run check      # 类型检查 + 单元测试 + 构建，提交前跑
npm run e2e        # 冒烟测试：机器人自动打一局（需先 build；首次要 npx playwright install chromium）
```

网址加 `?seed=数字` 可固定种子。

## 目录

```
index.html            页面骨架（静态文字标了 data-i18n）
public/fonts/         自带字体子集（由 tools/fontsub.py 生成）
src/
  main.ts             入口：装配各层、底栏按钮、主循环
  core/               随机数（可复现）、工具函数、事件总线
  platform/           存储、震动、运行环境（网页 / 原生壳）
  data/               纯数据：卡牌、遗物、天赋、敌人、事件、人物、局外；art/ 是像素图
  locales/zh-CN/      全部文字：内容文案、公共剧情（story.ts）、界面文字；story/ 是人物各自的剧情
  i18n/               t() 和语言切换；启动时把文案填进数据表
  game/               规则：状态、伤害公式、掉落、备战、存档、局外进度；plan.ts 夜晚编排，story.ts 剧情取用
  sim/                战斗模拟：出怪、出手连锁、伤害、敌人行为、触发钩子
  render/             画面：像素图、战场画布、背景着色器、界面特效层
  audio/              音效、背景音乐、声音开关
  ui/                 界面组件：卡牌、顶栏、弹层、剧情、战报、图鉴、台词
  app/                流程：开局 → 备战 → 战斗 → 结算；prep/ 是备战的操作、界面和拖拽
  mod/                模组：类型、检查、合并进各张表、从 mods/ 加载
  styles/             样式，按界面区域分文件
tests/
  unit/               语言包完整性、分层约束、无界面战斗模拟（vitest）
  e2e/                冒烟测试和关键界面截图（Playwright）
mods/                 模组（每个子目录一个；_example 是示例，不加载）
tools/                像素图生成、字体子集化、缺字检查、图标生成
docs/                 模组教程、平衡说明、字体授权
```

## 分层

规则层和模拟层不碰 DOM，换渲染方式、换平台时只动上层。`tests/unit/layers.test.ts` 会检查：

| 层 | 可以依赖 |
| --- | --- |
| `core` | 无 |
| `data` | `core` |
| `i18n` / `locales` | `data`、`core` |
| `game` | 上面这些 + `platform` |
| `sim` | 上面这些 + `game` |
| `render` / `audio` / `ui` / `app` | 全部 |

战斗模拟对外只通过 `sim/view.ts` 的 `SimView` 接口输出表现事件（粒子、飘字、音效、台词、卡牌闪烁……），界面层在 `ui/battle-view.ts` 实现它；无界面跑模拟时用空实现。

随机数分两种：规则相关的（出怪、商店、掉落、暴击……）走 `core/rng.ts` 的 `rng`，可复现；纯表现的（粒子、飘字、台词挑哪句）用 `vr()`，不影响结算。存档记录进入备战前的随机数状态。

## 多语言

- 屏幕上的字全部在 `src/locales/zh-CN/`：`cards` `relics` `talents` `enemies` `events` `heroes` 是内容文案，`story` 是剧情和台词，`terms` 是术语，`meta` 是成就、难度、加码等，`ui` 是界面文字。
- 数据表（`src/data`）只放机制，不放文字；启动时 `i18n/apply.ts` 把文案填进去，代码里照常读 `ITEMS[k].n`。
- 界面文字用 `t('prep.trainSub', { a: 1, b: 2 })`，参数写成 `{n}`。
- 加一门语言：复制 `locales/zh-CN` 改译文，在 `i18n/index.ts` 的 `PACKS` 里登记，再给字体子集补字。`tests/unit/i18n.test.ts` 会检查缺键。

## 网页与 PWA

网页版是 PWA：iPhone 用 Safari 打开，点「分享 → 添加到主屏幕」；安卓 Chrome 会提示安装。从主屏打开时全屏、无浏览器栏，断网也能玩。

- `public/manifest.webmanifest`：名字、竖屏、图标（`public/icons/`，由 `node tools/make-app-assets.mjs` 生成）。
- `public/sw.js`：离线缓存。页面先走网络，带哈希的资源直接用缓存；每次构建换一个缓存版本（`__BUILD_ID__`）。只在正式构建的网页版注册。
- 从主屏打开时 `<html>` 带 `standalone` 类；`src/platform/pwa.ts` 处理 iOS Safari 的安装提示。

## 移动端（iOS / Android）

原生壳用 Capacitor，工程在 `ios/` 和 `android/`，配置在 `capacitor.config.ts`（appId `com.abcdlsj.nightwatch`）。

```bash
npm run build && npx cap sync     # 把 dist/ 同步进原生工程
npx cap open ios                  # Xcode 打开，选设备运行 / Archive 上架
npx cap open android              # Android Studio 打开（需装 Android SDK）
```

- 只支持竖屏；刘海和圆角靠 CSS 的 safe-area-inset 处理。
- 原生壳存档写进系统存储（`@capacitor/preferences`），首次启动迁移 WebView 旧数据；震动用系统震感；切后台自动静音；Android 返回键先关弹层和背包。均在 `src/platform/native.ts`，网页版不加载。
- 图标和启动图：`node tools/make-app-assets.mjs` 生成 `resources/` 源图和网页图标，再 `npx @capacitor/assets generate --ios --android --assetPath resources` 导出原生各尺寸。

## 模组

游戏内容都是表：卡牌 `ITEMS`、遗物 `RELICS`、天赋 `TALENTS`、敌人 `EN`、人物 `HEROES` / `KITS` / `PATHS`、说话人 `VOICES`、像素图、剧情。规则代码只按表里的字段办事。模组（`mods/<目录>/index.ts`）在启动时由 `src/mod/load.ts` 读入，`src/mod/apply.ts` 逐条检查后合并进这些表；写错的条目跳过，原因显示在标题页的「工坊」里。

教程见 [docs/modding.md](docs/modding.md)，示例见 `mods/_example/`。

## 测试与平衡

```bash
npm run typecheck   # 类型检查
npm test            # 单元测试：语言包完整性、分层约束、无界面战斗模拟
npm run bench       # 平衡模拟（见 docs/balance.md）
npm run e2e         # 冒烟测试
npm run shots       # 关键界面截图
```

## 美术流程

卡牌图标、人物立绘、首领大图都写成 `tools/pixelgen.py` 里的绘制函数，改完运行：

```bash
npm run art                              # 重新生成 src/data/art/generated.ts
python3 tools/pixelgen.py --preview      # 另外输出 shots/ 下的预览图（需要 Pillow）
```

## 开发约定

- 每个改动独立提交，提交信息用 `类型(范围): 说明`，如 `feat(enemy): 新增自爆鼠`。
- 提交前运行 `npm run check`，大改动再跑 `npm run e2e`。
- 新增文字只写进 `src/locales`；出现新汉字时 `npm run build` 会提醒跑 `npm run fonts`。
- `dist/` 是构建产物，不入库。

## 路线图

- [x] 工程化：TypeScript + Vite，分层，可复现随机数，无界面战斗模拟
- [x] 全部文字抽成语言包
- [ ] 敌人与首领立绘升级到 16×16 / 32×32
- [x] 平衡模拟：`npm run bench`
- [ ] 横屏布局、手柄操作、Steam 桌面壳

## 许可

代码和美术以 [MIT](LICENSE) 发布。`public/fonts/` 里的字体不在其内，各自是 SIL Open Font License 1.1，见 [docs/fonts.md](docs/fonts.md)。
