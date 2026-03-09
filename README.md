# Acre

`Acre` 是一个面向房地产经纪公司内部团队的 Web 工作台。当前仓库实现的是 `Acre Agent OS` 的第一版工程骨架，服务对象是：

- `Agent`：一线经纪人，使用 listings、轻 CRM、活动通知、资源库、AI 工具
- `Office Team`：运营/管理人员，使用 listings admin、events、resources、analytics

这不是客户前台网站。客户前台后续会是独立 surface，复用这里的 listings 和后台数据能力。

## 当前真实状态

当前已经实现：

- 一个 `Next.js` 响应式 Web 应用，支持桌面和手机浏览器
- 两套工作台入口：
  - `Agent Workspace`
  - `Office Console`
- 基础页面路由：
  - `/`
  - `/agent/dashboard`
  - `/agent/listings`
  - `/agent/clients`
  - `/agent/notifications`
  - `/agent/resources`
  - `/office/dashboard`
  - `/office/listings`
  - `/office/events`
  - `/office/resources`
- 一组只读 API：
  - `/api/health`
  - `/api/agent/dashboard`
  - `/api/office/dashboard`
  - `/api/listings`
  - `/api/clients`
  - `/api/events`
  - `/api/resources`
- 一个独立的权限模型包 `@acre/auth`
- 一个独立的领域数据/服务包 `@acre/backoffice`
- 一份 `Prisma + PostgreSQL` schema，覆盖组织、用户、房源、CRM、通知、活动、资源、vendor、审计日志

当前未实现 / 计划中：

- 未实现真实登录、session、用户鉴权
- 未实现数据库读写，页面和 API 当前都使用 `@acre/backoffice` 里的内存示例数据
- 未实现任何写操作接口，当前 API 全是 `GET`
- 未实现 Prisma Client 初始化、migration 流程、seed、真实 CRUD
- 未实现测试体系
- 未实现 Vercel 项目绑定和生产环境部署
- 未实现对象存储、异步任务、AI 工作流、文件上传、OCR、第三方集成

这几项在文档里都会明确以“未实现 / 暂定方案”处理，不应误认为已经完成。

## 本地启动

前提：

- Node.js `22+` 建议
- npm `10+`
- 如果要校验数据库 schema，需要本地可用的 PostgreSQL 连接串；仅跑前端和只读 API 不需要真实数据库

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
- [packages/db/prisma/schema.prisma](./packages/db/prisma/schema.prisma) 定义数据库结构，但尚未接入运行时

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
