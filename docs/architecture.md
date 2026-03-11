# Architecture

## 概览

当前项目是一个 `monorepo`，目标是承载 `Acre Agent OS`。它目前是一个“前端可运行、后端骨架已落、数据库 runtime 已经初始化，但主页面和主 API 仍以 mock 数据为主”的阶段。

更准确地说：

- 前端已经可运行
- API 已经存在
- API 当前以 `@acre/backoffice` 的内存数据为主，但 `Office Dashboard` 的业务指标、`Office Pipeline`、`Office Transactions`、`Office Contacts`、`Office Tasks`、`Office Reports`、`Office Activity Log` 和 `Office Accounting` 已经切到 Prisma
- 数据库 schema、Prisma client、migration、seed 已接入
- 但数据库只进入了一个最小读路径，还没有替换主页面和主 API 的 mock 数据
- 权限模型存在，且当前已经接入一个最小本地 session
- 但还没有复杂权限管理或数据级权限
- `Office / Back Office` 的页面主线已经开始按 `Brokermint` 的后台结构收敛，其中 `Dashboard` 的业务指标、`Pipeline`、`Transactions`、`Contacts`、`Tasks`、`Reports`、`Activity` 已经切到真实数据库，其他页面仍主要由静态示例数据驱动
- `Activity` 虽然已经是数据库驱动的真实 activity log，但当前覆盖范围仍只限于仓库里已经实现的真实写入路径；documents / approvals / settings 变更还没有真实事件源
- `Activity` 当前还是一个受限访问的 account activity 模块，不把它当作所有 office 角色都能直接访问的普通页面；首版只允许 `office_admin` 和 `office_manager`

## 技术栈

### 前端

- `Next.js 16` App Router
- `React 19`
- `TypeScript`
- 原生 CSS，集中在 [apps/web/app/globals.css](../apps/web/app/globals.css)
- `@acre/ui` 里的轻量共享 Back Office primitives

说明：

- 当前没有引入第三方状态库
- 当前没有表单库
- 当前没有第三方 UI 框架，但已经建立内部 `Office` 设计系统：
  - 设计 tokens 在 [apps/web/app/globals.css](../apps/web/app/globals.css)
  - 共享组件在 [packages/ui/src/index.tsx](../packages/ui/src/index.tsx)
  - 规则文档在 [docs/office-design-system.md](./office-design-system.md)
- 页面主要是服务端组件 + 少量客户端导航组件
- 当前 `Back Office` 最接近真实参考的页面是：
  - [apps/web/app/office/dashboard/page.tsx](../apps/web/app/office/dashboard/page.tsx)
  - [apps/web/app/office/pipeline/page.tsx](../apps/web/app/office/pipeline/page.tsx)
  - [apps/web/app/office/transactions/page.tsx](../apps/web/app/office/transactions/page.tsx)

### 后端

- `Next.js Route Handlers` 作为当前 API 层
- `@acre/backoffice` 作为领域服务层
- `@acre/auth` 作为权限定义层
- `apps/web/lib/auth-session.ts` 作为当前本地 session 层

说明：

- 当前 API 已包含最小读写路径：
  - `Transactions`：list / detail / create / status update
  - `Contacts`：list / detail / create / edit / follow-up task create / transaction link
  - `Transaction detail`：finance update、linked contacts 管理、transaction tasks create / update
  - `Activity`：server-side 同时读取真实 `AuditLog` 和实时派生 alerts，渲染 `Activity Log + Operational Alerts`
    - `AuditLog` 是唯一活动事件源
    - 页面支持 `actor / object type / date range` 过滤
    - 事件摘要通过集中 formatter 读取结构化 payload / changes，而不是把文案散在 UI 里
    - 顶部 `Add comment` 会通过 `/api/office/activity/comments` 写入 `AuditLog`，评论和普通事件共用同一条活动流
- 当前 `Pipeline` 页面已通过 server-side service 读取真实 transaction workspace 数据：
  - 左侧 funnel summary rail
  - 右侧 unified transaction list
  - `Closed / Cancelled` 月度 rollup
  - query-param 驱动的 search / side / owner / metric mode 过滤
- 当前 `Reports` 页面已通过 server-side service 读取真实聚合数据
- 当前 `Reports` 页面也已有最小 CSV 导出路径，使用当前 session 和过滤条件直接导出 transaction 行
- 当前已有最小本地登录 / 登出 / cookie session
- 当前已经有 transaction、contact、follow-up task 的 service-to-db 数据访问层，其他模块还没有
- 当前 dashboard 业务指标也已有最小查询 service
- 当前没有 worker、queue、cron

