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

### 决策 013

- 编号：BD-013
- 日期：2026-06-08
- 状态：accepted
- 背景：ReviewX 已具备 users 与 sessions 数据底座，需要建立第一阶段可用的登录态闭环，但暂不实现业务权限矩阵和前端页面。
- 决策：ReviewX 第一阶段认证采用手机号 + 密码登录，主登录态为服务端 session + HttpOnly Cookie；Cookie 名称默认 `reviewx_session`；session token 只进入 HttpOnly Cookie，不进入响应 body；Email 登录不采用；phone one-time code、角色权限矩阵、注册、找回密码和修改密码后续另行设计。
- 理由：该方案与身份与会话基线一致，可支持服务端可控失效、登出、会话上限和认证探针，同时避免提前固化业务权限模型。
- 影响范围：`AuthModule`、`AuthController`、`AuthService`、`SessionAuthGuard`、session 配置、认证 API 和 E2E 测试。
- 后续动作：后续 auth 阶段再补充注册或账号初始化策略、密码修改、phone one-time code、RolesGuard、业务权限矩阵和前端登录页。
- 相关文档：`docs/auth-baseline.md`、`docs/handoff/handoff-backend-api-map.md`、`docs/handoff/handoff-backend-config-matrix.md`

### 决策 014

- 编号：BD-014
- 日期：2026-06-09
- 状态：accepted
- 背景：ReviewX 已实现 auth 第一阶段登录闭环，但当前不提供注册接口，也不应为了本地手动验证而引入正式用户管理能力。
- 决策：本地调试通过 `backend/scripts/create-local-user.ts` 创建或重置手机号用户；该脚本仅允许连接 `reviewx_dev` 或 `reviewx_test`，只使用 `MONGO_URI` 应用账号，不使用运维连接；生产用户初始化、正式用户管理和批量导入后续另行设计；不复用 EduForge `import-users` 脚本语义。
- 理由：保持认证基线和正式用户管理边界清晰，同时为手动验证 `/auth/login`、`/auth/me`、`/auth/logout` 提供可控入口。
- 影响范围：本地开发脚本、`backend/package.json` scripts、lint 覆盖范围和后续手动验证流程。
- 后续动作：后续如需要正式用户初始化、管理后台或批量导入，应单独设计权限、审计、幂等和 production 运维流程。
- 相关文档：`docs/handoff/handoff-backend-snapshot.md`

### 决策 015

- 编号：BD-015
- 日期：2026-06-09
- 状态：accepted
- 背景：ReviewX auth 第一阶段登录闭环已实现，需要收口认证 API 成功语义并减少基础框架信息暴露。
- 决策：`POST /auth/login` 和 `POST /auth/logout` 成功统一返回 `200 OK`；应用初始化时关闭 Express 默认 `X-Powered-By` 响应头。
- 理由：登录和登出是动作型认证接口，不需要使用 `201 Created`；关闭 `X-Powered-By` 可避免暴露底层框架信息。
- 影响范围：`AuthController`、应用初始化、auth E2E 和 API map。
- 后续动作：更完整的安全响应头、CSRF、rate limit 和审计策略后续另行设计。
- 相关文档：`docs/handoff/handoff-backend-api-map.md`

### 决策 016

- 编号：BD-016
- 日期：2026-06-09
- 状态：accepted
- 背景：ReviewX production 环境关闭 `autoIndex`，应用启动不应隐式创建或变更生产索引。
- 决策：索引同步通过 `backend/scripts/sync-indexes.ts` 手动受控执行；脚本只使用 `MONGO_ADMIN_URI`，当前同步 `User` / `Session` 模型索引；production 或目标库为 `reviewx` 时必须传入 `--confirm-production`。
- 理由：索引变更属于运维动作，需要与应用运行连接和启动流程隔离，避免 production 启动时不可控地创建或删除索引。
- 影响范围：`backend/scripts/sync-indexes.ts`、`backend/package.json`、MongoDB 运维流程和后续 Schema 索引变更流程。
- 后续动作：后续新增 Schema 或索引时，必须同步更新 `scripts/sync-indexes.ts` 的模型注册清单；生产执行前确认 Schema 索引定义、备份或维护窗口安排。
- 相关文档：`docs/handoff/handoff-backend-config-matrix.md`、`docs/handoff/handoff-backend-snapshot.md`

### 决策 017

