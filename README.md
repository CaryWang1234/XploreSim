# XploreSim · 站点总仓

一个站点，三个入口，托管在 Cloudflare Pages，绑定 `xploresim.salmoncat0304.xyz`。

| 路径 | 内容 |
| --- | --- |
| `/` | 中心页：两个赛季的入口 |
| `/rebuilt/` | 2026 REBUILT 推演台 |
| `/reefscape/` | 2025 REEFSCAPE 推演台 |

## 目录

```
index.html 404.html      中心页与 404，零 JS、零外部字体
scripts/build-site.mjs   组装 dist/：根页面 + 两个赛季各自的 web/
scripts/serve.mjs        本地预览 dist/，目录索引与 404 规则和 Pages 一致
scripts/check.mjs       中心页守卫：链接、结构、样式互查
rebuilt/                 2026 版子树（web/ 是站点，scripts/ 是测量与守卫，docs/ 是资料）
reefscape/               2025 版子树（同上）
dist/                    构建产物，gitignore
```

## 命令

```
npm run build      # dist/ = 根页面 + /rebuilt/ + /reefscape/
npm run serve      # http://127.0.0.1:4190/ 预览 dist/
npm run check      # 中心页守卫（SKIP_NET=1 跳过线上 200 检查）
npm run check:apps # 两个 app 各自的静态守卫
npm test           # 两个 app 的 headless 测试
npm run validate   # 以上全部 + 构建，.githooks/pre-push 跑的就是它
```

引擎级验证留在各自目录，不进 pre-push：`npm --prefix rebuilt run validate` 与
`npm --prefix reefscape run validate`（后者含约五十条物理不变量，十几分钟）。碰了引擎代码的推送前手动跑一遍。

## 部署

Cloudflare Pages，production branch `main`：

```
Build command:  npm run build
Output:         dist
```

两个 app 的资源全部相对引用（`./js/...`，Worker 走 `import.meta.url`），所以 `web/` 换个目录前缀就能跑，
业务代码一行不用改。localStorage 的 key 按赛季分开（`xplore-sim-setup-v1` /
`xplore-reefscape-setup-v1`），同域共存不串。

## 域名

`xploresim` 是 `salmoncat0304.xyz` 下的一条记录，2026-10 从 GitHub Pages 迁到 Cloudflare Pages
自定义域。旧库的 CNAME 文件与 Pages 发布已撤；`frc-rebuilt-tactics-*.qoder.zone` 与
`frc-reefscape-tactics-*.qoder.zone` 两个旧站暂留作回退。

## 页面只放入口

中心页不抄任何测量数字：真实比分锚、镜像、AI 胜率这些一律留在两个 app 自己的 README 里，本页只把人送到
两个赛季站点。`scripts/check.mjs` 里对应一条「页面保持指路牌」的守卫：出现 `<article>`／`<details>`／
`<svg>`／`class="card"`／`class="num"` 就报错，防止带数字的卡片被重新搬回首页。

页面正文只写英文，`npm run check` 里有一条 CJK 守卫盯这件事。背景全部用 CSS 画：底部的透视网格是赛场地毯，
左上与右上的两团辉光分别取两个赛季的颜色（2026 土黄 `#c9a45c`、2025 青 `#5ccfd0`），这两个是全页仅有的强调色，
`prefers-reduced-motion` 下所有动画一律关掉。

## 历史

由三个库合并：中心页（`xploresim-hub`，成为根历史）、2026 版（`rebuilt/`，subtree 自
`XploreSim_dev`）、2025 版（`reefscape/`，subtree 自 `XploreSim_reefscape`）。两个 app 的提交历史完整保留，
`git log -- rebuilt/` 能翻到它们各自的提交。旧库在域名切换完成后归档。
