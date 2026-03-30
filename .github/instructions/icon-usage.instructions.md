---
applyTo: "**/*.tsx"
description: "Use when editing TSX files. Prefer lucide-react icons, keep icon usage consistent, and avoid importing full icon sets."
---

# Icon Usage (TSX)

## Goal
Keep icon usage consistent across the project by standardizing on lucide-react.

## Rules
- Prefer lucide-react for UI icons.
- Import only required icons, for example: import { Search, Plus } from 'lucide-react'.
- Do not use wildcard or namespace imports for icons.
- Do not import all icons through dynamic maps unless the icon name comes from CMS or database.
- Keep icon sizing and coloring consistent with local component styles (Tailwind classes or explicit props).
- For button and menu items, align icon and text with flex row and spacing.

## Preferred Patterns
- Static icon usage:
  - import { ShoppingCart } from 'lucide-react'
  - <ShoppingCart className="size-4" />
- Typed icon prop:
  - import { type LucideIcon } from 'lucide-react'

## Avoid
- import * as Icons from 'lucide-react'
- Unnecessary icon library mixing inside the same feature or page
