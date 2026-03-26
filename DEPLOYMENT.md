# ================================================
# 3D Packaging SaaS - 自托管架构迁移指南
# ================================================

## 📋 概述

本项目已从 Supabase 托管架构迁移到完全自托管架构，实现了数据的完全控制权。

## 🏗️ 架构变更对比

| 组件 | Supabase 架构 | 自托管架构 |
|------|-------------|----------|
| 数据库 | Supabase PostgreSQL | 自托管 PostgreSQL 16 |
| 对象存储 | Supabase Storage | MinIO (S3 兼容) |
| 认证系统 | Supabase Auth | NextAuth.js v5 |
| 权限控制 | Row Level Security | API 层权限校验 |
| 部署方式 | 云托管 | Docker Compose |

## 🚀 快速启动

### 1. 环境准备

确保已安装：
- Docker & Docker Compose
- Node.js 18+
- npm 或 yarn

### 2. 配置环境变量

```bash
cp .env.example .env
```

编辑 `.env` 文件，填入实际配置（开发环境可使用默认值）。

### 3. 启动基础设施

```bash
# 启动 PostgreSQL, MinIO, Redis
docker-compose up -d

# 查看服务状态
docker-compose ps

# 查看日志
docker-compose logs -f
```

服务端口：
- PostgreSQL: `localhost:5432`
- MinIO: `localhost:9000` (API)
- MinIO Console: `localhost:9001`
- Redis: `localhost:6379`

### 4. 安装依赖

```bash
npm install
```

### 5. 数据库初始化

数据库会在容器启动时自动执行 `docker/postgres/init/01-schema.sql` 脚本。

默认创建的测试账号：
- Admin: `admin@packaging.local` / `admin123`
- Vendor: `vendor@packaging.local` / `vendor123`
- Buyer: `buyer@packaging.local` / `buyer123`

⚠️ **生产环境请立即修改这些默认密码！**

### 6. 启动开发服务器

```bash
npm run dev
```

访问 `http://localhost:3000`

## 📁 项目结构

```
3D选型系统/
├── docker/
│   └── postgres/
│       └── init/
│           └── 01-schema.sql       # 数据库初始化脚本
├── src/
│   ├── app/
│   │   └── api/                    # API Routes
│   │       ├── auth/               # NextAuth 认证
│   │       ├── products/           # 产品接口
│   │       ├── design/             # 设计会话接口
│   │       └── inquiries/          # 询价接口
│   ├── lib/
│   │   ├── db.ts                   # PostgreSQL 连接
│   │   ├── s3.ts                   # MinIO 客户端
│   │   ├── auth.ts                 # NextAuth 配置
│   │   ├── types.ts                # TypeScript 类型
│   │   └── api-middleware.ts       # API 权限中间件
│   └── components/
│       └── vendor/
│           └── UploadModel.tsx     # 3D 模型上传组件
├── docker-compose.yml              # Docker 服务编排
└── .env.example                    # 环境变量模板
```

## 🔐 安全配置

### 1. 更新默认密码

**数据库密码**:
```env
POSTGRES_PASSWORD=your_secure_password
```

**MinIO 凭证**:
```env
MINIO_ROOT_USER=your_admin_user
MINIO_ROOT_PASSWORD=your_secure_password
```

**NextAuth Secret**:
```bash
# 生成随机密钥
openssl rand -base64 32
```

将生成的密钥设置到 `.env`:
```env
NEXTAUTH_SECRET=your_random_secret_key
```

### 2. 生产环境配置

**数据库**:
- 启用 SSL 连接
- 配置备份策略
- 限制网络访问

**MinIO**:
- 使用 HTTPS
- 配置 CDN 加速
- 设置对象生命周期策略

**应用**:
- 设置 `NODE_ENV=production`
- 配置反向代理 (Nginx)
- 启用 HTTPS

## 📡 API 文档

### 认证

**POST /api/auth/signin**
登录接口（NextAuth）

**POST /api/auth/signout**
登出接口

### 产品管理

**GET /api/products**
- 查询参数：`page`, `pageSize`, `status`, `vendorId`
- 权限：公开（买家/公开用户只能看到已发布产品）

**POST /api/products**
- 权限：仅商家
- 请求类型：`multipart/form-data`
- 字段：
  - `name` (必填): 产品名称
  - `description`: 产品描述
  - `price`: 单价
  - `moq`: 最小起订量
  - `tags`: 标签（逗号分隔）
  - `model` (必填): 3D 模型文件
  - `thumbnail`: 缩略图

### 设计会话

**POST /api/design/save**
- 权限：仅买家
- 请求类型：`multipart/form-data`
- 字段：
  - `productId` (必填)
  - `sessionName`
  - `configJson` (必填): 材质配置 JSON
  - `snapshot`: 渲染快照图片
  - `notes`

**GET /api/design/save**
- 权限：仅买家
- 返回当前用户的所有设计方案

### 询价管理

**POST /api/inquiries**
- 权限：仅买家
- 请求体：
  ```json
  {
    "productId": "uuid",
    "designSessionId": "uuid",
    "quantity": 1000,
    "message": "需求描述"
  }
  ```

**GET /api/inquiries**
- 权限：买家/商家
- 买家：查看自己发起的询价
- 商家：查看收到的询价

## 🧪 测试

### 测试上传功能

```bash
curl -X POST http://localhost:3000/api/products \
  -H "Cookie: your-session-cookie" \
  -F "name=Test Product" \
  -F "model=@path/to/model.glb" \
  -F "price=10.50" \
  -F "moq=1000"
```

### 访问 MinIO 控制台

浏览器访问：`http://localhost:9001`
- 用户名：`minioadmin`
- 密码：`minioadmin`

## 🛠️ 运维命令

### Docker 管理

```bash
# 停止服务
docker-compose down

# 停止并删除数据卷（⚠️ 会清空数据）
docker-compose down -v

# 重启特定服务
docker-compose restart postgres

# 查看服务日志
docker-compose logs -f minio
```

### 数据库管理

```bash
# 连接到 PostgreSQL
docker exec -it 3d-packaging-db psql -U postgres -d packaging_saas

# 备份数据库
docker exec 3d-packaging-db pg_dump -U postgres packaging_saas > backup.sql

# 恢复数据库
docker exec -i 3d-packaging-db psql -U postgres packaging_saas < backup.sql
```

### MinIO 管理

```bash
# 列出所有桶
docker exec 3d-packaging-minio mc ls myminio

# 查看桶策略
docker exec 3d-packaging-minio mc anonymous get myminio/3d-models
```

## 🚨 故障排查

### 数据库连接失败

1. 检查容器状态：`docker-compose ps`
2. 查看日志：`docker-compose logs postgres`
3. 验证环境变量：`DATABASE_URL`

### MinIO 上传失败

1. 检查桶是否创建：访问 `http://localhost:9001`
2. 验证 `forcePathStyle: true` 配置
3. 检查文件大小限制

### 认证问题

1. 清除浏览器 Cookie
2. 验证 `NEXTAUTH_SECRET` 已设置
3. 检查数据库中的 `profiles` 表

## 📚 相关文档

- [PostgreSQL Docker 官方文档](https://hub.docker.com/_/postgres)
- [MinIO 官方文档](https://min.io/docs/minio/linux/index.html)
- [NextAuth.js 文档](https://next-auth.js.org/)
- [AWS SDK for JavaScript v3](https://docs.aws.amazon.com/AWSJavaScriptSDK/v3/latest/)

## 🤝 贡献指南

欢迎提交 Issue 和 Pull Request！

## 📄 License

MIT
