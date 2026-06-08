# ReviewX 后端关键决策记录

## 1. 用途

- 记录 ReviewX 后端和平台工程层面的关键决策
- 避免后续会话反复讨论已确定选择
- 用于解释为什么采用某种后端架构、部署、数据库、文件、会议、会话或集成方案

## 2. 与通用架构文档关系

- 通用规则看 `docs/backend-architecture.md`、`docs/database-conventions.md`、`docs/auth-baseline.md`、`docs/codex-rules.md`
- 本文档只记录 ReviewX 项目自己的后端关键决策
- 本文档不替代基础架构文档

## 3. 决策记录模板

- 编号：
- 日期：
- 状态：`proposed / accepted / superseded / rejected`
- 背景：
- 决策：
- 理由：
- 影响范围：
- 后续动作：
- 相关文档：

## 4. 当前可记录的初始决策

### 决策 001

- 编号：BD-001
- 日期：待补充
- 状态：accepted
- 背景：ReviewX 需要建立可持续扩展的全栈工程基线。
- 决策：ReviewX 技术栈方向采用 NestJS + Next.js + MongoDB。
- 理由：当前基础架构文档已围绕这一方向建立，便于持续迭代。
- 影响范围：后端、前端、数据库、部署协作。
- 后续动作：以后续实际初始化代码和配置为准补充版本与结构细节。
- 相关文档：`docs/backend-architecture.md`、`docs/frontend-architecture.md`

### 决策 002

- 编号：BD-002
- 日期：待补充
- 状态：accepted
- 背景：ReviewX 需要复用既有通用工程治理方式，但不能提前固化具体业务实现。
- 决策：基础 `docs` 文档保持通用化，handoff 文档允许 ReviewX 项目化。
- 理由：基础规则需要可复用，项目交接文档需要保留当前项目事实与决策。
- 影响范围：文档治理、后续 Codex 指令和人工交接流程。
- 后续动作：后续关键事实进入 handoff，不回填到通用基础文档中。
- 相关文档：`docs/codex-instruction-spec.md`、`docs/codex-rules.md`

### 决策 003

- 编号：BD-003
- 日期：待补充
- 状态：accepted
- 背景：ReviewX 可能与其他系统共享基础设施资源。
- 决策：ReviewX 可以共享同一 ECS 或数据库实例级基础设施，但必须通过服务端口、域名、数据库名、配置和部署进程隔离。
- 理由：在控制成本的同时保留独立部署和故障隔离边界。
- 影响范围：部署、配置、数据库命名、运维流程。
- 后续动作：待实际部署方案确认后补充更细分的运行策略。
- 相关文档：`docs/database-conventions.md`

### 决策 004

- 编号：BD-004
- 日期：待补充
- 状态：proposed
- 背景：ReviewX 需要处理用户上传材料与相关元数据。
- 决策：用户上传材料不直接存入 MongoDB，数据库只保存索引、元数据和关联关系；实际文件存储方案待定，当前倾向对象存储。
- 理由：降低数据库体积压力，便于后续扩展、审计和下载管理。
- 影响范围：文件存储、数据模型、下载链路、部署配置。
- 后续动作：待文件存储方案明确后同步 `handoff-backend-snapshot.md` 和配置矩阵。
- 相关文档：`docs/database-conventions.md`

### 决策 005

- 编号：BD-005
- 日期：待补充
- 状态：proposed
- 背景：ReviewX 可能需要在线会议、直播或回看能力。
- 决策：会议与直播能力倾向采用商业能力或外部平台集成，不自研完整会议系统；具体方案待定。
- 理由：降低平台复杂度与后续运维成本。
- 影响范围：外部集成、配置、安全、审计和前后端交互设计。
- 后续动作：待方案收敛后补充具体接入方式和配置项。
- 相关文档：`handoff-backend-config-matrix.md`

### 决策 006

