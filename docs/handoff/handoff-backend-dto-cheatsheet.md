# ReviewX 后端 DTO 速查

## 1. 用途

- 记录后端 DTO、请求体、查询参数、响应结构和关键枚举
- 防止 Codex 修改接口时误改契约

## 2. 当前状态

- `backend` 已初始化
- 当前 users 和 sessions 模块新增内部 Input 和类型
- 当前 auth 模块新增登录 DTO 和认证返回类型
- 当前未创建 UsersController 或 SessionsController；auth DTO 是 HTTP 契约

## 3. 当前 DTO / Input

| DTO 名称          | 所属模块 | 用途                 | 字段                                               | 必填 / 可选                                         | 类型                                                                       | 校验规则                                        | 默认值                                   | 示例                            | 关联 API | 备注                                     |
| ----------------- | -------- | -------------------- | -------------------------------------------------- | --------------------------------------------------- | -------------------------------------------------------------------------- | ----------------------------------------------- | ---------------------------------------- | ------------------------------- | -------- | ---------------------------------------- |
| `CreateUserInput` | users    | Service 创建用户输入 | `phone`、`passwordHash`、`name`、`roles`、`organizationIds`、`disciplineIds`、`mustChangePassword`、`isActive`、`status` | `phone/passwordHash/name` 必填；其他可选 | `phone/passwordHash/name: string`；`roles: UserRole[]`；数组 ID 为 string[]；`status: UserStatus` | 当前为 TypeScript interface，无 HTTP validation | `roles`、`organizationIds`、`disciplineIds`、`mustChangePassword`、`isActive`、`status` 由 schema 默认值兜底 | `{ phone, passwordHash, name, roles }` | 无 | 不包含明文密码、email 或 phone code 字段 |
| `CreateSessionInput` | sessions | Service 创建 session 输入 | `userId`、`ttlMs` 或 `expiresAt`、`userAgent`、`ip` | `userId` 必填；`ttlMs/expiresAt` 二选一；`userAgent/ip` 可选 | `userId: string \| ObjectId`；`ttlMs: number`；`expiresAt: Date`；`userAgent/ip: string` | 当前为 TypeScript type，无 HTTP validation | 无全局默认 TTL，由调用方显式传入 | `{ userId, ttlMs }` | 无 | 不包含 Cookie 配置、角色权限或业务字段 |
| `LoginDto` | auth | `POST /auth/login` 请求体 | `phone`、`password` | 均必填 | `phone/password: string` | `phone` trim、非空字符串；`password` 非空字符串 | 无 | `{ phone, password }` | `POST /auth/login` | 不包含 email、rememberMe 或 phone code 字段 |
| `CreateBatchDto` / `UpdateBatchDto` / `QueryBatchesDto` | batches | 批次管理 | `name`、`year`、`description`、`isActive`；查询含 `page/pageSize/keyword/isActive` | create `name` 必填；update 全可选 | string / number / boolean | trim、分页范围校验、ObjectId 路径由 service 校验 | `page=1`、`pageSize=100`、最大 `1000` | `{ name: "2026", year: 2026 }` | `/admin/batches` | 当前仍分页；`name` 唯一 |
| `CreateDictionaryDto` / `UpdateDictionaryDto` / `QueryDictionariesDto` | dictionaries | 普通字典管理 | 写入含 `dictType`、`code`、`name`、`description`、`sortOrder`、`isActive`；查询含 `dictType`、`keyword`、`isActive` | create `dictType/code/name` 必填 | string / number / boolean | trim、`sortOrder >= 0`、查询支持 `dictType/keyword/isActive` | `sortOrder=0` | `{ dictType: "project_status", code: "in_progress", name: "实施中" }` | `/admin/dictionaries` | 列表不分页，返回数组；`dictType+code`、`dictType+name` 唯一 |
| `CreateTreeDictionaryDto` / `UpdateTreeDictionaryDto` / `QueryTreeDictionariesDto` | tree-dictionaries | 树形字典管理 | 写入含 `treeType`、`parentId`、`code`、`name`、`fullName`、`sortOrder`、`isActive`；查询含 `treeType`、`parentId`、`keyword`、`isActive` | create `treeType/name` 必填 | string / ObjectId / number / boolean | trim、`parentId` ObjectId 校验、查询支持 `treeType/parentId/keyword/isActive` | `level/pathIds` 后端计算 | `{ treeType: "region", name: "重庆市" }` | `/admin/tree-dictionaries` | 列表不分页，返回平铺数组；当前未实现 tree children 接口 |
| `CreateOrganizationDto` / `UpdateOrganizationDto` / `QueryOrganizationsDto` | organizations | 单位管理 | `name`、`contactName`、`contactPhone`、`regionId`、`isActive`；查询含 `page/pageSize/keyword/isActive/regionId` | create `name` 必填 | string / ObjectId / boolean | trim、`regionId` ObjectId 且必须为 `treeType=region`；分页最大 `1000` | `page=1`、`pageSize=100` | `{ name: "测试单位", regionId }` | `/admin/organizations` | 列表保留分页；`name` 唯一 |
| `CreateReviewSchemeDto` / `UpdateReviewSchemeDto` / `ReviewSchemeItemDto` / `QueryReviewSchemesDto` | review-schemes | 评审方案管理 | 写入含 `name`、`description`、`items[]`、`isActive`；查询含 `keyword`、`isActive`；item 含 `name/maxScore/scoringGuide/sortOrder/suggestionRequiredThresholdRatio` | create `name/items` 必填；items 至少 1 项 | string / number / boolean / array | `maxScore > 0`、阈值 `0..1`、嵌套 DTO 校验 | item 阈值默认 `0.8` | `{ name, items: [{ name, maxScore }] }` | `/admin/review-schemes` | 列表不分页，返回数组；`totalScore` 后端计算 |
| `CreateProjectDto` / `UpdateProjectDto` / `QueryProjectsDto` | projects | 项目基础管理 | 写入字段同 Project；查询含 `page/pageSize/keyword/isActive/batchId/reviewManagerId/reviewSchemeId/projectTypeId/statusId/departmentId/disciplineId/hasReviewManager/hasReviewScheme` | create `batchId/projectNo/name` 必填 | string / ObjectId / number / Date / boolean / array | ObjectId 校验、数组去重、资金 `>=0`、跨集合关联校验；分页最大 `1000` | `page=1`、`pageSize=100`；arrays 默认空数组 | `{ batchId, projectNo, name }` | `/admin/projects` | 列表保留分页；`batchId+projectNo` 唯一；负责人角色硬校验 |
| `UpdateReviewAssignmentDto` / `BatchUpdateReviewAssignmentDto` | projects | 管理员设置评审负责人/评审方案 | 单个含 `reviewManagerId`、`reviewSchemeId`；批量额外含 `projectIds` | 单个至少传 `reviewManagerId/reviewSchemeId` 之一；批量 `projectIds` 非空 | ObjectId / array | ObjectId 校验、数组去重；`reviewManagerId` 必须启用且具备 `review_manager`；`reviewSchemeId` 必须启用 | 无 | `{ reviewManagerId, reviewSchemeId }` | `PATCH /admin/projects/:id/review-assignment`、`PATCH /admin/projects/review-assignment/batch` | 设置 `reviewSchemeId` 时写入 `reviewSchemeSnapshot`；批量返回成功/失败明细 |
| `UpdateProjectScheduleDto` | projects | 设置评审安排 | `reviewTime`、`reviewLocation`、`meetingUrl` | 全可选 | Date / string | `reviewTime` 必须为合法日期；地点最长 200；meetingUrl 最长 500；字符串 trim | 无 | `{ reviewTime, reviewLocation, meetingUrl }` | `PATCH /review-manager/projects/:id/schedule`、`PATCH /admin/projects/:id/schedule` | 仅更新评审安排字段，不调用腾讯会议 API |
| `QueryReviewManagerProjectsDto` | projects | 评审负责人项目列表 | `page/pageSize/keyword/isActive/batchId/reviewSchemeId/statusId` | 全可选 | number / string / ObjectId / boolean | ObjectId 校验；分页最大 `1000` | `page=1`、`pageSize=100` | `{ batchId, keyword }` | `GET /review-manager/projects` | `review_manager` 只返回自己负责项目；admin 兜底访问不强制负责人范围 |
| `QueryExpertCandidatesDto` | project-expert-assignments | 专家候选列表 | `page/pageSize/keyword/isActive` | 全可选 | number / string / boolean | 分页最大 `1000`；keyword 按姓名/手机号匹配 | `page=1`、`pageSize=100` | `{ keyword: "138" }` | `GET /review-manager/projects/:id/expert-candidates`、`GET /admin/projects/:id/expert-candidates` | 候选强校验 expert 角色、启用、学科匹配、承担单位/合作单位回避；项目无学科返回空分页 |
| `AppendProjectExpertsDto` / `UpdateProjectExpertsDto` / `BatchProjectExpertsDto` | project-expert-assignments | 专家追加、替换和批量分配 | 追加/替换含 `expertUserIds`；批量含 `projectIds`、`expertUserIds`、`mode` | 追加 `expertUserIds` 非空；替换允许空数组；批量 `projectIds` 非空，`mode=append` 时专家非空 | ObjectId array / enum | ObjectId 校验、数组去重；`mode` 仅 `replace/append` | 无 | `{ expertUserIds: ["..."] }` | `/review-manager/projects/:id/experts`、`PUT /review-manager/projects/experts/batch` | `PUT replace` 任一专家不合规则整体 `409`；`POST append` 返回逐专家成功/失败明细 |
| `QueryProjectOwnerProjectsDto` | project-materials | 项目负责人项目列表 | `page/pageSize/keyword/batchId/statusId/projectTypeId/reviewManagerId/reviewSchemeId` | 全可选 | number / string / ObjectId | ObjectId 校验；分页最大 `1000`；keyword 按项目编号/名称匹配 | `page=1`、`pageSize=100` | `{ pageSize: 1000, keyword }` | `GET /project-owner/projects` | 只返回当前 `project_owner` 用户负责的启用项目，响应含评审安排、`followUpNeeds`、`materialCount` |
| `QueryExpertProjectsDto` | project-materials | 专家项目列表 | `page/pageSize/keyword/batchId/statusId` | 全可选 | number / string / ObjectId | ObjectId 校验；分页最大 `1000`；keyword 按项目编号/名称匹配 | `page=1`、`pageSize=100` | `{ batchId, keyword }` | `GET /expert/projects` | 只返回当前专家 `status=assigned` 的启用项目 |
| `UpdateFollowUpNeedsDto` | project-materials | 项目负责人更新后续推进需求 | `followUpNeeds` | 必填，可为空字符串 | string | trim；最长 5000 | 无 | `{ followUpNeeds: "需协调..." }` | `PATCH /project-owner/projects/:id/follow-up-needs` | 只更新 `Project.followUpNeeds`，不得更新项目其他字段 |
| `QueryProjectMaterialsDto` | project-materials | 单项目材料列表过滤 | `materialTypeId` | 可选 | ObjectId | ObjectId 校验 | 无 | `{ materialTypeId }` | `/project-owner/projects/:id/materials`、`/review-manager/projects/:id/materials`、`/expert/projects/:id/materials`、`/admin/projects/:id/materials` | 单项目材料列表不分页，只返回 `active` 材料 |
| `UploadProjectMaterialsDto` | project-materials | 项目负责人上传项目材料 | `materialTypeId`、`remark`；multipart `files` | `materialTypeId/files` 必填；`remark` 可选 | ObjectId / string / file array | `materialTypeId` ObjectId 且必须是启用 `dictType=material_type`；`remark` trim 且最长 1000；文件数量最大 20，单文件最大 500MB，禁止空文件和危险扩展名 | 无 | multipart form-data | `POST /project-owner/projects/:id/materials` | 文件字段名 `files`，支持多文件；数据库只保存文件引用和元数据，不保存文件内容 |
| `UploadProjectImportDto` | project-imports | Excel 项目导入上传 | `batchId`；multipart `file` | `batchId/file` 必填 | `batchId: ObjectId`；file buffer | `batchId` ObjectId；文件扩展名 `.xlsx/.xls`；文件大小 10MB 上限 | 无 | multipart form-data | `POST /admin/project-imports/upload` | 使用 `xlsx` 解析第一个工作表；关键表头缺失或无有效数据行返回 `400` |
| `QueryProjectImportJobsDto` | project-imports | 导入任务列表查询 | `page/pageSize/status/batchId/keyword` | 全可选 | number / string / ObjectId | status 枚举、`batchId` ObjectId、分页最大 `1000` | `page=1`、`pageSize=100` | `{ status, batchId, pageSize: 1000 }` | `GET /admin/project-imports` | 返回分页对象 |
| `QueryProjectImportRowsDto` | project-imports | 导入行列表查询 | `page/pageSize/status/keyword` | 全可选 | number / string | status 枚举、分页最大 `1000` | `page=1`、`pageSize=100` | `{ status, keyword, pageSize: 1000 }` | `GET /admin/project-imports/:id/rows` | 返回分页对象 |
| `UpdateProjectImportRowDto` | project-imports | 导入行人工修正 | `normalized`、`resolved`、`createOrganization`、`createOwnerUser` | 全可选；按修正场景传入 | nested object | ObjectId 校验、数组去重、资金 `>=0`、创建单位/用户字段 trim | 无 | `{ resolved: { leadOrganizationId }, createOwnerUser: { name, phone } }` | `PATCH /admin/project-imports/:id/rows/:rowId` | 可选择既有主数据；可创建单位和项目负责人用户；不可创建字典/树形字典 |
| `QueryExpertReviewTasksDto` | expert-reviews | 专家评分任务列表 | `page/pageSize/keyword/batchId/status/reviewManagerId/reviewSchemeId` | 全可选 | number / string / ObjectId / enum | ObjectId 校验；`status` 为 `not_started/draft/submitted/returned`；分页最大 `1000` | `page=1`、`pageSize=100` | `{ status: "submitted" }` | `GET /expert/review-tasks` | 只返回当前专家已分配项目 |
| `SaveExpertReviewDto` / `ExpertReviewItemInputDto` | expert-reviews | 保存草稿或提交评分 | `items[]`；item 含 `name/score/evaluationDescription/improvementSuggestion/hasMajorIssue` | 草稿 items 可选；提交时业务层要求每项完整 | string / number / boolean / array | DTO 校验字符串长度；业务层校验 score 范围、快照项存在、提交必填和改进建议条件必填 | 无 | `{ items: [{ name: "技术", score: 55 }] }` | `PUT /expert/review-tasks/:projectId`、`POST /expert/review-tasks/:projectId/submit` | `totalScore` 不接收前端值，由后端计算 |
| `ReturnExpertReviewDto` | expert-reviews | 退回专家评分 | `returnReason` | 必填 | string | trim，1..1000 | 无 | `{ returnReason: "请补充说明" }` | `POST /review-manager/projects/:id/expert-reviews/:expertUserId/return` | 仅 submitted 可退回 |
| `GenerateConsensusDraftDto` | consensus-reviews | 合议草稿生成查询参数 | `force` | 可选 | boolean | 支持 `true/false` 字符串转换 | `false` | `?force=true` | `POST /review-manager/projects/:id/consensus/draft` | 已有 draft 时需 `force=true` 才覆盖；confirmed 不可覆盖 |
| `ConfirmConsensusReviewDto` | consensus-reviews | 人工确认合议 | `finalOpinion/finalScore/finalLevel/useDraftAsBase` | `finalOpinion/finalScore/finalLevel` 必填；`useDraftAsBase` 预留可选 | string / number / boolean | `finalOpinion` 1..10000；`finalScore` 业务层校验 `0..reviewSchemeSnapshot.totalScore`；`finalLevel` 校验 review_level 字典或 A/B/C/D 兜底 | 无 | `{ finalOpinion, finalScore: 82, finalLevel: "A" }` | `POST /review-manager/projects/:id/consensus/confirm`、`POST /admin/projects/:id/consensus/confirm` | 当前允许再次确认覆盖最新确认结果，不做完整等级变更历史 |

