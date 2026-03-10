# Acre

`Acre` 是一个面向房地产经纪公司内部团队的 Web 工作台。当前仓库实现的是 `Acre Agent OS` 的第一版工程骨架，服务对象是：

- `Agent`：一线经纪人，使用 listings、轻 CRM、活动通知、资源库、AI 工具
- `Office Team`：运营/管理人员，当前重点是 `Back Office`，参考 `Brokermint` 的 `Dashboard / Pipeline / Transactions / Contacts / Reports / Activity / Library / Accounting`

这不是客户前台网站。客户前台后续会是独立 surface，复用这里的 listings 和后台数据能力。

## 当前真实状态

当前已经实现：

- 一个 `Next.js` 响应式 Web 应用，支持桌面和手机浏览器
- 两套工作台入口：
  - `Agent Workspace`
  - `Office Console / Back Office`
- `Office Console` 已经按 `Brokermint` 的后台信息架构重做第一轮：
  - 左侧分组导航
  - `Dashboard`
  - `Pipeline`
  - `Transactions`
  - `Contacts`
  - `Reports`
  - `Activity`
  - `Library`
  - `Accounting`
  - `Settings > Company`
- `Dashboard` 当前保留原有高保真布局，但业务指标已改为真实数据库查询：
  - `Goal Tracking`
  - 当前登录用户 / 角色 / office access 摘要
  - transaction counts by status
  - contacts needing follow-up
  - `Weekly Updates`
  - `Acre Useful Links`
  - `Back Office Agent Training Links`
  - `Recent Transactions`（真实数据库）
- `Pipeline` 当前已实现一版静态漏斗页，按 `Opportunity / Active / Pending / Closed / Cancelled` 分栏展示
- `Transactions` 当前已实现一版更接近 `Brokermint` 的静态高密度列表页，包含顶部统计、搜索、分页和交易列表
- `Transactions` 现在是当前第一个接入真实数据库的 `Office` 模块：
  - 列表页使用 PostgreSQL / Prisma 读取真实 transaction 数据
  - 支持搜索和状态筛选
  - `Create Transaction` modal 会真实写入数据库
  - 已有 transaction detail 页面
  - 已有 status update 写路径
- `Contacts` 现在也已接入真实数据库：
  - 列表页使用 PostgreSQL / Prisma 读取真实 client 数据
  - 支持搜索、创建、编辑和基础 stage 筛选
  - 已有 contact detail 页面
  - 支持为 contact 创建 follow-up task
  - 支持把 contact 作为 primary client 关联到 transaction
- `Reports` 现在也已接入真实数据库：
  - 支持 total transactions
  - 支持 transactions by status
  - 支持 transactions by owner / agent
  - 支持 transactions over time
  - 支持 contacts needing follow-up
  - 支持最小 date range / owner 过滤
- `Create Transaction` 保持在 `Transactions` 页面内的 modal 结构，按 `NEW TRANSACTION / step 1 of 4` 真实截图铺出，包含顶部 `Type / Status / Representing` 和 `Additional fields`
- 基础页面路由：
  - `/` -> 登录后跳对应 workspace，未登录跳 `/login`
  - `/agent` -> `/agent/dashboard`
  - `/office` -> `/office/dashboard`
  - `/login`
  - `/agent/dashboard`
  - `/agent/listings`
  - `/agent/clients`
  - `/agent/notifications`
  - `/agent/resources`
  - `/office/dashboard`
  - `/office/pipeline`
  - `/office/transactions`
  - `/office/contacts`
  - `/office/reports`
  - `/office/activity`
  - `/office/company`
  - `/office/library`
  - `/office/accounting`
- 一组只读 API：
  - `/api/health`
  - `/api/db/seeded-context`
  - `/api/agent/dashboard`
  - `/api/office/dashboard`
  - `/api/office/transactions`
  - `/api/office/transactions/:transactionId`
  - `/api/office/contacts`
  - `/api/office/contacts/:contactId`
  - `/api/office/contacts/:contactId/follow-up-tasks`
  - `/api/office/contacts/:contactId/transactions/:transactionId`
  - `/api/listings`
  - `/api/clients`
  - `/api/events`
  - `/api/resources`
- 一个独立的权限模型包 `@acre/auth`
- 一个独立的领域数据/服务包 `@acre/backoffice`
- 一个独立的数据库包 `@acre/db`，当前已包含：
  - 可复用的 Prisma client
  - 初始 migration 基线
  - seed workflow
  - 一个最小的数据库读取 utility 和 API probe
- 一个最小本地 auth/session 方案，当前已包含：
  - seeded user 登录
  - 登录后 signed cookie session
  - `POST /api/auth/login`
  - `POST /api/auth/logout`
  - `/office/*` 服务端保护
  - 服务端可读取 `currentUser / currentMembership / currentOrganization / currentOffice`
- 一份 `Prisma + PostgreSQL` schema，覆盖组织、用户、房源、CRM、通知、活动、资源、vendor、审计日志

当前未实现 / 计划中：

- `Dashboard`、`Transactions`、`Contacts`、`Reports` 之外的大多数页面和 API 仍使用 `@acre/backoffice` 的内存示例数据
- 已实现数据库 runtime、migration、seed，且 `Dashboard` 的业务指标、`Transactions`、`Contacts`、`Reports` 已接入真实数据库；其余主页面和主 API 仍未完成数据库切换
- 已实现最小本地 auth/session，但还没有复杂权限管理、数据级权限、第三方 auth provider
- 未实现 `Brokermint` 中更深层的交易详情子页、审批流、checklists、accounting ledger、buyer offers
- 写操作接口当前只覆盖：
  - `Transactions` 的 create / status update
  - `Contacts` 的 create / edit / follow-up task create / transaction link
