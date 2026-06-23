# ReviewX 后端当前事实快照

## 1. 用途

- 记录后端当前事实
- 让新会话快速判断 `backend` 当前是否初始化、有哪些模块、有哪些关键能力、哪些内容尚未实现

## 2. 当前状态

- `backend` 已初始化为可运行的 NestJS 公共骨架
- 当前包含 `AppModule`、`AppController`、`AppService`、配置层、通用异常过滤器、users 模块基础模型、sessions 模块基础模型和 auth 模块第一阶段登录基线
- 当前已有 users 基础模块和管理员用户维护模块；`UsersModule` 提供 Schema + Service，`AdminUsersModule` 组合 `AuthModule + UsersModule` 并暴露 `/admin/users` 管理员用户维护 API
- 当前已有 sessions 模块；该模块只有 Schema + Service，无 Controller，无 HTTP API
- 当前已有 auth 模块；该模块包含 AuthController、AuthService 和 SessionAuthGuard
- 当前已确认最小健康检查 API：`GET /health`
- 当前已确认认证 API：`POST /auth/login`、`POST /auth/logout`、`GET /auth/me`
- 当前已具备单元测试与最小 E2E 测试骨架
- 当前已接入 `MongooseModule`，建立 MongoDB 连接与环境配置基线
- 当前仅保留 `.env.development.example`、`.env.test.example`、`.env.production.example` 三类环境示例文件
- 当前已预留通用 LLM / Bailian 配置基线
- 当前 `dca16ae` 基线已安装 `ali-oss`
- 当前已准备 Storage / OSS 环境变量 example：`STORAGE_DRIVER`、`OSS_REGION`、`OSS_BUCKET`、`OSS_INTERNAL_ENDPOINT`、`OSS_PUBLIC_ENDPOINT`、`OSS_ACCESS_KEY_ID`、`OSS_ACCESS_KEY_SECRET`、`OSS_OBJECT_PREFIX`
- 当前已实现 Storage 抽象层，`STORAGE_DRIVER=fake` 使用本地 fake storage，`STORAGE_DRIVER=oss` 使用 `ali-oss`
- 当前已实现 `ProjectMaterial` 项目材料模型，数据库只保存 OSS/fake storage 引用和文件元数据，不保存文件内容
- 当前已实现项目负责人项目列表、详情、`followUpNeeds` 更新、材料上传、材料列表、短期下载 URL、材料提交、物理删除和删除审计
- 当前项目材料上传已复用通用上传文件名规范化工具，保存 `originalFilename` 和生成 `safeFilename` 前会保守修正常见 multipart 中文文件名 mojibake；该修复只影响新上传材料，历史乱码材料不自动迁移
- 当前已实现评审负责人、已分配专家和管理员查看项目材料及获取短期下载 URL 的后端接口；评审负责人/专家只可见 `submitted` 材料，项目负责人/admin 可见 `draft/submitted/legacy active`
- 当前已新增本地开发脚本 `scripts/create-local-user.ts`，用于在 development/test 数据库创建或更新手机号用户以手动验证 auth
- 当前已新增受控索引同步脚本 `scripts/sync-indexes.ts`，用于显式同步 users / sessions、第一阶段业务集合以及项目导入集合索引
- 当前已实现第一阶段管理端业务底座：batches、dictionaries、tree-dictionaries、organizations、review-schemes、projects
- 当前已实现第二阶段项目 Excel 导入与待确认机制：project-imports
- 当前项目导入上传创建任务时，会通过通用上传文件名规范化工具在入库前对 multipart 场景下 latin1 误解码的中文 Excel 文件名做保守修正；正常 UTF-8 中文、英文和常见空格/括号/短横线/下划线文件名保持原样
- 当前项目导入支持管理员删除未确认入库的导入任务；删除只清理 `ProjectImportJob` 和对应 `ProjectImportRow`，不删除正式项目；`parsing` 或已有 confirmed 行的任务禁止删除
- 当前项目导入学科字段使用专用多值拆分规则：英文逗号、中文逗号、分号和换行可分隔多个学科，学科名称内部顿号 `、` 不再被拆分；合作单位等通用多值字段仍保留顿号拆分。该修复只影响后续新上传或重新保存触发重新标准化的导入行，历史已解析 `ProjectImportRow.normalized.disciplineNames` 不自动迁移
- 当前已实现第二阶段补丁一 Excel 字段映射配置后端化：`project_import_field_mappings` 独立集合、`/admin/project-import-field-mappings*` 管理接口、固定标准字段枚举、别名配置 CRUD、启用/停用、reset-defaults、上传解析消费 effective alias map
- 当前已实现第三阶段项目评审分配与评审安排后端能力：项目评审负责人/评审方案设置、评审方案快照、评审负责人项目列表、评审时间/地点/meetingUrl 设置、专家候选列表、专家分配/替换/追加/移除、批量专家分配；专家分配移除已收紧为无 `expert_reviews` 记录时才物理删除 assignment
- 当前已实现第四阶段项目负责人填报与 OSS 材料管理后端能力
- 当前已实现第四阶段补丁一门户端只读基础数据接口：`/portal/reference-data/dictionaries`、`tree-dictionaries`、`batches`、`organizations`、`review-schemes`、`users`，供 `project_owner/expert/review_manager/client/admin` 登录后读取展示型最小摘要；不提供写接口，不替代 `/admin/*` 主数据 CRUD
- 当前已实现第五阶段专家评分与合议评审后端能力：已分配专家评分任务、草稿/提交、专家本人删除未提交 draft 草稿、提交评分评审时间窗口校验、评审负责人查看/退回、评分汇总、规则化合议草稿、人工确认合议
- 当前专家任务列表 `/expert/review-tasks` 和详情 `/expert/review-tasks/:projectId` 的 `project` 摘要会内联当前项目 `reviewManager` 最小摘要 `{ id, name, phone? }`；该摘要只按项目 `reviewManagerId` 查询对应用户，不受 portal reference-data users 排除 admin 多角色用户规则影响，且不返回 `passwordHash`、token 等敏感字段
- 当前已实现第六阶段项目申诉与等级变更留痕后端能力：项目负责人查看 confirmed 合议结果、提交申诉、申诉附件上传/列表/下载 URL/软删除、评审负责人/管理员查看和处理申诉、申诉导致等级变化时写等级变更日志
- 当前仍不包含 frontend 页面、真实 AI 接入、甲方看板或腾讯会议集成
- 当前 `/admin/*` 新增接口统一要求 Session 登录 + `admin` 角色
- 当前 `/review-manager/*` 新增接口统一要求 Session 登录 + `review_manager` 或 `admin` 角色；具体项目操作时非 admin 必须是该项目 `reviewManagerId`
- 当前主数据列表口径：普通字典、树形字典、评审方案列表不分页，直接返回数组
- 当前分页列表口径：批次、单位、项目、导入任务、导入行列表返回 `{ items, page, pageSize, total }`；分页默认 `page=1`、`pageSize=100`、最大 `1000`
- 当前已实现管理员用户列表与维护接口：`GET/POST /admin/users`、`GET/PATCH /admin/users/:id`、`PATCH /admin/users/:id/status`、`POST /admin/users/:id/reset-password`；列表分页沿用 `{ items, page, pageSize, total }`，`pageSize <= 1000`
- 当前行政区划树形字典统一使用 `treeType=administrative_division`；`Organization.regionId` 字段名保持不变，但引用节点必须属于该 treeType；历史 `treeType=region` 不再作为行政区划口径，当前不做历史数据迁移
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
│        ├─ controllers/
│        │  └─ admin-users.controller.ts
│        ├─ dto/
│        │  ├─ create-admin-user.dto.ts
│        │  ├─ create-user.input.ts
│        │  ├─ query-admin-users.dto.ts
│        │  ├─ reset-admin-user-password.dto.ts
│        │  ├─ update-admin-user.dto.ts
│        │  └─ update-admin-user-status.dto.ts
│        ├─ schemas/
│        │  └─ user.schema.ts
│        ├─ types/
│        │  ├─ public-user.type.ts
│        │  ├─ user-role.type.ts
│        │  └─ user-status.type.ts
│        ├─ admin-users.module.ts
│        ├─ users.module.ts
│        ├─ users.service.spec.ts
│        └─ users.service.ts
├─ test/
│  ├─ admin-users.e2e-spec.ts
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
- 当前已有管理员用户维护模块：
  - `AdminUsersModule`
  - `AdminUsersController`
  - `QueryAdminUsersDto`
  - `CreateAdminUserDto`
  - `UpdateAdminUserDto`
  - `ResetAdminUserPasswordDto`
  - `UpdateAdminUserStatusDto`
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
  - `ProjectImportFieldMappingsController`
  - `ProjectImportFieldMappingsService`
  - `ProjectImportFieldMapping` schema