- 编号：BD-006
- 日期：2026-06-07
- 状态：accepted
- 背景：ReviewX 后端需要先建立可运行、可构建、可测试的公共工程骨架，供后续认证、用户、会话、文件与会议等模块迭代。
- 决策：ReviewX 后端先从无业务模块的公共 NestJS 骨架起步，只迁移工程配置、公共目录和最小健康检查能力，不引入任何业务模块或业务脚本。
- 理由：先稳定工程底座，可以降低后续模块开发与测试接入成本，同时避免过早固化领域模型。
- 影响范围：`backend` 公共骨架、配置体系、最小测试能力和后续模块开发起点。
- 后续动作：后续新增业务模块时，继续按后端架构文档分层补齐模块、Schema、认证和数据库能力。
- 相关文档：`docs/backend-architecture.md`、`docs/codex-rules.md`、`docs/handoff/handoff-backend-snapshot.md`

### 决策 007

- 编号：BD-007
- 日期：2026-06-07
- 状态：accepted
- 背景：ReviewX 与其他系统可能在同一台开发机或同一台 ECS 上并行运行，需要避免本地默认端口冲突。
- 决策：ReviewX 本地默认端口与其他同机服务错开，后端默认使用 `PORT=5001`；同时保留 `CORS_ORIGIN` 作为独立配置项，未来前端本地来源示例使用 `http://localhost:3001`。
- 理由：便于同机并行开发、联调和部署排错，减少默认端口碰撞。
- 影响范围：后端配置默认值、README、本地开发说明和后续前后端联调口径。
- 后续动作：后续如初始化前端或补充环境示例文件，继续沿用该本地端口口径。
- 相关文档：`docs/handoff/handoff-backend-config-matrix.md`、`docs/handoff/handoff-backend-snapshot.md`

### 决策 008

- 编号：BD-008
- 日期：2026-06-07
- 状态：accepted
- 背景：ReviewX 后端需要先建立数据库连接与环境隔离基线，为后续 users、sessions 和 auth 开发做准备，同时避免误用其他项目命名或把测试连接到非 test 数据库。
- 决策：ReviewX MongoDB 数据库按环境物理隔离，production 使用 `reviewx`，development 使用 `reviewx_dev`，test 使用 `reviewx_test`；本地 development/test 使用独立应用账号与运维账号；后端通过 `MongooseModule` 和配置层统一接入 `MONGO_URI`、`MONGO_ADMIN_URI`、`MONGO_AUTO_INDEX`，其中 `MONGO_URI` 用于应用运行，`MONGO_ADMIN_URI` 保留给未来脚本，production 关闭 `autoIndex`。
- 理由：先明确数据库命名和连接边界，可以降低后续认证、用户与持久化模块接入时的误连风险，并与数据库治理文档保持一致。
- 影响范围：后端配置体系、E2E 环境隔离、MongoDB 运维口径和后续 Schema 接入方式。
- 后续动作：后续新增业务 Schema 时继续沿用该环境隔离口径，并通过受控流程处理 production 索引同步；应用运行继续只使用 `MONGO_URI`，运维脚本再使用 `MONGO_ADMIN_URI`。
- 相关文档：`docs/database-conventions.md`、`docs/handoff/handoff-backend-config-matrix.md`、`docs/handoff/handoff-backend-snapshot.md`

### 决策 009

- 编号：BD-009
- 日期：2026-06-07
- 状态：accepted
- 背景：ReviewX 后续会实现用户、登录和会话能力，但当前阶段仅建立数据库与配置基线。
- 决策：ReviewX 不引入 Email 功能，未来用户以手机号作为主要登录标识；当前阶段不实现 auth/users/sessions，也不引入 phone one-time code 或密码哈希相关依赖与配置。
- 理由：先稳定数据库和配置底座，避免在未完成认证方案细化前过早固化无关依赖、配置和用户模型。
- 影响范围：后续认证方案、用户模型、环境配置和依赖引入节奏。
- 后续动作：后续进入 auth/users/sessions 任务时，再按手机号登录方向补充用户 Schema、会话集合和密码或 phone code 策略。
- 相关文档：`docs/auth-baseline.md`、`docs/handoff/handoff-backend-snapshot.md`

