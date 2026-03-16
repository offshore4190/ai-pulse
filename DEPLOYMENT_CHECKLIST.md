# 🚀 GitHub 部署快速检查清单

> 在推送到 GitHub 前，请完成以下检查

## ✅ 安全检查

### 环境变量
- [ ] `.env` 文件**不在** Git 版本控制中
- [ ] `.env.example` 存在且只包含占位符
- [ ] `.gitignore` 包含 `.env` 和其他敏感文件
- [ ] 代码中没有硬编码的 API keys

### 代码审查
- [ ] 运行 `./scripts/pre-deploy-check.sh` 并通过所有检查
- [ ] 没有 `console.log` 包含敏感信息
- [ ] 所有 API keys 通过环境变量注入
- [ ] `npm run build` 构建成功
- [ ] `npm run lint` 类型检查通过

## 📝 文档完整性

- [ ] README.md 已更新（如有新功能）
- [ ] LICENSE 文件存在
- [ ] SECURITY.md 已审查
- [ ] 示例截图或 GIF（可选，增强可读性）

## 🔧 功能测试

### 本地测试
- [ ] `npm run dev` 本地运行正常
- [ ] 语言切换功能正常
- [ ] 视角切换功能正常
- [ ] 所有链接可点击
- [ ] 无控制台错误

### 数据加载
- [ ] Gemini API 调用成功
- [ ] Fallback 数据正常显示（API 失败时）
- [ ] 缓存机制工作正常
- [ ] 用户统计（积分、Streak）正常

## 🌐 部署配置

### GitHub 仓库
- [ ] 仓库名称有意义（如 `ai-pulse`）
- [ ] 仓库描述清晰
- [ ] 选择合适的可见性（Public / Private）
- [ ] `.github/workflows/daily-snap.yml` 配置正确

### GitHub Secrets（部署后配置）
- [ ] `GEMINI_API_KEY` 已添加到 Repository Secrets
- [ ] `APP_URL` 已添加到 Repository Secrets（部署后）

### Vercel 配置（部署后）
- [ ] 项目已导入
- [ ] `GEMINI_API_KEY` 环境变量已配置
- [ ] `APP_URL` 环境变量已配置（可选）
- [ ] 自动部署已启用

## 📦 Git 提交

### 提交前检查
```bash
# 1. 查看状态
git status

# 2. 查看即将提交的更改
git diff

# 3. 运行安全检查
./scripts/pre-deploy-check.sh

# 4. 确认构建
npm run build
```

### 首次提交
```bash
# 添加所有文件（.gitignore 会自动排除敏感文件）
git add .

# 创建提交
git commit -m "Initial commit: AI Pulse - 高密度 AI 情报仪表盘"

# 关联远程仓库（替换 YOUR_USERNAME）
git remote add origin https://github.com/YOUR_USERNAME/ai-pulse.git

# 推送到 GitHub
git branch -M main
git push -u origin main
```

## 🎯 部署后验证

### GitHub 验证
- [ ] 代码已推送到 GitHub
- [ ] README 正确显示
- [ ] `.env` 没有出现在仓库中
- [ ] GitHub Actions 工作流可见

### Vercel 验证
- [ ] 部署成功（绿色勾号）
- [ ] 访问 Vercel URL 正常
- [ ] 功能完整可用
- [ ] 性能达标（Lighthouse > 85）

### GitHub Actions 验证
- [ ] Daily Snap 工作流存在
- [ ] 可手动触发工作流
- [ ] 工作流运行成功（首次可能需要手动触发）

## 🆘 常见问题

### Q: 推送时提示 `.env` 文件太大
**A**: `.env` 不应该被推送！检查 `.gitignore` 配置：
```bash
git rm --cached .env
git commit -m "Remove .env from version control"
```

### Q: Vercel 构建失败
**A**: 检查环境变量是否配置，运行 `npm run build` 查看详细错误

### Q: GitHub Actions 失败
**A**: 检查 Repository Secrets 是否配置，查看 Actions 日志

### Q: API 调用 429 错误
**A**: Gemini API 配额耗尽，升级到付费计划或等待配额重置

## 📚 相关文档

- [README.md](./README.md) - 项目说明
- [SECURITY.md](./SECURITY.md) - 安全策略
- [DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md) - 详细部署步骤
- [REFACTORING_GUIDE.md](./REFACTORING_GUIDE.md) - 组件架构

---

## ✅ 最终确认

完成以上所有检查项后，你已准备好部署到 GitHub！

```bash
# 最后一次安全检查
./scripts/pre-deploy-check.sh

# 如果通过，执行推送
git push
```

**🎉 祝你部署顺利！**
