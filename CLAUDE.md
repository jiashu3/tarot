# 星语塔罗 — 项目上下文（Claude Code 会话自动加载）

## 这是什么
单文件塔罗占卜网页应用。零依赖、零构建、纯原生 HTML/CSS/JS，**全部代码在 `index.html`**（约 1250 行）。本地双击即用，静态托管即上线。

## 运行与测试
- 运行：浏览器直接打开 `index.html`（file:// 协议即可，无模块加载问题）
- 冒烟测试：`node scripts/smoke-test.cjs`（桩 DOM 验证数据/牌阵/prompt/兜底判定，应全部通过）
- 图片补下载：`bash scripts/retry-missing.sh`（幂等，只下缺失的）

## 不可破坏的架构决策
1. **单文件 + 零依赖**：不引入框架、不加构建步骤、不拆 JS/CSS 文件。`images/` 是唯一的本地资源目录。
2. **AI 解读 = BYOK**：OpenAI 兼容格式 `POST {base}/v1/chat/completions`，SSE 流式解析。baseUrl/key/model 存 localStorage（`tarot.settings.v1`），浏览器直连，国内默认推荐 DeepSeek 预设。无 Key 时用内置简版解读兜底，永不白屏。
3. **内置精简牌义（每张牌的 ku/kr/e 字段）是双用途的**：注入 AI prompt 防幻觉 + 兜底解读素材。新增牌必须补全这些字段。
4. **牌图**：公有领域 Rider-Waite-Smith 1909，来自 Wikimedia Commons `Special:FilePath/<文件名>?width=480`。id 即文件名：`m00–m21 / w01–14 / c01–14 / s01–14 / p01–14`。

## 数据结构约定
- 牌：`{id, zh, en, arcana:('major'|'wands'|'cups'|'swords'|'pentacles'), num?, ku[], kr[], e}`
- 牌阵：`{id, group:('quick'|'focus'|'deep'), name, count, desc, positions:[{name, meaning, cross?}], layout?:[[col,row],…], verdictType?:('yesno'|'season'), verdict?:string}`
  - `layout` 与 positions 按下标一一对应（桌面端网格坐标）；移动端自动降级为流式布局
  - `cross:true` = 横压牌（凯尔特十字第 2 张「挑战」）
  - `verdict` 会以【特别要求】注入 AI prompt；`verdictType` 驱动兜底判定（见 `localVerdict()`）
- 记录：localStorage `tarot.records.v1`，上限 200 条，`{id, ts, q, spread, picks:[{cid,rev}], reading}`

## 用户偏好（必须遵守）
- **解读风格：大胆、直接、给明确的"牌面答案"**。禁止打太极、禁止"塔罗无法预测"式拒绝、禁止建议咨询医生/专业人士。免责声明只在页脚统一展示。
- 用户中文交流，喜欢直接给结论和成品，不喜欢被说教。

## 踩过的坑（别再犯）
1. prompt 格式示例里的占位词（如「位置｜牌名」）会被 AI 原样照抄——必须在 buildPrompt 末尾显式列出真实位置名（【位置名称】行）。
2. 系统提示里写"提醒咨询专业人士"会让模型借题发挥、整段拒绝解读——免责交给 UI 层。
3. node fetch 访问 `commons.wikimedia.org/w/api.php` 在本机网络不通；`curl + Special:FilePath` 可以。

## 部署环境（改代码后上线必读）
- 线上：https://jiashu3.github.io/tarot/ ｜ 远程：github.com/jiashu3/tarot（公开，main 分支）
- 更新流程：`git add -A && git commit -m "..." && git push`，Pages 约 1 分钟自动重建
- **本机直连 github.com 不通**（api.github.com 通）；push 必须走用户本地代理 `127.0.0.1:3213`（仓库已配 `http.proxy`，代理工具需保持运行）
- gh CLI 在 `C:\Program Files\GitHub CLI\gh.exe`（未进 PATH），已设备流登录 jiashu3

## 当前状态（2026-08-03）
- ✅ M1–M4：完整抽牌流程（洗牌/牌扇/翻牌）、AI 流式解读、占卜记录、78 张公有领域牌图
- ✅ V2 复杂牌阵系统：8 个牌阵（含是否/四季/关系/六芒星/凯尔特十字）、坐标布局引擎、牌阵选择器（点阵预览）、AI prompt 按牌数自适应 + 专属指令、兜底判定
- ✅ M5 部署上线（GitHub Pages）
- ⬜ 待办（按建议优先级）：Canvas 结果分享图（获客发动机，最优先）、微信小程序+流量主、Key 代理（Cloudflare Workers + 配额）、牌库浏览页、每日一牌、PWA
- 商业化与安全分析结论见 `docs/PROJECT.md` 第八、九节

完整构建思路与演进记录见 `docs/PROJECT.md`。
