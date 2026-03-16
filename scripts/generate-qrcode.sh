#!/bin/bash

# 生成二维码脚本
# 用法: ./scripts/generate-qrcode.sh https://your-deployment-url.com

set -e

# 颜色定义
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo "🎨 AI Pulse - 二维码生成工具"
echo "================================"
echo ""

# 检查参数
if [ -z "$1" ]; then
    echo -e "${YELLOW}⚠️  请提供部署 URL${NC}"
    echo ""
    echo "用法: $0 <URL>"
    echo ""
    echo "示例:"
    echo "  $0 https://ai-pulse.pages.dev"
    echo "  $0 https://ai-pulse.vercel.app"
    exit 1
fi

URL="$1"
OUTPUT_DIR="qrcodes"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)

# 创建输出目录
mkdir -p "$OUTPUT_DIR"

echo "📱 生成二维码..."
echo "URL: $URL"
echo ""

# 生成不同尺寸的二维码
echo "生成标准版 (300x300)..."
qrencode -s 10 -l H -o "$OUTPUT_DIR/qrcode_standard_$TIMESTAMP.png" "$URL"

echo "生成大尺寸版 (600x600)..."
qrencode -s 20 -l H -o "$OUTPUT_DIR/qrcode_large_$TIMESTAMP.png" "$URL"

echo "生成超大版 (900x900 - 适合打印)..."
qrencode -s 30 -l H -o "$OUTPUT_DIR/qrcode_print_$TIMESTAMP.png" "$URL"

echo "生成终端版..."
qrencode -t ANSIUTF8 "$URL"

echo ""
echo -e "${GREEN}✅ 二维码生成成功！${NC}"
echo ""
echo "文件保存在:"
echo "  📁 ./$OUTPUT_DIR/"
echo "  - qrcode_standard_$TIMESTAMP.png (300x300 - 手机展示)"
echo "  - qrcode_large_$TIMESTAMP.png (600x600 - 投影仪)"
echo "  - qrcode_print_$TIMESTAMP.png (900x900 - 打印海报)"
echo ""
echo "💡 使用建议:"
echo "  - 课堂投影: 使用 large 版本"
echo "  - 打印材料: 使用 print 版本"
echo "  - 在线分享: 使用 standard 版本"
echo ""
echo "🔗 访问 URL: $URL"
