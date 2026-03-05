#!/bin/bash

# FunASR 服务安装脚本 (macOS/Linux)

echo "🚀 开始安装 FunASR 服务..."

# 检查 Python
if ! command -v python3 &> /dev/null; then
    echo "❌ 未找到 Python3，请先安装"
    exit 1
fi

echo "✓ Python 版本: $(python3 --version)"

# 安装依赖
echo ""
echo "📦 安装依赖..."
pip3 install fastapi uvicorn python-multipart pydantic funasr modelscope soundfile librosa numpy

echo ""
echo "✅ 安装完成！"
echo ""
echo "📝 启动服务:"
echo "   cd server"
echo "   python3 main.py"
echo ""
echo "📖 API 文档: http://localhost:8000/docs"
