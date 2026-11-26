# Nightwatch 离线数值平衡实验室（`lab/`）

本目录存放 **Nightwatch 纯离线数值平衡体检、长夜进阶难度（Heat 0–8）概率扫频与 GPU 神经代理构筑搜索** 代码，与前端构建完全隔离（不会打进 `dist/`），并 **100% 复用 `src/sim/`、`src/game/`、`src/data/` 真实 TypeScript 引擎**，零规则漂移。

---

## 一、三大核心能力

### 1. 全量数值平衡体检（`npm run lab:audit` / `bun lab/balance/audit.ts`）
输出 `lab/balance/reports/balance-audit.md` + `.json`，覆盖：
- **4 档玩家水平 × 5 位守夜人**（乱点新手 / 读文案新手 / 构筑熟手 / 机制大师）在 Heat 0 普通 9 夜、全新零熟练账号、以及完整 15 夜（含隐藏首领）下的胜率与存活曲线；
- **全 15 个流派 & 全 20 套起手** 的前期存活率与通关率体检；
- **5 位第 9 夜首领 × 5 位守夜人** 压力矩阵；
- **两套敌人（亡者与深渊 vs 霜潮）& 8 套敌情** 均衡度与致死归因；
- **8 件规则遗物 & 10 项人物觉醒** 反事实净增益对照；
- **全卡池 / 遗物 / 天赋** 登场胜率归因榜（自动定位过强/陷阱项）。

### 2. 长夜进阶难度曲线扫频（`npm run lab:ascension` / `bun lab/balance/ascension-sweep.ts`）
输出 `lab/balance/reports/ascension-sweep.md` + `.json`：
- 覆盖 **Heat 0 → Heat 8 共 9 档难度 × 4 档玩家水平 × 5 位守夜人**，以及 **完整 15 夜 Heat 0/4/8**；
- 校验面向**自动战斗构筑游戏**的难度阶梯设计：
  - **Heat 0**：乱点散装偏难（教玩家看文案与站位），认真读文案 / 试 2~3 次的新手即可高概率通关；
  - **Heat 4**：需理解羁绊、站位、经济利息与乘区叠加；
  - **Heat 8**：需精通构筑、连锁、加码节奏与针对敌情/首领的熟手/大师才能稳定攻克。

### 3. GPU Order-Aware 8 格棋盘神经代理主动搜索（`lab/balance/surrogate_search.py`）
输出 `lab/balance/reports/gpu-surrogate-{hero}-n{night}-h{heat}.md` + `.json`：
- 在 Colab A100/L4/T4 GPU 上训练 **5 模型 PyTorch Order-Aware 8-Slot Transformer Ensemble**，编码完整 8 格可变尺寸卡牌（1/2/3 格）× 词缀 × C 位 × 规则遗物 × 觉醒；
- 每轮在 GPU 上筛选 **80,000+ 有序 8 格棋盘排列**，按 5 大构筑生态位分层 UCB 采样后回传给真实 TS 战斗引擎精确复核；
- 自动产出全局 Top 15 极限构筑榜、卡牌/词缀/规则遗物统治率，以及**冠军站位敏感度**（打乱槽位顺序测试站位博弈深度）。

---

## 二、本地运行 & Colab 一键云端运行

### 本地运行
```bash
bun lab/balance/audit.ts                          # 本地快速全量体检
bun lab/balance/ascension-sweep.ts                # 本地 Heat 0..8 曲线扫频
python3 lab/balance/surrogate_search.py --hero ayla --night 9 --heat 8
```

### Colab 云端运行（自动 `EXIT trap` 关机，零额度浪费）
```bash
chmod +x lab/colab/run-job.sh

./lab/colab/run-job.sh audit          # High-RAM CPU 大样本全量审计
./lab/colab/run-job.sh ascension      # High-RAM CPU Heat 0..8 大样本扫频
./lab/colab/run-job.sh gpu-surrogate  # A100/L4 GPU 5 英雄神经代理构筑搜索
./lab/colab/run-job.sh gpu-full       # A100/L4 GPU 一次会话跑完 audit + ascension + 5 英雄 GPU 搜索
```
