# ReviewX 后端当前事实快照

## 1. 用途

- 记录后端当前事实
- 让新会话快速判断 `backend` 当前是否初始化、有哪些模块、有哪些关键能力、哪些内容尚未实现

## 2. 当前状态

- `backend` 已初始化为可运行的 NestJS 公共骨架
- 当前包含 `AppModule`、`AppController`、`AppService`、配置层、通用异常过滤器、users 模块基础模型、sessions 模块基础模型和 auth 模块第一阶段登录基线
- 当前已有 users 模块；该模块只有 Schema + Service，无 Controller，无 HTTP API
- 当前已有 sessions 模块；该模块只有 Schema + Service，无 Controller，无 HTTP API
- 当前已有 auth 模块；该模块包含 AuthController、AuthService 和 SessionAuthGuard
- 当前已确认最小健康检查 API：`GET /health`
- 当前已确认认证 API：`POST /auth/login`、`POST /auth/logout`、`GET /auth/me`
- 当前已具备单元测试与最小 E2E 测试骨架
- 当前已接入 `MongooseModule`，建立 MongoDB 连接与环境配置基线
- 当前仅保留 `.env.development.example`、`.env.test.example`、`.env.production.example` 三类环境示例文件
- 当前已预留通用 LLM / Bailian 配置基线
- 当前已新增本地开发脚本 `scripts/create-local-user.ts`，用于在 development/test 数据库创建或更新手机号用户以手动验证 auth
- 当前已新增受控索引同步脚本 `scripts/sync-indexes.ts`，用于显式同步 users / sessions、第一阶段业务集合以及项目导入集合索引
- 当前已实现第一阶段管理端业务底座：batches、dictionaries、tree-dictionaries、organizations、review-schemes、projects
- 当前已实现第二阶段项目 Excel 导入与待确认机制：project-imports
- 当前已实现第三阶段项目评审分配与评审安排后端能力：项目评审负责人/评审方案设置、评审方案快照、评审负责人项目列表、评审时间/地点/meetingUrl 设置、专家候选列表、专家分配/替换/追加/移除、批量专家分配
- 当前 `/admin/*` 新增接口统一要求 Session 登录 + `admin` 角色
- 当前 `/review-manager/*` 新增接口统一要求 Session 登录 + `review_manager` 或 `admin` 角色；具体项目操作时非 admin 必须是该项目 `reviewManagerId`
- 当前主数据列表口径：普通字典、树形字典、评审方案列表不分页，直接返回数组
- 当前分页列表口径：批次、单位、项目、导入任务、导入行列表返回 `{ items, page, pageSize, total }`；分页默认 `page=1`、`pageSize=100`、最大 `1000`
- 当前无管理员用户列表接口；未来如新增用户列表，应保留分页并沿用 `pageSize <= 1000`
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
│     ├─ auth/
│     │  ├─ decorators/
│     │  │  └─ current-user.decorator.ts
│     │  ├─ dto/
│     │  │  └─ login.dto.ts
│     │  ├─ guards/
│     │  │  └─ session-auth.guard.ts
│     │  ├─ types/
│     │  │  ├─ authenticated-user.type.ts
│     │  │  └─ login-result.type.ts
│     │  ├─ auth.controller.ts
│     │  ├─ auth.module.ts
│     │  ├─ auth.service.spec.ts
│     │  └─ auth.service.ts
│     ├─ sessions/
│     │  ├─ schemas/
│     │  │  └─ session.schema.ts
│     │  ├─ types/
│     │  │  ├─ create-session.input.ts
│     │  │  ├─ public-session.type.ts
│     │  │  └─ session-record.type.ts
│     │  ├─ sessions.module.ts
│     │  ├─ sessions.service.spec.ts
│     │  └─ sessions.service.ts
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
│  ├─ auth.e2e-spec.ts
│  ├─ app.e2e-spec.ts
│  └─ jest-e2e.json
├─ scripts/
│  ├─ create-local-user.ts
│  └─ sync-indexes.ts
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
- 当前已有 sessions 基础模块：
  - `SessionsModule`
  - `SessionsService`
  - `Session` schema
- 当前已有 auth 第一阶段模块：
  - `AuthModule`
  - `AuthController`
  - `AuthService`
  - `SessionAuthGuard`
- 当前已有管理员角色权限基础：
  - `Roles` decorator
  - `RolesGuard`
  - `USER_ROLES`
- 当前已有第一阶段业务模块：
  - `BatchesModule`
  - `DictionariesModule`
  - `TreeDictionariesModule`
  - `OrganizationsModule`
  - `ReviewSchemesModule`
  - `ProjectsModule`
- 当前已有第二阶段导入模块：
  - `ProjectImportsModule`
- 当前已有第三阶段评审专家分配模块：
  - `ProjectExpertAssignmentsModule`
  - `ProjectExpertAssignmentsController`
  - `AdminProjectExpertCandidatesController`
  - `ProjectExpertAssignmentsService`
  - `ExpertEligibilityService`