- 其余模块仍未实现真实 CRUD
- 未实现测试体系
- Vercel 项目已绑定 GitHub 仓库，`main` 分支 push 会自动触发生产部署
- 未实现对象存储、异步任务、AI 工作流、文件上传、OCR、第三方集成

这几项在文档里都会明确以“未实现 / 暂定方案”处理，不应误认为已经完成。

## 本地启动

前提：

- Node.js `22+` 建议
- npm `10+`
- 如果要使用本地登录、执行 Prisma 命令、或访问数据库 probe route，需要本地可用的 PostgreSQL 连接串
- 如果只浏览当前 mock 页面和不依赖数据库的只读 API，真实数据库不是必需项

安装依赖：

```bash
npm install
```

启动开发环境：

```bash
npm run dev
```

默认地址：

- `http://localhost:3000`

## 常用开发命令

安装依赖：

```bash
npm install
```

启动开发服务器：

```bash
npm run dev
```

类型检查：

```bash
npm run typecheck
```

基础静态校验：

```bash
npm run lint
```

构建生产包：

```bash
npm run build
```

校验 Prisma schema：

```bash
npm run db:validate
```

生成 Prisma client：

```bash
npm run db:generate
```

运行开发 migration：

```bash
npm run db:migrate -- --name init
```

执行 seed：

```bash
npm run db:seed
```

## 项目目录结构

```text
acre/
  apps/
    web/                    # Next.js Web 应用
      app/                  # App Router 页面和 API routes
  packages/
    auth/                   # 角色和权限定义
    backoffice/             # 领域模型、示例数据、页面/API 共用服务层
    db/                     # Prisma schema 和数据库相关配置
    ui/                     # 共享 UI 组件
  docs/                     # 面向维护者的文档
  package.json              # monorepo 根脚本
  turbo.json                # Turbo task 配置
  tsconfig.base.json        # 共享 TS 配置
```

更具体一点：

- [apps/web](./apps/web) 是当前唯一运行中的应用
- [apps/web/app](./apps/web/app) 同时包含页面和 API route
- [packages/backoffice/src/index.ts](./packages/backoffice/src/index.ts) 是当前最核心的业务入口文件
- [packages/auth/src/index.ts](./packages/auth/src/index.ts) 定义角色和权限
- [packages/db/prisma/schema.prisma](./packages/db/prisma/schema.prisma) 定义数据库结构和 migration 方向
- [packages/db/src/client.ts](./packages/db/src/client.ts) 是可复用 Prisma client 入口
- [packages/db/src/bootstrap.ts](./packages/db/src/bootstrap.ts) 是当前最小数据库读取 utility
- [packages/db/src/transactions.ts](./packages/db/src/transactions.ts) 是当前 transaction 持久化 service 入口
- [packages/db/src/contacts.ts](./packages/db/src/contacts.ts) 是当前 contact / follow-up task 持久化 service 入口
- [apps/web/lib/auth-session.ts](./apps/web/lib/auth-session.ts) 是当前本地 session 和 server-side auth context 入口
- [apps/web/app/office/dashboard/page.tsx](./apps/web/app/office/dashboard/page.tsx)、[apps/web/app/office/pipeline/page.tsx](./apps/web/app/office/pipeline/page.tsx)、[apps/web/app/office/transactions/page.tsx](./apps/web/app/office/transactions/page.tsx) 是当前 `Back Office` UI 的主要入口
- [apps/web/app/office/transactions/[transactionId]/page.tsx](./apps/web/app/office/transactions/[transactionId]/page.tsx) 是当前 transaction detail 入口
- [apps/web/app/office/contacts/page.tsx](./apps/web/app/office/contacts/page.tsx) 和 [apps/web/app/office/contacts/[contactId]/page.tsx](./apps/web/app/office/contacts/[contactId]/page.tsx) 是当前 contact list/detail 入口

## 新人第一次接手建议先看什么

建议按这个顺序读，30 分钟内能建立项目全貌：

1. [README.md](./README.md)
2. [docs/architecture.md](./docs/architecture.md)
3. [packages/backoffice/src/index.ts](./packages/backoffice/src/index.ts)
4. [apps/web/app/page.tsx](./apps/web/app/page.tsx)
5. [apps/web/app/agent/dashboard/page.tsx](./apps/web/app/agent/dashboard/page.tsx)
6. [apps/web/app/office/dashboard/page.tsx](./apps/web/app/office/dashboard/page.tsx)
7. [packages/auth/src/index.ts](./packages/auth/src/index.ts)
8. [packages/db/prisma/schema.prisma](./packages/db/prisma/schema.prisma)
9. [docs/deployment.md](./docs/deployment.md)
10. [docs/decisions.md](./docs/decisions.md)

如果你准备继续开发功能，不要先从页面样式下手。先确认三件事：

- 当前功能是不是仍然只读 mock 数据
- 你要改的是页面展示层，还是 `@acre/backoffice` 服务层
- 新功能是否需要先落数据库 schema，再补 API，再接页面

## 维护要求

从现在开始，每次新增重要功能或新增环境变量时，至少同步更新这些文档：

- [README.md](./README.md)
- [docs/architecture.md](./docs/architecture.md)
- [docs/deployment.md](./docs/deployment.md)
- [docs/env.md](./docs/env.md)
- [docs/decisions.md](./docs/decisions.md)
