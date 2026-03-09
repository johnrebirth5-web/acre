# Architecture

## 概览

当前项目是一个 `monorepo`，目标是承载 `Acre Agent OS`。它目前是一个“前端可运行、后端骨架已落、数据库 schema 已定义、真实持久化尚未接通”的阶段。

更准确地说：

- 前端已经可运行
- API 已经存在
- API 当前返回的是 `@acre/backoffice` 的内存数据
- 数据库 schema 已定义，但数据库还没有进入请求链路
- 权限模型存在，但还没有和真实登录态绑定

## 技术栈

### 前端

- `Next.js 16` App Router
- `React 19`
- `TypeScript`
- 原生 CSS，集中在 [apps/web/app/globals.css](../apps/web/app/globals.css)

说明：

- 当前没有引入第三方状态库
- 当前没有表单库
- 当前没有 UI 框架
- 页面主要是服务端组件 + 少量客户端导航组件

### 后端

- `Next.js Route Handlers` 作为当前 API 层
- `@acre/backoffice` 作为领域服务层
- `@acre/auth` 作为权限定义层

说明：

- 当前 API 只有 `GET`
- 当前没有真实鉴权
- 当前没有 service-to-db 的数据访问层
- 当前没有 worker、queue、cron

### 数据库

- `PostgreSQL`
- `Prisma schema` 已定义在 [packages/db/prisma/schema.prisma](../packages/db/prisma/schema.prisma)

说明：

- 目前只有 schema，没有 runtime Prisma client 接入
- 没有 migration 文件
- 没有 seed
- 没有 repository/service persistence 实现

### 第三方服务

当前真实接入状态：

- `GitHub`：已接入，仓库已推送
- `Vercel`：未实现 / 计划中
- `PostgreSQL` 实例：未接入运行时
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
- `getAgentDashboardSnapshot`
- `getOfficeDashboardSnapshot`
- `listListings`
- `listClients`
- `listEvents`
- `listResources`
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

- 真实登录态
- 基于 session 的权限校验
- route guard
- 数据级权限

### `packages/db`

职责：

- 定义数据库 schema
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
- `Notification`
- `Event`
- `EventRsvp`
- `Resource`
- `Vendor`
- `AuditLog`

## 关键数据流

### 当前数据流

现在的真实请求链路是：

1. 页面或 API route 被请求
2. 页面/API 调用 `@acre/backoffice`
3. `@acre/backoffice` 返回内存中的示例对象
4. 页面渲染或 API 返回 JSON

也就是说，当前没有：

- 数据库查询
- 登录态解析
- 远程 API 调用
- 缓存层

### 未来预期数据流

暂定方案：

1. 请求进入 `apps/web`
2. session / auth middleware 解析当前用户和组织
3. route handler 调用领域 service
4. 领域 service 通过 Prisma 访问 PostgreSQL
5. 返回 DTO 给页面或 API

这个链路还没有完成。

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

### 4. CRM / Follow-up / Notifications 是 agent 工作流核心

CRM 当前只是 mock 页面，但从 schema 看已经有明确方向：

- client
- follow_up_task
- notification

这三者未来会形成一个连续工作流，不应分散为互相独立的小模块。

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

### 4. 数据库 schema 已有，但运行时还没有

后续第一位接手者最容易误判“既然有 Prisma schema，就已经有数据库逻辑”。实际上现在没有。

建议：

- 先补 `Prisma client + migration + seed`
- 再逐步替换 `@acre/backoffice` 的内存数据

## 后续扩展推荐入口

如果你要继续实现真实功能，建议按这个顺序推进：

1. `auth/session`
2. `organization + office context`
3. `Prisma runtime`
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