- 当前已有第三阶段评审专家分配模块：
  - `ProjectExpertAssignmentsModule`
  - `ProjectExpertAssignmentsController`
  - `AdminProjectExpertCandidatesController`
  - `ProjectExpertAssignmentsService`
  - `ExpertEligibilityService`
- 当前已有第四阶段对象存储模块：
  - `StorageModule`
  - `StorageConfigService`
  - `FakeStorageService`
  - `OssStorageService`
- 当前已有第四阶段项目材料模块：
  - `ProjectMaterialsModule`
  - `ProjectMaterialsService`
  - `ProjectOwnerProjectsController`
  - `ProjectOwnerMaterialsController`
  - `ReviewManagerMaterialsController`
  - `ExpertMaterialsController`
  - `AdminMaterialsController`
  - `ProjectMaterialDeletionLog` schema
- 当前已有第四阶段补丁一门户参考数据模块：
  - `PortalReferenceDataModule`
  - `PortalReferenceDataController`
  - `PortalReferenceDataService`
  - `QueryPortalCommonDto`
  - `QueryPortalDictionariesDto`
  - `QueryPortalTreeDictionariesDto`
  - `QueryPortalUsersDto`
  - `Portal*Summary` 响应类型
- 当前已有第五阶段专家评分模块：
  - `ExpertReviewsModule`
  - `ExpertReviewsService`
  - `ExpertReviewTasksController`
  - `ReviewManagerExpertReviewsController`
  - `AdminExpertReviewsController`
  - `ExpertReview` schema
