# 3D 选型系统开发进度（自托管版）

> 项目类型：多租户 B2B 3D 包材 SaaS
> 技术栈：Next.js 14 + PostgreSQL + MinIO + NextAuth.js + Three.js + Tailwind CSS
> 最后更新：2026-04-08

---

## 项目概览

当前项目已完成从「产品上架 → 3D 定制 → 保存设计 → 发起询价」的主体链路，并具备三类角色：

- 管理员：厂家认证管理、配件分类管理、系统初始化（bootstrap）
- 厂家：3D 模型上传与管理、产品创建/编辑/发布、模型预览
- 买家：浏览展厅、进入产品 3D 定制页、保存设计方案、查看询价记录

---

## 当前架构

- 前端：Next.js 14（App Router）+ TypeScript + Tailwind + Shadcn UI
- 3D 渲染：three.js + @react-three/fiber + @react-three/drei
- 认证：NextAuth.js v5
- 数据库：PostgreSQL 16
- 对象存储：MinIO（S3 兼容）
- 部署：Docker Compose

---

## 已完成功能

### 1) 基础与权限

- [x] 注册/登录流程（`/api/auth/register` + NextAuth）
- [x] 角色分流（admin/vendor/buyer）
- [x] 路由与接口权限校验（页面守卫 + API 中间件）
- [x] 管理员 bootstrap 接口（`/api/admin/bootstrap`，token 保护）

### 2) 管理员后台

- [x] 厂家列表与认证状态查看
- [x] 厂家认证/取消认证（`PATCH /api/admin/vendors/[vendorId]/verify`）
- [x] 配件分类管理（新增/编辑/删除）
- [x] 公共配件分类查询接口（`GET /api/accessory-categories`，含 fallback）

### 3) 厂家后台

- [x] 产品创建、编辑、删除、状态切换（draft/published/archived）
- [x] 产品列表与弹窗 3D 预览
- [x] 3D 模型上传到 MinIO（`POST /api/models/upload`）
- [x] 模型资产管理（列表/预览/删除）
- [x] 产品创建与编辑时可配置 `partSurfaceOptions`（部件可选工艺）

### 4) 买家侧与展厅

- [x] 展厅页（`/shop`）与厂家店铺页（`/shop/vendor/[vendorId]`）
- [x] 产品详情 + 3D 定制页（`/shop/product/[productId]`）
- [x] 设计方案保存/更新/查询/删除（`/api/design/save` 的 GET/POST/PUT/DELETE）
- [x] 买家后台已联动加载设计与询价列表（`/dashboard/buyer`）

### 5) 3D 配置器（关键能力）

- [x] 模型自动居中与相机自动适配（AutoFit）
- [x] HDR 环境贴图照明（本地 `public/hdr/studio_small_03_1k.hdr`）
- [x] 灯光与曝光已下调，减少过亮问题（包含 `environmentIntensity`、`toneMappingExposure` 调整）
- [x] 材质预设（注塑/喷漆/电镀亮面/电镀哑光/玻璃）
- [x] 支持全局与分部件材质编辑（颜色 + 工艺）
- [x] **首屏严格保留原模型材质**：在 `preserveMaterials=true` 时不替换原材质
- [x] **用户操作后再进入材质系统**：`preserveMaterials=false` 时才切换为 `MeshPhysicalMaterial` 并应用 preset
- [x] 部件级还原 + 整体材质还原（整体还原会清空配置并回到原始材质显示）

---

## 接口现状（已落地）

- [x] `/api/auth/register`（POST）
- [x] `/api/auth/[...nextauth]`
- [x] `/api/products`（GET/POST）
- [x] `/api/products/[productId]`（PATCH/DELETE）
- [x] `/api/models`（GET/POST）
- [x] `/api/models/upload`（POST）
- [x] `/api/models/[id]`（DELETE）
- [x] `/api/design/save`（GET/POST/PUT/DELETE）
- [x] `/api/inquiries`（GET/POST）
- [x] `/api/accessory-categories`（GET）
- [x] `/api/admin/accessory-categories`（GET/POST）
- [x] `/api/admin/accessory-categories/[categoryId]`（PATCH/DELETE）
- [x] `/api/admin/vendors`（GET）
- [x] `/api/admin/vendors/[vendorId]/verify`（PATCH）
- [x] `/api/admin/bootstrap`（POST）

---

## 当前待办与风险

### 高优先级

- [ ] 询价提交流程联调：`ProductConfigurator` 目前发送 `product_id`，而 `POST /api/inquiries` 读取 `productId`，字段命名需统一
- [ ] 买家询价列表字段对齐：Dashboard 目前按嵌套对象读取（`inquiry.product/vendor`），接口当前返回扁平字段
- [ ] 厂家侧报价/回复能力未落地（询价状态流转、报价金额、备注编辑）

### 中优先级

- [ ] 订单闭环（inquiry -> order）尚未实现 API/UI
- [ ] 旧组件清理：`src/app/dashboard/vendor/components/ModelUpload.tsx` 仍有 TODO，建议统一为 `ModelUploadArea`
- [ ] 移动端交互细化（3D 定制页与后台长表单）

### 工程化

- [ ] 自动化测试（单元/集成）仍缺失
- [ ] ESLint 尚未完成初始化落地（本地 `next lint` 会进入交互配置）

---

## 最近一次关键更新（2026-04-08）

- 3D 首屏材质策略改为“原样显示”：未操作前不做材质替换
- 材质系统切换时机改为“用户操作后再启用”
- 场景亮度参数已下调，减少过曝与反射刺眼问题
- `process.md` 内容按当前代码实现状态重写
