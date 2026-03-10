# Decisions

## 这份文件是做什么的

这不是“理想架构宣言”，而是记录当前项目为什么会长成现在这样，以及哪些选择是有意为之，哪些只是阶段性方案。

接手者最应该先理解这里，因为很多代码现状看起来“不完整”，但其实是刻意停在一个对后续演进更安全的阶段。

## 关键决策 1：先做内部 Agent / Office 系统，不做客户前台

原因：

- 当前业务定义明确偏向内部工作台
- 用户角色、流程、权限、数据结构都首先服务 agent 和 office team
- 客户前台网站未来应复用这里的数据能力，但不应反过来绑架后台设计

影响：

- 当前页面只做 agent / office 两个 workspace
- 信息架构优先考虑内部工作流，不优先考虑营销展示

Trade-off：

- 现在看起来不“完整”，因为 public-facing 部分还没开始
- 但这样能先把真正复杂的业务中台钉住

## 关键决策 2：采用 monorepo，而不是单个前端项目

原因：

- 项目从一开始就不是单页面 demo
- 已经明确需要前端、权限、领域逻辑、数据库 schema 分层
- 后续还可能增加更多 app 和 package

影响：

- 根目录用 npm workspaces + Turbo
- `apps/web` 只做应用层
- `packages/*` 放共用能力

Trade-off：

- 初期样板和工程配置比单项目多
- 但后面接数据库、鉴权、更多 app 时返工更少

## 关键决策 3：当前后端先用 Next.js Route Handlers，而不是独立 API 服务

原因：

- 当前阶段最重要的是把 Web、API、领域结构一起钉住
- Next.js Route Handlers 足够承载现在这批只读 API
- 和未来 Vercel 部署路径一致

影响：

- API 目前都在 [apps/web/app/api](../apps/web/app/api)
- 页面和 API 共用 `@acre/backoffice`

Trade-off：

- 后续如果出现复杂写操作、长任务、重集成，可能需要拆更独立的 service/worker
- 但现在不值得过早拆分

## 关键决策 4：先把业务结构做对，再接真实数据库

这是当前最容易被误解的一点。

为什么没有一开始就接数据库：

- 当前最先需要验证的是模块边界和信息架构
- 项目需求还在快速收敛
- 过早把数据库写入页面和 API，后续很容易高成本返工

所以现在采用了一个过渡方案：

- `packages/db` 里先定义 Prisma schema
- `packages/backoffice` 里先提供稳定的 mock 数据和 DTO
- 页面和 API 先围绕 service 输出建结构

Trade-off：

- 这让项目当前“能跑但不持久化”
- 这是刻意的，不是漏做

后续重构点：

- 用 Prisma runtime 替换 `@acre/backoffice` 里的内存数据来源
- 尽量保留页面和 API 的输出 shape，不让前端大面积返工

## 关键决策 5：权限模型先独立成包

原因：

- 多角色是项目基础，不是后加功能
- listings、clients、events、resources、analytics 的访问能力未来一定会分角色变化
- 如果权限逻辑先散在页面里，后面一定会变乱

影响：

- 当前 `@acre/auth` 已经独立
- 页面和 API 已经可以读角色摘要

未实现：

- 复杂 session 体系
- middleware
- 数据级权限

Trade-off：

- 当前看起来像“只定义了权限字符串”
- 但这比以后从 UI 代码里回收权限逻辑要安全得多

## 关键决策 6：Listings 是数据中轴

原因：

- 从产品定义看，listings 同时服务内部运营、agent 营销和未来 public site
- 所以 schema 和页面设计都优先围绕 listings 建立

影响：

- office 端有 listings admin
- agent 端有 listings workspace
- schema 中 listings 关联了 office、owner、share links、public/private 状态

Trade-off：

- 其他模块现在看起来相对轻
- 这是因为 listings 会成为后续很多功能的上游数据源

## 关键决策 7：当前 UI 故意不引入重型组件库

原因：

- 现在最重要的是把产品结构和响应式工作台做出来
- 过早引入复杂 design system 或表格库，收益不高
- 当前页面规模还不需要它

影响：

- 当前只有 `@acre/ui` 中几个很轻的基础组件
- 样式主要集中在全局 CSS

Trade-off：

- 后续做复杂表格、表单、过滤器时可能要引入新工具
- 但现在保持轻量更利于快速迭代

## 关键决策 8：当前优先贴近 `Brokermint` 的 Back Office，而不是继续发散 Acre 新概念页

原因：

