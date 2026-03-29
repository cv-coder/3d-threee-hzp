# 3D包材选型系统 - 开发进度

> 项目类型: 多租户 B2B 3D包材SaaS平台  
> 技术栈: Next.js 14 + PostgreSQL + MinIO + NextAuth.js + Three.js + Tailwind CSS  
> 最后更新: 2026-03-28

---

## 项目概述

该项目为自托管 3D 包材选型系统，支持两类角色：
- 厂家: 上传 3D 模型、发布产品、处理询价
- 买家: 浏览产品、在线材质定制、保存方案、发起询价

核心目标:
- 实现从产品展示到询价闭环
- 保证多角色权限隔离
- 支持本地与服务器一致部署（Docker Compose）

---

## 当前架构

- 前端: Next.js 14 (App Router) + TypeScript + Tailwind + Shadcn UI
- 3D 引擎: three.js + @react-three/fiber + @react-three/drei
- 认证: NextAuth.js v5
- 数据库: PostgreSQL 16
- 对象存储: MinIO (S3 兼容)
- 部署: Docker Compose

---

## 已完成功能

### 1) 基础工程
- [x] 项目初始化与目录结构搭建
- [x] TypeScript 与 Tailwind 配置
- [x] 统一环境变量模板（.env.example）

### 2) 认证与权限
- [x] 邮箱密码注册/登录
- [x] 角色区分（vendor / buyer）
- [x] 路由保护（中间件 + 服务端校验）

### 3) 厂家工作台
- [x] 产品创建
- [x] 产品列表与状态管理（上架/下架）
- [x] 3D 模型上传入口（MinIO）

### 4) 买家工作台
- [x] 我的设计列表
- [x] 询价记录展示
- [x] 基础统计信息

### 5) 公开展厅与定制
- [x] 产品列表页（/shop）
- [x] 产品详情与 3D 预览（/shop/product/[productId]）
- [x] 材质参数调节（颜色、粗糙度、金属度）
- [x] 保存设计与发起询价流程

### 6) 后端接口
- [x] /api/auth/register
- [x] /api/products (GET/POST)
- [x] /api/design/save
- [x] /api/inquiries

### 7) 工程质量
- [x] 历史遗留依赖与旧调用已移除
- [x] TypeScript 编译通过（npx tsc --noEmit）
- [x] Git 仓库初始化完成

---

## 项目结构（当前）

```text
3D选型系统/
├── docker/
│   └── postgres/init/01-schema.sql
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   ├── auth/
│   │   │   ├── products/
│   │   │   ├── design/
│   │   │   └── inquiries/
│   │   ├── dashboard/
│   │   │   ├── vendor/
│   │   │   └── buyer/
│   │   └── shop/
│   ├── components/
│   │   ├── ui/
│   │   └── 3d/
│   └── lib/
│       ├── auth.ts
│       ├── db.ts
│       ├── s3.ts
│       └── api-middleware.ts
├── docker-compose.yml
├── .env.example
├── README.md
└── DEPLOYMENT.md
```

---

## 本地启动

1. 安装依赖
```bash
npm install
```

2. 准备环境变量
```bash
Copy-Item .env.example .env
```

3. 启动基础设施
```bash
npm run docker:up
```

4. 启动应用
```bash
npm run dev
```

访问: http://localhost:3000

---

## 下一阶段计划

- [ ] 完成产品编辑接口（PATCH /api/products/:id）
- [ ] 完成产品删除接口（DELETE /api/products/:id）
- [ ] 完成真实模型上传接口（/api/upload/model）
- [ ] 买家端设计列表与询价联动优化
- [ ] 移动端交互优化

---

## 已知待办

- Docker 未安装时无法启动 PostgreSQL/MinIO
- 部分前端按钮依赖尚未落地的后端端点
- 上传流程仍有 TODO 占位逻辑

---

## 备注

该文档已按当前自托管架构更新，不再包含过时的第三方 BaaS 初始化流程。
