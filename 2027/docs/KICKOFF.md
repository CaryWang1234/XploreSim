# 2027 开题运行手册

目标：开题后 72 小时内上线一个可玩、可回放、可部署的 2027 控制台。最迟 T+2 小时，`/2027/`
已经是 2027 的身份和规则页，而不是 TBA 占位页。

现在站上已经有的东西：`/2027/` 占位页、构建与部署链路、hub 第三入口、game pack 契约、静态守卫和
契约测试。开题当天不需要再搭站，只需要填缝。

---

## 0. 唯一入口

`2027/web/js/game.js` 是赛题缝。页面、构建和守卫都读它；改这个文件，页面上的年份、赛名、配色、
阶段、计分和 RP 立即更新，不需要碰壳层。

`2027/web/js/game-contract.js` 是契约。它检查阶段秒数总和、键唯一、计分键必须是已声明的阶段类型，
以及一条硬规则：**只要还有一个 `placeholder: true`，`status` 就不能是 `live`**。页面和静态守卫
调用的是同一个函数，所以不会出现“页面看起来好了、守卫却过不了”的分叉。

开题当天先填 `game.js`，把 `status` 从 `tba` 改成 `draft`；规则和场地都测完后才改 `live`。

---

## 1. 五道缝

| 文件 | 负责 | 什么时候填 | 验收 |
| --- | --- | --- | --- |
| `web/js/game.js` | 赛名、年份、配色、UI 名词、阶段、计分、RP、规则条目 | T+0 到 T+1h | `npm --prefix 2027 run check` |
| `web/js/rules.js` | 手册常量，每条带章节引用；冲突清单 | T+1 到 T+4h | 每条数字能指回手册 |
| `web/js/model.js` | 场地几何、起始位、机器人档案、场景默认值 | T+4 到 T+12h | 场地坐标能画出俯视图 |
| `web/js/engine.js` | tick 机制、拾取/放置/得分、阶段、犯规 | T+12 到 T+36h | 不变量脚本全过 |
| `web/js/viz.js` | 场地绘制，全部从 `model.js` 的几何读 | T+12 到 T+36h | 截图与手册场地图对得上 |

冻结层（开题当天不要改）：`rng`、`replay`、`worker-client`、`worker` 生命周期、`statestore`
骨架、`scouting` 框架、`chartdata`、`league` 统计、`mc`、`serve`、`check_web`、`build-site`。

如果决定从 `rebuilt/` 复制完整控制台，只复制 `web/js/` 里的引擎和 UI，然后**保留**
`2027/web/js/game.js` 与 `game-contract.js`，并让新的 `ui.js` 继续 import 它们。守卫会检查这条
import，断了就报错。

---

## 2. 手册到文件的映射

| 手册部分 | 先落到 | 再落到 | 注意 |
| --- | --- | --- | --- |
| §1 介绍、单位、场地坐标约定 | `rules.js` 的 `MANUAL` | `game.js` 的 `edition` / `manual` | 2026 用英寸/秒/分，2027 若改单位，先写进 `MANUAL` |
| §4/§5 场地、元素、尺寸 | `rules.js` 的 `FIELD` | `model.js` 的几何、`viz.js` 的绘制 | 坐标原点、红蓝墙方向、镜像规则 |
| §6 比赛流程、阶段、计分 | `rules.js` 的 `TIME` / `POINTS` | `game.js` 的 `phases` / `actions` / `rp`，`engine.js` 的记分 | 阶段秒数总和必须等于 `clock.matchSec` |
| §6 排名分、奖励分 | `rules.js` 的 RP 表 | `game.js` 的 `rp` | 地区赛/冠军赛两列时不要压成一列 |
| §7 犯规、判罚 | `rules.js` 的 `RULES` | `engine.js` 的犯规计时与罚分 | 罚给对手还是自己，逐条确认 |
| §8 机器人限制 | `rules.js` 的 `ROBOT_LIMITS` | `model.js` 的档案上限 | 只建模会改变比赛结果的限制 |
| 表格与图 | `rules.js` 的注释 | `docs/` 或规则页 | 每个数字旁边留章节号 |
| 手册自相矛盾 | `rules.js` 的 `RULE_CONFLICTS` | `game.js` 的 `rules` 条目 | 不要静默选一个；留开关或写明采用哪一版 |

硬规则：**手册里的数字才写进 `rules.js`；不是手册的建模选择标 `[estimate]`**。这条在 2025 和
2026 两季都执行过，2027 不要破例。

---

## 3. 开题前（T-7 到 T-0）

- [ ] 用虚构赛题做一次 6 小时预演：填 `game.js` → 写 10 条 `rules.js` → 画一个矩形场地 →
      跑一场最简比赛 → 构建 → 部署到预览环境。把卡点记在本文件末尾。
- [ ] 准备 2027 手册 PDF、场地图、计分表和犯规表；确认手册版本号（如 TU1/TU2）。
- [ ] 确认 Cloudflare Pages 的生产部署权限可用；push 到 `main` 本身不会触发构建。
- [ ] 决定 2027 控制台是“从 `rebuilt/` 派生”还是“只保留占位页先上规则页”。两条路都要保留
      2027 的守卫。
- [ ] 开题当天不要在同一个分支里改 `rebuilt/` 或 `reefscape/`；旧赛季是线上资产。

---

## 4. 开题 72 小时

### T+0 到 T+1h：身份

1. 填 `game.js`：`name`、`edition`、`manual`、`theme`、`labels`。
2. 填 `phases`：先按手册的 MATCH 结构写，秒数从 `TIME` 抄。
3. 填 `actions` 和 `rp`：只写有分数的行；没有分数的机制不要造一行。
4. `status` 改成 `draft`。
5. 跑 `npm --prefix 2027 run check`，页面上的 TBA 标题和阶段表应立即变成 2027 的内容。