### 数据库

- `PostgreSQL`
- `Prisma schema` 已定义在 [packages/db/prisma/schema.prisma](../packages/db/prisma/schema.prisma)
- `Prisma client` 入口在 [packages/db/src/client.ts](../packages/db/src/client.ts)
- 最小数据库读取 utility 在 [packages/db/src/bootstrap.ts](../packages/db/src/bootstrap.ts)

说明：

- 已有 runtime Prisma client 接入
- 已有初始 migration 基线
- 已有 seed workflow
- 当前已经有数据库 probe read path、本地 auth 查询路径，以及 transaction/contact persistence；主页面和大多数主 API 仍未切到数据库

## Office 设计系统

`Office / Back Office` 当前已经不再按页面各自决定视觉规则，而是使用统一设计系统：

- 主字体：通过 root layout 全局加载的 `Inter`
- tokens：集中在 [apps/web/app/globals.css](../apps/web/app/globals.css)
- primitives：集中在 [packages/ui/src/index.tsx](../packages/ui/src/index.tsx)
- 详细规则：见 [docs/office-design-system.md](./office-design-system.md)

当前统一的核心对象包括：

- page shell / page header
- section card / detail section
- filter bar
- data table
- form fields / inputs / buttons
- status badges
- Back Office navigation

这套系统当前优先解决的是：

- 页面间字体、间距、按钮、表格和 detail section 的漂移
- `Dashboard / Transactions / Contacts / Tasks / Activity / Accounting / Reports / Pipeline` 之间的产品割裂

### 第三方服务

当前真实接入状态：

- `GitHub`：已接入，仓库已推送
- `Vercel`：已接入，当前 `main` 分支 push 会自动触发生产部署
- `PostgreSQL / Prisma runtime`：代码已接入，本机已验证 local migrate + seed + query，但主页面和主 API 尚未切换到数据库
- 对象存储：未实现
- OCR / AI / 外部地产系统集成：未实现

不要把“规划中”当成“已接入”。

## 模块划分

### `apps/web`

职责：

- 页面路由
- API 路由
- Agent / Office 的界面层
- 把 `@acre/backoffice` 和 `@acre/auth` 的数据渲染出来

关键目录：

- [apps/web/app](../apps/web/app)
- [apps/web/app/api](../apps/web/app/api)

### `packages/backoffice`

职责：

- 当前最核心的业务数据入口
- 提供页面和 API 共用的读取函数
- 定义当前示例数据的 shape

注意：

- 它现在既承担“领域模型定义”，又承担“临时 mock 数据源”
- 未来很可能要拆成更清晰的 domain modules

当前主要导出：

- organization / offices / members
- listings / clients / events / notifications / resources / vendors
- transactions / legacy pipeline snapshot helpers
- `getAgentDashboardSnapshot`
- `getOfficeDashboardSnapshot`
- `listListings`
- `listClients`
- `listEvents`
- `listResources`
- `listTransactions`
- `getApiCatalog`

### `packages/auth`

职责：

- 定义角色
- 定义权限项
- 提供角色到权限的映射

当前作用范围：

- 页面展示
- API 返回 access summary

未实现：

- 复杂权限管理
- 数据级权限

### `packages/db`

职责：

- 定义数据库 schema
- 提供可复用 Prisma client
- 提供 migration / seed workflow
- 提供最小数据库读取 utility
- 明确未来持久化边界

当前覆盖的核心实体：

- `Organization`
- `Office`
- `User`
- `Membership`
- `Listing`
- `ListingAsset`
- `ListingShareLink`
- `Client`
- `FollowUpTask`
- `TransactionTask`
- `TaskListView`
- `Notification`
- `Event`
- `EventRsvp`
- `Resource`
- `Vendor`
- `AuditLog`
- `LedgerAccount`
- `AccountingTransaction`
- `AccountingTransactionLineItem`
- `GeneralLedgerEntry`
- `EarnestMoneyRecord`

当前已提供的数据库运行时入口：

