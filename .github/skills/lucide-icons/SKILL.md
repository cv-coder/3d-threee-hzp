---
name: lucide-icons
description: "Use when: adding icons, searching for icons, replacing icon components, using lucide-react, LucideIcon type, icon props (size/color/strokeWidth), dynamic icons, or importing from lucide-react. Covers installation, usage patterns, TypeScript types, and best practices for Lucide icon library in React/Next.js projects."
---

# Lucide Icons in React / Next.js

Reference: https://lucide.dev/icons/ | https://lucide.dev/guide/react/getting-started

## 1. 安装

```sh
pnpm add lucide-react
# 或
npm install lucide-react
```

---

## 2. 查找图标

1. 打开 https://lucide.dev/icons/
2. 搜索关键词（英文），找到目标图标
3. 图标名即为组件名（PascalCase），例如：`boxes` → `<Boxes />`
4. 图标名转换规则：`kebab-case` → `PascalCase`
   - `arrow-right` → `ArrowRight`
   - `chevron-down` → `ChevronDown`
   - `shopping-cart` → `ShoppingCart`

---

## 3. 基础使用

```tsx
import { Camera, Heart, ShoppingCart } from 'lucide-react';

// 基础
<Camera />

// 自定义尺寸、颜色、描边宽度
<Camera size={48} color="red" strokeWidth={1} />

// 多个图标一行导入（Tree-shakable，只打包用到的）
<Heart className="text-red-500" />
<ShoppingCart size={20} />
```

**Props 速查表：**

| Prop | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `size` | `number \| string` | `24` | 宽高（px） |
| `color` | `string` | `currentColor` | 颜色，支持 CSS 颜色值 |
| `strokeWidth` | `number` | `2` | 描边粗细 |
| `absoluteStrokeWidth` | `boolean` | `false` | 描边宽度是否绝对值（不随 size 缩放） |
| `className` | `string` | — | Tailwind/CSS 类名 |

所有标准 SVG 属性也可作为 props 传入。

---

## 4. 颜色控制

```tsx
// 方式一：color prop
<Smile color="#3e9392" />

// 方式二：currentColor（通过父元素或 Tailwind 类继承）
<button className="text-blue-500">
  <ThumbsUp />  {/* 继承父元素 text color */}
</button>

// 方式三：Tailwind className
<Star className="text-yellow-400 fill-yellow-400" />
```

---

## 5. TypeScript 类型

```tsx
import { type LucideIcon, type LucideProps } from 'lucide-react';

// 接受图标组件作为 prop
interface ButtonProps {
  icon: LucideIcon;
  label: string;
}

const IconButton = ({ icon: Icon, label }: ButtonProps) => (
  <button aria-label={label}>
    <Icon size={16} />
  </button>
);

// 封装图标组件（透传所有 props）
const WrapIcon = (props: LucideProps) => <Camera {...props} />;
```

---

## 6. 动态图标（按名称加载）

> ⚠️ 会导入所有图标，**仅在内容由 CMS/数据库驱动时使用**，静态场景请直接 import。

```tsx
import { DynamicIcon } from 'lucide-react/dynamic';

// name 为 kebab-case
<DynamicIcon name="camera" color="red" size={48} />
<DynamicIcon name="shopping-cart" size={20} />
```

---

## 7. 全局样式配置

```tsx
// 在应用根组件包裹一次，所有子孙图标继承配置
import { IconContext } from 'lucide-react'; // v0 API，v1 推荐用 CSS/Tailwind 继承

// v1 推荐方式：通过 CSS currentColor 继承
<div className="text-gray-600 [&_svg]:size-5">
  <Camera />
  <Heart />
</div>
```

---

## 8. 与 Tailwind CSS 配合最佳实践

```tsx
// 用 className 控制外观，避免硬编码 size/color
<Trash2 className="size-4 text-red-500 hover:text-red-700 transition-colors" />

// 按钮中对齐
<button className="flex items-center gap-2">
  <Plus className="size-4" />
  新增
</button>

// 禁用状态
<Save className="size-4 opacity-50" />
```

---

## 9. 常见图标速查（按场景）

| 场景 | 图标名 | 导入名 |
|------|--------|--------|
| 添加/新增 | `plus`, `plus-circle` | `Plus`, `PlusCircle` |
| 删除 | `trash-2`, `x` | `Trash2`, `X` |
| 编辑 | `pencil`, `edit` | `Pencil`, `Edit` |
| 保存 | `save` | `Save` |
| 搜索 | `search` | `Search` |
| 设置 | `settings`, `sliders` | `Settings`, `Sliders` |
| 用户 | `user`, `users` | `User`, `Users` |
| 上传/下载 | `upload`, `download` | `Upload`, `Download` |
| 返回 | `arrow-left`, `chevron-left` | `ArrowLeft`, `ChevronLeft` |
| 展开/收起 | `chevron-down`, `chevron-up` | `ChevronDown`, `ChevronUp` |
| 成功/错误 | `check-circle`, `x-circle` | `CheckCircle`, `XCircle` |
| 警告/信息 | `alert-triangle`, `info` | `AlertTriangle`, `Info` |
| 菜单 | `menu`, `more-horizontal` | `Menu`, `MoreHorizontal` |
| 文件 | `file`, `folder` | `File`, `Folder` |
| 加载 | `loader`, `loader-circle` | `Loader`, `LoaderCircle` |
| 购物 | `shopping-cart`, `package` | `ShoppingCart`, `Package` |
| 3D/模型 | `box`, `boxes`, `cube` | `Box`, `Boxes` |
| 锁定 | `lock`, `unlock` | `Lock`, `Unlock` |
| 眼睛 | `eye`, `eye-off` | `Eye`, `EyeOff` |
| 链接 | `link`, `external-link` | `Link`, `ExternalLink` |
| 刷新 | `refresh-cw`, `rotate-ccw` | `RefreshCw`, `RotateCcw` |

---

## 10. 反模式与注意事项

- **避免** `import * as Icons from 'lucide-react'`：会打包全部图标，体积极大
- **避免** 在循环中使用 `DynamicIcon`，除非数据确实来自动态源
- **不需要** 单独安装 `@types/lucide-react`，自带类型声明
- **v0 → v1 迁移**：图标名基本保持不变，`IconContext.Provider` 已废弃，改用 CSS 继承

---

## 11. 工作流：给组件选图标

1. 描述图标语义（中文/英文均可），去 https://lucide.dev/icons/ 搜索
2. 确认图标名（页面标题为 kebab-case）
3. 转换为 PascalCase 组件名
4. `import { ComponentName } from 'lucide-react'`
5. 使用 `size`/`className` 适配当前设计尺寸
6. 确保与周围文字垂直居中：`flex items-center gap-2`
