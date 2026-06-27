# ReviewX 后端当前事实快照

## 1. 用途

- 记录后端当前事实
- 让新会话快速判断 `backend` 当前是否初始化、有哪些模块、有哪些关键能力、哪些内容尚未实现

## 2. 当前状态

- `backend` 已初始化为可运行的 NestJS + Mongoose + MongoDB 后端，包含 `AppModule`、配置层、全局异常过滤器、ValidationPipe、健康检查、测试骨架和受控索引同步脚本。
- 当前本地默认后端端口为 `5001`，本地前端来源示例为 `http://localhost:3001`；环境示例保留 `.env.development.example`、`.env.test.example`、`.env.production.example`。
- 认证与用户：已实现手机号 + 密码登录、HttpOnly Cookie Session、`/auth/login`、`/auth/logout`、`/auth/me`、users / sessions 数据底座和 `/admin/users` 管理员用户维护。
- 主数据：已实现 batches、dictionaries、tree-dictionaries、organizations、review-schemes、projects；行政区划统一为 `treeType=administrative_division`，`Organization.regionId` 字段名保留。
- 项目导入：已实现 Excel 上传解析、字段映射配置、待确认行修正、确认入库、跳过、未确认任务删除，以及上传文件名和学科字段拆分小修。
- 评审组织：已实现项目评审负责人 / 评审方案设置、评审方案快照、评审负责人项目列表、评审安排、专家候选、单位回避、专家追加 / 替换 / 移除 / 批量分配；`/review-manager/projects` 只返回当前评审负责人负责项目，admin 全局视角保留在 `/admin`。
- 专家分配 mutation 已加入项目级锁定：`reviewTime` 已到、任一 `ExpertReview`、任一 `ConsensusReview` 或项目已有最终等级 / 最终结论时，admin 和 review_manager 的追加、替换、移除、批量设置专家均禁止继续调整并返回 `EXPERT_ASSIGNMENT_LOCKED`。
- 项目材料：已实现项目负责人项目列表、详情、`followUpNeeds` 更新、材料上传、材料列表、短期下载 URL、材料提交、物理删除和删除审计；新上传材料默认 `draft`，项目负责人提交后进入 `submitted`，legacy `active` 按草稿兼容。
- 材料可见性：项目负责人 / admin 可见 `draft/submitted/legacy active`，评审负责人 / 专家只可见 `submitted`；项目负责人只能物理删除 `draft/legacy active`，`submitted` 返回 `409`；admin 删除材料必须填写原因并保留删除审计。
- 上传文件名归一化：后端 common `normalizeUploadedFilename()` 已覆盖项目材料和申诉附件上传，保存用户可见 `originalFilename`、生成 `safeFilename/objectKey` 和多文件失败明细前会保守修复常见中文文件名 mojibake，并清理控制字符和路径字符；历史已保存乱码文件名不自动迁移。
- 门户参考数据：已实现 `/portal/reference-data/*` 只读接口，允许 `project_owner/expert/review_manager/client/admin` 登录读取展示型最小摘要；用户摘要仅允许 `review_manager/expert/project_owner`，禁止查询 admin 用户。
- 专家评分与合议：已实现已分配专家评分任务、草稿 / 提交、本人 draft 草稿删除、提交评分评审时间窗口校验、评审负责人查看 / 退回、评分汇总、`rule_based` 合议草稿和人工确认合议；首次确认会写 `ConsensusReview` 与 `Project.finalLevel/originalLevel`，已 confirmed 合议再次 confirm 返回 `409 CONSENSUS_ALREADY_CONFIRMED` 且不覆盖最终结论。
- 合议响应已补确认人摘要：`ConsensusReviewResponse`、`ProjectOwnerConsensusResponse` 和申诉详情里的关联合议摘要可返回 `confirmedByUser?: { id, name, phone? } | null`；只读查询 `users.name/phone`，不返回密码、完整角色权限、改密状态、session/token；确认人用户不可解析时为 `null` 且接口不失败。
- 项目申诉：已实现项目负责人查看 confirmed 合议结果、提交申诉、申诉附件上传 / 列表 / 下载 URL，已上传申诉附件留痕不可删除，评审负责人 / 管理员查看和处理申诉、申诉导致等级变化时写等级变更日志。
- 申诉创建前提：必须已有 confirmed 合议，必须存在有效最终等级，同一项目最多 3 次申诉，存在 `submitted/processing` 未处理申诉时禁止再次提交。
- 申诉有效最终等级后端口径为 `project.finalLevel ?? confirmedConsensus.finalLevel`；历史数据中 `Project.finalLevel` 缺失但 confirmed 合议有 `finalLevel` 时允许创建申诉并懒回填 `projects.finalLevel/originalLevel`，懒回填不写等级变更日志。
- 当前已实现 Storage 抽象层，`STORAGE_DRIVER=fake` 使用本地 fake storage，`STORAGE_DRIVER=oss` 使用 `ali-oss`；development / test 默认 fake，production 默认 oss。
- 当前已实现甲方看板后端统计 API：`GET /client/dashboard/overview` 和 `GET /client/dashboard/projects`，仅 `client` 角色可访问，按全部 `isActive=true` 项目做只读统计与钻取，不做甲方细粒度数据隔离。
- 当前仍未实现甲方看板前端、真实 AI 汇总、腾讯会议 API / 直播 / 推流 / 回看、文件预览 / 在线转换、用户自助改密、忘记密码 / 短信验证码、用户 / 专家批量导入和细粒度权限矩阵。
- 接口细节见 `handoff-backend-api-map.md`，DTO 字段和枚举见 `handoff-backend-dto-cheatsheet.md`，Service 职责边界见 `handoff-backend-service-map.md`，配置项见 `handoff-backend-config-matrix.md`。
## 3. 技术基线

