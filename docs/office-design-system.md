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

## Responsive 规则

`Office / Back Office` 采用 desktop-first 的响应策略，重点不是手机优先，而是保证窄一点的桌面和笔记本宽度仍然稳定、可操作。

### 断点

- `<= 1360px`
  进入第一层 laptop hardening：
  - 过滤条开始更积极换行
  - 双栏 workspace / detail 区开始允许纵向堆叠
  - summary cards 从 4/3 列收成 2 列
- `<= 1120px`
  进入窄笔记本模式：
  - 多数 summary grid 收成 1 列
  - 表单网格优先收成 1 列
  - Activity / Pipeline / Accounting 的并排区域应改为上下结构
- `<= 980px`
  保持 desktop shell，但进一步缩紧 sidebar 和 page padding
- `<= 820px`
  进入当前已有的 mobile rail / sidebar collapse 行为

### 表格溢出策略

- Back Office 列表优先保持列语义，不要把桌面表格硬压成不可读窄列
- 当宽度不足时：
  - 表格容器横向滚动
  - 不让整页横向滚动
  - 关键 dense 表格要有明确 `min-width`
- 适用至少包括：
  - Transactions
  - Contacts
  - Tasks
  - Accounting
  - Agent Billing ledger
  - Reports 里的表格区

### Filter Bar 换行策略

- 过滤条和 action bar 在 laptop 宽度下必须允许换到多行
- 行为原则：
  - filters 可缩，但不能缩到不可操作
  - primary / secondary actions 在换行后仍然可见
  - query-param 行为不变，只改布局

### 双栏 / 侧栏堆叠策略

- `main + side panel` 或 `left rail + right content` 结构在较窄桌面宽度下应改为上下堆叠
- 当前重点适用：
  - Accounting
  - Activity
  - Pipeline
  - detail page 的双栏信息区

### Summary Card 策略

- wide desktop：允许 3-4 列
- narrow laptop：优先收成 2 列
- 必要时收成 1 列
- 不要让卡片为了保留列数而被压成不稳定高度或极窄内容块

## Responsive 实施细则

这一轮不是补充“原则”，而是把原则真正落到了共享层和关键页面上。

### Office shell

- `<= 980px`
  - `Office` 侧边栏不再继续强撑桌面双栏
  - 主内容改成单列
  - 使用 `office-mobile-rail` 保持主要导航可达
- 目标不是手机优先，而是避免窄笔记本把主内容压坏

### 表格实现策略

- `DataTable / office-table / bm-office-table` 统一使用局部横向滚动
- 规则：
  - 容器自己滚动
  - 不允许整页跟着横向滚动
  - 行和表头保留明确 `min-width`
  - 重要 dense 表格不改成 stacked cards
- 当前已明确加固：
  - Transactions
  - Contacts
  - Tasks
  - Accounting
  - Agent Billing ledger
  - Reports tables
  - Pipeline list/table
  - Agents roster

### Filter / action bar 实施策略

- 过滤条、操作条、页头 action 区统一允许换行
- 输入控件保持合理最小宽度
- action buttons 保持 `flex: 0 0 auto`
- 复杂表单页继续优先使用共享 class：
  - `office-filter-bar`
  - `office-report-filters`
  - `office-page-actions`
  - `office-section-actions`
  - `office-filter-actions`

### 双栏 / side-panel 实施策略

- 以下布局在 laptop 宽度下优先堆叠，而不是继续横向硬挤：
  - Accounting
  - Activity
  - Pipeline
  - detail pages with secondary panel
- 共享 class：
  - `office-detail-two-column`
  - `bm-accounting-grid`
  - `bm-activity-layout`
  - `office-pipeline-layout`

### 已重点加固的页面

- `/office/dashboard`
- `/office/transactions`
- `/office/contacts`
- `/office/tasks`
- `/office/activity`
- `/office/accounting`
- `/office/reports`
- `/office/pipeline`
- transaction detail
- contact detail

如果新增 `Office` 页面也落在这些结构类型里，优先复用这些共享 class，不要重新写页面级媒体查询。

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
5. 如果页面包含 dense table / filter bar / 双栏 detail，先按上面的 responsive 规则处理，不要再让页面在 laptop 宽度下被横向挤坏