- 当前已有第五阶段合议评审模块：
  - `ConsensusReviewsModule`
  - `ConsensusReviewsService`
  - `ReviewManagerConsensusController`
  - `AdminConsensusController`
  - `ConsensusReview` schema
- 当前已有第六阶段项目申诉模块：
  - `ProjectAppealsModule`
  - `ProjectAppealsService`
  - `ProjectOwnerAppealsController`
  - `ReviewManagerAppealsController`
  - `AdminAppealsController`
  - `ProjectAppeal` schema
  - `ProjectAppealAttachment` schema
  - `ProjectLevelChangeLog` schema
- 当前 users 基础模块本身不包含普通用户 Controller；管理员用户维护 HTTP API 由 `AdminUsersModule` 下的 `AdminUsersController` 暴露
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
- 当前 `/portal/reference-data/*` 统一要求 Session 登录和业务门户角色 `project_owner/expert/review_manager/client/admin`；其中 `/portal/reference-data/users` 只允许查询 `review_manager/expert/project_owner` 摘要，禁止 `admin` 角色查询且结果排除含 `admin` 角色用户
- 当前用户模型新增 `organizationIds`、`disciplineIds`、`mustChangePassword`、`isActive`
- 当前 `/admin/users` 可由 admin 分页查看、搜索、创建、编辑、启用/停用用户，维护多角色、关联单位和学科，并重置密码；创建用户未传 `password` 时默认使用手机号，重置密码未传 `password` 时默认重置为手机号，`mustChangePassword` 默认 `true`
- 当前 `/admin/users` 响应只返回安全字段：`id`、`phone`、`name`、`roles`、`organizationIds`、`disciplineIds`、`mustChangePassword`、`isActive`、`createdAt`、`updatedAt`；不 populate 单位/学科名称，不返回 `passwordHash`
- 当前管理员用户维护要求 `organizationIds` 引用启用的 `Organization`，`disciplineIds` 引用启用且 `treeType=discipline` 的 `TreeDictionary` 节点
- 当前管理员不能停用自己，不能移除自己的 `admin` 角色，且后端保护系统不能进入没有启用 admin 用户的状态
- 旧用户兼容口径：`isActive` 缺失按启用处理；新增数组缺失按空数组处理
- 当前不实现注册、找回密码、修改密码、phone one-time code、复杂角色权限矩阵、菜单权限或数据范围权限
- 仅启用了 `cookie-parser` 作为通用基础设施准备
- 后续以 `docs/auth-baseline.md` 和真实实现为准

### 4.4 数据库连接与集合

