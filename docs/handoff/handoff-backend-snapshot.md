# ReviewX 后端当前事实快照

## 1. 用途

- 记录后端当前事实
- 让新会话快速判断 `backend` 当前是否初始化、有哪些模块、有哪些关键能力、哪些内容尚未实现

## 2. 当前状态

- `backend` 已初始化为可运行的 NestJS 公共骨架
- 当前包含 `AppModule`、`AppController`、`AppService`、配置层、通用异常过滤器和 users 模块基础模型
- 当前已有 users 模块；该模块只有 Schema + Service，无 Controller，无 HTTP API
- 当前已确认最小健康检查 API：`GET /health`
- 当前已具备单元测试与最小 E2E 测试骨架
- 当前已接入 `MongooseModule`，建立 MongoDB 连接与环境配置基线
- 当前仅保留 `.env.development.example`、`.env.test.example`、`.env.production.example` 三类环境示例文件
- 当前已预留通用 LLM / Bailian 配置基线
- 当前仍未接入外部集成
- 当前本地默认后端端口为 `5001`
- 当前本地前端来源示例为 `http://localhost:3001`

## 3. 技术基线

- 技术方向：NestJS + Mongoose + MongoDB + TypeScript
- 具体版本以 `backend/package.json`、锁文件、部署环境和实际代码为准
- 不在本文档中写死版本

## 4. 待后续补充的事实区

### 4.1 后端目录结构

当前目录结构如下：

```text
backend/
├─ src/
│  ├─ app.controller.spec.ts
│  ├─ app.controller.ts
│  ├─ app.module.ts
│  ├─ app.service.ts
│  ├─ app.setup.ts
│  ├─ main.ts
│  ├─ common/
│  │  └─ filters/
│  │     └─ all-exceptions.filter.ts
│  ├─ config/
│  │  ├─ configuration.ts
│  │  └─ env.validation.ts
│  └─ modules/
│     └─ users/
│        ├─ dto/
│        │  └─ create-user.input.ts
│        ├─ schemas/
│        │  └─ user.schema.ts
│        ├─ types/
│        │  ├─ public-user.type.ts
│        │  ├─ user-role.type.ts
│        │  └─ user-status.type.ts
│        ├─ users.module.ts
│        ├─ users.service.spec.ts
│        └─ users.service.ts
├─ test/
│  ├─ app.e2e-spec.ts
│  └─ jest-e2e.json
├─ .gitignore
├─ .prettierrc
├─ eslint.config.mjs
├─ nest-cli.json
├─ package.json
├─ README.md
├─ tsconfig.build.json
├─ tsconfig.eslint.json
└─ tsconfig.json
```

### 4.2 模块清单

- 当前仅有根应用骨架：
  - `AppModule`
  - `AppController`
  - `AppService`
- 当前已有 users 基础模块：
  - `UsersModule`
  - `UsersService`
  - `User` schema
- 当前 users 模块不包含 Controller，也未暴露 HTTP API

### 4.3 认证与会话

- 当前仅完成 users 数据底座，尚未实现 auth 或 sessions
- users 使用 `phone` 作为主要登录标识
- `passwordHash` 只保存哈希值，schema 中默认 `select: false`
- 当前不以邮箱作为登录标识，也无 Email 功能
- 仅启用了 `cookie-parser` 作为通用基础设施准备
- 后续以 `docs/auth-baseline.md` 和真实实现为准

### 4.4 数据库连接与集合

- 当前已通过 `MongooseModule` 接入 MongoDB 连接基线
- 当前 `MONGO_URI` 用于应用运行连接，`MONGO_ADMIN_URI` 预留给未来索引同步、迁移和运维脚本
- 当前配置项包括 `MONGO_URI`、`MONGO_AUTO_INDEX` 和 `MONGO_SERVER_SELECTION_TIMEOUT_MS`
- development 默认数据库名为 `reviewx_dev`
- test 默认数据库名为 `reviewx_test`
- production 数据库名口径为 `reviewx`
- development/test env example 当前使用本地独立应用账号和运维账号连接串
- `MONGO_ADMIN_URI` 当前不参与应用运行连接
- 当前已创建 `users` 集合对应 schema
- 当前 `users.phone` 具备唯一约束
- 当前没有 sessions 集合
- 后续集合以真实模块实现为准

### 4.5 文件上传 / 对象存储

- 当前未实现

### 4.6 外部服务集成

- 当前已预留通用 `LLM_PROVIDER` 与 `BAILIAN_*` 配置
- 当前 `BAILIAN_MODEL` 由 env 提供，代码中不固化默认模型
- 当前尚未实现任何 LLM 调用服务
- 当前未实现其他外部服务集成

### 4.7 后台任务 / 定时任务

- 当前未实现

### 4.8 测试与验证

- 已包含 `src/app.controller.spec.ts` 单元测试
- 已包含 `test/app.e2e-spec.ts` 最小 E2E，用于验证 `GET /health`
- 当前 E2E 启动会装配数据库连接，测试环境应使用 `reviewx_test`
- 当前本地可执行构建、lint、单元测试和最小 E2E；如本地未启动 MongoDB，E2E 可能因无法连接 `reviewx_test` 而失败

### 4.9 已知问题

- 当前虽已接入 users 数据底座，但仍无 auth/sessions
- 当前虽已预留 LLM / Bailian 配置，但尚未实现模型调用服务
- 当前仅有最小健康检查接口，后续业务模块需按架构文档逐步扩展

## 5. 维护规则

- 后端初始化后必须更新本文档
- 新增核心模块后应更新本文档
- 新增关键外部集成后应更新本文档
- 普通接口小改不要求机械更新本文档，除非影响系统事实判断