- 编号：BD-017
- 日期：2026-06-10
- 状态：accepted
- 背景：ReviewX 需要为科评星第一阶段建立后续导入、评审、材料、AI、申诉和看板可依赖的后端业务底座，但本阶段不能提前实现完整流程。
- 决策：第一阶段只实现用户多角色、`/admin/*` 登录 + admin 角色权限、批次、普通字典、树形字典、单位、评审方案和项目基础 CRUD；删除接口采用停用语义；项目关联采用硬校验，项目负责人必须具备 `project_owner`，评审负责人必须具备 `review_manager`，不自动补用户角色；评审方案 `totalScore` 由后端计算；项目预留 `reviewSchemeSnapshot` 字段但不实现快照生成。
- 理由：先稳定数据契约和关联约束，避免后续 Excel 导入、专家评分、AI 合议、申诉和看板在不稳定模型上继续叠加。
- 影响范围：`backend/src/common`、`backend/src/modules/*`、`backend/scripts/sync-indexes.ts`、`test/admin-foundation.e2e-spec.ts`。
- 后续动作：后续业务阶段如启用项目方案快照、导入、材料、专家分配或评分，应基于当前模型显式扩展，不得把未实现流程写成已实现。
- 相关文档：`docs/handoff/handoff-backend-snapshot.md`、`docs/handoff/handoff-backend-api-map.md`、`docs/handoff/handoff-backend-dto-cheatsheet.md`

### 决策 018

- 编号：BD-018
- 日期：2026-06-11
- 状态：accepted
- 背景：ReviewX 第一阶段管理端数据量较小，普通字典、树形字典和评审方案分页会增加前后端契约复杂度；项目和单位仍可能需要批次级或区域级分页查询。
- 决策：`GET /admin/dictionaries`、`GET /admin/tree-dictionaries`、`GET /admin/review-schemes` 列表不分页，直接返回数组；`GET /admin/projects`、`GET /admin/organizations` 保留分页；通用分页默认 `page=1`、`pageSize=100`、最大 `1000`，超过最大值按 DTO 校验返回 `400`；当前不新增 `/admin/tree-dictionaries/tree` 接口，不新增用户管理列表。
- 理由：小型主数据直接全量返回更适合当前业务规模；项目、单位和用户列表仍保留分页以承载批次级数据和后续扩展。
- 影响范围：`PaginationQueryDto`、dictionaries/tree-dictionaries/review-schemes 查询 DTO 与列表 Service、`test/admin-foundation.e2e-spec.ts`、backend handoff。
- 后续动作：如后续新增用户列表，应使用分页对象并沿用 `pageSize <= 1000`；如新增树形 children 接口，必须单独补 API、测试和 handoff。
- 相关文档：`docs/handoff/handoff-backend-api-map.md`、`docs/handoff/handoff-backend-dto-cheatsheet.md`

### 决策 019

- 编号：BD-019
- 日期：2026-06-11
- 状态：accepted
- 背景：ReviewX 每年项目约 400 项，管理员提供 Excel 作为项目基础数据来源；导入过程中会出现负责人、单位、学科、处室等主数据无法匹配或多匹配的情况，不能只做一次性脚本。
- 决策：新增 `project-imports` 后端模块，使用已安装的 `xlsx` 同步解析第一个工作表；字段映射表作为后端常量维护；上传后持久化 `ProjectImportJob` 与 `ProjectImportRow`，自动精确匹配可确认行，无法确定的数据进入 `pending_confirmation`；管理员可人工修正行、创建缺失单位和项目负责人用户，然后单行或批量确认入库。
- 理由：导入需要留痕、可追溯、可人工校正，同时匹配规则必须保守，避免把 Excel 脏数据自动写入项目和主数据。
- 影响范围：`ProjectImportsModule`、`project_import_jobs`、`project_import_rows`、`ProjectsService.upsertImportedProject()`、`UsersService.createWithPlainPassword()`、`scripts/sync-indexes.ts`、`test/project-imports.e2e-spec.ts`。
- 后续动作：如后续需要导入模板下载、字段映射后台配置、导入结果导出、异步队列或事务增强，应单独设计；当前不保存原 Excel 文件，不接 OSS。
- 相关文档：`docs/handoff/handoff-backend-api-map.md`、`docs/handoff/handoff-backend-dto-cheatsheet.md`、`docs/handoff/handoff-backend-service-map.md`

### 决策 020

