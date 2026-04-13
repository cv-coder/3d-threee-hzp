# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 常用命令

```bash
# 开发
npm run dev          # 启动 Next.js 开发服务器

# 构建与生产
npm run build        # 生产构建
npm run start        # 启动生产服务器

# 代码质量
npm run lint         # 通过 next lint 运行 ESLint

# Docker 服务（PostgreSQL 必需，MinIO/Redis 可选）
npm run docker:up    # 启动所有服务（默认仅启动 postgres）
npm run docker:down  # 停止所有服务

# 启动含 MinIO 对象存储的完整服务：
docker-compose --profile with-minio up -d

# 数据库备份/恢复
npm run db:backup    # pg_dump 导出到 backup.sql
npm run db:restore   # 从 backup.sql 恢复
```

## 架构总览

**Aether3D** 是一个 B2B SaaS 平台，连接包材厂商（vendor）与品牌买家（buyer），提供 3D 可视化产品定制及询价/报价工作流。

### 技术栈
- **框架**：Next.js 14（App Router，RSC）
- **数据库**：PostgreSQL，通过 `postgres` npm 包使用原生 SQL，无 ORM
- **认证**：NextAuth v5 beta（JWT 策略，credentials provider）
- **3D 渲染**：Three.js + React Three Fiber + @react-three/drei
- **对象存储**：MinIO（S3 兼容），通过 AWS SDK v3 访问
- **状态管理**：Zustand
- **UI**：Tailwind CSS + Radix UI 基础组件 + shadcn/ui 组件

### 用户角色与路由
三个角色各有独立 Dashboard，在 `src/middleware.ts` 中强制执行：
- `admin` → `/dashboard/admin` — 厂商审核、品类管理
- `vendor` → `/dashboard/vendor` — 产品/模型管理、询价处理
- `buyer` → `/dashboard/buyer` — 浏览商城、3D 定制、提交询价

公开路由：`/`、`/login`、`/register`、`/shop/**`

### 数据流

1. **认证**分为两套配置以兼容 Edge Runtime：
   - `src/lib/auth-config.ts` — 轻量配置，供 middleware 使用（Edge 安全，不访问数据库）
   - `src/lib/auth.ts` — 完整配置，含数据库查询（仅 Node.js 环境）

2. **数据库**（`src/lib/db.ts`）：对 `postgres` 标签模板字面量的薄封装。提供 `db.findOne`、`db.findMany`、`db.insert`、`db.update`、`db.delete`，以及用于复杂查询的原始 `sql` 标签。全程原生 SQL，无 ORM。

3. **文件存储**（`src/lib/s3.ts`）：通过 S3 兼容 API 操作 MinIO。四个 bucket：`3d-models` 和 `thumbnails` 为公开访问；`logos` 和 `snapshots` 使用签名 URL。凭证优先使用 `MINIO_ROOT_USER/PASSWORD`，其次才是 `MINIO_ACCESS_KEY/SECRET_KEY`。

4. **API 路由**（`src/app/api/`）：使用 `src/lib/api-middleware.ts` 中的 `withAuth()`（角色鉴权）或 `withErrorHandler()`（公开接口）包装。`withAuth` 会将 session 作为第二个参数注入处理函数。

5. **3D 配置器**（`src/components/3d/Configurator3D.tsx`）：核心组件。使用 DRACOLoader 加载 GLTF/GLB 模型，自动将相机适配到模型包围盒，首次加载时快照原始材质，后续根据 `MaterialConfig` 在重渲染时应用覆盖。支持按部件设置颜色和表面工艺。五种表面工艺预设：`injection-color`、`paint-matte`、`electroplated-glossy`、`electroplated-matte`、`glass`。环境贴图依赖 `/public/hdr/studio_small_03_1k.hdr`。

### 关键类型（`src/types/database.ts`）
- `MaterialConfig` — 以 JSONB 存储于 `products.material_config` 和 `design_sessions.config_json`，包含 `color`、`surfaceFinish`、`parts`（以 mesh 名称为键的逐部件覆盖）、`logoUrl` 等字段
- `ModelPart` — 从已加载 GLTF 中检测到的可编辑部件描述，用于逐部件材质控制 UI
- `SurfaceFinishType` — 五种工艺预设键的联合类��

### 数据库 Schema
由 `docker/postgres/init/01-schema.sql` 初始化。核心表：
- `profiles` — 所有用户（admin/vendor/buyer），自定义凭证认证，无 NextAuth adapter 表
- `products` — 厂商产品，含 `material_config JSONB`
- `model_assets` — 已上传 3D 模型文件，在数据库中记录对应的 MinIO 路径
- `design_sessions` — 买家定制会话，含 `config_json JSONB`
- `inquiries` — 买家→厂商询价记录，可关联设计会话
- `accessory_categories` — 管理员维护的产品品类

### 环境变量
在 `.env.local` 中配置：
```
NEXTAUTH_SECRET=
POSTGRES_HOST=localhost
POSTGRES_PORT=4563        # docker-compose 映射到 4563，非默认的 5432
POSTGRES_DB=packaging_saas
POSTGRES_USER=postgres
POSTGRES_PASSWORD=postgres
NEXT_PUBLIC_MINIO_URL=http://localhost:9000
MINIO_ENDPOINT=localhost
MINIO_PORT=9000
MINIO_ROOT_USER=minioadmin
MINIO_ROOT_PASSWORD=minioadmin
```

### 初始种子账号（来自 schema 初始化）
- `admin@packaging.local` / `admin123`
- `vendor@packaging.local` / `vendor123`
- `buyer@packaging.local` / `buyer123`
