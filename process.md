# 3D包材选型系统 - 开发进度

> 项目类型: 多租户 B2B 3D包材SaaS平台  
> 技术栈: Next.js 14 + PostgreSQL + MinIO + NextAuth.js + Three.js + Tailwind CSS  
> 最后更新: 2026-04-02

---

## 项目概述

该项目为自托管 3D 包材选型系统，支持三类角色：
- 管理员: 管理厂家认证、系统配置
- 厂家: 上传 3D 模型、发布产品、管理模型资产
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
- [x] 环境变量模板与本地脚本（start.bat/start.sh）

### 2) 认证与权限
- [x] 注册与登录流程（register + NextAuth）
- [x] 角色区分（admin / vendor / buyer）
- [x] 路由保护（中间件 + 服务端校验）
- [x] SessionProvider 全局包装支持 useSession 客户端钩子

### 3) 管理员后台
- [x] 厂家列表查看（含认证状态）
- [x] 厂家认证/取消认证（一键操作）
- [x] 厂家搜索功能（前端筛选）
- [x] Bootstrap 初始化 API（token 保护，自动禁用）
- [x] /dashboard/admin 管理员工作台

### 4) 厂家工作台
- [x] 产品创建
- [x] 产品编辑（PATCH，支持全字段更新）
- [x] 产品删除（DELETE，带所有权校验）
- [x] 产品列表与状态管理（draft/published/archived）
- [x] 3D 模型上传到 MinIO（真实上传链路）
- [x] 模型资产管理（列表/删除）

### 5) 买家能力
- [x] 产品详情页材质定制 + 保存设计 + 发起询价
- [x] 设计保存接口与询价接口（后端）
- [x] 买家后台页面框架与统计卡片

### 6) 公开展厅与定制
- [x] 产品列表页（/shop）
- [x] 厂家店铺页（/shop/vendor/[vendorId]）
- [x] 产品详情与 3D 预览（/shop/product/[productId]）
- [x] 材质参数调节（颜色、粗糙度、金属度）
- [x] Header 用户状态显示 + 快速退出登录

### 7) 后端接口
- [x] /api/auth/register (POST)
- [x] /api/auth/[...nextauth] (NextAuth)
- [x] /api/products (GET/POST)
- [x] /api/products/[productId] (PATCH/DELETE)
- [x] /api/models (GET/POST)
- [x] /api/models/upload (POST, multipart)
- [x] /api/models/[id] (DELETE)
- [x] /api/admin/vendors (GET)
- [x] /api/admin/vendors/[vendorId]/verify (PATCH)
- [x] /api/admin/bootstrap (POST)
- [x] /api/design/save (GET/POST)
- [x] /api/inquiries (GET/POST)

### 8) 工程质量
- [x] 历史遗留依赖与旧调用移除
- [x] 密码哈希验证修复（bcryptjs）
- [x] Session 角色异常检测修复
- [x] 上传后产品预览链路可用（model_url + MinIO URL 归一化）

---

## 当前待完善项

### 高优先级
- [ ] 买家后台数据联动：接入 /api/design/save 与 /api/inquiries（当前页面仍有 TODO 注释，未实际拉取）
- [ ] 厂家回复询价能力：补充询价状态更新/报价/备注接口与 UI
- [ ] 询价到订单闭环：订单表/API/UI（当前仅类型定义，未实现业务流）

### 中优先级
- [ ] 移动端交互优化（尤其产品定制页与厂家后台）
- [ ] 消息通知系统（邮件/站内信）
- [ ] 数据导出与报表

### 运维与部署
- [ ] PostgreSQL 远程连接认证配置验证（网络、凭据、访问策略）
- [ ] MinIO 生产环境策略细化（访问控制、备份、生命周期）

---


## 已知技术备注

- Configurator3D 使用本地 HDR（public/hdr/studio_small_03_1k.hdr）作为反射环境贴图。
- 模型上传已切换为真实 MinIO 上传接口：POST /api/models/upload（multipart/form-data）。
- 产品预览依赖 model_url；支持相对路径与绝对 URL 归一化解析。

---

## 备注

该文档已按当前自托管架构更新，不包含过时的第三方 BaaS 初始化流程。