- 当前已通过 `MongooseModule` 接入 MongoDB 连接基线
- 当前 `MONGO_URI` 用于应用运行连接，`MONGO_ADMIN_URI` 预留给未来索引同步、迁移和运维脚本
- 当前 `scripts/sync-indexes.ts` 使用 `MONGO_ADMIN_URI` 运维账号连接，不启动 Nest 应用，不使用 `MONGO_URI`
- 当前 `scripts/sync-indexes.ts` 显式注册 `User`、`Session`、`Batch`、`Dictionary`、`TreeDictionary`、`Organization`、`ReviewScheme`、`Project`、`ProjectImportFieldMapping`、`ProjectImportJob`、`ProjectImportRow` schema，并同步对应集合索引
- 当前 `scripts/sync-indexes.ts` 也显式注册 `ProjectExpertAssignment` schema；production 或目标库为 `reviewx` 时仍要求 `--confirm-production`
- 当前 `scripts/sync-indexes.ts` 也显式注册 `ProjectMaterial` 和 `ProjectMaterialDeletionLog` schema；production 或目标库为 `reviewx` 时仍要求 `--confirm-production`
- 当前 `scripts/sync-indexes.ts` 也显式注册 `ExpertReview`、`ConsensusReview`、`ProjectAppeal`、`ProjectAppealAttachment` 和 `ProjectLevelChangeLog` schema；production 或目标库为 `reviewx` 时仍要求 `--confirm-production`
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
- 当前未为 `/admin/users` 新增 users 查询索引；本阶段沿用既有 `users.phone` unique 索引与当前后台数据规模下的普通筛选查询
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
- 当前专家分配移除规则：不存在 `expert_reviews(projectId, expertUserId)` 时，`DELETE /review-manager/projects/:id/experts/:expertUserId` 物理删除 `project_expert_assignments`；存在任意 `draft/submitted/returned` 评分记录时返回 `409 EXPERT_ASSIGNMENT_HAS_REVIEW_RECORD`，不删除 assignment，不删除 `expert_reviews`，不修改 assignment 状态；replace 隐含移除同样先整体检查，若任一待移除专家已有评分记录则该项目不做部分更新；历史 `status=removed` assignment 仍可兼容读取并在重新分配时恢复为 `assigned`
- 当前已创建 `project_materials` 集合，用于保存项目材料文件引用和元数据，字段包括 `projectId`、`materialTypeId`、`uploadedByUserId`、`originalFilename`、`safeFilename`、`objectKey`、`bucket`、`storageDriver`、`mimeType`、`extension`、`sizeBytes`、`sha256`、`remark`、`status`、`submittedAt`、`submittedByUserId`、legacy `deletedAt`、legacy `deletedByUserId` 和 timestamps
- 当前 `project_materials` 索引：`projectId + status`、`projectId + materialTypeId + status`、`uploadedByUserId + createdAt`、`objectKey` unique、`createdAt`
- 当前项目材料状态为 `draft/submitted/active`，其中新上传默认 `draft`，`submitted` 对评审负责人/专家可见，`active` 仅为 legacy 兼容并按草稿处理；schema 可读取旧 `deleted`，但业务不再新写 `deleted`
- 当前已创建 `project_material_deletion_logs` 集合，用于保存项目材料删除审计，字段包括项目/材料/材料类型/上传人/删除人/删除角色/删除原因、原材料文件快照、删除前状态、提交留痕快照、storage 删除结果和 `deletedAt`
- 当前 `project_material_deletion_logs` 索引：`projectId + deletedAt`、`materialId`、`deletedByUserId + deletedAt`、`deletedByRole + deletedAt`
- 当前项目材料删除为物理删除：项目负责人只能删除 `draft/legacy active`，`submitted` 返回 `409`；admin 删除必须提供 reason，可删除 `draft/submitted/legacy active`；删除时先调用 `storageService.deleteObject(objectKey)`，成功后写 deletion log 并删除 `project_materials` 主记录；storage 删除失败时不删 DB、不写成功日志
- 当前已创建 `expert_reviews` 集合，用于保存专家对项目的评分记录，字段包括 `projectId`、`expertUserId`、`assignmentId`、`reviewSchemeSnapshot`、`items.itemSnapshot`、`items.score`、`items.evaluationDescription`、`items.improvementSuggestion`、`items.hasMajorIssue`、`totalScore`、`status`、`submittedAt`、`returnedAt`、`returnedByUserId`、`returnReason` 和 timestamps
- 当前 `expert_reviews` 索引：`projectId + expertUserId` unique、`projectId + status`、`expertUserId + status`、`projectId + submittedAt`
- 当前 `ExpertReview.status` 取值：`draft/submitted/returned`；无记录时接口返回视图状态 `not_started`，不入库
- 当前专家评分必须使用 `Project.reviewSchemeSnapshot`；保存时复制项目快照到 `ExpertReview.reviewSchemeSnapshot`；不直接读取当前 `ReviewScheme.items`；项目快照缺失时专家评分接口返回 `409`
- 当前专家评分提交校验：若项目 `reviewTime` 存在且服务器当前时间早于该时间，`POST /expert/review-tasks/:projectId/submit` 返回 `409 REVIEW_NOT_STARTED`，不写 `submitted/submittedAt`；`reviewTime` 缺失时兼容允许提交；保存草稿不受 `reviewTime` 限制；评分项仍要求每项 `score` 必填且在 `0..maxScore`，`evaluationDescription` 必填；`improvementSuggestion` 在 `score < maxScore * suggestionRequiredThresholdRatio` 或 `hasMajorIssue=true` 时必填，阈值缺失默认 `0.8`；非满分但未低于阈值只建议填写，不硬阻断；`totalScore` 由后端计算
- 当前专家可调用 `DELETE /expert/review-tasks/:projectId/draft` 物理删除本人 `status=draft` 的 `expert_reviews` 记录；删除前必须仍是该项目 `status=assigned` 专家；无评分记录返回 `404` 和“未找到可删除的评分草稿。”，`submitted/returned` 返回 `409 EXPERT_REVIEW_DRAFT_NOT_DELETABLE` 和“只有未提交的评分草稿可以删除。”；删除不受 `reviewTime` 限制，不删除 `project_expert_assignments`、项目、材料或 submitted/returned 历史评分记录，不新增 `deleted` 状态
- 当前已创建 `consensus_reviews` 集合，用于保存项目合议结果，字段包括 `projectId`、`reviewSchemeSnapshot`、`draftGeneratedAt`、`draftGeneratedByUserId`、`draftSource`、`draftOpinion`、`draftScore`、`finalOpinion`、`finalScore`、`finalLevel`、`originalLevel`、`confirmedByUserId`、`confirmedAt`、`status`、`expertReviewStats` 和 timestamps
- 当前 `consensus_reviews` 索引：`projectId` unique、`status`、`confirmedAt`
- 当前 `ConsensusReview.status` 取值：`draft/confirmed/reopened`；`reopened` 仅预留，当前阶段不使用
- 当前合议草稿只实现 `draftSource=rule_based` 规则聚合：平均 submitted 专家总分作为 `draftScore`，拼接专家评价描述、改进建议和重大问题提示作为 `draftOpinion`；不调用真实 AI 或外部大模型
- 当前人工确认合议会写 `ConsensusReview.finalOpinion/finalScore/finalLevel/confirmedByUserId/confirmedAt/status=confirmed`，并写 `Project.finalLevel`；`Project.originalLevel` 为空时同步写入；不修改 `Project.reviewSchemeSnapshot`
- 当前 `finalLevel` 优先校验启用的普通字典 `dictType=review_level` 的 `code` 或 `name`；若该字典为空，允许字符串 `A/B/C/D` 兜底；本阶段不自动创建 `review_level` 字典
- 当前已创建 `project_appeals` 集合，用于记录项目负责人每一次申诉，字段包括 `projectId`、`appealNo`、`submittedByUserId`、`reason`、`status`、`relatedConsensusReviewId`、`levelBeforeAppeal`、`levelAfterHandling`、`handledByUserId`、`handlingOpinion`、`handledAt`、`causedLevelChange` 和 timestamps
- 当前 `project_appeals` 索引：`projectId + appealNo` unique、`projectId + status`、`submittedByUserId + createdAt`、`handledByUserId + handledAt`
- 当前 `ProjectAppeal.status` 取值：`submitted/processing/accepted/rejected/canceled`；本阶段实际使用 `submitted/accepted/rejected`，`processing/canceled` 仅预留；同一项目最多 3 次申诉，存在 `submitted/processing` 未处理申诉时禁止再次提交
- 当前已创建 `project_appeal_attachments` 集合，用于保存申诉补充材料文件引用和元数据，字段包括 `appealId`、`projectId`、`uploadedByUserId`、`originalFilename`、`safeFilename`、`objectKey`、`bucket`、`storageDriver`、`mimeType`、`extension`、`sizeBytes`、`sha256`、`remark`、`status`、`deletedAt`、`deletedByUserId` 和 timestamps
- 当前 `project_appeal_attachments` 索引：`appealId + status`、`projectId + status`、`uploadedByUserId + createdAt`、`objectKey` unique、`createdAt`
- 当前申诉附件删除为软删除，`status=deleted` 并记录 `deletedAt/deletedByUserId`，不物理删除 OSS object；申诉附件不使用 `material_type` 字典
- 当前已创建 `project_level_change_logs` 集合，用于记录项目最终等级变更历史，字段包括 `projectId`、`appealId`、`consensusReviewId`、`fromLevel`、`toLevel`、`reason`、`changedByUserId`、`changedAt`、`source` 和 timestamps
- 当前 `project_level_change_logs` 索引：`projectId + changedAt`、`appealId`、`changedByUserId + changedAt`、`source + changedAt`
- 当前申诉处理导致等级变更时只更新 `Project.finalLevel` 并写 `ProjectLevelChangeLog(source=appeal_handling)`；不修改 `ConsensusReview.finalLevel`；`Project.originalLevel` 保留首次合议确认等级，若历史数据为空则申诉处理时写入调整前等级
- 当前第五阶段历史合议确认不会自动回填 `ProjectLevelChangeLog`
- 当前已创建 `project_import_jobs` 集合，用于记录 Excel 导入任务、字段映射快照、统计计数和任务状态
- 当前 `project_import_jobs.originalFilename` 仅用于展示，上传新任务入库前会保守修正常见中文文件名 mojibake；历史已入库乱码数据不自动迁移
- 当前可通过 `DELETE /admin/project-imports/:id` 物理删除误上传 / 测试上传的未确认导入任务；如果 `confirmedRows > 0` 或存在 `status=confirmed` 的导入行则返回 `409`，避免破坏导入确认审计链路
- 当前已创建 `project_import_rows` 集合，用于记录每一行原始值、标准化值、自动/人工 resolved ID、issues、行状态和确认留痕
- 当前已创建 `project_import_field_mappings` 集合，用于保存 Excel 字段映射自定义配置；一条 `standardField` 一条配置，字段包括 `standardField`、`aliases`、`normalizedAliases`、`isActive`、`description`、`createdByUserId`、`updatedByUserId` 和 timestamps
- 当前 `project_import_field_mappings` 索引：`standardField` unique、`isActive`、`normalizedAliases`
- 当前 Excel 字段映射标准字段仍由 `PROJECT_IMPORT_STANDARD_FIELDS` 固定枚举控制，管理员不能通过接口新增 standardField；`PROJECT_IMPORT_FIELD_ALIASES` 仍作为内置默认 fallback
- 当前字段映射配置保存时校验空别名、同字段重复归一化别名、跨字段配置别名冲突，并拦截与其他标准字段保留默认别名冲突；`isActive=false` 或无配置时上传解析回退默认内置别名
- 后续集合以真实模块实现为准