- 当前 users 模块不包含 Controller，也未暴露 HTTP API
- 当前 sessions 模块不包含 Controller，也未暴露 HTTP API

### 4.3 认证与会话

- 当前已完成 users、sessions 数据底座和 auth 第一阶段登录基线
- users 使用 `phone` 作为主要登录标识
- `passwordHash` 只保存哈希值，schema 中默认 `select: false`
- 当前不以邮箱作为登录标识，也无 Email 功能
- sessions 使用服务端随机 `token`、`expiresAt` TTL、`revokedAt` 和 `lastSeenAt` 建模
- auth 当前支持手机号 + 密码登录、服务端 session、HttpOnly Cookie、logout 和 me
- Cookie 名称默认 `reviewx_session`，Cookie 内容只保存 session token
- `SessionAuthGuard` 当前用于保护 `GET /auth/me`
- 本地可通过 `scripts/create-local-user.ts` 创建或重置手机号用户，用于手动验证 `/auth/login`、`/auth/me`、`/auth/logout`
- `scripts/create-local-user.ts` 不是注册接口、不是用户导入脚本、不用于 production
- `scripts/create-local-user.ts` 只允许 development/test 数据库，使用 `MONGO_URI` 应用账号连接，不使用 `MONGO_ADMIN_URI`
- 当前用户模型支持多角色数组 `roles`
- 当前角色枚举：`admin`、`client`、`review_manager`、`expert`、`project_owner`
- 当前用户模型新增 `organizationIds`、`disciplineIds`、`mustChangePassword`、`isActive`
- 旧用户兼容口径：`isActive` 缺失按启用处理；新增数组缺失按空数组处理
- 当前不实现注册、找回密码、修改密码、phone one-time code、复杂角色权限矩阵、菜单权限或数据范围权限
- 仅启用了 `cookie-parser` 作为通用基础设施准备
- 后续以 `docs/auth-baseline.md` 和真实实现为准

### 4.4 数据库连接与集合

- 当前已通过 `MongooseModule` 接入 MongoDB 连接基线
- 当前 `MONGO_URI` 用于应用运行连接，`MONGO_ADMIN_URI` 预留给未来索引同步、迁移和运维脚本
- 当前 `scripts/sync-indexes.ts` 使用 `MONGO_ADMIN_URI` 运维账号连接，不启动 Nest 应用，不使用 `MONGO_URI`
- 当前 `scripts/sync-indexes.ts` 显式注册 `User`、`Session`、`Batch`、`Dictionary`、`TreeDictionary`、`Organization`、`ReviewScheme`、`Project`、`ProjectImportJob`、`ProjectImportRow` schema，并同步对应集合索引
- 当前 `scripts/sync-indexes.ts` 也显式注册 `ProjectExpertAssignment` schema；production 或目标库为 `reviewx` 时仍要求 `--confirm-production`
- 当前 `scripts/sync-indexes.ts` 在 production 或目标库为 `reviewx` 时要求 `--confirm-production`
- 当前配置项包括 `MONGO_URI`、`MONGO_AUTO_INDEX` 和 `MONGO_SERVER_SELECTION_TIMEOUT_MS`
- 当前新增 session Cookie 配置项：`SESSION_COOKIE_NAME`、`SESSION_TTL_MS`、`MAX_ACTIVE_SESSIONS_PER_USER`、`SESSION_COOKIE_SECURE`、`SESSION_COOKIE_SAME_SITE`
- development 默认数据库名为 `reviewx_dev`
- test 默认数据库名为 `reviewx_test`
- production 数据库名口径为 `reviewx`
- development/test env example 当前使用本地独立应用账号和运维账号连接串
- `MONGO_ADMIN_URI` 当前不参与应用运行连接
- 当前已创建 `users` 集合对应 schema
- 当前 `users.phone` 具备唯一约束
- 当前已创建 `sessions` 集合对应 schema
- 当前 `sessions.token` 具备唯一约束
- 当前 `sessions.expiresAt` 定义 TTL index，TTL 删除不保证精确到秒
- 当前已创建 `batches` 集合，`name` 唯一
- 当前已创建 `dictionaries` 集合，`dictType + code` 唯一，`dictType + name` 唯一
- 当前已创建 `tree_dictionaries` 集合，支持 `treeType` 多树、多根、`parentId`、`pathIds`、`level`，`treeType + parentId + name` 唯一
- 当前已创建 `organizations` 集合，`name` 唯一
- 当前已创建 `review_schemes` 集合，`name` 唯一，`totalScore` 由后端按 items 计算
- 当前已创建 `projects` 集合，`batchId + projectNo` 唯一，并关联批次、类型、状态、负责人、单位、学科、处室、评审负责人和评审方案
- 当前项目设置 `reviewSchemeId` 的第三阶段专用接口会同步写入 `reviewSchemeSnapshot`，快照包含方案 ID、名称、总分和评分项数组；仅设置 `reviewManagerId` 不更新快照；本阶段不实现清空 `reviewSchemeId`
- 当前已创建 `project_expert_assignments` 集合，用于保存项目与专家分配关系，字段包括 `projectId`、`expertUserId`、`assignedByUserId`、`source`、`status`、`removedAt`、`removedByUserId` 和 timestamps
- 当前 `project_expert_assignments` 索引：`projectId + expertUserId` unique、`projectId + status`、`expertUserId + status`、`assignedByUserId + createdAt`
- 当前已创建 `project_import_jobs` 集合，用于记录 Excel 导入任务、字段映射快照、统计计数和任务状态
- 当前已创建 `project_import_rows` 集合，用于记录每一行原始值、标准化值、自动/人工 resolved ID、issues、行状态和确认留痕
- 后续集合以真实模块实现为准