- `prisma`
- `getPrismaClient`
- `getSeededWorkspaceSnapshot`
- `getOfficeDashboardBusinessSnapshot`
- `getOfficeActivityLogSnapshot`
- `getOfficePipelineWorkspaceSnapshot`
- `listTransactions`
- `getTransactionById`
- `createTransaction`
- `updateTransactionStatus`
- `listContacts`
- `getContactById`
- `createContact`
- `updateContact`
- `createFollowUpTask`
- `linkContactToTransaction`
- `listTransactionTasks`
- `listOfficeTasks`
- `listTaskListViews`
- `createTransactionTask`
- `updateTransactionTask`
- `completeTransactionTask`
- `reopenTransactionTask`
- `requestTransactionTaskReview`
- `approveTransactionTask`
- `rejectTransactionTask`
- `saveTaskListView`
- `getOfficeReportsSnapshot`
- `getOfficeAccountingSnapshot`
- `createAccountingTransaction`
- `updateAccountingTransaction`
- `createEarnestMoneyRecord`
- `updateEarnestMoneyRecord`

## 关键数据流

### 当前数据流

现在的主要请求链路是：

1. 请求进入 `apps/web`
2. 如果是 `/office/*`，layout 先解析本地 session
3. 页面/API 调用 `@acre/backoffice` 或 `@acre/db`
4. service 返回 DTO
5. 页面渲染或 API 返回 JSON

也就是说，当前主业务页面还没有：

- 远程 API 调用
- 缓存层

当前 `Back Office` 页面读取路径大致是：

1. `/office/dashboard` 先读取当前 office session，再调 `@acre/db` 的 `getOfficeDashboardBusinessSnapshot`
2. `/office/activity` 先读取当前 office session，再调 `@acre/db` 的 `getOfficeActivityLogSnapshot`
3. `/office/pipeline` 调 `@acre/db` 的 `getOfficePipelineWorkspaceSnapshot`
4. `/office/transactions` 调 `@acre/db` 的 transaction service，并按 query-param 驱动的 `q / status / page / pageSize` 做服务端过滤和分页
5. `/office/transactions` 内的客户端 modal 调 `/api/office/transactions` 写入数据库；`GET /api/office/transactions` 也接受 `q / status / page / pageSize`
6. `/office/transactions/:transactionId` 调 `getTransactionById`
6. detail 页面通过 `/api/office/transactions/:transactionId` 更新 status
7. detail 页面通过 `/api/office/transactions/:transactionId/finance` 更新最小 finance 字段
8. detail 页面通过 transaction contact routes 做 link / unlink / set primary
9. detail 页面通过 transaction task routes 做 create / edit / complete / reopen / review
10. `/office/contacts` 调 `@acre/db` 的 contact service，并按 query-param 驱动的 `q / stage / page / pageSize` 做服务端过滤和分页
11. `/office/contacts` 和 `/office/contacts/:contactId` 通过 contacts API 做 create / edit / follow-up task / transaction link；`GET /api/office/contacts` 也接受 `q / stage / page / pageSize`
12. `/office/reports` 调 `@acre/db` 的 reports service，返回组织范围内的最小实时报表聚合
13. `/office/accounting` 调 `@acre/db` 的 accounting service，返回 overview cards、accounting transaction list、general ledger、EMD records 和 chart of accounts
14. `/api/office/accounting/transactions` 与 `/api/office/accounting/earnest-money` 负责最小 create / update 写入；posting 成功后同步生成 GL entries 和 `AuditLog`
15. `/office/activity` 读取 `AuditLog`，并结合 transaction / task / contact / follow-up / accounting / EMD 的实时数据库状态派生 operational alerts
16. transaction / contact / finance / task / accounting / EMD 的真实写入路径会同步写入 `AuditLog`
17. auth login / logout 和 follow-up task create 也会写入 `AuditLog`
18. `/office/activity` 顶部的内部评论也会写入 `AuditLog`，并出现在同一条 stream 里
19. `/office/activity` 的左侧分类来自真实 action taxonomy，不是静态菜单
20. `GET /api/office/reports/export` 复用相同过滤条件和 session scope，导出真实 transaction CSV
21. `/office/tasks` 读取 `TransactionTask + TaskListView`，按 built-in view、saved view 和 query-param filters 返回真实任务列表
22. `/office/tasks` 的 create / edit / complete / reopen / request review / approve / reject 都直接写数据库，并同步写入 `AuditLog`
23. `/api/office/tasks/views` 以 membership 维度持久化 saved views
24. Dashboard 的 weekly updates / useful links / training links 仍使用静态内容
25. 其他页面仍然直接把静态 DTO 渲染成后台 UI

当前唯一已经走数据库的最小读路径是：

