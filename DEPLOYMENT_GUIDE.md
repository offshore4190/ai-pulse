# 部署指南 / Deployment Guide

## 🚀 快速部署到 GitHub + Vercel

### 📋 部署前检查清单

**在推送到 GitHub 之前，请运行安全检查脚本**:

```bash
# 运行自动安全检查
./scripts/pre-deploy-check.sh

# 或手动检查
git status                    # 确认没有 .env 文件
grep -r "AIzaSy" src/        # 确认没有硬编码 API keys
npm run build                # 确认构建成功
```

---

## 🐙 步骤 1: 推送到 GitHub

### 1.1 初始化本地 Git 仓库（如果还没有）

```bash
cd "/Users/hao/Desktop/ai pulse"
git init
git add .
git commit -m "Initial commit: AI Pulse dashboard"
```

### 1.2 创建 GitHub 仓库

1. 访问 [github.com/new](https://github.com/new)
2. 仓库名称: `ai-pulse` (或你喜欢的名字)
3. 描述: `AI intelligence dashboard with dual perspectives`
4. 选择 **Public** 或 **Private**
5. **不要**勾选 "Add README" / ".gitignore" / "license" (我们已有这些文件)
6. 点击 **Create repository**

### 1.3 关联远程仓库并推送

```bash
# 替换 YOUR_USERNAME 为你的 GitHub 用户名
git remote add origin https://github.com/YOUR_USERNAME/ai-pulse.git

# 推送代码
git branch -M main
git push -u origin main
```

### 1.4 配置 GitHub Secrets (用于 GitHub Actions)

1. 进入你的 GitHub 仓库
2. 点击 **Settings** → **Secrets and variables** → **Actions**
3. 点击 **New repository secret**
4. 添加以下 secrets:

| Name | Value | 说明 |
|------|-------|------|
| `GEMINI_API_KEY` | 你的 Gemini API 密钥 | 用于每日快照生成 |
| `APP_URL` | `https://your-app.vercel.app` | Vercel 部署后填入 |

---

## ☁️ 步骤 2: 部署到 Vercel

### 2.1 导入 GitHub 仓库

1. 访问 [vercel.com](https://vercel.com)
2. 点击 **Add New...** → **Project**
3. 选择你的 GitHub 账号和 `ai-pulse` 仓库
4. 点击 **Import**

### 2.2 配置项目设置

**Framework Preset**: Vite ✅ (自动检测)

**Root Directory**: `./` ✅

**Build Command**:
```bash
npm run build
```

**Output Directory**:
```
dist
```

**Install Command**:
```bash
npm install
```

### 2.3 配置环境变量

在 Vercel 项目设置页面，添加环境变量:

| Key | Value | Environment |
|-----|-------|-------------|
| `GEMINI_API_KEY` | 你的 Gemini API 密钥 | Production, Preview, Development |
| `APP_URL` | (留空，首次部署后填入) | Production |
| `VITE_PIPELINE_API_URL` | (可选) 后端 API 地址 | Production |

**重要**: `GEMINI_API_KEY` 要选择所有环境（Production + Preview + Development）

### 2.4 部署

点击 **Deploy** 按钮，等待构建完成（约 1-2 分钟）

部署成功后，你会获得一个 URL，如:
```
https://ai-pulse-xxx.vercel.app
```

### 2.5 更新 APP_URL

1. 复制 Vercel 给你的部署 URL
2. 回到 Vercel 项目设置 → **Environment Variables**
3. 编辑 `APP_URL`，填入你的 Vercel URL
4. 点击 **Redeploy** (可选，下次部署会自动使用新值)

### 2.6 更新 GitHub Secret

回到 GitHub 仓库设置，更新 `APP_URL` secret 为你的 Vercel URL，以便 GitHub Actions 正常工作。

---

## 🔄 步骤 3: 设置自动部署

### 3.1 Vercel 自动部署

✅ 已自动配置！每次推送到 `main` 分支，Vercel 会自动构建和部署。

```bash
# 推送更新
git add .
git commit -m "Update features"
git push

# Vercel 会自动检测并部署
```

### 3.2 GitHub Actions 每日快照

✅ 已配置！工作流会在每天 UTC 22:00 (北京时间次日 06:00) 自动运行。

查看运行状态:
- GitHub 仓库 → **Actions** → **Daily Snap**

手动触发:
- GitHub 仓库 → **Actions** → **Daily Snap** → **Run workflow**

---

## 🌐 步骤 4: 配置自定义域名（可选）

### 4.1 在 Vercel 中添加域名

1. Vercel 项目 → **Settings** → **Domains**
2. 输入你的域名（如 `ai-pulse.com`）
3. 点击 **Add**

### 4.2 配置 DNS 记录

在你的域名提供商（如 Cloudflare, GoDaddy）添加记录:

**A 记录**:
```
Type: A
Name: @
Value: 76.76.21.21
```

**CNAME 记录**:
```
Type: CNAME
Name: www
Value: cname.vercel-dns.com
```

### 4.3 更新环境变量

将 `APP_URL` 更新为你的自定义域名:
```
APP_URL=https://ai-pulse.com
```

---

## 📱 步骤 5: 测试部署

### 5.1 功能测试清单

访问你的 Vercel URL 并测试:

- [ ] 页面正常加载
- [ ] 语言切换 (中文 ↔ 英文)
- [ ] 视角切换 (投资人 ↔ 学生)
- [ ] 今日重磅信号显示
- [ ] 关键指标网格显示
- [ ] 校园声音聊天功能 (学生视角)
- [ ] 用户资料页面 (积分、Streak)
- [ ] 播客视图
- [ ] 所有外部链接可点击

### 5.2 性能检查

```bash
# Lighthouse 测试 (Chrome DevTools)
1. 打开 Chrome DevTools (F12)
2. 切换到 Lighthouse 标签
3. 选择 Performance + Accessibility + Best Practices + SEO
4. 点击 Generate report

# 目标分数
Performance: >85
Accessibility: >90
Best Practices: >90
SEO: >85
```

### 5.3 移动端测试

- [ ] iPhone Safari
- [ ] Android Chrome
- [ ] 响应式布局正常
- [ ] 触摸交互流畅

---

## 🔧 故障排查

### 问题: 构建失败

**检查**:
```bash
# 本地测试构建
npm run build

# 查看错误日志
cat build-errors.log
```

**常见原因**:
- TypeScript 类型错误
- 缺少依赖
- 环境变量未配置

**解决**:
```bash
# 重新安装依赖
rm -rf node_modules package-lock.json
npm install

# 修复类型错误
npm run lint
```

### 问题: API 调用失败

**检查**:
1. Vercel 环境变量是否正确配置
2. `GEMINI_API_KEY` 是否有效
3. API 配额是否耗尽

**测试 API Key**:
```bash
curl -H "Content-Type: application/json" \
  -d '{"contents":[{"parts":[{"text":"Hello"}]}]}' \
  "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=YOUR_API_KEY"
```

### 问题: GitHub Actions 失败

**检查**:
1. Repository Secrets 是否配置
2. `.github/workflows/daily-snap.yml` 是否正确
3. 查看 Actions 日志了解详细错误

**手动运行**:
```bash
# 本地测试快照生成
GEMINI_API_KEY=your_key APP_URL=https://your-app.vercel.app node scripts/generate-snap.mjs
```

---

## 🔄 日常维护

### 更新代码

```bash
# 1. 拉取最新代码
git pull

# 2. 安装新依赖（如果有）
npm install

# 3. 测试
npm run dev

# 4. 构建
npm run build

# 5. 推送
git add .
git commit -m "Your update message"
git push
```

### 监控 API 配额

1. 访问 [Google AI Studio](https://ai.google.dev/)
2. 查看 API 使用情况
3. 如需要，升级到付费计划

### 更新依赖

```bash
# 检查过期依赖
npm outdated

# 更新依赖
npm update

# 或使用 npm-check-updates
npx npm-check-updates -u
npm install
```

---

## 📊 分析和监控

### Vercel Analytics

1. Vercel 项目 → **Analytics**
2. 查看访问量、性能指标
3. 免费版提供基础数据

### Google Analytics (可选)

在 `public/index.html` 添加:

```html
<!-- Google Analytics -->
<script async src="https://www.googletagmanager.com/gtag/js?id=G-XXXXXXXXXX"></script>
<script>
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('js', new Date());
  gtag('config', 'G-XXXXXXXXXX');
</script>
```

---

## 🎯 性能优化建议

### 1. 启用缓存

在 `vercel.json` 中配置:

```json
{
  "headers": [
    {
      "source": "/assets/(.*)",
      "headers": [
        {
          "key": "Cache-Control",
          "value": "public, max-age=31536000, immutable"
        }
      ]
    }
  ]
}
```

### 2. 图片优化

使用 Vercel Image Optimization:

```tsx
import Image from 'next/image'; // 如果迁移到 Next.js

<Image
  src="/logo.png"
  width={100}
  height={100}
  alt="Logo"
/>
```

### 3. 代码分割

使用 React lazy loading:

```tsx
import { lazy, Suspense } from 'react';

const PodcastView = lazy(() => import('./components/PodcastDailyView'));

<Suspense fallback={<Loading />}>
  <PodcastView />
</Suspense>
```

---

## ✅ 部署完成检查清单

- [ ] 代码已推送到 GitHub
- [ ] Vercel 部署成功
- [ ] 环境变量已配置
- [ ] GitHub Secrets 已配置
- [ ] 自定义域名已设置（如果有）
- [ ] 功能测试全部通过
- [ ] 性能测试达标
- [ ] GitHub Actions 正常运行
- [ ] README 中的 URL 已更新
- [ ] SECURITY.md 已审查

---

## 📚 相关文档

- [README.md](./README.md) - 项目总览
- [SECURITY.md](./SECURITY.md) - 安全策略
- [REFACTORING_GUIDE.md](./REFACTORING_GUIDE.md) - 组件架构

---

**🎉 恭喜！你的 AI Pulse 已成功部署到生产环境！**

如有问题，请查看 [故障排查](#故障排查) 部分或提交 [Issue](https://github.com/YOUR_USERNAME/ai-pulse/issues)。
