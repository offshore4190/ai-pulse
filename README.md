# 第一杯 / First Cup - AI Pulse

[![Vercel](https://img.shields.io/badge/Vercel-Deploy-black?logo=vercel)](https://vercel.com)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.8-blue?logo=typescript)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-19-61dafb?logo=react)](https://react.dev/)
[![License](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)

> **今天 AI 在干嘛** - 高密度 AI 情报仪表盘，面向学生与投资人的双视角 AI 日报平台

**What AI Is Up To Today** - A high-density AI intelligence dashboard with dual perspectives for students and investors.

## ✨ 特性 / Features

🎯 **双视角模式** - 投资人视角（融资、市场）+ 学生视角（学习、副业）
🌐 **中英双语** - 完整的国际化支持
🤖 **AI 原生** - 基于 Gemini 2.0 Flash + Google Search Grounding
📊 **实时情报** - 每日自动生成 AI 行业动态
💬 **社区互动** - 校园声音实时聊天室
📈 **成长激励** - AI 素养积分 + 连续阅读 Streak
🎨 **精美设计** - Tailwind CSS 4 + Motion 动画

## 🚀 快速开始

### 前置要求

- Node.js 18+
- npm / yarn / pnpm
- Gemini API Key ([获取](https://ai.google.dev/))

### 本地开发

```bash
# 1. 克隆仓库
git clone https://github.com/your-username/ai-pulse.git
cd ai-pulse

# 2. 安装依赖
npm install

# 3. 配置环境变量
cp .env.example .env
# 编辑 .env 文件，填入你的 GEMINI_API_KEY

# 4. 启动开发服务器
npm run dev

# 访问 http://localhost:3000
```

### 生产构建

```bash
# 构建生产版本
npm run build

# 预览生产构建
npm run preview
```

## 🔐 安全配置

### 环境变量设置

**本地开发**:
```bash
# 复制模板文件
cp .env.example .env

# 编辑 .env，填入真实的 API key
GEMINI_API_KEY=AIzaSy...your_real_key...
```

**⚠️ 重要安全提示**:
- ✅ `.env` 已在 `.gitignore` 中，不会被提交到 Git
- ✅ 仅提交 `.env.example` 模板文件
- ❌ **永远不要**在代码中硬编码 API key
- ❌ **永远不要**将 `.env` 提交到 GitHub

### Vercel 部署

1. Fork 本仓库到你的 GitHub 账号

2. 在 [Vercel](https://vercel.com) 中导入项目

3. 配置环境变量（在 Vercel 项目设置中）:
   ```
   GEMINI_API_KEY=your_gemini_api_key
   APP_URL=https://your-app.vercel.app
   ```

4. 部署！Vercel 会自动构建和部署

### GitHub Actions 自动化

本项目包含每日快照生成的 GitHub Actions 工作流。需要配置以下 **Repository Secrets**:

1. 进入 GitHub 仓库 → Settings → Secrets and variables → Actions

2. 添加以下 secrets:
   - `GEMINI_API_KEY`: 你的 Gemini API 密钥
   - `APP_URL`: 你的 Vercel 部署域名（如 `https://ai-pulse.vercel.app`）

工作流会在每天 UTC 22:00 (北京时间次日 06:00) 自动运行。

## 📁 项目结构

```
ai-pulse/
├── src/
│   ├── components/
│   │   ├── dashboard/          # 仪表盘核心组件
│   │   │   ├── TodaySignalCard.tsx
│   │   │   ├── MetricsGrid.tsx
│   │   │   ├── TodayActionCard.tsx
│   │   │   └── UserProfilePanel.tsx
│   │   ├── layout/             # 布局组件
│   │   │   ├── Header.tsx
│   │   │   └── Footer.tsx
│   │   ├── CampusVoice.tsx     # 校园声音聊天
│   │   ├── PodcastDailyView.tsx # 播客视图
│   │   └── [其他组件...]
│   ├── services/
│   │   ├── geminiService.ts    # Gemini API 集成
│   │   └── userStatsService.ts # 用户统计
│   ├── contexts/
│   │   └── LanguageContext.tsx # 国际化上下文
│   ├── constants/
│   │   └── translations.ts     # 翻译常量
│   ├── hooks/
│   │   └── useAutoScroll.ts    # 自定义 Hooks
│   ├── types.ts                # TypeScript 类型定义
│   ├── App.tsx                 # 主应用组件
│   └── main.tsx                # 应用入口
├── api/
│   └── messages.ts             # Vercel Serverless API
├── scripts/
│   └── generate-snap.mjs       # 每日快照生成脚本
├── public/
│   └── snap.html               # 静态快照页面
├── .github/workflows/
│   └── daily-snap.yml          # GitHub Actions 配置
├── .env.example                # 环境变量模板
├── .gitignore                  # Git 忽略文件
├── package.json
├── vite.config.ts
└── README.md
```

## 🛠️ 技术栈

**前端框架**:
- React 19
- TypeScript 5.8
- Vite 6.2

**样式 & 动画**:
- Tailwind CSS 4.1
- Motion 12 (Framer Motion 继任者)
- Lucide Icons

**AI & 数据**:
- Google Gemini 2.0 Flash API
- Google Search Grounding
- 本地 localStorage 缓存

**部署 & CI/CD**:
- Vercel (前端 + Serverless Functions)
- GitHub Actions (自动化快照生成)

## 🎨 核心功能

### 双视角模式

**投资人视角**:
- 今日重磅信号
- 融资交易动态
- 社交信号追踪
- 市场热点雷达
- 专业洞察分析

**学生视角**:
- 同龄人故事
- 低成本副业配方
- 独立创造者案例
- 今日行动建议
- 校园声音社区

### AI 驱动的内容生成

使用 Gemini API 每日生成:
- 6-8 条高质量新闻资讯
- 4 个社交信号解读
- 5-6 个 AI 工具推荐
- 学科专业洞察
- 个性化行动建议

### 成长激励系统

- **AI 素养积分**: 每日访问 +10 分，互动行为额外加分
- **连续阅读 Streak**: 激励用户养成每日学习习惯
- **总阅读天数**: 累计统计，可视化成长轨迹

## 🔧 开发指南

### 添加新组件

```tsx
// src/components/dashboard/MyNewComponent.tsx
export function MyNewComponent({ t, data }: MyNewComponentProps) {
  return (
    <section className="bg-white rounded-3xl p-6">
      {/* Your component content */}
    </section>
  );
}
```

### 修改翻译

编辑 `src/constants/translations.ts`:

```typescript
export const translations = {
  en: {
    myNewKey: 'My New Translation',
    // ...
  },
  zh: {
    myNewKey: '我的新翻译',
    // ...
  }
};
```

### 自定义主题

Tailwind 配置在 `src/index.css` 和 `vite.config.ts` 中。

### 运行测试

```bash
# TypeScript 类型检查
npm run lint

# 构建检查
npm run build
```

## 📖 文档

- [组件拆分重构指南](./REFACTORING_GUIDE.md) - 详细的组件架构文档
- [API 文档](./docs/API.md) - Gemini API 集成指南（待添加）
- [部署指南](./docs/DEPLOYMENT.md) - 生产环境部署（待添加）

## 🤝 贡献

欢迎贡献！请遵循以下步骤:

1. Fork 本仓库
2. 创建特性分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 开启 Pull Request

**贡献指南**:
- 遵循现有代码风格
- 添加 TypeScript 类型定义
- 更新相关文档
- 确保构建成功 (`npm run build`)

## 🐛 问题反馈

遇到问题？请 [提交 Issue](https://github.com/your-username/ai-pulse/issues)

## 📄 许可证

MIT License - 详见 [LICENSE](LICENSE) 文件

## 🙏 致谢

- [Google Gemini](https://ai.google.dev/) - AI 驱动核心
- [Vercel](https://vercel.com) - 无缝部署体验
- [Tailwind CSS](https://tailwindcss.com) - 现代样式框架
- [Motion](https://motion.dev) - 流畅动画效果

## 📬 联系方式

- 项目主页: [https://github.com/your-username/ai-pulse](https://github.com/your-username/ai-pulse)
- 问题反馈: [Issues](https://github.com/your-username/ai-pulse/issues)
- 在线演示: [https://ai-pulse.vercel.app](https://ai-pulse.vercel.app)

---

**⚡ Built with AI • 与 AI 共创**

如果这个项目对你有帮助，请给个 ⭐️ Star！
