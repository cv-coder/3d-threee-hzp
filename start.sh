#!/bin/bash

# ================================================
# 3D Packaging SaaS - 一键启动脚本
# ================================================

set -e

echo "🚀 启动 3D Packaging SaaS 自托管平台..."
echo ""

# 检查 Docker
if ! command -v docker &> /dev/null; then
    echo "❌ 错误: 未安装 Docker，请先安装 Docker"
    exit 1
fi

if ! command -v docker-compose &> /dev/null; then
    echo "❌ 错误: 未安装 Docker Compose，请先安装"
    exit 1
fi

# 检查 Node.js
if ! command -v node &> /dev/null; then
    echo "❌ 错误: 未安装 Node.js，请先安装 Node.js 18+"
    exit 1
fi

# 检查环境变量文件
if [ ! -f .env ]; then
    echo "📝 未找到 .env 文件，正在从模板创建..."
    cp .env.example .env
    echo "✅ .env 文件已创建，请根据需要修改配置"
    echo ""
fi

# 启动 Docker 服务
echo "🐳 启动 Docker 服务 (PostgreSQL, MinIO, Redis)..."
docker-compose up -d

echo ""
echo "⏳ 等待服务启动..."
sleep 5

# 检查服务状态
echo ""
echo "📊 服务状态:"
docker-compose ps

# 安装 npm 依赖
if [ ! -d "node_modules" ]; then
    echo ""
    echo "📦 安装 npm 依赖..."
    npm install
else
    echo ""
    echo "✅ npm 依赖已安装"
fi

# 提示用户
echo ""
echo "✅ 服务已启动成功！"
echo ""
echo "📡 服务访问地址:"
echo "  - PostgreSQL: localhost:5432"
echo "  - MinIO API: http://localhost:9000"
echo "  - MinIO Console: http://localhost:9001"
echo "  - Redis: localhost:6379"
echo ""
echo "🔑 默认凭证 (请在生产环境修改):"
echo "  - Database: postgres / postgres"
echo "  - MinIO: minioadmin / minioadmin"
echo ""
echo "👤 测试账号:"
echo "  - Admin: admin@packaging.local / admin123"
echo "  - Vendor: vendor@packaging.local / vendor123"
echo "  - Buyer: buyer@packaging.local / buyer123"
echo ""
echo "🚀 启动开发服务器:"
echo "   npm run dev"
echo ""
echo "📚 查看文档:"
echo "   - 部署指南: DEPLOYMENT.md"
echo "   - 迁移指南: MIGRATION.md"
echo ""