1. `/api/db/seeded-context`
2. route 调 `@acre/db` 的 `getSeededWorkspaceSnapshot`
3. utility 通过 Prisma 查询 organization / office / memberships / users
4. 返回 seed 后的数据库快照 JSON

当前本地 auth 的主要链路是：

1. 用户在 `/login` 提交 seeded email
2. `/api/auth/login` 通过 `@acre/db` 查 active membership
3. 服务端写入 signed cookie session
4. `/office/*` layout 读取 session，并在服务端拿到 current user / membership / organization / office
5. 未登录用户重定向到 `/login`
6. `/api/office/dashboard` 读取当前 session context，而不是硬编码角色

### 未来预期数据流

暂定方案：

1. 请求进入 `apps/web`
2. session / auth middleware 解析当前用户和组织
3. route handler 调用领域 service
4. 领域 service 通过 `@acre/db` 的 Prisma runtime 访问 PostgreSQL
5. 返回 DTO 给页面或 API

这个链路只完成了最小数据库 probe，主页面和主 API 还没有全部切换。

## 核心业务逻辑

从当前项目目标看，后续最核心的业务逻辑不在 UI，而在下面这些领域：

### 1. 多组织 / 多 office

项目不是单一公司后台。当前 mock 数据里已经体现了多公司结构：

- Acre NY Realty Inc
- Acre NJ LLC
- Acre NY Rentals LLC

这意味着后续任何真实数据接入，都必须优先考虑：

- organization scope
- office scope
- membership scope

如果这里处理错，最容易出权限和数据串线问题。

### 2. 角色和权限

当前已有三类角色：

- `agent`
- `office_manager`
- `office_admin`

虽然现在只是静态映射，但它已经决定了后续架构方向。不要把权限逻辑散落在页面组件里。

### 3. Listings 是系统核心

从 PRD 和当前页面结构看，`listings` 不是普通内容列表，而是整个系统的数据中轴：

- agent 端依赖 listings 做营销和分享
- office 端依赖 listings 做 intake / review / publish
- public site 后续也会依赖 listings

这部分以后最可能演化为系统最重要的核心模块。

### 3.5 Transactions 是当前 Back Office 的主轴

按用户最新范围定义，当前阶段优先复刻的是 `Brokermint` 的 `Back Office`，不是 Acre 全平台所有模块。因此当前最重要的 UI/业务主轴是：

- `Dashboard`
- `Pipeline`
- `Transactions`
- `Contacts`
- `Reports`
- `Activity`
- `Library`
- `Accounting`

其中真正最需要优先落成真实数据的，是 `Transactions`、`Contacts` 以及它们关联出来的 `Pipeline`、`Reports`。

### 3.6 Company referral / commission rule 是当前已确认的真实业务规则

来自本地 PDF [____CRM_____Agent__.pdf](../____CRM_____Agent__.pdf) 的已确认规则：

- 创建交易时要支持 `Company Referral`
- 需要有 `Company Referral Employee's Name`
- 要支持 `Add agent / commission`
- 客服推单默认 `20%`
- 代运营成单默认 `10%`
- 特定来源还要求额外添加特定参与方，例如 `Guangzhou Huihe`、`Feitong Zhao`

这意味着 `Create Transaction` 以后不能只是基础交易表单，还必须包含 referral source 和 commission participant 的业务层逻辑。

### 4. CRM / Follow-up / Notifications 是 agent 和 office 的连续工作流

CRM 当前已经开始从 `Office Contacts` 落地最小真实实现，但整体仍远未完整。从 schema 看已经有明确方向：

- client
- follow_up_task
- notification

当前已经落地的最小闭环包括：

- contact list / create / edit
  - contact list 现在不再把全量结果拉到客户端内存过滤，而是由服务端按 URL 参数返回分页结果
- contact detail
- follow-up task create / list
- `TransactionContact` -> transaction/contact relation
- `Transaction.primaryClientId` 兼容同步
- transaction detail contacts section:
  - list linked contacts
  - link existing contact
  - unlink linked contact
  - set primary linked contact
- transaction finance section:
  - `grossCommission`
  - `referralFee`
  - `officeNet`
  - `agentNet`
  - `financeNotes`
  - 当前直接存放在 `Transaction` 行上，而不是独立 finance 子系统
