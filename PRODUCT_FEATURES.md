# AI Pulse 产品功能总结

> 本文档随代码同步更新，反映当前已实现的功能。最后更新：基于代码库分析生成。

---

## 一、产品概述

**AI Pulse** 是一款面向「下一代建设者和支持者」的 AI 情报仪表盘，提供每日高保真 AI 行业资讯、市场信号与行动建议。支持投资人（Investor）和大学生（Student）两种角色视角，中英双语。

---

## 二、核心功能模块

### 1. 角色与语言切换

| 功能 | 说明 |
|------|------|
| 角色切换 | **投资人 (Investor)** / **大学生 (Student)** 两种 persona |
| 语言 | 中文 / 英文 (i18n)，通过 `LanguageContext` 管理 |
| 数据差异化 | 不同角色展示不同内容板块与调性（投资人偏投研，学生偏成长与副业） |

- 投资人：投研黑咖、社交信号、核心交易、市场指标
- 学生：全球同咖、独立创咖、副业冰萃、今日行动、专业特调

---

### 2. 每日简报 (Daily Briefing)

| 模块 | 投资人 | 学生 | 数据来源 |
|------|--------|------|----------|
| **重磅热咖 (Heavy Hitter)** | ✅ 置顶 | ✅ 右侧卡片 | `todaySignal` |
| **核心指标** | ✅ 5 项 | ✅ 5 项 | `metrics` |
| **投研黑咖 (新闻流)** | ✅ 主栏 | — | `news` |
| **社交信号** | ✅ X/YouTube/Reddit | — | `socialSignals` |
| **核心交易** | ✅ 融资交易 | — | `deals` |
| **专业特调** | ✅ 4 学科洞察 | ✅ | `majorInsights` |
| **深度探索** | ✅ 论文/新闻/论坛 | ✅ | `majorDeepDive` |
| **热点拉花** | ✅ 话题热度 | ✅ | `topics` |
| **即将到来** | ✅ 行业活动日历 | ✅ | `calendar` |
| **副业冰萃** | — | ✅ | `sideHustles` |
| **全球同咖** | — | ✅ 同龄故事 | `peerStory` |
| **独立创咖** | — | ✅ 独立开发者 | `soloEntrepreneurs` |
| **今天只做 1 件事** | — | ✅ | `todayAction` |
| **Agent 自助吧台** | ✅ 3 个推荐 | ✅ | `agentIntros` |

---

### 3. 数据获取与缓存

| 能力 | 说明 |
|------|------|
| **Pipeline 后端优先** | 若配置 `VITE_PIPELINE_API_URL`，优先从 Python 后端拉取预聚合快照 |
| **Gemini 兜底** | 后端不可用时，直接调用 Gemini API 生成 DashboardData |
| **本地持久化缓存** | 使用 `localStorage` 实现「每日一报」逻辑，同一天复用已生成内容 |
| **内存缓存** | 30 分钟 TTL，减少重复请求 |

---

### 4. 后端 Pipeline（Python FastAPI）

#### 四阶段流水线

```
Stage 1: 采集 → Stage 2: 预处理 → Stage 3: AI 打分 → Stage 4: 聚合入库
```

| 阶段 | 说明 | 数据源 |
|------|------|--------|
| **Stage 1 采集** | 并行采集多源内容 | RSS、GitHub、Twitter/X、YouTube |
| **Stage 2 预处理** | 去重、清洗、翻译 | `raw_items` 表 |
| **Stage 3 AI 打分** | Gemini 评分与分类 | `processed_items` 表 |
| **Stage 4 聚合** | 按 persona/language 组合生成 DashboardData | `daily_snapshots` 表 |

#### API 端点

| 端点 | 方法 | 说明 |
|------|------|------|
| `/api/pipeline/snapshot` | GET | 获取当日预构建快照（persona + language + date） |
| `/api/pipeline/podcast-script` | GET | 根据快照生成播客稿（voiceTone、hostName 可选） |
| `/api/pipeline/run` | POST | 手动触发完整流水线（异步，202 Accepted） |
| `/api/pipeline/status` | GET | 流水线健康状态与当日快照列表 |

---

### 5. 今日 AI 播客 (Podcast Daily)

| 功能 | 说明 |
|------|------|
| 播客气口 | 青年 / 中年 / 老年 / 温柔 / 阳光 / 专业 |
| 开场白 | 「这是你的今日份『第一杯』，我是 [Name]，建议趁热饮用」（禁止「欢迎收听」） |
| 节奏标注 | 脚本中可含 [停顿]、[语气上扬]、[语气下沉]，TTS 朗读时自动去除并实现真实停顿 |
| Student 收尾 | outro 必须包含「今日只做一件事」行动指令 |
| 时长 | 约 60 秒广播脚本（内容精简） |
| 生成播客稿 | 后端 Gemini 或前端 `buildFallbackScript` 兜底 |
| 章节导航 | 按 todaySignal、metrics、news、deals 等分段 |
| 朗读 | 使用浏览器 TTS（`speechSynthesis`），按 [停顿] 分段并插入约 0.6s 静音 |

---

### 6. 社区：不装了我也在用 AI (Campus Voice)

| 功能 | 说明 |
|------|------|
| 实时消息流 | 轮询 `/api/messages`，4 秒间隔 |
| 发布消息 | POST 文本，支持匿名/署名 |
| 今日征集 | `dailyPrompt` 作为每日话题，优质投稿可上「今日最佳」 |
| 今日最佳 | `featured` 消息高亮展示 |
| 存储 | 内存存储（Vercel Serverless，冷启动会重置） |

---

### 7. 用户成长体系

| 指标 | 说明 |
|------|------|
| **AI 素养积分** | `aiLiteracyPoints`，localStorage 持久化 |
| **连续阅读天数** | `currentStreakDays`，每日首次访问 +1 |
| **总阅读天数** | `totalReadDays` |
| **积分获取** | 每日首次访问 +10；阅读全文 +5；发帖等行为可扩展 |

---

### 8. 错误与降级

| 场景 | 行为 |
|------|------|
| API 配额耗尽 | 显示错误页，支持重试、切换 API Key（AI Studio 环境） |
| 演示模式 | 显示缓存/示例数据，标注「演示模式」 |
| 快照生成失败 | 后端返回 503，前端可回退 Gemini 或本地兜底 |

---

## 三、技术栈

| 层 | 技术 |
|----|------|
| 前端 | React、Vite、TypeScript、Motion（动画） |
| 后端 | FastAPI、SQLAlchemy、PostgreSQL（或兼容） |
| AI | Google Gemini API |
| 采集 | RSS、GitHub API、Twitter/X、YouTube |
| 部署 | AI Studio、Vercel（API Routes） |

---

## 四、相关项目：Clawfeed

`clawfeed/` 目录包含独立产品路线图（`ROADMAP.zh.md`），规划了 Digest 浏览、Source 管理、多租户、Channel 推送等能力。与当前 AI Pulse 前端/后端为不同产品线，共享部分设计理念。

---

## 五、维护说明

- 本文件应与代码保持同步，主要依据：
  - `src/App.tsx`：界面模块与交互
  - `src/services/geminiService.ts`：数据获取逻辑
  - `backend/routers/pipeline.py`：Pipeline API
  - `backend/pipeline/run_pipeline.py`：流水线阶段
  - `src/types.ts`：数据结构定义
- 新增功能或 API 时，请更新对应章节。