### 4.5 文件上传 / 对象存储

- 当前已实现管理员 Excel 项目导入上传接口，使用已安装的 `xlsx` 解析第一个工作表；表头字段映射优先读取 `project_import_field_mappings` 中启用配置，未配置或停用时回退 `PROJECT_IMPORT_FIELD_ALIASES` 内置默认别名
- 当前 Excel 项目导入上传不保存原 Excel 文件；上传文件名只作为任务展示字段保存，保存前会对典型 `å¹´/ç»©/ï¼` 等 mojibake 片段做保守 latin1 到 UTF-8 修正，旧任务不自动回填
- 当前不长期保存原 Excel 文件；只保存导入任务与导入行解析结果
- 当前 `dca16ae` 基线已安装 `ali-oss`，并已在 `.env.development.example`、`.env.test.example`、`.env.production.example` 准备 Storage / OSS 配置样例
- `STORAGE_DRIVER` 支持 `fake / oss`：development/test example 默认 `fake`，production example 默认 `oss`
- `STORAGE_DRIVER=fake` 不访问真实阿里云 OSS，上传返回结构化 fake objectKey，签名 URL 形如 `https://fake-storage.local/{objectKey}?expires=...`
- `STORAGE_DRIVER=oss` 使用 `ali-oss`；上传和删除使用 `OSS_INTERNAL_ENDPOINT`，生成浏览器可访问签名 URL 使用 `OSS_PUBLIC_ENDPOINT`
- `OSS_INTERNAL_ENDPOINT` 用于后端部署在阿里云同地域 ECS 时访问 OSS，优先走内网；本地开发机器通常不能访问 internal endpoint
- `OSS_PUBLIC_ENDPOINT` 用于生成浏览器可访问的签名下载/预览 URL
- OSS Bucket 建议私有读写；后端当前通过材料下载 URL 接口生成短期签名 URL 供下载/预览
- 不得提交真实 `OSS_ACCESS_KEY_ID` / `OSS_ACCESS_KEY_SECRET`，不得使用阿里云主账号 AccessKey，应使用最小权限 RAM 用户或后续可替换为 RAM Role
- E2E 测试不得依赖真实阿里云 OSS；test 环境默认 `STORAGE_DRIVER=fake`，自动化测试使用 fake storage
- 当前已实现项目材料上传、列表、短期下载 URL、提交、物理删除和删除审计；材料类型使用普通字典 `dictType=material_type`，上传接口不自动创建材料类型字典
- 当前项目材料上传在 `ProjectMaterialsService.validateFile()` 中先规范化上传文件名，再基于规范化后的文件名生成 `safeFilename`、扩展名和 objectKey；多文件上传 failures 中的 `originalFilename` 也使用规范化后的文件名。新上传材料默认 `draft`；历史已入库乱码材料不迁移、不重命名 objectKey 或存储对象，建议删除后重新上传
- 当前文件安全限制包括禁止空文件、单次最多 20 个文件、单文件最大 500MB、仅允许常见材料扩展名并拒绝明显危险扩展名；当前不做病毒扫描、内容解析、OCR 或在线预览转码
- 当前申诉附件复用项目材料文件安全限制，单次最多 20 个文件、单文件最大 500MB、禁止空文件和危险扩展名；objectKey 形如 `{prefix}/projects/{projectId}/appeals/{appealId}/{yyyy}/{uuid}-{safeFilename}`；自动化测试使用 fake storage
- 当前仍未实现真实 AI 合议、甲方看板、腾讯会议 API 集成、直播、推流、回看、前端直传 OSS、分片上传或断点续传

