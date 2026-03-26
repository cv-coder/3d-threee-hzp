# 3D包材选型系统 (自托管版)

> 多租户 B2B 3D包材SaaS平台 - 完全自托管架构

## 📋 项目概述

一个完全自托管的3D包材定制SaaS平台，允许"包材厂商"上传3D模型并上架产品，"品牌方"在线浏览、定制瓶子材质并发起询价。

**架构特点**:
- ✅ 完全数据掌控权（无第三方依赖）
- ✅ Docker 一键部署
- ✅ 生产级别的安全性
- ✅ 高性能对象存储（MinIO）

## 🏗️ 技术栈

| 类型 | 技术 |
|------|------|
| **前端** | Next.js 14, React, TypeScript, Tailwind CSS, Shadcn/UI |
| **3D 引擎** | Three.js, @react-three/fiber, @react-three/drei |
| **数据库** | PostgreSQL 16 (自托管) |
| **对象存储** | MinIO (S3 兼容) |
| **认证** | NextAuth.js v5 |
| **状态管理** | Zustand |
| **容器化** | Docker, Docker Compose |

## 🚀 快速开始

### 方式一：一键启动脚本（推荐）

**Windows**:
```bash
start.bat
```

**Linux/Mac**:
```bash
chmod +x start.sh
./start.sh
```

### 方式二：手动启动

#### 1. 安装依赖

确保已安装：
- Docker & Docker Compose
- Node.js 18+
- npm 或 yarn

#### 2. 配置环境变量

```bash
cp .env.example .env
```

编辑 `.env` 文件（开发环境可使用默认值）

#### 3. 启动基础设施

```bash
npm run docker:up
# 或
docker-compose up -d
```

服务端口：
- PostgreSQL: `localhost:5432`
- MinIO: `localhost:9000` (API)
- MinIO Console: `localhost:9001`
- Redis: `localhost:6379`

#### 4. 安装项目依赖

```bash
npm install
```

#### 5. 启动开发服务器

```bash
npm run dev
```

访问 `http://localhost:3000`

## 🔑 默认测试账号

| 角色 | 邮箱 | 密码 |
|------|------|------|
| 管理员 | admin@packaging.local | admin123 |
| 商家 | vendor@packaging.local | vendor123 |
| 买家 | buyer@packaging.local | buyer123 |

⚠️ **生产环境请立即修改这些密码！**

访问 http://localhost:3000

## 📡 核心 API

### 认证
- `POST /api/auth/signin` - 登录
- `POST /api/auth/signout` - 登出

### 产品管理
- `GET /api/products` - 获取产品列表（支持分页、筛选）
- `POST /api/products` - 上传产品（仅商家）

### 设计会话
- `GET /api/design/save` - 获取设计方案列表
- `POST /api/design/save` - 保存设计方案（仅买家）

### 询价
- `GET /api/inquiries` - 获取询价列表
- `POST /api/inquiries` - 创建询价（仅买家）

详细 API 文档请查看 [DEPLOYMENT.md](./DEPLOYMENT.md)

## 🛠️ 常用命令

```bash
# Docker 管理
npm run docker:up        # 启动服务
npm run docker:down      # 停止服务
npm run docker:logs      # 查看日志

# 数据库管理
npm run db:backup        # 备份数据库
npm run db:restore       # 恢复数据库

# 开发
npm run dev              # 启动开发服务器
npm run build            # 构建生产版本
npm run start            # 启动生产服务器
```

## 📁 项目结构

```
3D选型系统/
├── docker/
│   └── postgres/init/          # 数据库初始化脚本
├── src/
│   ├── app/
│   │   ├── api/                # API Routes
│   │   │   ├── auth/          # NextAuth
│   │   │   ├── products/      # 产品接口
│   │   │   ├── design/        # 设计会话
│   │   │   └── inquiries/     # 询价
│   │   ├── dashboard/         # Dashboard 页面
│   │   └── shop/              # 公开展厅
│   ├── components/
│   │   ├── ui/                # UI 组件库
│   │   ├── 3d/                # 3D 组件
│   │   └── vendor/            # 商家组件
│   └── lib/
│       ├── db.ts              # 数据库连接
│       ├── s3.ts              # MinIO 客户端
│       ├── auth.ts            # NextAuth 配置
│       └── types.ts           # 类型定义
├── docker-compose.yml         # Docker 编排
├── DEPLOYMENT.md              # 部署指南
├── MIGRATION.md               # 迁移说明
└── start.sh / start.bat       # 一键启动脚本
```

## 📚 文档

- **[DEPLOYMENT.md](./DEPLOYMENT.md)** - 详细部署指南和API文档
- **[MIGRATION.md](./MIGRATION.md)** - Supabase 迁移说明
- **[process.md](./process.md)** - 开发进度文档

## 🔐 安全建议

生产环境部署前必须：
1. ✅ 修改所有默认密码
2. ✅ 生成安全的 `NEXTAUTH_SECRET`
3. ✅ 配置 SSL/TLS
4. ✅ 设置防火墙规则
5. ✅ 启用数据库备份
6. ✅ 配置访问日志和监控

## 🆘 故障排查

### 数据库连接失败
```bash
docker-compose ps                    # 检查容器状态
docker-compose logs postgres         # 查看日志
```

### MinIO 上传失败
访问 MinIO Console: `http://localhost:9001`
验证桶是否创建成功

### 认证问题
清除浏览器 Cookie，验证 `NEXTAUTH_SECRET` 已设置

详细故障排查请查看 [DEPLOYMENT.md](./DEPLOYMENT.md#故障排查)

## 🤝 贡献

欢迎提交 Issue 和 Pull Request！

## 📄 开源协议

MIT
