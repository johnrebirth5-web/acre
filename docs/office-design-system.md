# Office Design System

## 目标

`Office / Back Office` 现在使用统一的视觉系统，目标是贴近 `BoldTrail / Brokermint` 的后台产品气质：

- 信息密度高，但可扫读
- 中性、克制、偏运营后台
- 表格 / 列表 / detail section 优先
- 尽量减少页面级一次性样式

这个系统不是独立组件库产品，而是当前仓库里给 `Office` 页面使用的共享 UI 约束。

## 字体策略

- 全局主字体通过 [apps/web/app/layout.tsx](/Users/openclaw_john/工作文件夹/Acre/apps/web/app/layout.tsx) 加载 `Inter`
- 变量名：`--font-office-sans`
- `Office` 页面不再各自选字体，也不要混用新的主字体

默认层级：

- 页面标题：`PageHeader h2`
- 页面说明：`PageHeader p`
- section 标题：`SectionHeader h3`
- 列表列头：大写、较小字号、较高字重
- 正文：常规 14px-16px 区间
- 辅助说明：`text-muted`
- 数值摘要：`StatCard strong`

## Tokens

主要 tokens 定义在 [apps/web/app/globals.css](/Users/openclaw_john/工作文件夹/Acre/apps/web/app/globals.css)：

- 字体：`--office-font-sans`
- 背景 / surface：`--office-bg`、`--office-surface`、`--office-surface-muted`
- 文本：`--office-text`、`--office-text-muted`
- 边框：`--office-border`、`--office-border-strong`
- 强调色：`--office-accent`、`--office-accent-strong`
- 状态色：`--office-success`、`--office-warning`、`--office-danger`
- 阴影：`--office-shadow-sm`、`--office-shadow-md`
- 圆角：`--office-radius-sm`、`--office-radius-md`、`--office-radius-lg`
- 间距：`--office-space-*`
- focus：`--office-focus-ring`

规则：

- 新的 `Office` 页面不要硬编码随意颜色、间距、圆角
- 如果找不到合适 token，先补 token，再写页面

## 共享组件

共享 primitives 在 [packages/ui/src/index.tsx](/Users/openclaw_john/工作文件夹/Acre/packages/ui/src/index.tsx)：

- `PageShell`
- `PageHeader`
- `SectionHeader`
- `SectionCard`
- `DetailSection`
- `FormSection`
- `FilterBar`
- `FilterField`
- `StatCard`
- `DataTable`
- `DataTableHeader`
- `DataTableBody`
- `DataTableRow`
- `FormField`
- `TextInput`
- `SelectInput`
- `TextareaInput`
- `Button`
- `Badge`
- `StatusBadge`
- `EmptyState`
- `SecondaryMetaList`

使用原则：

- 新页面优先复用这些 primitives
- 如果页面里出现第二次相同结构，就优先考虑提到 `@acre/ui`
- 不要给单个页面再发明一套新的 button / card / filter bar

## 页面模板规则

### List pages

适用：

- `Transactions`
- `Contacts`
- `Tasks`
- `Accounting`
- `Reports` 的主列表区

推荐结构：

1. `PageShell`
2. `PageHeader`
3. `SectionCard`
4. `FilterBar`
5. `DataTable`
6. footer / pager

### Detail pages

适用：

- transaction detail
- contact detail

推荐结构：

1. `PageShell`
2. `PageHeader`
3. `DetailSection` / `SectionCard`
4. section 间距统一，不要一页一个节奏

### Workspace pages

适用：

- `Pipeline`
- `Activity`

推荐结构：

1. `PageShell`
2. `PageHeader`
3. 左 summary rail / 分类区
4. 右主工作区

## 表格 / 列表规则

- 优先高密度、可扫读，而不是大卡片
- 列头统一大写、小字号、高字重
- 行 hover 要轻，不要 marketing 式大阴影
- 状态尽量用 badge / pill，不靠删除线或颜色堆砌
- 数字列尽量对齐，避免跳动

## 详情 section 规则

- section 表面统一用浅色 surface + 细边框
- label/value 模式统一
- 不要一个 detail section 用表单样式，另一个像 marketing card
- `contacts / finance / tasks / overview` 都应该像一个产品的一部分

## 表单规则

- 统一使用：
  - `FormField`
  - `TextInput`
  - `SelectInput`
  - `TextareaInput`
  - `Button`
- 字段语义可以不同，但控件风格不要再分裂
- modal 里的输入也尽量走同一视觉系统

## 导航规则

- 导航保持密集、稳定、运营后台感
- 分组标题统一大写和较高字重
- 激活态用克制的深蓝，不用过多装饰
- 不改 IA 时，尽量只做视觉统一，不动结构

## 当前覆盖范围

这套设计系统已经开始用于这些关键页面：

- `Dashboard`
- `Transactions`
- `Contacts`
- `Tasks`
- `Activity`
- `Accounting`
- `Reports`
- `Pipeline`
- transaction detail
- contact detail

仍有旧类名存在，这是兼容式重构的一部分。当前策略不是一次性重写全部 markup，而是：

- 先统一 token 和 primitives
- 再逐步把旧 `bm-* / office-*` 样式收口到同一视觉系统

## 后续新增页面要求

以后新增 `Office` 页面时：

1. 先看这个文档
2. 优先复用 [packages/ui/src/index.tsx](/Users/openclaw_john/工作文件夹/Acre/packages/ui/src/index.tsx)
3. 尽量不要新增页面专属 button / card / table 皮肤
4. 如果需要新模式，先判断是否应该进入 `@acre/ui`