Gate：契约通过，占位计数下降；页面顶部不再写 “not published yet”。

### T+1 到 T+4h：常量

1. 建 `web/js/rules.js`，按 `rebuilt/web/js/rules.js` 的块结构写：`MANUAL`、`TIME`、`POINTS`、
   `FIELD`、`ROBOT_LIMITS`、`RULES`、`RULE_CONFLICTS`。
2. 每个块上方写章节号；每条 `RULES` 的 `engine` 指向真实函数名（先写计划函数名，落码后对齐）。
3. 手册有冲突时写进 `RULE_CONFLICTS`，并在引擎里留一个开关。
4. 把 `game.js` 的阶段/计分和 `rules.js` 对齐：两处数字不一致时，以 `rules.js` 为准，
   `game.js` 只做展示。

Gate：随便挑 20 个数字，能在手册同一页找到出处；冲突清单不是空的（如果手册确实有冲突）或明确写
“未发现冲突”。

### T+4 到 T+12h：场地

1. 建 `web/js/model.js`：场地矩形、关键结构、起始位、机器人档案、`defaultScenario`。
2. 建 `web/js/viz.js`：先画外框和中心线，再按手册图加结构；所有坐标从 `rules.js` 的 `FIELD` 读。
3. 用固定尺寸截图，和手册场地图并排看；红蓝镜像必须对称。
4. 填 `game.js` 的 `field.lengthIn` / `field.widthIn`，删掉对应 `placeholder`。

Gate：`/2027/` 能显示实测场地尺寸；截图里没有“大概在这个位置”的结构。

### T+12 到 T+36h：机制

1. 建 `web/js/engine.js`：先跑通时钟和阶段，再跑通一个得分动作，再加第二个动作。
2. 每加一个机制，补一个不变量：
   - 不能凭空产生得分元素；
   - 分数变化必须能追溯到一次动作；
   - 阶段边界不能在非法时刻计分；
   - 犯规只罚一次，且罚给正确的一方。
3. 建 `web/js/policy.js` 或先复用 `rebuilt` 的基线策略，保证能跑满一场。
4. 每 4 小时跑一次 `npm --prefix 2027 test`，不要等到最后。

Gate：一场比赛能从 0 跑到 `matchSec`，比分、阶段和事件日志自洽。

### T+36 到 T+60h：策略与校准

1. 接 `fastsim` / `ai` / `league`：先用固定种子跑 24 场，确认没有崩溃。
2. 用 `rebuilt` 的 A/B 结构做至少一组配对测量；每个引用的数字带上 n 和标准误。
3. 校准只调有独立测量的旋钮；没有测量的参数不要为了“看起来像”而调。
4. 把页面上的“Measured data”换成 2027 的数字，删掉 2026 的。

Gate：批量跑分可重复；同一个种子两次结果一致；页面上的每个数字都能用脚本复现。

### T+60 到 T+72h：收口与上线

1. 删掉 `game.js` 里所有 `placeholder: true`，补 `rules` 至少一条，填 `manual.source` 和场地尺寸。
2. `status` 改成 `live`。
3. 跑：

```
SKIP_NET=1 npm run validate
npm run build
```

4. 检查 `dist/2027/`：HTML 有 beacon、`js/game.js` 是新的、没有 2026 的文案。
5. push 到 `main`，然后用 Cloudflare Pages API 手动创建生产部署（push 不会自动构建）。
6. 线上验证：
   - `https://xploresim.salmoncat0304.xyz/2027/` 返回 200 且标题是 2027 赛名；
   - 抓一个本次改过的资源（例如 `/2027/js/game.js`）确认里面有你刚写的字符串；
   - 首页第三入口能进 `/2027/`；
   - 旧赛季 `/rebuilt/`、`/reefscape/` 仍返回 200。

Gate：`npm run check`（不跳过网络）全过；线上资源是本次构建的版本。

---

## 5. 部署

沿用仓库现有流程：

- 构建命令 `npm run build`，输出 `dist`，生产分支 `main`。
- push 到 `main` 不触发构建；用 Cloudflare Pages API 创建 production deployment。
- 部署后必须抓一个**本次改动过的**资源验证，不能只看 push 成功或首页 200。
- 回滚：Pages 的上一版部署可直接回滚；不要用强推 `main` 来“回到上一版”。

---

## 6. 降级规则

- **机制写不完**：`status` 保持 `draft`，先上线规则页和场地页。不要为了“看起来能玩”把
  `placeholder` 删掉。
- **引擎有 bug**：关掉对应开关并在规则页写明；不要静默改分。
- **数据没测完**：保留 `placeholder`，契约会拦住 `live`；这是设计，不是障碍。
- **旧赛季**：开题当天不动。2027 的问题在 2027 的分支里修。
- **页面与守卫冲突**：以契约为准；如果契约本身错了，改契约并补测试，不要绕过守卫。

---

## 7. 开题当天最容易漏的十件事

1. 阶段秒数总和和 `clock.matchSec` 对不上。
2. 计分行用了 `phases` 里不存在的 `kind`。
3. 地区赛和冠军赛的 RP 阈值不同，却只写了一列。
4. 手册自相矛盾，代码静默选了一版，规则页没留痕。
5. 估算值没有标 `[estimate]`。
6. 单位混用（英寸/米、秒/毫秒）。
7. 场地坐标原点或红蓝方向反了，镜像不对称。
8. 犯规罚给了自己，或者同一次接触罚了两次。
9. 规则页的 `engine` 字段指向不存在的函数。
10. 部署后只看了首页 200，没有抓本次改动的资源。

---

## 8. 预演记录

在这里记下 T-7 预演里实际卡住的地方，开题当天先看这一节。

- （待填）
