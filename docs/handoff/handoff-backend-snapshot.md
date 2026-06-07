# ReviewX 后端当前事实快照

## 1. 用途

- 记录后端当前事实
- 让新会话快速判断 `backend` 当前是否初始化、有哪些模块、有哪些关键能力、哪些内容尚未实现

## 2. 当前状态

- `backend` 已初始化为可运行的 NestJS 公共骨架
- 当前仅包含 `AppModule`、`AppController`、`AppService`、配置层和通用异常过滤器
- 当前无业务模块、无 `src/modules/` 目录、无业务 Schema
- 当前已确认最小健康检查 API：`GET /health`
- 当前已具备单元测试与最小 E2E 测试骨架
- 当前未接入数据库连接与外部集成
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
│  └─ config/
│     ├─ configuration.ts
│     └─ env.validation.ts
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
- 当前无业务模块
- 当前无 `src/modules/` 目录

### 4.3 认证与会话

- 当前未实现认证、用户或会话能力
- 仅启用了 `cookie-parser` 作为通用基础设施准备
- 后续以 `docs/auth-baseline.md` 和真实实现为准

### 4.4 数据库连接与集合

- 当前仅预留 `MONGO_URI` 配置项
- 当前未引入数据库模块，未创建任何集合或 Schema
- 后续以真实模块实现为准

### 4.5 文件上传 / 对象存储

- 当前未实现

### 4.6 外部服务集成

- 当前未实现

### 4.7 后台任务 / 定时任务

- 当前未实现

### 4.8 测试与验证

- 已包含 `src/app.controller.spec.ts` 单元测试
- 已包含 `test/app.e2e-spec.ts` 最小 E2E，用于验证 `GET /health`
- 当前测试不依赖数据库
- 当前本地可执行构建、lint、单元测试和最小 E2E

### 4.9 已知问题

- 当前未接入数据库模块，后续如进入 Schema 或持久化开发，再补齐数据库装配与隔离测试
- 当前仅有最小健康检查接口，后续业务模块需按架构文档逐步扩展

## 5. 维护规则

- 后端初始化后必须更新本文档
- 新增核心模块后应更新本文档
- 新增关键外部集成后应更新本文档
- 普通接口小改不要求机械更新本文档，除非影响系统事实判断
