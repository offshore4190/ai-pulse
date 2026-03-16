# 安全策略 / Security Policy

## 🔒 安全最佳实践

### 环境变量管理

1. **本地开发**
   ```bash
   # ✅ 正确做法
   cp .env.example .env
   # 编辑 .env 填入真实密钥
   # .env 已被 .gitignore 忽略

   # ❌ 错误做法
   # 不要在代码中硬编码 API key
   const apiKey = "AIzaSyXXXXXXXX"; // 危险！
   ```

2. **生产部署**
   - Vercel: 在项目设置中配置环境变量
   - GitHub Actions: 使用 Repository Secrets
   - 永远不要在代码或配置文件中暴露真实密钥

### Git 提交前检查

在每次提交前，请确认:

```bash
# 1. 检查是否有敏感文件
git status

# 2. 查看即将提交的内容
git diff --staged

# 3. 确认 .env 没有被跟踪
git ls-files | grep .env
# 应该只看到 .env.example

# 4. 搜索代码中的潜在密钥
grep -r "AIzaSy" src/ scripts/ --exclude-dir=node_modules
grep -r "GEMINI_API_KEY.*=" src/ scripts/ --exclude-dir=node_modules
```

### API Key 安全

1. **获取 Gemini API Key**
   - 访问: https://ai.google.dev/
   - 创建项目并生成 API key
   - 设置使用配额限制（防止滥用）

2. **密钥轮换**
   - 定期（建议每 3-6 个月）更换 API key
   - 如怀疑密钥泄露，立即撤销并生成新密钥

3. **访问控制**
   - 在 Google Cloud Console 中限制 API key 使用范围
   - 仅允许特定 HTTP referrer (如你的域名)
   - 设置每日请求配额

### 代码审查清单

提交 Pull Request 前，请确认:

- [ ] 没有硬编码的 API keys
- [ ] 没有硬编码的密码或 tokens
- [ ] .env 文件没有被提交
- [ ] .env.example 已更新（如果添加了新变量）
- [ ] 敏感日志已移除（如 console.log API keys）
- [ ] 所有外部链接使用 `rel="noopener noreferrer"`

## 🛡️ 漏洞报告

如果你发现安全漏洞，请**不要**公开提 Issue。

请通过以下方式私下报告:

1. **GitHub Security Advisory**
   - 进入仓库 → Security → Advisories → New draft
   - 详细描述漏洞和复现步骤

2. **电子邮件** (如果没有 GitHub 账号)
   - 发送至: security@your-domain.com
   - 主题: [SECURITY] AI Pulse Vulnerability Report

我们承诺在 48 小时内回复，并在 7 天内修复严重漏洞。

## 🔍 已知限制

1. **API 配额耗尽**
   - Gemini API 免费配额有限
   - 建议升级到付费计划以获得稳定服务
   - 已实现降级到静态 fallback 数据

2. **WebSocket 无认证**
   - 校园声音功能当前为匿名模式
   - 缺少用户认证可能导致滥用
   - 已实现基础内容长度验证（0-500 字符）

3. **本地存储安全**
   - 用户数据存储在 localStorage（浏览器本地）
   - 清除浏览器数据会丢失用户统计
   - 暂无服务端持久化

## ✅ 部署前安全检查清单

### Vercel 部署

- [ ] 在 Vercel 项目设置中配置 `GEMINI_API_KEY`
- [ ] 在 Vercel 项目设置中配置 `APP_URL`
- [ ] 确认环境变量没有在日志中暴露
- [ ] 测试生产构建是否正常工作
- [ ] 配置自定义域名（如果有）
- [ ] 启用 HTTPS (Vercel 默认启用)

### GitHub Actions

- [ ] 在 Repository Settings → Secrets 中添加 `GEMINI_API_KEY`
- [ ] 在 Repository Settings → Secrets 中添加 `APP_URL`
- [ ] 测试工作流是否能成功运行
- [ ] 检查 Actions 日志，确认没有密钥泄露
- [ ] 限制工作流权限（仅需要的最小权限）

### 代码库

- [ ] 确认 `.env` 在 `.gitignore` 中
- [ ] 确认 `.env.example` 没有真实密钥
- [ ] 搜索代码中的 `console.log` 并移除敏感日志
- [ ] 检查是否有硬编码的密钥或密码
- [ ] 更新 README 中的联系方式和链接
- [ ] 添加 LICENSE 文件（推荐 MIT）

## 🚨 应急响应

### 如果 API Key 泄露

1. **立即撤销**
   - 登录 Google AI Studio
   - 删除泄露的 API key

2. **生成新密钥**
   - 创建新的 API key
   - 更新所有部署环境的环境变量

3. **检查使用情况**
   - 查看 API 使用日志
   - 确认是否有异常请求
   - 如有大量异常请求，联系 Google 支持

4. **通知用户**
   - 如果泄露影响用户数据，及时通知
   - 在 README 中添加安全公告

### 恢复检查清单

- [ ] 旧密钥已撤销
- [ ] 新密钥已部署到所有环境
- [ ] API 配额恢复正常
- [ ] 无异常日志或请求
- [ ] 更新事后总结文档

## 📚 参考资源

- [Vercel 环境变量文档](https://vercel.com/docs/concepts/projects/environment-variables)
- [GitHub Secrets 文档](https://docs.github.com/en/actions/security-guides/encrypted-secrets)
- [Google AI Studio 安全指南](https://ai.google.dev/docs/security)
- [OWASP Top 10](https://owasp.org/www-project-top-ten/)

## 📅 更新日志

- **2026-03-16**: 初始安全策略发布
- 定期审查和更新本文档

---

**安全是一个持续的过程，而不是一次性的任务。**

如有任何安全相关问题，请随时联系维护者。