- 编号：BD-020
- 日期：2026-06-11
- 状态：accepted
- 背景：ReviewX 项目已可导入并确认入库，需要进入可组织评审状态，但不能提前实现专家评分、材料填报、AI 合议、申诉、看板或腾讯会议集成。
- 决策：第三阶段新增项目评审负责人/评审方案设置、评审安排和专家分配后端能力；项目与专家关系使用独立 `project_expert_assignments` 集合，不把巨大专家数组作为 Project 唯一来源；设置 `reviewSchemeId` 时写入 `reviewSchemeSnapshot`；专家候选和分配统一由后端强校验 `expert` 角色、启用状态、学科匹配、承担单位回避和合作单位回避。
- 理由：独立关系集合便于后续专家评分、权限校验和移除留痕；评审方案快照避免方案后续修改影响已分配项目；后端硬校验避免前端筛选绕过业务规则。
- 影响范围：`ProjectsService`、`ProjectExpertAssignmentsModule`、`project_expert_assignments` 集合、`scripts/sync-indexes.ts`、评审负责人和管理员 API、后续专家评分权限基础。
- 后续动作：后续如实现专家评分、项目负责人材料填报、会议集成、通知、监管看板或审计总线，应基于当前分配关系和方案快照继续扩展，不得把本阶段未实现能力写成已完成。
- 相关文档：`docs/handoff/handoff-backend-snapshot.md`、`docs/handoff/handoff-backend-api-map.md`、`docs/handoff/handoff-backend-service-map.md`

### 决策 021

- 编号：BD-021
- 日期：2026-06-12
- 状态：accepted
- 背景：ReviewX 在正式实现“项目负责人填报与 OSS 材料管理机制”前，需要先统一对象存储配置命名和测试隔离口径，避免第四阶段实现时临时发明配置项。
- 决策：后端 Storage / OSS 配置统一使用 `STORAGE_DRIVER` 和 `OSS_*` 环境变量；`STORAGE_DRIVER` 支持 `fake / oss`，development/test example 默认 `fake`，production example 默认 `oss`；`OSS_INTERNAL_ENDPOINT` 用于同地域 ECS 后端访问 OSS 内网 endpoint，`OSS_PUBLIC_ENDPOINT` 用于生成浏览器可访问的签名下载/预览 URL；E2E 与自动化测试不得依赖真实阿里云 OSS。
- 理由：fake/oss 驱动口径可让自动化测试稳定隔离外部服务；internal/public endpoint 分工可同时满足 ECS 内网访问与浏览器下载/预览访问；先固化变量名能降低第四阶段 StorageService、材料模型和接口实现的配置漂移风险。
- 影响范围：`backend/.env.development.example`、`backend/.env.test.example`、`backend/.env.production.example`、后端配置矩阵、后续第四阶段 StorageService 和材料管理实现。
- 后续动作：第四阶段实现 StorageService 或材料管理时，应基于当前变量名接入配置校验和实际读取；测试环境使用 FakeStorageService 或 mock storage；Bucket 建议私有读写，后端生成短期签名 URL；不得提交真实 `OSS_ACCESS_KEY_ID` / `OSS_ACCESS_KEY_SECRET`，不得使用阿里云主账号 AccessKey，应使用最小权限 RAM 用户或后续 RAM Role。
- 相关文档：`docs/handoff/handoff-backend-config-matrix.md`、`docs/handoff/handoff-backend-snapshot.md`、`docs/e2e-testing.md`

### 决策 022

- 编号：BD-022
- 日期：2026-06-12
- 状态：accepted
- 背景：ReviewX 已完成项目导入、评审安排和专家分配，需要在不实现前端、评分、AI 或会议能力的前提下，打通评审前项目负责人填报与材料可见性后端链路。
- 决策：新增 Storage 抽象层和 `ProjectMaterial` 集合；项目材料文件本体只存储到 fake storage 或阿里云 OSS，MongoDB 只保存 objectKey、bucket、驱动、文件名、MIME、扩展名、大小、sha256、状态和关联元数据；项目负责人可以查看自己的项目、更新 `Project.followUpNeeds`、上传/查看/下载 URL/软删除材料；评审负责人、已分配专家和管理员只能按权限查看 active 材料并获取短期下载 URL。
- 理由：Storage 抽象让自动化测试不依赖真实 OSS，同时为 production 使用私有 OSS Bucket 和短期签名 URL 留出稳定边界；独立材料集合便于审计、软删除、后续生命周期清理和跨角色只读可见性；`ProjectExpertAssignment.status=assigned` 继续作为专家可见性的唯一后端依据。
- 影响范围：`StorageModule`、`ProjectMaterialsModule`、`project_materials` 集合、`scripts/sync-indexes.ts`、`/project-owner/*`、`/expert/*`、`/review-manager/projects/:id/materials*`、`/admin/projects/:id/materials*`、项目负责人 `followUpNeeds` 字段。
- 后续动作：后续如实现专家评分、AI 合议、申诉、甲方看板、腾讯会议集成、病毒扫描、在线预览转码、前端直传、分片上传或断点续传，必须在当前材料权限、短期 URL 和软删除口径上显式扩展；不得把 OSS object 物理删除作为本阶段默认业务删除行为。
- 相关文档：`docs/handoff/handoff-backend-snapshot.md`、`docs/handoff/handoff-backend-api-map.md`、`docs/handoff/handoff-backend-service-map.md`、`docs/handoff/handoff-backend-config-matrix.md`