### 4.6 外部服务集成

- 当前已预留通用 `LLM_PROVIDER` 与 `BAILIAN_*` 配置
- 当前 `BAILIAN_MODEL` 由 env 提供，代码中不固化默认模型
- 当前尚未实现任何 LLM 调用服务；第五阶段合议草稿为后端 `rule_based` 规则聚合，不消费 LLM 配置
- 当前已基于 `ali-oss` 实现 OSS storage adapter；fake storage 用于 development/test 和自动化测试
- 当前除 OSS storage adapter 外，未实现其他外部服务集成

### 4.7 后台任务 / 定时任务

- 当前未实现

### 4.8 测试与验证

- 已包含 `src/app.controller.spec.ts` 单元测试
- 已包含 `src/modules/auth/auth.service.spec.ts` 单元测试
- 已包含 `test/app.e2e-spec.ts` 最小 E2E，用于验证 `GET /health`
- 已包含 `test/auth.e2e-spec.ts`，用于验证 login / me / logout Cookie 闭环
- 已包含 `test/admin-foundation.e2e-spec.ts`，用于验证 `/admin/*` 401/403、主数据 CRUD、唯一约束、树子节点约束和项目关联校验
- `test/admin-foundation.e2e-spec.ts` 当前也覆盖普通字典、树形字典、评审方案列表返回数组，以及项目/单位 `pageSize=1000` 和超过上限返回 `400`
- 已包含 `test/project-imports.e2e-spec.ts`，用于验证导入权限、上传校验、字段别名、自动匹配、待确认、人工修正、确认入库、批量确认、跳过、未确认导入任务删除、已确认任务删除拦截和既有列表口径不回退
- 已包含 `src/modules/project-imports/services/project-imports.service.spec.ts`，用于验证导入任务删除规则：非法 ID、任务不存在、`parsing`、`confirmedRows`、confirmed 行兜底检查、删除成功清理 rows 且不调用项目入库能力
- 已包含 `src/modules/project-imports/services/project-import-field-mappings.service.spec.ts`，用于验证 Excel 字段映射配置标准字段清单、完整配置视图、upsert/update/delete/reset-defaults、effective alias map、非法字段、空别名、同字段重复、跨字段冲突和停用 fallback
- 已包含 `src/modules/project-imports/utils/import-normalizer.spec.ts`，用于验证项目导入标准化：通用多值字段仍按顿号拆分，学科字段不按顿号拆分但仍按逗号、分号和换行拆分，重复学科去重，空值返回空数组
- 已包含 `src/common/utils/uploaded-filename.util.spec.ts`，用于验证通用上传文件名保守修正：正常中文/英文不变、典型 latin1 mojibake 修正、空值兜底和非乱码边界不误改
- 已包含 `src/modules/project-imports/utils/project-import-filename.util.spec.ts`，用于验证项目导入上传文件名兼容转发仍可用
- 已包含 `test/project-import-field-mappings.e2e-spec.ts`，用于验证 `/admin/project-import-field-mappings*` 401/403/admin 权限、标准字段清单、PUT、GET 列表/详情、PATCH、reset-defaults、DELETE 和错误口径
- `test/project-imports.e2e-spec.ts` 当前也覆盖自定义字段映射别名参与上传解析、删除配置后默认内置别名 fallback 仍可用，以及包含顿号的完整学科名称在上传解析后按完整名称匹配 `treeType=discipline` 节点
- 已包含 `test/project-review-assignments.e2e-spec.ts`，用于验证评审分配权限、评审负责人/方案设置、方案快照、批量设置、评审安排、专家候选、学科匹配、承担单位/合作单位回避、专家追加/替换/移除、无评分记录时物理删除 assignment、有 `draft/submitted/returned` 评分记录时禁止移除、专家删除 draft 后可移除、replace 阻断部分更新、assigned 列表返回评分记录标记、历史 removed 后恢复和批量专家分配
- 已包含 `src/modules/storage/storage.service.spec.ts`，用于验证 fake storage 行为和 oss 配置缺失错误口径
- 已包含 `src/modules/project-materials/services/project-materials.service.spec.ts`，用于验证项目材料上传会规范化 mojibake 中文文件名、正常中文和英文不被破坏、`safeFilename` / objectKey 基于规范化文件名生成、多文件 failures 返回规范化后的 `originalFilename`，以及 draft/submitted 状态机、角色可见性、提交统计、物理删除、删除审计和 storage 删除失败保护
- 已包含 `test/project-materials.e2e-spec.ts`，用于验证项目负责人项目列表、`followUpNeeds` 更新、fake storage 上传、材料类型校验、非法/空文件、材料列表、下载 URL、提交、物理删除、admin 删除 reason 和 deletion log、评审负责人/专家只能查看 submitted、multipart 中文文件名 mojibake 修复和既有接口轻量回归
- 已包含 `test/expert-reviews.e2e-spec.ts`，用于验证专家评分权限、任务列表、快照缺失、草稿保存、draft 草稿删除并回到 `not_started`、submitted/returned 删除返回 `409` 且记录保留、无评分记录删除返回 `404`、未分配或 removed 专家不可删除、评审开始前可删除草稿但提交仍返回 `409 REVIEW_NOT_STARTED`、评审时间已过或缺失时允许提交、改进建议条件必填、submitted 后禁止修改、退回和重新提交、评审负责人/管理员查看、评分汇总，以及专家任务列表/详情内联 admin + review_manager 多角色评审负责人摘要和负责人用户缺失时 `reviewManager=null`
- 已包含 `test/consensus-reviews.e2e-spec.ts`，用于验证合议草稿生成、无 submitted 评分阻断、force 覆盖 draft、confirmed 后禁止覆盖草稿、人工确认、`finalLevel` 字典/兜底校验、管理员兜底查看和 Project 等级写入
- 已包含 `test/project-appeals.e2e-spec.ts`，用于验证项目负责人 confirmed 合议查看、未确认合议/缺少 finalLevel 不可申诉、最多 3 次申诉、未处理申诉互斥、申诉附件 fake storage 上传/非法文件/下载 URL/软删除、评审负责人和管理员处理申诉、等级变更留痕以及 `ConsensusReview.finalLevel` 不被覆盖
- 已包含 `test/admin-users.e2e-spec.ts`，用于验证 `/admin/users` 401/403、创建用户、默认手机号密码、多角色、单位/学科校验、分页/搜索/过滤、详情和响应不返回 `passwordHash`、更新用户、单独状态接口、禁止停用自己、禁止移除自己的 admin 角色、至少保留一个启用 admin、重置密码和重置后登录
- 已包含 `src/modules/portal-reference-data/services/portal-reference-data.service.spec.ts`，用于验证门户参考数据默认 active 过滤、字典/树形字典/批次/单位/评审方案最小摘要、用户 role 必填、禁止 admin role、排除 admin 用户和敏感字段不返回
- 已包含 `test/portal-reference-data.e2e-spec.ts`，用于验证 `/portal/reference-data/*` 401/403、project_owner 读取 `material_type/project_status/discipline/batches/organizations/review-schemes/users?role=review_manager`、`users?role=admin` 返回 `400`、`users?role=review_manager` 仍排除含 admin 角色的多角色用户、admin 复用门户接口以及 POST/PATCH/DELETE 不存在
- 当前 E2E 启动会装配数据库连接，测试环境应使用 `reviewx_test`
- 当前 `test:e2e` 脚本使用 `--runInBand`，避免多个 Nest/Mongoose E2E worker 并发耗尽本地内存
- 当前本地可执行构建、lint、单元测试和最小 E2E；如本地未启动 MongoDB，E2E 可能因无法连接 `reviewx_test` 而失败
- 当前 `npm run create-local-user` 仅作为本地 development/test 辅助脚本，不属于自动测试前置条件
- 当前 `npm run sync-indexes` 是手动受控索引同步入口，不属于应用启动流程

### 4.9 已知问题

- 当前 auth 第一阶段已实现，但仍无注册、找回密码、修改密码、phone one-time code、复杂业务权限矩阵、菜单权限或数据范围权限
- 当前已实现 Excel 项目导入与待确认机制、评审分配/安排/专家分配后端能力、Storage 抽象层、项目负责人填报、项目材料管理、门户端只读基础数据接口、专家评分、规则化合议评审、项目申诉和等级变更留痕后端能力；仍不包含 frontend 页面、真实 AI 接入、甲方看板或腾讯会议 API/直播/推流/回看集成
- 当前未实现 `/admin/tree-dictionaries/tree` 树形 children 接口，树形字典列表只提供平铺数组，由调用方自行组树
- 当前虽已预留 LLM / Bailian 配置，但尚未实现模型调用服务；合议草稿为 `rule_based`，不调用外部大模型
- 后续业务模块仍需按架构文档逐步扩展，不得绕过当前 auth、角色和数据隔离口径

## 5. 维护规则

- 后端初始化后必须更新本文档
- 新增核心模块后应更新本文档
- 新增关键外部集成后应更新本文档
- 普通接口小改不要求机械更新本文档，除非影响系统事实判断