### 4.5 文件上传 / 对象存储

- 当前已实现管理员 Excel 项目导入上传接口，使用已安装的 `xlsx` 解析第一个工作表；字段映射表是后端常量，不是数据库配置
- 当前不长期保存原 Excel 文件，不接入 OSS；只保存导入任务与导入行解析结果
- 当前未实现 frontend 页面、OSS、项目负责人材料上传/填报、专家评分、AI 合议、申诉、甲方看板或腾讯会议 API 集成；评审安排仅保存 `reviewTime/reviewLocation/meetingUrl`

### 4.6 外部服务集成

- 当前已预留通用 `LLM_PROVIDER` 与 `BAILIAN_*` 配置
- 当前 `BAILIAN_MODEL` 由 env 提供，代码中不固化默认模型
- 当前尚未实现任何 LLM 调用服务
- 当前未实现其他外部服务集成

### 4.7 后台任务 / 定时任务

- 当前未实现

### 4.8 测试与验证

- 已包含 `src/app.controller.spec.ts` 单元测试
- 已包含 `src/modules/auth/auth.service.spec.ts` 单元测试
- 已包含 `test/app.e2e-spec.ts` 最小 E2E，用于验证 `GET /health`
- 已包含 `test/auth.e2e-spec.ts`，用于验证 login / me / logout Cookie 闭环
- 已包含 `test/admin-foundation.e2e-spec.ts`，用于验证 `/admin/*` 401/403、主数据 CRUD、唯一约束、树子节点约束和项目关联校验
- `test/admin-foundation.e2e-spec.ts` 当前也覆盖普通字典、树形字典、评审方案列表返回数组，以及项目/单位 `pageSize=1000` 和超过上限返回 `400`
- 已包含 `test/project-imports.e2e-spec.ts`，用于验证导入权限、上传校验、字段别名、自动匹配、待确认、人工修正、确认入库、批量确认、跳过和既有列表口径不回退
- 已包含 `test/project-review-assignments.e2e-spec.ts`，用于验证评审分配权限、评审负责人/方案设置、方案快照、批量设置、评审安排、专家候选、学科匹配、承担单位/合作单位回避、专家追加/替换/移除、removed 后恢复和批量专家分配
- 当前 E2E 启动会装配数据库连接，测试环境应使用 `reviewx_test`
- 当前 `test:e2e` 脚本使用 `--runInBand`，避免多个 Nest/Mongoose E2E worker 并发耗尽本地内存
- 当前本地可执行构建、lint、单元测试和最小 E2E；如本地未启动 MongoDB，E2E 可能因无法连接 `reviewx_test` 而失败
- 当前 `npm run create-local-user` 仅作为本地 development/test 辅助脚本，不属于自动测试前置条件
- 当前 `npm run sync-indexes` 是手动受控索引同步入口，不属于应用启动流程

### 4.9 已知问题

- 当前 auth 第一阶段已实现，但仍无注册、找回密码、修改密码、phone one-time code、复杂业务权限矩阵、菜单权限或数据范围权限
- 当前已实现 Excel 项目导入与待确认机制，以及评审分配/安排/专家分配后端能力；仍不包含 frontend 页面、OSS 上传、项目负责人材料填报、专家评分、AI 合议、申诉、甲方看板或腾讯会议 API/直播/推流/回看集成
- 当前未实现 `/admin/tree-dictionaries/tree` 树形 children 接口，树形字典列表只提供平铺数组，由调用方自行组树
- 当前虽已预留 LLM / Bailian 配置，但尚未实现模型调用服务
- 当前仅有最小健康检查接口，后续业务模块需按架构文档逐步扩展

## 5. 维护规则

- 后端初始化后必须更新本文档
- 新增核心模块后应更新本文档
- 新增关键外部集成后应更新本文档
- 普通接口小改不要求机械更新本文档，除非影响系统事实判断
