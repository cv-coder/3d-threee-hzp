# 3D包材选型系统 - 开发进度

> 项目类型: 多租户 B2B 3D包材SaaS平台  
> 技术栈: Next.js 14 + PostgreSQL + MinIO + NextAuth.js + Three.js + Tailwind CSS  
> 最后更新: 2026-03-29

---

## 项目概述

该项目为自托管 3D 包材选型系统，支持三类角色：
- 管理员: 管理厂家认证、系统配置
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
- [x] 角色区分（admin / vendor / buyer）
- [x] 路由保护（中间件 + 服务端校验）
- [x] SessionProvider 全局包装支持 useSession 客户端钩子
- [x] JWT token 会话管理与 Edge Runtime 兼容分离

### 3) 管理员后台
- [x] 厂家列表查看（含认证状态）
- [x] 厂家快速认证/取消认证（一键操作）
- [x] 厂家搜索功能（模糊搜索名称和邮箱）
- [x] Bootstrap 初始化 API（token 保护，自动禁用）
- [x] /dashboard/admin 管理员工作台

### 4) 厂家工作台
- [x] 产品创建
- [x] 产品编辑（PATCH - 支持全字段更新）
- [x] 产品删除（DELETE - 带所有权校验）
- [x] 产品列表与状态管理（草稿/已发布/已下架）
- [x] 3D 模型上传入口（MinIO）

### 5) 买家工作台
- [x] 我的设计列表
- [x] 询价记录展示
- [x] 基础统计信息

### 6) 公开展厅与定制
- [x] 产品列表页（/shop - 仅显示热门产品及所属厂家）
- [x] 厂家店铺页面（/shop/vendor/[vendorId] - 展示所有厂家上架产品）
- [x] 产品详情与 3D 预览（/shop/product/[productId]）
- [x] 材质参数调节（颜色、粗糙度、金属度）
- [x] 保存设计与发起询价流程
- [x] 产品页 header 用户状态显示（邮箱 + 角色标签）
- [x] 快速退出登录（header 退出按钮）

### 7) 后端接口
- [x] /api/auth/register
- [x] /api/auth/login
- [x] /api/products (GET/POST)
- [x] /api/products/[productId] (PATCH/DELETE)
- [x] /api/admin/vendors (GET - 厂家列表)
- [x] /api/admin/vendors/[vendorId]/verify (PATCH - 认证状态)
- [x] /api/admin/bootstrap (POST - 首次管理员创建)
- [x] /api/design/save
- [x] /api/inquiries

### 8) UI 与交互
- [x] 全局术语统一（商家 → 厂家）
- [x] Sticky footer（展厅和产品页）
- [x] 响应式设计
- [x] Loading 状态反馈

### 9) 工程质量
- [x] 历史遗留依赖与旧调用已移除
- [x] TypeScript 编译通过（npx tsc --noEmit）
- [x] Git 仓库初始化完成
- [x] 密码哈希验证修复（bcryptjs 正确配置）
- [x] Session 缓存与角色异常检测修复

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
真实 3D 模型上传与预览优化
- [ ] 买家端设计列表与询价联动优化
- [ ] 厂家回复询价功能
- [ ] 订单管理系统
- [ ] 移动端交互优化
- [ ] 消息通知系统（邮件/站内信）
- [ ] 数据导出与报表功能

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

##[ ] PostgreSQL 远程连接认证配置（当前需要验证网络和凭据）
- [ ] 3D 模型实际上传完整流程（当前为占位逻辑）
- [ ] 厂家回复询价的后端端点和 UIPostgreSQL/MinIO
- 部分前端按钮依赖尚未落地的后端端点
- 上传流程仍有 TODO 占位逻辑

---

## 备注

该文档已按当前自托管架构更新，不再包含过时的第三方 BaaS 初始化流程。
