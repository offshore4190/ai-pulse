# Cloudflare Pages 部署指南（国内访问优化）

## 📋 部署步骤

### 1. 创建 Cloudflare 账号

1. 访问 https://dash.cloudflare.com/sign-up
2. 使用邮箱注册（无需信用卡）

### 2. 连接 GitHub 仓库

1. 登录后，左侧菜单选择 **Workers & Pages**
2. 点击 **Create application**
3. 选择 **Pages** 标签
4. 点击 **Connect to Git**
5. 授权 Cloudflare 访问 GitHub
6. 选择仓库：`offshore4190/ai-pulse`

### 3. 配置构建设置

```
Project name: ai-pulse
Production branch: main
Framework preset: None
Build command: npm run build
Build output directory: dist
```

### 4. 环境变量配置

点击 **Environment variables (advanced)**，添加：

| Variable name | Value |
|---------------|-------|
| `GEMINI_API_KEY` | 你的 Gemini API 密钥 |
| `NODE_VERSION` | 20 |

### 5. 部署

点击 **Save and Deploy**，等待 2-3 分钟。

### 6. 获取部署 URL

部署成功后，你会获得：
- 主域名：`https://ai-pulse-xxx.pages.dev`
- 可以在 **Custom domains** 添加自定义域名

## 🔧 部署后配置

### 更新 Serverless Functions（如果使用）

Cloudflare Pages 支持 Functions，但需要调整：

1. 创建 `functions` 目录（而不是 `api`）
2. 将 `api/messages.ts` 移动到 `functions/api/messages.ts`
3. 修改为 Cloudflare Workers 格式

**或者**：保持当前结构，使用客户端直接调用 Gemini API（已支持）

### 国内访问优化

Cloudflare 在中国有 CDN 节点，默认已优化。如需进一步加速：

1. 绑定已备案的自定义域名
2. 启用 Cloudflare 的 China Network
3. 配置缓存规则

## 📱 生成二维码

部署完成后，使用以下方式生成二维码：

### 在线生成（推荐）

访问：https://cli.im/
输入你的 Cloudflare Pages URL，生成二维码并下载。

### 使用代码生成

```bash
# 安装 qrcode
npm install -g qrcode

# 生成二维码（替换 URL）
qrcode "https://ai-pulse-xxx.pages.dev" -o qrcode.png
```

## 🎯 完整部署检查清单

- [ ] Cloudflare 账号已创建
- [ ] GitHub 仓库已连接
- [ ] 构建设置已配置
- [ ] `GEMINI_API_KEY` 环境变量已添加
- [ ] 部署成功
- [ ] 访问 URL 正常工作
- [ ] 国内网络测试通过
- [ ] 二维码已生成
- [ ] 在手机上测试扫码访问

## 🔍 故障排查

### 问题：构建失败

**检查**：
- 确认 `NODE_VERSION` 环境变量设为 `20`
- 查看构建日志，检查错误信息

### 问题：API 调用失败

**检查**：
- 确认 `GEMINI_API_KEY` 已正确配置
- 检查 API 配额是否充足

### 问题：国内访问慢

**解决**：
- 使用自定义域名（需备案）
- 联系 Cloudflare 启用 China Network（企业版功能）

## 📞 支持

如有问题，查看：
- Cloudflare Pages 文档: https://developers.cloudflare.com/pages/
- 项目 GitHub Issues: https://github.com/offshore4190/ai-pulse/issues
