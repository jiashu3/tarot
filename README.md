# 星语塔罗 ✦

一个本地可用、也可一键上线的塔罗占卜网页。单文件、零依赖，双击 `index.html` 即玩。

![牌面](images/m17.jpg)

## 快速开始

1. 直接用浏览器打开 `index.html`
2. （可选）点击右上角 ⚙ 配置 AI 解读：
   - 预设选 **DeepSeek**（国内直连，platform.deepseek.com 注册送额度）
   - 填入 API 密钥 → 保存 → 可点「测试连接」验证
   - 密钥只存在你自己浏览器的 localStorage，不上传任何服务器
   - 不配置也能玩：自动使用内置简版解读

## 功能

- 78 张完整韦特牌（公有领域 1909 版），正/逆位
- 8 个牌阵：单张指引 / 时间之流 / 二选一 / 是否牌阵 / 四季牌阵 / 关系牌阵 / 六芒星 / 凯尔特十字
- 仪式感流程：洗牌动画 → 牌扇抽牌 → 3D 翻牌（凯尔特十字有横压牌）
- AI 流式解读：结合你的问题逐张解读 + 综合指引（支持 DeepSeek / Kimi / 通义 / OpenRouter 等 OpenAI 兼容接口）
- 占卜记录：自动保存每次占卜与完整解读，可回看、删除
- 移动端适配

## 目录结构

```
index.html      全部应用代码
images/         78 张牌图
scripts/        图片下载与冒烟测试脚本
docs/PROJECT.md 完整构建文档（设计决策与演进历史）
CLAUDE.md       项目上下文（供 AI 协作会话加载）
```

## 部署

整个文件夹推到 GitHub 仓库 → Settings → Pages → 选 main 分支根目录，即获得在线版。

## 开发

```bash
node scripts/smoke-test.cjs   # 冒烟测试（数据/牌阵/prompt/兜底）
bash scripts/retry-missing.sh # 补齐缺失牌图
```

## 版权与免责

牌面为公有领域 Rider-Waite-Smith 牌（1909）。本产品仅供娱乐与自我反思。
