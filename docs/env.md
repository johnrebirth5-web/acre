# Environment Variables

## 概览

当前项目实际用到的环境变量非常少。

真实代码状态：

- 当前只有 `DATABASE_URL` 被 Prisma schema 使用
- 页面和 API 的运行当前不依赖数据库，因此在“只跑前端和 mock API”时，即使没有真实数据库，也能运行
- 一旦执行 Prisma 相关命令，`DATABASE_URL` 就变成必需项

未来随着 auth、storage、AI、第三方集成接入，这个文件需要同步扩展。

## 当前环境变量清单

### `DATABASE_URL`

用途：

- 提供 PostgreSQL 连接串
- 当前用于 Prisma schema 校验
- 未来会用于 Prisma Client 读写数据库

是否必填：

- 对 Prisma 命令是必填
- 对当前页面本地运行是“可不填”，因为页面还没接数据库

示例格式：

```env
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/acre"
```

缺失后的影响：

- `npm run db:validate` 会失败
- 未来如果接入 Prisma runtime，应用启动或 API 查询也会失败

开发和生产差异：

- 开发环境通常使用本地 PostgreSQL 或开发库
- 生产环境必须使用真实数据库，并确保网络和权限配置正确

## 当前代码中的来源

参考文件：

- [.env.example](../.env.example)
- [packages/db/prisma/schema.prisma](../packages/db/prisma/schema.prisma)
- [packages/db/package.json](../packages/db/package.json)

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

1. 先配置 `.env.local`
2. 提供真实可连接的 `DATABASE_URL`
3. 再开始接 Prisma runtime 和 migration

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