- `Office Tasks` 现在已经从 transaction detail 内嵌区块扩成独立模块：
  - `TransactionTask`
  - `TaskListView`
  - built-in views:
    - `Requires attention`
    - `All transactions`
  - per-membership saved views
  - filters:
    - transaction status
    - assignee
    - due window
    - no due date
    - compliance status
    - transaction
    - keyword search
  - 最小合规工作流字段：
    - requires document
    - requires review
    - requires secondary approval
    - review status
    - compliance status
  - 任务动作：
    - create
    - edit
    - complete
    - reopen
    - request review
    - approve
    - reject
  - transaction detail tasks section 与 `/office/tasks` 共用同一套数据库和 service，不另建第二套 task 系统

更高级的 CRM 自动化、提醒编排、批量任务、线索分配仍未实现。

### 5. Accounting 当前是 transaction-side accounting foundation

`/office/accounting` 现在不再是占位页，而是一个最小但真实的 accounting MVP。它的边界是刻意收住的：

- 目标是支持 brokerage / agent / transaction 相关的 accounting workflow
- 不是 QuickBooks 替代品
- 也不是全公司运营会计平台

当前落地的数据基础：

- `LedgerAccount`
- `AccountingTransaction`
- `AccountingTransactionLineItem`
- `GeneralLedgerEntry`
- `EarnestMoneyRecord`

当前支持的 accounting transaction types：

- `invoice`
- `bill`
- `credit_memo`
- `deposit`
- `received_payment`
- `made_payment`
- `journal_entry`
- `transfer`
- `refund`

当前 posting 层仍然是显式规则，不是通用 accounting engine：

- `invoice`
- `received_payment`
- `bill`
- `made_payment`
- `deposit`
- `refund`
- `credit_memo / journal_entry / transfer` 走 line items + balanced entry 规则

当前 EMD workflow 也是真实的：

- expected amount
- received amount
- refunded / distributed amount
- due date / payment date / deposit date
- held by office / held externally
- optional ledger posting

故意没做的范围：

- QuickBooks sync
- bank reconciliation
- payroll
- office-rent / utilities accounting
- ACH payouts / payment gateways
- 完整 commission-plan engine

## 最容易改出问题的地方

### 1. 把 mock 数据当成正式数据层

当前 `@acre/backoffice` 很方便，但它本质上还是临时数据源。后续接数据库时，最容易出现的问题是：

- 页面直接耦合到 mock 字段
- API 和页面各自写一套转换逻辑
- 新旧 DTO 不一致

建议：

- 在接数据库前先定义清楚 DTO 边界
- 保持页面只依赖 service 输出，不直接依赖底层 schema

### 2. 权限逻辑下沉到页面

当前页面里已经有 role summary 展示，但还没有真正做权限拦截。后续很容易有人为了“先跑起来”直接在页面组件里写 if/else。

建议：

- 权限判断统一放在 `@acre/auth` 和 server-side service 层
- 页面只消费“已经过滤好的能力”

### 3. Listings 既服务内部又服务外部

同一份 listings 数据未来既要服务内部 agent/office，又可能服务 public website。最容易出错的点是：

- public/private 字段边界
- SEO 字段和内部字段混杂
- 营销文案与后台原始数据耦合

建议：

- 明确区分内部模型、外部展示模型、营销输出模型

### 4. 数据库 runtime 已有，但主读取链路还没有切换

后续第一位接手者最容易误判“既然有 Prisma client 和 seed，就说明页面已经接数据库”。实际上现在只有 `Dashboard` 的业务指标、`Pipeline`、`Transactions`、`Contacts`、`Reports` 这几条线已经接数据库，其他主页面大多还没有。

建议：

- 先通过最小 query utility 明确 DTO 形状
- 再逐步替换 `@acre/backoffice` 的内存数据

## 后续扩展推荐入口

如果你要继续实现真实功能，建议按这个顺序推进：

1. `auth/session`
2. `organization + office context`
3. 把更多读取路径接到 `@acre/db`
4. `listings CRUD`
5. `clients + follow_up_tasks`
6. `notifications + events`
7. `resources + vendors`
8. 文件、OCR、AI、外部集成

原因：

- 先把用户上下文和组织边界定住，后面不容易返工
- listings 和 CRM 是最核心的业务价值
- 其他模块大多依赖这些基础数据结构

## 给维护者的建议

如果你是第一次接手，不要直接“开始加页面”。先确认：

- 你的改动是临时展示层改动，还是会进入长期业务模型
- 你是否需要先改 `@acre/backoffice`
- 你是否需要同步改 `@acre/auth` 或 `packages/db/prisma/schema.prisma`
- 文档是否需要同步更新

这个项目当前还在“把架构方向钉稳”的阶段。稳定边界比快速堆页面更重要。
