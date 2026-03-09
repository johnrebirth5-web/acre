# Deployment

## 当前部署状态

当前真实状态：

- 本地开发可运行
- GitHub 仓库已存在并已推送
- Vercel 未配置
- 没有生产环境实例
- 没有 staging 环境实例

所以这份文档既说明“现在如何运行”，也说明“后续推荐如何部署”。其中未落地部分会标明。

## 当前可用部署方式

### 1. 本地开发运行

这是当前唯一实际完成并验证通过的运行方式。

步骤：

```bash
npm install
npm run dev
```

访问：

- `http://localhost:3000`

已验证的命令：

```bash
npm run lint
npm run typecheck
npm run build
npm run db:validate
```

## 推荐的后续部署方案

当前的推荐方案是：

- `GitHub` 作为代码源
- `Vercel` 部署 `apps/web`
- `PostgreSQL` 作为外部数据库

但注意：

- 现在还没有把项目正式接到 Vercel
- 现在 API 还没有依赖真实数据库
- 所以当前并不存在“完整生产部署”

## 构建与发布

### 本地构建

```bash
npm run build
```

作用：

- 验证 monorepo 中各 package 能否完成 `build`
- 验证 Next.js 应用能否生成生产构建
- 验证 API route 是否能通过 Next build

### 发布到 GitHub

当前仓库已经这样发布：

- remote: `origin`
- repo: [johnrebirth5-web/acre](https://github.com/johnrebirth5-web/acre)
- branch: `main`

典型流程：

```bash
git add .
git commit -m "your message"
git push origin main
```

### 未来发布到 Vercel

未实现 / 计划中。

推荐步骤：

1. 在 Vercel 中导入 GitHub 仓库
2. 指定根项目为仓库根目录
3. 让 Vercel 识别 `Next.js`
4. 配置环境变量
5. 首次构建并验证 `/` 和 `/api/health`

由于当前只有一个 app，理论上直接部署仓库即可。但如果未来新增更多 `apps/*`，要重新检查 Vercel 的 root/project 设置。

## 依赖的平台和服务

### 当前已依赖

- GitHub
- Node.js
- npm

### 当前代码中已声明但尚未接入运行时

- PostgreSQL
- Prisma
- Vercel

### 未来大概率需要，但当前未实现

- 对象存储
- 鉴权服务或 session 存储
- 后台任务执行器
- AI / OCR / third-party integration service

## 开发、测试、生产环境区别

### 开发环境

当前真实情况：

- 运行 `next dev`
- 使用 `@acre/backoffice` 内存数据
- 不需要真实数据库即可浏览页面和调用 API
- 如果只执行 `db:validate`，只需要一个格式正确的 `DATABASE_URL`

### 测试环境

未实现。

当前没有：

- 自动化测试环境
- preview environment 约定
- fixture / seed 流程

暂定建议：

- 后续接数据库后，先补一个最小的 preview/staging 环境
- 不要直接把生产数据库作为开发验证环境

### 生产环境

未实现。

当前不应该把这个仓库视为可直接上线的生产系统，原因包括：

- 没有真实鉴权
- 没有数据库运行时接入
- 没有写接口
- 没有 observability
- 没有错误监控
- 没有测试

## 常见部署故障点

### 1. Node/npm 版本不兼容

表现：

- `npm install` 或 `next build` 失败

建议：

- 使用较新的 Node 版本，建议 `Node 22+`
- 保持本地与 CI / Vercel 版本尽量一致

### 2. workspace 依赖没安装完整

表现：

- `@acre/*` 包无法解析
- `next build` 或 `tsc` 报 workspace module not found

建议：

- 在仓库根目录运行 `npm install`
- 不要只在 `apps/web` 下单独装依赖

### 3. `DATABASE_URL` 缺失

表现：

- `npm run db:validate` 失败

说明：

- 当前运行页面不依赖真实数据库
- 但 Prisma schema 校验依赖 `DATABASE_URL`

建议：

- 参考 [docs/env.md](./env.md) 配置

### 4. 把“可 build”误认为“可上线”

表现：

- 团队误以为 Next build 成功就代表生产可用

实际情况：

- 当前 build 成功，只代表前端和 API mock 层可编译
- 不代表业务已具备生产能力

### 5. Vercel 根目录识别错误

这个问题曾经出现过，所以已经在 [apps/web/next.config.ts](../apps/web/next.config.ts) 里通过 `turbopack.root` 做了约束。

如果未来目录结构变化，需要重新检查这里。

## 发布前最低检查清单

在任何准备发布的动作前，建议先跑：

```bash
npm run lint
npm run typecheck
npm run build
npm run db:validate
```

再手动确认：

- 首页能打开
- Agent 页面能打开
- Office 页面能打开
- `/api/health` 返回 `ok`

如果后续接入真实数据库，再把数据库连接检查加入发布清单。
