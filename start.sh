#!/bin/bash

# 帕鲁答题游戏启动脚本
# 启动后端服务和前端静态文件服务

cd "$(dirname "$0")"

echo "🎮 启动帕鲁答题游戏服务..."
echo "================================"

# 检查 node_modules 是否存在
if [ ! -d "node_modules" ]; then
    echo "📦 正在安装依赖..."
    npm install
fi

# 设置默认管理员密码（如果没有设置）
if [ -z "$ADMIN_PASSWORD" ]; then
    export ADMIN_PASSWORD="palu2024admin"
    echo "🔑 使用默认管理员密码: palu2024admin"
    echo "   建议通过环境变量设置自定义密码:"
    echo "   export ADMIN_PASSWORD=your_password"
fi

# 启动后端服务
echo "🚀 启动后端服务 (端口 3000)..."
node backend.js &
BACKEND_PID=$!

# 等待后端启动
sleep 2

# 检查后端是否成功启动
if ! kill -0 $BACKEND_PID 2>/dev/null; then
    echo "❌ 后端启动失败"
    exit 1
fi

echo "✅ 后端服务已启动 (PID: $BACKEND_PID)"
echo ""
echo "================================"
echo "🎮 游戏地址: http://localhost:3000"
echo "================================"
echo ""
echo "按 Ctrl+C 停止服务"
echo ""

# 等待用户中断
trap "echo ''; echo '🛑 正在停止服务...'; kill $BACKEND_PID 2>/dev/null; exit 0" INT
wait $BACKEND_PID
