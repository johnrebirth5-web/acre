# Environment Variables

## 概览

当前项目实际用到的环境变量非常少。

真实代码状态：

- 当前数据库相关代码使用 `DATABASE_URL`
- 当前主页面和大多数 API 仍不依赖数据库，因此在“只跑前端和 mock API”时，即使没有真实数据库，也能运行
- 但 `Office Pipeline workspace`、`Office Transactions`、`Office Contacts`、`Office Tasks`、transaction finance、本地登录、`/office/activity` 和数据库 probe 已经依赖 `DATABASE_URL`
- transaction detail 下的 checklist/tasks 也已经依赖 `DATABASE_URL`
- `Office Reports` 的 CSV 导出 route 也依赖 `DATABASE_URL`
- `/api/office/activity/comments` 也依赖 `DATABASE_URL`
- 一旦执行 Prisma 相关命令，或访问这些数据库路径，`DATABASE_URL` 就变成必需项
- 当前本地 auth/session 可以使用默认开发 secret，但建议显式配置 `ACRE_SESSION_SECRET`

未来随着 auth、storage、AI、第三方集成接入，这个文件需要同步扩展。

## 当前环境变量清单

### `DATABASE_URL`

用途：

- 提供 PostgreSQL 连接串
- 当前用于 Prisma schema 校验
- 当前用于 Prisma Client、migration、seed 和数据库 probe 读取
- 当前也用于 `TransactionContact` 关系迁移和回填
- 后续会用于更多页面和 API 的真实数据库读写

是否必填：

- 对 Prisma 命令是必填
- 对数据库 probe route 是必填
- 对只看 mock 页面本地运行是“可不填”
- 对 `/office/pipeline`、`/office/transactions`、`/office/contacts`、`/office/activity`、`/login`、数据库 probe 是必填
- 对 `/office/tasks` 也是必填
- 对 transaction detail 下的 checklist/tasks 读写也是必填
- 对 `/api/office/reports/export` 也是必填
- 对 transaction detail 下的 finance 读写也是必填
- 对 `/api/office/activity/comments` 也是必填

示例格式：

```env
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/acre"
```

缺失后的影响：

- `npm run db:validate` 会失败
- `npm run db:migrate` 会失败
- `npm run db:seed` 会失败
- `/api/db/seeded-context` 会失败
- `/office/pipeline` 会失败
- `/office/transactions` 会失败
- `/office/contacts` 会失败
- `/office/activity` 会失败
- `/office/tasks` 会失败
- `/login` 和需要 session context 的 server-side 查询会失败
- transaction detail 下的 checklist/tasks route 会失败
- `/api/office/reports/export` 会失败
- `/api/office/activity/comments` 会失败
- 后续如果更多页面/API 接入 Prisma runtime，相关查询也会失败

开发和生产差异：

- 开发环境通常使用本地 PostgreSQL 或开发库
- 生产环境必须使用真实数据库，并确保网络和权限配置正确

### `ACRE_SESSION_SECRET`

用途：

- 本地 auth/session 的 cookie 签名 secret
- 当前用于保护 `acre_local_session` 不被随意篡改

是否必填：

- 本地开发不是强制必填，因为代码里有 development fallback
- 但建议配置，避免不同环境共享默认 secret

示例格式：

```env
ACRE_SESSION_SECRET="replace-with-a-long-random-string"
```

缺失后的影响：

- 本地登录仍然可以工作
- 但会退回到仓库内的开发默认值，不适合长期共享环境

开发和生产差异：

- 开发环境可用 fallback 启动
- 生产或共享环境应始终显式配置

## 当前代码中的来源

参考文件：

- [.env.example](../.env.example)
- [packages/db/prisma/schema.prisma](../packages/db/prisma/schema.prisma)
- [packages/db/package.json](../packages/db/package.json)
- [packages/db/src/client.ts](../packages/db/src/client.ts)

注意：

- 当前 `db:validate` 脚本里带了一个本地占位格式的连接串，用于在没有真实 secret 的情况下完成 schema 语法校验
- 这不等于已经接入真实数据库

## 暂未实现但未来大概率会新增的环境变量

以下变量当前还不存在于代码里，因此不要提前假设已经接入：

- `NEXTAUTH_SECRET` 或同类 auth secret
- `NEXTAUTH_URL` 或应用 base URL
- `S3_*` / `R2_*` 对象存储相关变量
- AI provider key
- OCR provider key
- 邮件 / 短信服务 key
- 第三方地产平台集成 key

这些在真正接入前，不应写入生产部署手册中作为“已存在配置”。

## 开发环境建议

如果你当前只是前端开发或页面结构开发：

- 可以不配置真实数据库
- 直接运行 `npm run dev`

如果你要开始接数据库：

1. 先在仓库根目录配置 `.env.local`
2. 提供真实可连接的 `DATABASE_URL`
3. 运行 `npm run db:generate`
4. 运行 `npm run db:migrate -- --name init`
5. 运行 `npm run db:seed`

当前实现说明：

- `packages/db` 的 Prisma 脚本会读取仓库根目录的 `.env.local` / `.env`
- `@acre/db` 的 runtime 也会从仓库根目录读取同一份 `DATABASE_URL`

## 生产环境建议

当前没有生产环境，但后续如果部署到 Vercel：

- 不要把 `.env.local` 提交到仓库
- 在 Vercel 项目设置中配置环境变量
- 生产 `DATABASE_URL` 必须指向可用的 PostgreSQL 实例

## 维护要求

今后每新增一个环境变量，都应同步更新：

- [docs/env.md](./env.md)
- [.env.example](../.env.example)
- 如果影响部署，也要同步更新 [docs/deployment.md](./deployment.md)