### 决策 023

- 编号：BD-023
- 日期：2026-06-12
- 状态：accepted
- 背景：ReviewX 已具备评审方案快照、专家分配和材料可见性，需要实现专家评分与合议评审后端闭环，但当前阶段明确不接真实 AI、不做申诉和前端页面。
- 决策：新增 `ExpertReview` 和 `ConsensusReview` 两个独立集合；专家评分必须基于 `Project.reviewSchemeSnapshot`，保存时复制快照，不直接读取当前 `ReviewScheme.items`；专家提交后不可修改，评审负责人可退回为 `returned` 后专家重新提交；合议草稿使用 `draftSource=rule_based` 的规则化平均分与文本拼接，人工确认才写正式合议结果和 `Project.finalLevel/originalLevel`。
- 理由：独立集合可以保留专家评分、合议草稿和人工确认结果留痕；使用项目方案快照避免后续方案改动影响已评分项目；rule_based 草稿满足当前不接真实 AI 的约束，同时为后续 AI 合议预留来源枚举。
- 影响范围：`ExpertReviewsModule`、`ConsensusReviewsModule`、`expert_reviews`、`consensus_reviews`、`scripts/sync-indexes.ts`、专家/评审负责人/管理员新增 API、handoff 文档和 E2E。
- 后续动作：如后续实现真实 AI、申诉、完整等级变更历史、报告导出或前端页面，应在当前评分/合议留痕口径上显式扩展，不得覆写现有快照和评分记录。
- 相关文档：`docs/handoff/handoff-backend-snapshot.md`、`docs/handoff/handoff-backend-api-map.md`、`docs/handoff/handoff-backend-service-map.md`、`docs/handoff/handoff-backend-dto-cheatsheet.md`

### 决策 024

- 编号：BD-024
- 日期：2026-06-12
- 状态：accepted
- 背景：ReviewX 已能人工确认合议并写入 `Project.finalLevel/originalLevel`，需要补齐评审后异议处理闭环，同时保留原始合议结果和等级调整留痕。
- 决策：新增 `ProjectAppeal`、`ProjectAppealAttachment` 和 `ProjectLevelChangeLog` 三个集合；项目负责人只能对本人项目已 confirmed 合议结果提交申诉，单项目最多 3 次，且 `submitted/processing` 未处理申诉互斥；申诉附件继续使用 fake/oss Storage，只保存文件引用；评审负责人或 admin 可处理申诉，申诉有效且等级变化时只更新 `Project.finalLevel` 并写 `ProjectLevelChangeLog(source=appeal_handling)`。
- 理由：申诉需要独立留痕和附件审计，不能覆盖第五阶段人工确认的合议记录；`Project.finalLevel` 表达当前最终等级，`ConsensusReview.finalLevel` 和 `Project.originalLevel` 保留原始合议等级，便于后续监管看板同时展示当前等级和原始合议结果。
- 影响范围：`ProjectAppealsModule`、`project_appeals`、`project_appeal_attachments`、`project_level_change_logs`、项目负责人/评审负责人/admin 新增 API、`scripts/sync-indexes.ts`、`test/project-appeals.e2e-spec.ts`。
- 后续动作：后续如实现前端页面、甲方看板、申诉撤回、多级复议、复杂等级变更审批、通知或报告导出，应在当前申诉状态机和等级留痕口径上显式扩展；不得把申诉等级调整写回 `ConsensusReview.finalLevel`。
- 相关文档：`docs/handoff/handoff-backend-snapshot.md`、`docs/handoff/handoff-backend-api-map.md`、`docs/handoff/handoff-backend-service-map.md`、`docs/handoff/handoff-backend-dto-cheatsheet.md`

