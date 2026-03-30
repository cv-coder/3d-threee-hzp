@echo off
REM ================================================
REM 3D Packaging SaaS - Windows 一键启动脚本
REM ================================================

echo.
echo 启动 3D Packaging SaaS 自托管平台...
echo.

REM 检查 Docker
docker --version >nul 2>&1
if %errorlevel% neq 0 (
    echo 错误: 未安装 Docker，请先安装 Docker Desktop
    pause
    exit /b 1
)

docker-compose --version >nul 2>&1
if %errorlevel% neq 0 (
    echo 错误: 未安装 Docker Compose
    pause
    exit /b 1
)

REM 检查 Node.js
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo 错误: 未安装 Node.js，请先安装 Node.js 18+
    pause
    exit /b 1
)

REM 检查环境变量文件
if not exist .env (
    echo 未找到 .env 文件，正在从模板创建...
    copy .env.example .env
    echo .env 文件已创建，请根据需要修改配置
    echo.
)

REM 启动 Docker 服务
echo 启动 Docker 服务 (PostgreSQL, MinIO, Redis)...
docker-compose up -d

echo.
echo 等待服务启动...
timeout /t 5 /nobreak >nul

REM 检查服务状态
echo.
echo 服务状态:
docker-compose ps

REM 安装 npm 依赖
if not exist node_modules (
    echo.
    echo 安装 npm 依赖...
    call npm install
) else (
    echo.
    echo npm 依赖已安装
)

REM 提示用户
echo.
echo 服务已启动成功！
echo.
echo 服务访问地址:
echo   - PostgreSQL: localhost:5432
echo   - MinIO API: http://localhost:9000
echo   - MinIO Console: http://localhost:9001
echo   - Redis: localhost:6379
echo.
echo 默认凭证 (请在生产环境修改):
echo   - Database: postgres / postgres
echo   - MinIO: minioadmin / minioadmin
echo.
echo 测试账号:
echo   - Admin: admin@packaging.local / admin123
echo   - Vendor: vendor@packaging.local / vendor123
echo   - Buyer: buyer@packaging.local / buyer123
echo.
echo 启动开发服务器:
echo    npm run dev
echo.
echo 查看文档:
echo    - 部署指南: DEPLOYMENT.md
echo    - 迁移指南: MIGRATION.md
echo.

pause