## 4. 类型 / 状态

| 名称           | 可选值 / 字段                                                                     | 含义              | 是否对前端暴露        | 是否可持久化 | 备注                       |
| -------------- | --------------------------------------------------------------------------------- | ----------------- | --------------------- | ------------ | -------------------------- |
| `UserStatus`   | `active`、`disabled`                                                              | 用户基础状态      | 后续如暴露 API 再确认 | 是           | 当前不扩展复杂状态机       |
| `UserRole`     | `admin`、`client`、`review_manager`、`expert`、`project_owner` | 用户角色枚举 | 是 | 是 | `/admin/*` 当前只使用 `admin` |
| `PublicUser`   | `id`、`phone`、`name`、`roles`、`organizationIds`、`disciplineIds`、`mustChangePassword`、`isActive`、`status`、`createdAt`、`updatedAt`、`lastLoginAt` | 公开用户返回类型 | 是 | 否 | 不包含 `passwordHash` |
| `AuthIdentity` | `id`、`phone`、`passwordHash`、`roles`、`isActive`、`status` | auth 内部身份类型 | 否 | 否 | 仅供认证流程内部使用 |
| `PublicSession` | `id`、`userId`、`expiresAt`、`revokedAt`、`lastSeenAt`、`userAgent`、`ip`、`createdAt`、`updatedAt` | 公开 session 返回类型 | 后续如暴露 API 再确认 | 否 | 不包含 `token` |
| `CreatedSessionResult` | `token`、`session`、`expiresAt` | session 创建结果 | 否 | 否 | `createSession()` 专用返回，允许把 token 交给后续 auth 层 |
| `AuthSessionRecord` | 当前等同 `PublicSession` | auth 内部 session 记录类型 | 否 | 否 | 预留给后续 Guard / auth 流程使用 |
| `LoginResult` | `user`、`sessionToken`、`expiresAt` | AuthService 登录结果 | 否 | 否 | `sessionToken` 只交给 Controller 设置 HttpOnly Cookie，不进入响应 body |
| `AuthenticatedUser` | `user`、`session` | Guard 挂载到 request 的认证上下文 | 否 | 否 | `GET /auth/me` 只返回其中的 `user` |
| `ProjectImportJobStatus` | `parsing`、`pending_confirmation`、`completed`、`failed`、`canceled` | 导入任务状态 | 是 | 是 | 当前同步解析；正常上传后通常进入 `pending_confirmation`，全部处理后进入 `completed` |
| `ProjectImportRowStatus` | `importable`、`pending_confirmation`、`confirmed`、`skipped`、`failed` | 导入行状态 | 是 | 是 | 只有 `importable` 可确认入库；`confirmed` 不可重复确认或跳过 |
| `ProjectImportIssueCode` | `required_field_missing`、`invalid_number`、`funding_inconsistent`、`project_type_not_found`、`project_type_ambiguous`、`status_not_found`、`status_ambiguous`、`owner_not_found`、`owner_ambiguous`、`lead_organization_not_found`、`lead_organization_ambiguous`、`cooperation_organization_not_found`、`cooperation_organization_ambiguous`、`discipline_not_found`、`discipline_ambiguous`、`department_not_found`、`department_ambiguous`、`duplicate_project_no_in_file`、`existing_project_matched`、`lead_organization_duplicated_in_cooperation`、`unknown_error` | 导入行结构化问题编码 | 是 | 是 | `existing_project_matched` 和 `lead_organization_duplicated_in_cooperation` 当前为非阻断提示；其他 issue 阻断确认 |
| `ProjectExpertAssignmentSource` | `manual`、`batch` | 专家分配来源 | 是 | 是 | 单项目接口写 `manual`，批量接口写 `batch` |
| `ProjectExpertAssignmentStatus` | `assigned`、`removed` | 专家分配关系状态 | 是 | 是 | 移除专家只标记 `removed`，不物理删除 |
| `ExpertEligibilityReason` | `expert_not_found`、`expert_inactive`、`expert_role_missing`、`project_not_found`、`project_inactive`、`project_discipline_missing`、`expert_discipline_missing`、`discipline_mismatch`、`lead_organization_conflict`、`cooperation_organization_conflict`、`duplicate_expert`、`invalid_object_id` | 专家资格校验原因码 | 是 | 否 | 由 `ExpertEligibilityService` 输出；当前未使用 `duplicate_expert` 阻断重复添加，重复添加按幂等成功处理 |
| `ProjectMaterialStatus` | `active`、`deleted` | 项目材料状态 | 是 | 是 | 删除材料只标记 `deleted`，不物理删除 OSS object |
| `StorageDriver` | `fake`、`oss` | 项目材料存储驱动 | 是 | 是 | `ProjectMaterial.storageDriver` 保存上传时使用的驱动；接口不返回任何 AccessKey |
| `ExpertReviewStatus` | `draft`、`submitted`、`returned` | 专家评分持久化状态 | 是 | 是 | 无记录时接口返回视图状态 `not_started`，不入库 |
| `ExpertReviewViewStatus` | `not_started`、`draft`、`submitted`、`returned` | 专家评分接口视图状态 | 是 | 否 | 任务列表和负责人评分列表使用 |
| `ConsensusReviewStatus` | `draft`、`confirmed`、`reopened` | 合议评审状态 | 是 | 是 | `reopened` 当前仅预留 |
| `ConsensusDraftSource` | `rule_based`、`manual`、`ai` | 合议草稿来源 | 是 | 是 | 当前阶段只生成 `rule_based`；`ai` 仅预留，不代表已实现真实 AI |