### 决策 025

- 编号：BD-025
- 日期：2026-06-12
- 状态：accepted
- 背景：行政区划主数据曾在前后端存在 `region` 与 `administrative_division` 两套 treeType 口径，容易导致单位 `regionId` 引用的树节点来源漂移。
- 决策：行政区划树形字典统一使用 `treeType=administrative_division`；`Organization.regionId` 字段名保持不变，但必须引用 `treeType=administrative_division` 的 `TreeDictionary` 节点；历史 `treeType=region` 不再作为后端合法行政区划口径，前端也不再兼容读取。
- 理由：本次真正需要统一的是树形字典类型，不是 Organization API/Schema 字段名；保留 `regionId` 可避免 DTO、接口和既有引用的大范围破坏，同时消除两套行政区划数据并存风险。
- 影响范围：`OrganizationsService` 行政区划校验、`test/admin-foundation.e2e-spec.ts`、前端单位行政区划选择和树类型显示映射、handoff 文档。
- 本次验证：`backend` 下 `npm run lint`、`npm run test`、`npm run test:e2e`、`npm run build`、`npm run sync-indexes -- --env-file .env.test` 均通过。
- 后续动作：当前不做历史 `region` 数据迁移；如本地测试库已存在 `treeType=region` 行政区划数据，可人工删除或按 `treeType=administrative_division` 重新维护。
- 相关文档：`docs/handoff/handoff-backend-snapshot.md`、`docs/handoff/handoff-backend-api-map.md`、`docs/handoff/handoff-backend-service-map.md`、`docs/handoff/handoff-backend-dto-cheatsheet.md`、`docs/handoff/handoff-frontend-snapshot.md`

### 决策 026

- 编号：BD-026
- 日期：2026-06-13
- 状态：accepted
- 背景：ReviewX 已具备 Session + HttpOnly Cookie 登录、admin 角色守卫和本地 `create-local-user` 脚本，但正式业务不能依赖脚本维护用户，且下一阶段前端 `/admin/users` 需要稳定后端契约。
- 决策：新增管理员用户维护后端 API：`GET/POST /admin/users`、`GET/PATCH /admin/users/:id`、`PATCH /admin/users/:id/status`、`POST /admin/users/:id/reset-password`；全部要求登录且具备 `admin` 角色。用户返回结构使用 `AdminUserResponse` 安全字段，只返回 ID 数组，不 populate 单位/学科名称，不返回 `passwordHash`。普通 `PATCH /admin/users/:id` 支持更新 `isActive`，同时保留单独 `PATCH /admin/users/:id/status` 作为前端明确启用/停用入口，两者共享自我保护和最后启用 admin 保护。
- 理由：正式用户维护需要后端兜底权限和安全边界；单独 status 接口让前端启用/停用操作语义清晰，而普通 PATCH 保持字段维护能力；不 populate 可复用已有主数据接口并减少本阶段实现范围。
- 影响范围：`AdminUsersModule`、`AdminUsersController`、`UsersService` 管理员方法、users DTO、`test/admin-users.e2e-spec.ts`、backend handoff。
- 安全口径：创建和重置密码均可不传 `password`，默认使用手机号并写 bcrypt hash；`mustChangePassword` 默认 `true`；`organizationIds` 必须引用启用 Organization；`disciplineIds` 必须引用启用 `treeType=discipline` 节点；当前管理员不能停用自己或移除自己的 `admin` 角色，不能让系统没有启用 admin 用户。
- 索引口径：本阶段未新增 users 查询索引，沿用既有 `users.phone` unique 索引；后续如用户规模或查询压力上升，再按受控索引流程评估 `roles/isActive/organizationIds/disciplineIds/name/phone` 查询索引。
- 非目标：本阶段不实现 frontend `/admin/users` 页面，不实现用户自助改密、忘记密码、短信验证码、用户批量导入、权限矩阵配置或前端第二阶段业务页面。
- 相关文档：`docs/handoff/handoff-backend-snapshot.md`、`docs/handoff/handoff-backend-api-map.md`、`docs/handoff/handoff-backend-service-map.md`、`docs/handoff/handoff-backend-dto-cheatsheet.md`、`docs/handoff/handoff-backend-config-matrix.md`

## 5. 明确不记录

- 不记录普通代码小改
- 不记录尚未确认的业务字段
- 不记录临时讨论但未采纳方案
- 不记录前端 UI 小调整
- 不记录最终业务流程，除非影响后端架构