- 技术方向：NestJS + Mongoose + MongoDB + TypeScript
- 具体版本以 `backend/package.json`、锁文件、部署环境和实际代码为准
- 不在本文档中写死版本

## 4. 后端事实区

### 4.1 后端目录结构

当前目录按 NestJS 模块边界组织，snapshot 只保留模块级结构；逐文件 DTO / Service / spec 不在本文档重复展开。

```text
backend/
├─ src/
│  ├─ app.*、main.ts、app.setup.ts
│  ├─ common/        # filters、guards、decorators、utils 等通用能力
│  ├─ config/        # configuration 与 env validation
│  └─ modules/       # auth、sessions、users、主数据、项目导入、评审组织、材料、评分、合议、申诉、storage、portal-reference-data、client-dashboard
├─ test/             # e2e specs
├─ scripts/          # create-local-user、sync-indexes 等受控脚本
└─ package / tsconfig / eslint / nest 配置
```

- 模块级能力摘要见 4.2。
- 接口路径与权限见 `handoff-backend-api-map.md`。
- DTO、请求体、响应结构和枚举见 `handoff-backend-dto-cheatsheet.md`。
- Service 职责、依赖和副作用见 `handoff-backend-service-map.md`。

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
  - `AdminProjectExpertAssignmentsController`
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
- 当前已有第八阶段甲方看板统计模块：
  - `ClientDashboardModule`
  - `ClientDashboardController`
  - `ClientDashboardService`
  - `QueryClientDashboardOverviewDto`
  - `QueryClientDashboardProjectsDto`
  - `ClientDashboardProgressStage`
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
- 当前专家分配锁定规则：`reviewTime` 已到、存在任一 `expert_reviews`、存在任一 `consensus_reviews` 或项目已有 `finalLevel/originalLevel` 时，`POST/PUT/DELETE /review-manager/projects/:id/experts*`、`PUT /review-manager/projects/experts/batch`、`POST/PUT/DELETE /admin/projects/:id/experts*`、`PUT /admin/projects/experts/batch` 均禁止继续调整专家名单，返回 `409 EXPERT_ASSIGNMENT_LOCKED` 和 `reasons`；GET 候选专家和已分配专家不受锁定影响；未锁定时移除会物理删除 `project_expert_assignments`，review-manager scope 只允许当前负责人项目，admin scope 允许管理员全局操作；历史 `status=removed` assignment 仍可兼容读取并在重新分配时恢复为 `assigned`
- 当前已创建 `project_materials` 集合，用于保存项目材料文件引用和元数据，字段包括 `projectId`、`materialTypeId`、`uploadedByUserId`、`originalFilename`、`safeFilename`、`objectKey`、`bucket`、`storageDriver`、`mimeType`、`extension`、`sizeBytes`、`sha256`、`remark`、`status`、`submittedAt`、`submittedByUserId`、legacy `deletedAt`、legacy `deletedByUserId` 和 timestamps
- 当前 `project_materials` 索引：`projectId + status`、`projectId + materialTypeId + status`、`uploadedByUserId + createdAt`、`objectKey` unique、`createdAt`
- 当前项目材料状态为 `draft/submitted/active`，其中新上传默认 `draft`，`submitted` 对评审负责人/专家可见，`active` 仅为 legacy 兼容并按草稿处理；schema 可读取旧 `deleted`，但业务不再新写 `deleted`
- 当前 project-owner 项目列表和详情响应由 `ProjectMaterialsService` 内联 `reviewManager?: { id, name, phone? } | null` 评审负责人摘要；只查询 `users.name/phone`，不返回 `roles/passwordHash/mustChangePassword/session/token` 等敏感字段；项目设置了 `reviewManagerId` 但用户不存在时响应 `reviewManager=null`，由前端显示“评审负责人信息暂不可用”，不得把短 ObjectId 暴露给普通项目负责人
- 当前 project-owner 项目列表和详情响应包含 `ownerContentLocked`；锁定条件为存在 `ConsensusReview.status=confirmed`、项目 `finalLevel` 有有效值或项目 `originalLevel` 有有效值
- 当前项目负责人内容锁定后，`PATCH /project-owner/projects/:id/follow-up-needs`、`POST /project-owner/projects/:id/materials`、`POST /project-owner/projects/:id/materials/submit`、`DELETE /project-owner/projects/:id/materials/:materialId` 返回 `409 PROJECT_OWNER_CONTENT_LOCKED` 和固定中文提示；项目详情、材料列表、材料下载 URL、评审结果、申诉和 submitted 申诉附件补充上传不因该锁定失败；已上传申诉附件不可删除；admin 材料治理、review-manager / expert 材料只读查看不使用该锁定
- 当前已创建 `project_material_deletion_logs` 集合，用于保存项目材料删除审计，字段包括项目/材料/材料类型/上传人/删除人/删除角色/删除原因、原材料文件快照、删除前状态、提交留痕快照、storage 删除结果和 `deletedAt`
- 当前 `project_material_deletion_logs` 索引：`projectId + deletedAt`、`materialId`、`deletedByUserId + deletedAt`、`deletedByRole + deletedAt`
- 当前项目材料删除为物理删除：项目负责人只能删除 `draft/legacy active`，`submitted` 返回 `409`，项目负责人内容锁定后返回 `409 PROJECT_OWNER_CONTENT_LOCKED`；admin 删除必须提供 reason，可删除 `draft/submitted/legacy active`，不受 project-owner 内容锁影响；删除时先调用 `storageService.deleteObject(objectKey)`，成功后写 deletion log 并删除 `project_materials` 主记录；storage 删除失败时不删 DB、不写成功日志
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
- 当前已有 `ConsensusReview.status=confirmed` 时，review-manager 和 admin 的 confirm 接口都返回 `409 CONSENSUS_ALREADY_CONFIRMED`，不更新 `ConsensusReview.finalOpinion/finalScore/finalLevel/confirmedByUserId/confirmedAt`，也不更新 `Project.finalLevel/originalLevel`；后续调整应通过申诉处理或未来专门更正流程。
- 当前合议响应 mapper 会根据 `confirmedByUserId` 只读查询确认人最小摘要 `confirmedByUser={ id, name, phone? }`；`confirmedByUserId` 为空或用户不存在 / 不可解析时返回 `confirmedByUser=null`，不影响合议详情、确认成功响应、管理员合议查看、项目负责人 confirmed 合议和申诉详情关联合议摘要。
- 当前 `finalLevel` 优先校验启用的普通字典 `dictType=review_level` 的 `code` 或 `name`；若该字典为空，允许字符串 `A/B/C/D` 兜底；本阶段不自动创建 `review_level` 字典
- 当前已创建 `project_appeals` 集合，用于记录项目负责人每一次申诉，字段包括 `projectId`、`appealNo`、`submittedByUserId`、`reason`、`status`、`relatedConsensusReviewId`、`levelBeforeAppeal`、`levelAfterHandling`、`handledByUserId`、`handlingOpinion`、`handledAt`、`causedLevelChange` 和 timestamps
- 当前 `project_appeals` 索引：`projectId + appealNo` unique、`projectId + status`、`submittedByUserId + createdAt`、`handledByUserId + handledAt`
- 当前 `ProjectAppeal.status` 取值：`submitted/processing/accepted/rejected/canceled`；本阶段实际使用 `submitted/accepted/rejected`，`processing/canceled` 仅预留；同一项目最多 3 次申诉，存在 `submitted/processing` 未处理申诉时禁止再次提交
- 当前项目负责人创建申诉的最终等级有效口径为 `effectiveFinalLevel = project.finalLevel ?? confirmedConsensus.finalLevel`，空字符串按缺失处理；`Project.finalLevel` 缺失但 confirmed 合议 `finalLevel` 存在时允许创建申诉，`levelBeforeAppeal` 使用有效最终等级，并懒回填 `projects.finalLevel` 与缺失的 `projects.originalLevel`
- 当前已创建 `project_appeal_attachments` 集合，用于保存申诉补充材料文件引用和元数据，字段包括 `appealId`、`projectId`、`uploadedByUserId`、`originalFilename`、`safeFilename`、`objectKey`、`bucket`、`storageDriver`、`mimeType`、`extension`、`sizeBytes`、`sha256`、`remark`、`status`、`deletedAt`、`deletedByUserId` 和 timestamps
- 当前 `project_appeal_attachments` 索引：`appealId + status`、`projectId + status`、`uploadedByUserId + createdAt`、`objectKey` unique、`createdAt`
- 当前申诉附件上传成功后作为申诉材料留痕，project-owner 不允许删除；`DELETE /project-owner/projects/:id/appeals/:appealId/attachments/:attachmentId` 保留路由但返回 `409 PROJECT_APPEAL_ATTACHMENT_DELETE_NOT_ALLOWED`，不再写 `status=deleted/deletedAt/deletedByUserId`，不物理删除 OSS object；申诉附件不使用 `material_type` 字典
- 当前已创建 `project_level_change_logs` 集合，用于记录项目最终等级变更历史，字段包括 `projectId`、`appealId`、`consensusReviewId`、`fromLevel`、`toLevel`、`reason`、`changedByUserId`、`changedAt`、`source` 和 timestamps
- 当前 `project_level_change_logs` 索引：`projectId + changedAt`、`appealId`、`changedByUserId + changedAt`、`source + changedAt`
- 当前申诉处理导致等级变更时只更新 `Project.finalLevel` 并写 `ProjectLevelChangeLog(source=appeal_handling)`；不修改 `ConsensusReview.finalLevel`；`Project.originalLevel` 保留首次合议确认等级，若历史数据为空则申诉处理时写入调整前等级
- 当前 project-owner / admin `level-history` 响应保留 `changedByUserId` 并补充 `changedByUser?: { id, name, phone? } | null` 操作人摘要；用户不可解析时为 `null` 且接口不失败；不修改等级变更日志生成规则或 schema
- 当前申诉处理也对历史数据做最终等级兜底：优先 `Project.finalLevel`，再读取申诉关联 confirmed 合议或当前项目 confirmed 合议的 `finalLevel`，最后兜底 `appeal.levelBeforeAppeal`；兜底成功且 `Project.finalLevel` 缺失时懒回填 `projects.finalLevel/originalLevel`，懒回填不写 `ProjectLevelChangeLog`
- 当前第五阶段历史合议确认不会自动回填 `ProjectLevelChangeLog`
- 当前甲方看板统计 API 使用只读内存归并：先查 `isActive=true` 项目，再批量读取 `project_expert_assignments`、`expert_reviews`、`consensus_reviews`、`project_materials`、`project_appeals`，按项目生成统计项和阶段，不写回任何业务集合；有效最终等级为 `trim(Project.finalLevel) || trim(confirmed ConsensusReview.finalLevel) || ''`，且不修改 `ConsensusReview.finalLevel` 或 `Project.finalLevel`
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
- 当前已安装 `ali-oss`，并已在 `.env.development.example`、`.env.test.example`、`.env.production.example` 准备 Storage / OSS 配置样例
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
- 当前申诉附件复用项目材料文件安全限制，单次最多 20 个文件、单文件最大 500MB、禁止空文件和危险扩展名；上传时先规范化文件名，保存 `originalFilename`、生成 `safeFilename/objectKey` 和多文件 failures 前均使用归一化结果；objectKey 形如 `{prefix}/projects/{projectId}/appeals/{appealId}/{yyyy}/{uuid}-{safeFilename}`；自动化测试使用 fake storage；历史已入库乱码附件不迁移、不重命名 objectKey 或存储对象
- 当前仍未实现真实 AI 合议、甲方看板前端、腾讯会议 API 集成、直播、推流、回看、前端直传 OSS、分片上传或断点续传

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
- 已包含 `src/common/utils/uploaded-filename.util.spec.ts`，用于验证通用上传文件名保守修正：正常中文/英文不变、典型 latin1 mojibake 修正、空值兜底、路径字符清理和非乱码边界不误改
- 已包含 `src/modules/project-imports/utils/project-import-filename.util.spec.ts`，用于验证项目导入上传文件名兼容转发仍可用
- 已包含 `test/project-import-field-mappings.e2e-spec.ts`，用于验证 `/admin/project-import-field-mappings*` 401/403/admin 权限、标准字段清单、PUT、GET 列表/详情、PATCH、reset-defaults、DELETE 和错误口径
- `test/project-imports.e2e-spec.ts` 当前也覆盖自定义字段映射别名参与上传解析、删除配置后默认内置别名 fallback 仍可用，以及包含顿号的完整学科名称在上传解析后按完整名称匹配 `treeType=discipline` 节点
- 已包含 `test/project-review-assignments.e2e-spec.ts`，用于验证评审分配权限、review-manager 项目列表严格负责人视角、admin + review_manager 在 review-manager 命名空间只看自己负责项目、admin 全局项目视角、评审负责人/方案设置、方案快照、批量设置、评审安排、专家候选、学科匹配、承担单位/合作单位回避、专家追加/替换/移除、admin 命名空间专家分配、无评分记录时物理删除 assignment、专家删除 draft 后可移除、assigned 列表返回评分记录标记、历史 removed 后恢复、批量专家分配，以及 `reviewTime` 已到、已有 `ExpertReview`、已有 `ConsensusReview`、已有最终等级时的 `EXPERT_ASSIGNMENT_LOCKED` 后端锁定
- 已包含 `src/modules/storage/storage.service.spec.ts`，用于验证 fake storage 行为和 oss 配置缺失错误口径
- 已包含 `src/modules/project-materials/services/project-materials.service.spec.ts`，用于验证项目材料上传会规范化 mojibake 中文文件名、正常中文和英文不被破坏、`safeFilename` / objectKey 基于规范化文件名生成、多文件 failures 返回规范化后的 `originalFilename`，以及 draft/submitted 状态机、角色可见性、提交统计、物理删除、删除审计、storage 删除失败保护、project-owner 项目响应评审负责人摘要和 `PROJECT_OWNER_CONTENT_LOCKED` 写操作拦截
- 已包含 `test/project-materials.e2e-spec.ts`，用于验证项目负责人项目列表、`followUpNeeds` 更新、fake storage 上传、材料类型校验、非法/空文件、材料列表、下载 URL、提交、物理删除、admin 删除 reason 和 deletion log、评审负责人/专家只能查看 submitted、multipart 中文文件名 mojibake 修复、project-owner 项目响应评审负责人摘要、confirmed 合议 / `finalLevel` 后 project-owner 写操作锁定且读取 / 下载仍可用，以及既有接口轻量回归
- 已包含 `test/expert-reviews.e2e-spec.ts`，用于验证专家评分权限、任务列表、快照缺失、草稿保存、draft 草稿删除并回到 `not_started`、submitted/returned 删除返回 `409` 且记录保留、无评分记录删除返回 `404`、未分配或 removed 专家不可删除、评审开始前可删除草稿但提交仍返回 `409 REVIEW_NOT_STARTED`、评审时间已过或缺失时允许提交、改进建议条件必填、submitted 后禁止修改、退回和重新提交、评审负责人/管理员查看、评分汇总，以及专家任务列表/详情内联 admin + review_manager 多角色评审负责人摘要和负责人用户缺失时 `reviewManager=null`
- 已包含 `test/consensus-reviews.e2e-spec.ts`，用于验证合议草稿生成、无 submitted 评分阻断、force 覆盖 draft、confirmed 后禁止覆盖草稿、draft 首次确认、已 confirmed 再次 confirm 返回 `409 CONSENSUS_ALREADY_CONFIRMED` 且不覆盖合议 / 项目等级 / 确认人 / 确认时间、管理员兜底查看、Project 等级写入、确认响应含 `confirmedByUser.name/phone`，以及确认人用户不可解析时 `confirmedByUser=null` 且接口不失败
- 已包含 `test/project-appeals.e2e-spec.ts`，用于验证项目负责人 confirmed 合议查看、未确认合议/有效最终等级缺失不可申诉、`Project.finalLevel` 缺失但 confirmed 合议 `finalLevel` 存在时可申诉并懒回填、最多 3 次申诉、未处理申诉互斥、申诉附件 fake storage 上传/非法文件/中文文件名归一化/下载 URL、删除接口返回 409 且附件仍 active、submitted 状态仍可补充上传、评审负责人和管理员处理申诉、处理历史申诉时最终等级兜底、等级变更留痕和 `changedByUser` 摘要，以及 `ConsensusReview.finalLevel` 不被覆盖
- 已包含 `test/client-dashboard.e2e-spec.ts`，用于验证 `/client/dashboard/overview` 和 `/client/dashboard/projects` 的 401/403/client 权限、分页结构、`isActive=false` 排除、effectiveFinalLevel 优先级、submitted 材料统计、assigned 专家与 submitted 评分完成口径、pending 申诉、meetingUrl trim、progressStage 和 keyword / 多字段过滤
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
- 当前已实现 Excel 项目导入与待确认机制、评审分配/安排/专家分配后端能力、Storage 抽象层、项目负责人填报、项目材料管理、门户端只读基础数据接口、专家评分、规则化合议评审、项目申诉和等级变更留痕、甲方看板后端统计 API；仍不包含甲方看板前端、真实 AI 接入或腾讯会议 API/直播/推流/回看集成
- 当前未实现 `/admin/tree-dictionaries/tree` 树形 children 接口，树形字典列表只提供平铺数组，由调用方自行组树
- 当前虽已预留 LLM / Bailian 配置，但尚未实现模型调用服务；合议草稿为 `rule_based`，不调用外部大模型
- 后续业务模块仍需按架构文档逐步扩展，不得绕过当前 auth、角色和数据隔离口径

## 5. 维护规则

- 后端初始化后必须更新本文档
- 新增核心模块后应更新本文档
- 新增关键外部集成后应更新本文档
- 普通接口小改不要求机械更新本文档，除非影响系统事实判断
