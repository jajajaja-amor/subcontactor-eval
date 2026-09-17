# SubcontractOps

建筑分包商客服 Agent / Planner / Skill / Tool / Eval 运营平台。这是可运行的项目骨架：服务端 JSON 存储、运营工作台、工单 / Skill / Tool / Eval 页面，而不是营销首页。

## 技术栈

- Next.js 16 App Router、React 19、TypeScript
- Tailwind CSS 4、shadcn/ui（Radix）、Lucide、Sonner、Recharts、Zod
- 包管理：pnpm

## 脚本

```bash
pnpm install
pnpm dev          # 默认 5000，可用 DEPLOY_RUN_PORT 覆盖
pnpm build
pnpm start        # 默认 5000，可用 DEPLOY_RUN_PORT 覆盖
pnpm lint
pnpm typecheck
pnpm validate     # typecheck + lint
```

## 数据存储

业务 JSON 位于 `data/`。读写只允许发生在服务端：

- 进程级按文件互斥锁
- 先写临时文件再 `rename`
- 写入失败保留上一份有效数据
- `DATA_DIR` 可覆盖数据目录

临时验收接口：

- `GET /api/health`
- `POST /api/store-test` `{ "action": "lock" | "atomic" }`