- 用户已经明确当前范围只做后端，也就是内部 `Back Office`
- 真实参考已经固定为 `https://my.brokermint.com/#/dashboard`
- 前一轮概念化的 Acre 首页虽然能说明工程结构，但不符合真实业务使用场景

影响：

- 当前 `office` 线的页面命名、左侧导航、信息密度，都优先按 `Brokermint` 的后台结构收敛
- 当前最优先的页面是：
  - `Dashboard`
  - `Pipeline`
  - `Transactions`
- 其他 Acre 更宽泛的设想暂时不作为 `office` 主界面依据

Trade-off：

- 现在的 `office` UI 会比最初的 Acre PRD 更“像现有系统”，创新空间被暂时压后
- 但这更符合当前阶段目标，也更利于后续做功能等价系统

## 当前已知限制

这些限制是当前真实存在的，不应忽略：

- 只有最小本地 auth/session，没有第三方 provider、没有复杂权限管理
- 主页面和主 API 还没有切到真实数据库读写
- 写 API 当前只覆盖 `Transactions` 和 `Contacts` 的最小闭环
- 没有测试
- 没有异常监控
- 已有 Vercel 生产部署实例，但还没有完整生产业务能力
- `@acre/backoffice` 目前同时承担“领域模型”和“临时数据源”两种职责
- 当前 `Back Office` 页面虽然已经开始贴近 `Brokermint`，但除 `Dashboard` 业务指标、`Pipeline`、`Transactions`、`Contacts`、`Reports` 外，大部分仍是静态示例数据和简化交互，不应误判为已复刻完成

## 明确的临时方案

以下是刻意接受的临时方案，后续大概率会重构：

### 1. `@acre/backoffice` 里的内存数据

这是当前最大的临时方案。

目的：

- 让页面、API、领域结构先稳定

未来：

- 用真实 repository / Prisma 查询替换

### 2. API 全是 `GET`

目的：

- 先把读取模型钉稳

未来：

- 再补写操作和 mutation 规则

### 3. Prisma 先以最小 runtime 进入仓库

目的：

- 先定义数据边界
- 建立 generate / migrate / seed 的基础工作流
- 先证明 seed 后的数据可以被服务端查询
- 不在这一轮就把所有页面和 API 从 mock 切到数据库

未来：

- 再把真实数据库读取逐步替换进领域 service 和页面/API
- 当前这条迁移已经从 `Transactions` 和 `Contacts` 开始落地：
  - dashboard 业务指标 / recent transactions / access summary 已切到 Prisma + session context
  - pipeline buckets 已切到 Prisma，并按 transaction status 做显式列映射
  - transaction list/detail/create/status update 已经切到 Prisma
  - contact list/detail/create/edit/follow-up task / transaction link 已经切到 Prisma
  - transaction/contact relation 现在以 `TransactionContact` 为 source of truth，`primaryClientId` 仅保留兼容同步
  - transaction detail 现在已经开始消费 `TransactionContact`，支持最小 linked contacts 管理
  - reports page 的最小聚合报表已切到 Prisma
  - 其他模块继续保留 mock

### 4. Auth 先采用本地 seeded-user + signed-cookie 方案

目的：

- 尽快让 `/office/*` 具备最小服务端保护
- 复用已存在的 seeded users / memberships
- 不在这个阶段引入第三方 auth provider

当前形态：

- `/login` 使用 seeded email 登录
- server-side signed cookie session
- `/office/*` 通过 layout 做服务端拦截
- office dashboard API 改为读取真实 session context

未来：

- 再决定是否升级到更完整的 auth provider、session store、数据级权限

## 后续接手时最需要先理解的几个决策

如果你只读这一段，也要先理解下面四点：

1. 当前系统不是“全栈已完成”，而是“前端 + API + schema + 最小 Prisma runtime + 最小本地 auth + 部分模块数据库落地”已完成
2. 当前主 API 和页面的数据仍主要来自 `@acre/backoffice` 的内存数据，但 `Dashboard` 的业务指标、`Pipeline`、`Transactions`、`Contacts`、`Reports` 已是例外
3. `packages/db` 现在已经能 generate / migrate / seed / query，但这不代表所有页面都已经完成数据库迁移
4. 当前 auth 只是本地开发方案，不应误判为生产 auth 设计
5. 后续功能开发应优先保持模块边界，不要把 auth、db、页面逻辑重新混在一起

## 文档维护约定

从现在开始，任何影响架构边界的改动，都应该同步更新这份文件。尤其是：

- 新增数据库接入
- 新增 auth/session
- 新增外部服务
- 新增 app
- 把某个临时方案替换为正式实现