## 5. 当前 HTTP 响应结构

| API | 成功响应 | 敏感字段规则 | 备注 |
| --- | --- | --- | --- |
| `POST /auth/login` | `PublicUser` | 不包含 `passwordHash`、session token 或 Cookie 内容 | session token 只通过 HttpOnly Cookie 下发 |
| `POST /auth/logout` | `{ success: true }` | 不泄露 session 是否存在 | 幂等清理 Cookie |
| `GET /auth/me` | `PublicUser` | 不包含 `passwordHash`、session token 或 Cookie 内容 | 未登录返回 `401` |
| `/admin/dictionaries` 列表 | `DictionaryResponse[]` | 不返回用户密码哈希或 session token | 不分页；支持 `dictType/keyword/isActive` |
| `/admin/tree-dictionaries` 列表 | `TreeDictionaryResponse[]` | 不返回用户密码哈希或 session token | 不分页；平铺数组；支持 `treeType/parentId/keyword/isActive` |
| `/admin/review-schemes` 列表 | `ReviewSchemeResponse[]` | 不返回用户密码哈希或 session token | 不分页；支持 `keyword/isActive` |
| `/admin/batches`、`/admin/organizations`、`/admin/projects` 列表 | `{ items: [], page: 1, pageSize: 100, total: 0 }` | 不返回用户密码哈希或 session token | 分页；`pageSize` 最大 `1000`；超过最大值由 DTO 校验返回 `400` |
| `/admin/project-imports`、`/admin/project-imports/:id/rows` 列表 | `{ items: [], page: 1, pageSize: 100, total: 0 }` | 不返回用户密码哈希或 session token | 分页；`pageSize` 最大 `1000` |
| `/admin/project-imports/upload` | `ProjectImportJobResponse` | 不返回用户密码哈希或原 Excel 文件 | `fieldMapping` 保存本次表头识别快照 |
| `/admin/project-imports/:id/rows/:rowId` | `ProjectImportRowResponse` | `resolved` 仅返回 ID，不内联用户密码哈希 | 包含 `raw/normalized/resolved/issues/status/projectId/confirmedByUserId/confirmedAt` |
| 专家候选/专家列表 | `ExpertBasicResponse[]` 或分页对象 | 不返回 `passwordHash` | 字段含 `id/name/phone/organizationIds/disciplineIds`；候选额外含 `assigned` |
| `GET /project-owner/projects`、`GET /expert/projects` | `{ items: ProjectPortalResponse[], page, pageSize, total }` | 不返回用户密码哈希、OSS AccessKey 或 session token | `ProjectPortalResponse` 含项目基础字段、评审安排、`followUpNeeds`、`materialCount` |
| 单项目材料列表 | `ProjectMaterialResponse[]` | 不返回 OSS AccessKey、文件内容或持久化 URL | 字段含材料 ID、项目 ID、材料类型摘要、文件名、objectKey、bucket、storageDriver、mimeType、extension、sizeBytes、sha256、remark、status、createdAt、updatedAt |
| 材料上传 | `{ materials, successCount, failedCount, failures }` | 不返回 OSS AccessKey 或文件内容 | 多文件上传允许部分成功；全部失败时按错误返回 |
| 材料下载 URL | `{ url, expiresAt }` | 不返回 OSS AccessKey 或持久化 URL | 默认有效期 10 分钟；deleted 材料不可生成 URL |
| 材料软删除 | `{ deleted, alreadyDeleted }` | 不返回 OSS AccessKey 或文件内容 | 重复删除幂等成功；不物理删除 OSS object |
| 管理员用户列表 | 未实现 | 无 | 未来若实现，应保留分页，`pageSize` 最大 `1000` |

## 6. Excel 导入字段映射

- 标准字段：`projectNo`、`name`、`projectTypeName`、`ownerName`、`ownerPhone`、`leadOrganizationName`、`totalFunding`、`allocatedFunding`、`disciplineName`、`departmentName`、`cooperationOrganizationNames`、`statusName`、`organizationContactName`、`organizationContactPhone`
- 关键表头：`projectNo`、`name`、`leadOrganizationName`；缺失时上传接口直接返回 `400`
- 常见别名按后端常量维护，支持项目编号/编号/项目代码/项目合同编号、项目名称/名称/课题名称、项目类型/类型/项目类别/类别、项目负责人/负责人/项目负责人姓名/负责人姓名、负责人手机/负责人电话/联系电话、项目承担单位/承担单位/牵头单位/依托单位/单位名称等
- 表头匹配只做 trim 与全角/半角空格归一化后的精确匹配，不做复杂模糊匹配

## 7. 维护规则

- 新增或修改 DTO 必须同步本文档
- 修改请求体、响应结构或枚举值必须同步本文档
- 只修改 Service 内部逻辑且不影响接口契约时，可不更新本文档