### 决策 010

- 编号：BD-010
- 日期：2026-06-08
- 状态：accepted
- 背景：ReviewX 需要为后续模型能力预留环境配置，但当前阶段不实现具体 LLM 调用服务，也不能沿用其他项目中的专用命名。
- 决策：ReviewX 预留通用 `LLM_PROVIDER` 和 `BAILIAN_*` 配置；通过 `LLM_PROVIDER` 在 `stub` / `bailian` 间切换，不保留额外的启用开关；`BAILIAN_MODEL` 由 env 指定，代码中不固化默认模型，当前只建立配置基线，不引入百炼 SDK，不实现模型调用服务。
- 理由：先把提供方、开关和超时重试等基础配置统一到后端配置层，便于后续接入 LLM 服务时复用，同时避免把特定业务语义写死在环境变量命名中。
- 影响范围：环境示例文件、配置模块、配置校验和后续 LLM 服务接入方式。
- 后续动作：后续如正式实现模型服务，再基于当前通用命名补充 provider adapter、调用链路和运行时审计策略。
- 相关文档：`docs/handoff/handoff-backend-config-matrix.md`、`docs/handoff/handoff-backend-snapshot.md`

### 决策 011

- 编号：BD-011
- 日期：2026-06-08
- 状态：accepted
- 背景：ReviewX 后续需要 auth 与 sessions 能力，但当前阶段只建立 users 数据底座。
- 决策：users 模块以 `phone` 作为主要登录标识，不以邮箱作为登录标识；`passwordHash` 只保存哈希值，不保存明文密码，并在 schema 中默认 `select: false`；`roles` 暂不绑定最终业务角色集合，后续权限矩阵明确后再收敛。
- 理由：先稳定认证依赖的数据模型，可以降低后续 auth 和 sessions 接入成本，同时避免过早固化业务权限。
- 影响范围：`User` schema、`UsersService`、后续 auth/sessions 依赖方式。
- 后续动作：后续 auth 任务再实现密码校验、session 创建、Cookie 下发和认证探针。
- 相关文档：`docs/auth-baseline.md`、`docs/handoff/handoff-backend-snapshot.md`、`docs/handoff/handoff-backend-service-map.md`

### 决策 012

- 编号：BD-012
- 日期：2026-06-08
- 状态：accepted
- 背景：ReviewX 后续需要 login/logout/me 和 SessionAuthGuard，但当前阶段不应提前暴露认证 HTTP 契约。
- 决策：ReviewX 主登录态采用服务端 session；`sessions` 集合保存服务端随机 `token`、`userId`、`expiresAt`、`revokedAt`、`lastSeenAt` 和基础客户端元信息；`expiresAt` 使用 TTL index，TTL 删除不作为实时强一致机制；Cookie、Guard、登录接口和退出接口后续 auth 阶段实现。
- 理由：先稳定 auth 底层会话模型，可以降低后续认证模块接入成本，同时避免把 Cookie、安全策略和 HTTP API 契约提前固化。
- 影响范围：`Session` schema、`SessionsService`、后续 AuthModule、SessionAuthGuard 和 Cookie 策略。
- 后续动作：后续 auth 任务基于 `UsersService` 与 `SessionsService` 实现密码校验、session 创建、Cookie 下发、退出和认证探针。
- 相关文档：`docs/auth-baseline.md`、`docs/handoff/handoff-backend-snapshot.md`、`docs/handoff/handoff-backend-service-map.md`

## 5. 明确不记录

- 不记录普通代码小改
- 不记录尚未确认的业务字段
- 不记录临时讨论但未采纳方案
- 不记录前端 UI 小调整
- 不记录最终业务流程，除非影响后端架构
