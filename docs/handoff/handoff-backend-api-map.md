# ReviewX 后端 API 地图

## 1. 用途

- 记录后端 API 路径、方法、用途、权限、Controller、Service、状态
- 方便 Codex 修改接口时快速判断影响范围

## 2. 当前状态

- `backend` 已初始化
- 当前已确认最小健康检查 API
- 当前已确认 auth 第一阶段 API

## 3. 当前 API

| 模块 | 方法 | 路径 | Controller | Service | 权限 / Guard | 请求 DTO | 响应 DTO / 返回结构 | 状态 | 备注 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| app | `GET` | `/health` | `AppController` | `AppService` | 公共接口 | 无 | `{ status: 'ok', service: 'reviewx-backend' }` | implemented | 用于确认后端骨架已启动且可响应 |
| auth | `POST` | `/auth/login` | `AuthController` | `AuthService` | 公共接口 | `LoginDto` | `PublicUser` | implemented | 成功返回 `200 OK` 并设置 HttpOnly Cookie；响应 body 不包含 `passwordHash` 或 session token |
| auth | `POST` | `/auth/logout` | `AuthController` | `AuthService` | 幂等接口；读取 Cookie 中 session token | 无 | `{ success: true }` | implemented | 成功返回 `200 OK`；撤销当前 session 并清除 Cookie；不泄露 session 是否存在 |
| auth | `GET` | `/auth/me` | `AuthController` | `AuthService` | `SessionAuthGuard` | 无 | `PublicUser` | implemented | 通过 HttpOnly Cookie 校验当前 session；未登录返回 `401` |
| users | `GET` | `/admin/users` | `AdminUsersController` | `UsersService` | `SessionAuthGuard` + `RolesGuard(admin)` | `QueryAdminUsersDto` | `{ items, page, pageSize, total }` | implemented | 管理员分页查看用户；`page=1`、`pageSize=100`、最大 `1000`；支持 `keyword/role/isActive/organizationId/disciplineId`；不返回 `passwordHash` |
| users | `POST` | `/admin/users` | `AdminUsersController` | `UsersService` | `SessionAuthGuard` + `RolesGuard(admin)` | `CreateAdminUserDto` | `AdminUserResponse` | implemented | 创建用户；`phone` 唯一；`roles` 至少一个；未传 `password` 默认使用手机号；`mustChangePassword` 默认 `true`；单位和学科必须引用启用主数据 |
| users | `GET` | `/admin/users/:id` | `AdminUsersController` | `UsersService` | `SessionAuthGuard` + `RolesGuard(admin)` | path `id` | `AdminUserResponse` | implemented | ObjectId 非法返回 `400`；用户不存在返回 `404`；不返回 `passwordHash` |
| users | `PATCH` | `/admin/users/:id` | `AdminUsersController` | `UsersService` | `SessionAuthGuard` + `RolesGuard(admin)` | `UpdateAdminUserDto` | `AdminUserResponse` | implemented | 更新 `name/roles/isActive/organizationIds/disciplineIds/mustChangePassword`；不允许改 `phone/password/passwordHash`；保护当前 admin 和最后启用 admin |
| users | `PATCH` | `/admin/users/:id/status` | `AdminUsersController` | `UsersService` | `SessionAuthGuard` + `RolesGuard(admin)` | `UpdateAdminUserStatusDto` | `AdminUserResponse` | implemented | 单独启用/停用入口；不允许当前管理员停用自己；不允许破坏最后一个启用 admin |
| users | `POST` | `/admin/users/:id/reset-password` | `AdminUsersController` | `UsersService` | `SessionAuthGuard` + `RolesGuard(admin)` | `ResetAdminUserPasswordDto` | `AdminUserResponse` | implemented | 重置密码；未传 `password` 默认重置为手机号；`mustChangePassword` 默认 `true`；不返回 `passwordHash` |
| batches | `GET` | `/admin/batches` | `BatchesController` | `BatchesService` | `SessionAuthGuard` + `RolesGuard(admin)` | `QueryBatchesDto` | `{ items, page, pageSize, total }` | implemented | 当前仍分页；`page=1`、`pageSize=100`、最大 `1000`；支持 `keyword/isActive` |
| batches | `POST` | `/admin/batches` | `BatchesController` | `BatchesService` | `SessionAuthGuard` + `RolesGuard(admin)` | `CreateBatchDto` | `BatchResponse` | implemented | `name` 唯一 |
| batches | `GET` | `/admin/batches/:id` | `BatchesController` | `BatchesService` | `SessionAuthGuard` + `RolesGuard(admin)` | path `id` | `BatchResponse` | implemented | ObjectId 非法返回 `400` |
| batches | `PATCH` | `/admin/batches/:id` | `BatchesController` | `BatchesService` | `SessionAuthGuard` + `RolesGuard(admin)` | `UpdateBatchDto` | `BatchResponse` | implemented | 更新前检查重名 |
| batches | `DELETE` | `/admin/batches/:id` | `BatchesController` | `BatchesService` | `SessionAuthGuard` + `RolesGuard(admin)` | path `id` | `BatchResponse` | implemented | 当前 delete 语义为 `isActive=false` |
| dictionaries | `GET` | `/admin/dictionaries` | `DictionariesController` | `DictionariesService` | `SessionAuthGuard` + `RolesGuard(admin)` | `QueryDictionariesDto` | `DictionaryResponse[]` | implemented | 不分页，返回数组；支持 `dictType/keyword/isActive` |
| dictionaries | `POST/GET:id/PATCH:id/DELETE:id` | `/admin/dictionaries` | `DictionariesController` | `DictionariesService` | `SessionAuthGuard` + `RolesGuard(admin)` | `CreateDictionaryDto`、`UpdateDictionaryDto`、path `id` | `DictionaryResponse` | implemented | `dictType+code`、`dictType+name` 唯一；delete 为停用 |
| tree-dictionaries | `GET` | `/admin/tree-dictionaries` | `TreeDictionariesController` | `TreeDictionariesService` | `SessionAuthGuard` + `RolesGuard(admin)` | `QueryTreeDictionariesDto` | `TreeDictionaryResponse[]` | implemented | 不分页，返回平铺数组；支持 `treeType/parentId/keyword/isActive`；当前未实现 `/tree` 结构接口 |
| tree-dictionaries | `POST/GET:id/PATCH:id/DELETE:id` | `/admin/tree-dictionaries` | `TreeDictionariesController` | `TreeDictionariesService` | `SessionAuthGuard` + `RolesGuard(admin)` | `CreateTreeDictionaryDto`、`UpdateTreeDictionaryDto`、path `id` | `TreeDictionaryResponse` | implemented | 支持多根、`pathIds`、`level`；有子节点时 delete 返回 `409` |
| organizations | `GET` | `/admin/organizations` | `OrganizationsController` | `OrganizationsService` | `SessionAuthGuard` + `RolesGuard(admin)` | `QueryOrganizationsDto` | `{ items, page, pageSize, total }` | implemented | 保留分页；`page=1`、`pageSize=100`、最大 `1000`；支持 `keyword/isActive/regionId` |
| organizations | `POST/GET:id/PATCH:id/DELETE:id` | `/admin/organizations` | `OrganizationsController` | `OrganizationsService` | `SessionAuthGuard` + `RolesGuard(admin)` | `CreateOrganizationDto`、`UpdateOrganizationDto`、path `id` | `OrganizationResponse` | implemented | `regionId` 字段名保持不变，但必须引用 `treeType=administrative_division` 的树节点；历史 `treeType=region` 不再作为行政区划；`name` 唯一；delete 为停用 |
| review-schemes | `GET` | `/admin/review-schemes` | `ReviewSchemesController` | `ReviewSchemesService` | `SessionAuthGuard` + `RolesGuard(admin)` | `QueryReviewSchemesDto` | `ReviewSchemeResponse[]` | implemented | 不分页，返回数组；支持 `keyword/isActive` |
| review-schemes | `POST/GET:id/PATCH:id/DELETE:id` | `/admin/review-schemes` | `ReviewSchemesController` | `ReviewSchemesService` | `SessionAuthGuard` + `RolesGuard(admin)` | `CreateReviewSchemeDto`、`UpdateReviewSchemeDto`、path `id` | `ReviewSchemeResponse` | implemented | items 至少 1 项；`totalScore` 后端计算；delete 为停用 |
| projects | `GET` | `/admin/projects` | `ProjectsController` | `ProjectsService` | `SessionAuthGuard` + `RolesGuard(admin)` | `QueryProjectsDto` | `{ items, page, pageSize, total }` | implemented | 保留分页；`page=1`、`pageSize=100`、最大 `1000`；支持 `batchId/keyword/isActive/reviewManagerId/reviewSchemeId/projectTypeId/statusId/departmentId/disciplineId/hasReviewManager/hasReviewScheme` |
| projects | `POST/GET:id/PATCH:id/DELETE:id` | `/admin/projects` | `ProjectsController` | `ProjectsService` | `SessionAuthGuard` + `RolesGuard(admin)` | `CreateProjectDto`、`UpdateProjectDto`、path `id` | `ProjectResponse` | implemented | 校验批次、字典/树类型、用户角色、单位和启用评审方案；`batchId+projectNo` 唯一；delete 为停用 |
| projects | `PATCH` | `/admin/projects/:id/review-assignment` | `ProjectsController` | `ProjectsService` | `SessionAuthGuard` + `RolesGuard(admin)` | `UpdateReviewAssignmentDto` | `ProjectResponse` | implemented | 设置项目评审负责人和/或评审方案；`reviewManagerId` 必须是启用 `review_manager` 用户；`reviewSchemeId` 必须是启用方案，并写入 `reviewSchemeSnapshot` |
| projects | `PATCH` | `/admin/projects/review-assignment/batch` | `ProjectsController` | `ProjectsService` | `SessionAuthGuard` + `RolesGuard(admin)` | `BatchUpdateReviewAssignmentDto` | `{ successCount, failedCount, failures }` | implemented | 对多个项目设置同一评审负责人和/或评审方案；单项目失败不影响其他项目 |
| projects | `PATCH` | `/admin/projects/:id/schedule` | `ProjectsController` | `ProjectsService` | `SessionAuthGuard` + `RolesGuard(admin)` | `UpdateProjectScheduleDto` | `ProjectResponse` | implemented | 管理员兜底维护评审时间、地点、meetingUrl；不调用腾讯会议 API |
| project-expert-assignments | `GET` | `/admin/projects/:id/expert-candidates` | `AdminProjectExpertAssignmentsController` | `ProjectExpertAssignmentsService` | `SessionAuthGuard` + `RolesGuard(admin)` | `QueryExpertCandidatesDto` | `{ items, page, pageSize, total, reason? }` | implemented | 管理员全局查看专家候选；候选按 expert 角色、启用状态、学科匹配、承担单位/合作单位回避过滤，已分配专家标记 `assigned=true` |
| project-expert-assignments | `GET` | `/admin/projects/:id/experts` | `AdminProjectExpertAssignmentsController` | `ProjectExpertAssignmentsService` | `SessionAuthGuard` + `RolesGuard(admin)` | path `id` | `ExpertBasicResponse[]` | implemented | 管理员全局查看当前 `status=assigned` 专家，含 `hasReviewRecord/reviewStatus` |
| project-expert-assignments | `POST` | `/admin/projects/:id/experts` | `AdminProjectExpertAssignmentsController` | `ProjectExpertAssignmentsService` | `SessionAuthGuard` + `RolesGuard(admin)` | `AppendProjectExpertsDto` | `{ assignedExperts, successCount, failedCount, failures }` | implemented | 管理员全局追加专家；逐专家校验学科和单位回避；专家名单锁定时返回 `409 EXPERT_ASSIGNMENT_LOCKED` |
| project-expert-assignments | `PUT` | `/admin/projects/:id/experts` | `AdminProjectExpertAssignmentsController` | `ProjectExpertAssignmentsService` | `SessionAuthGuard` + `RolesGuard(admin)` | `UpdateProjectExpertsDto` | `{ assignedExperts, addedOrRestoredCount, removedCount }` | implemented | 管理员全局替换专家名单；专家名单锁定时返回 `409 EXPERT_ASSIGNMENT_LOCKED` |
| project-expert-assignments | `DELETE` | `/admin/projects/:id/experts/:expertUserId` | `AdminProjectExpertAssignmentsController` | `ProjectExpertAssignmentsService` | `SessionAuthGuard` + `RolesGuard(admin)` | path `id/expertUserId` | `{ removed, alreadyRemoved }` | implemented | 管理员全局移除专家；专家名单锁定时返回 `409 EXPERT_ASSIGNMENT_LOCKED` |
| project-expert-assignments | `PUT` | `/admin/projects/experts/batch` | `AdminProjectExpertAssignmentsController` | `ProjectExpertAssignmentsService` | `SessionAuthGuard` + `RolesGuard(admin)` | `BatchProjectExpertsDto` | `{ successCount, failedCount, results }` | implemented | 管理员全局批量追加或替换专家，逐项目返回结果；锁定项目按项目级失败返回 `EXPERT_ASSIGNMENT_LOCKED` |
| projects | `GET` | `/review-manager/projects` | `ReviewManagerProjectsController` | `ProjectsService` | `SessionAuthGuard` + `RolesGuard(review_manager)` | `QueryReviewManagerProjectsDto` | `{ items, page, pageSize, total }` | implemented | 只返回当前登录用户作为 `reviewManagerId` 的启用项目；admin + review_manager 多角色也只看自己负责项目；admin 全局项目视角走 `/admin/projects` |
| projects | `PATCH` | `/review-manager/projects/:id/schedule` | `ReviewManagerProjectsController` | `ProjectsService` | `SessionAuthGuard` + `RolesGuard(review_manager)` | `UpdateProjectScheduleDto` | `ProjectResponse` | implemented | 必须是项目 `reviewManagerId`；admin 不在 review-manager 命名空间超管穿透；只更新 `reviewTime/reviewLocation/meetingUrl` |
| project-expert-assignments | `GET` | `/review-manager/projects/:id/expert-candidates` | `ProjectExpertAssignmentsController` | `ProjectExpertAssignmentsService` | `SessionAuthGuard` + `RolesGuard(review_manager)` | `QueryExpertCandidatesDto` | `{ items, page, pageSize, total, reason? }` | implemented | 必须是当前评审负责人负责项目；项目无学科返回空分页和 `reason=project_discipline_missing`；不返回 `passwordHash` |
| project-expert-assignments | `GET` | `/review-manager/projects/:id/experts` | `ProjectExpertAssignmentsController` | `ProjectExpertAssignmentsService` | `SessionAuthGuard` + `RolesGuard(review_manager)` | path `id` | `ExpertBasicResponse[]` | implemented | 必须是当前评审负责人负责项目；返回当前 `status=assigned` 专家基本信息，含 `hasReviewRecord` 与 `reviewStatus(draft/submitted/returned/null)` 供前端判断能否移除 |
| project-expert-assignments | `POST` | `/review-manager/projects/:id/experts` | `ProjectExpertAssignmentsController` | `ProjectExpertAssignmentsService` | `SessionAuthGuard` + `RolesGuard(review_manager)` | `AppendProjectExpertsDto` | `{ assignedExperts, successCount, failedCount, failures }` | implemented | 必须是当前评审负责人负责项目；追加一个或多个专家；逐专家校验；重复添加已分配专家幂等成功；专家名单锁定时返回 `409 EXPERT_ASSIGNMENT_LOCKED` |
| project-expert-assignments | `PUT` | `/review-manager/projects/:id/experts` | `ProjectExpertAssignmentsController` | `ProjectExpertAssignmentsService` | `SessionAuthGuard` + `RolesGuard(review_manager)` | `UpdateProjectExpertsDto` | `{ assignedExperts, addedOrRestoredCount, removedCount }` | implemented | 必须是当前评审负责人负责项目；用传入集合替换当前专家；专家名单锁定时返回 `409 EXPERT_ASSIGNMENT_LOCKED` |
| project-expert-assignments | `DELETE` | `/review-manager/projects/:id/experts/:expertUserId` | `ProjectExpertAssignmentsController` | `ProjectExpertAssignmentsService` | `SessionAuthGuard` + `RolesGuard(review_manager)` | path `id/expertUserId` | `{ removed, alreadyRemoved }` | implemented | 必须是当前评审负责人负责项目；移除当前 `assigned` assignment；专家名单锁定时返回 `409 EXPERT_ASSIGNMENT_LOCKED` |
| project-expert-assignments | `PUT` | `/review-manager/projects/experts/batch` | `ProjectExpertAssignmentsController` | `ProjectExpertAssignmentsService` | `SessionAuthGuard` + `RolesGuard(review_manager)` | `BatchProjectExpertsDto` | `{ successCount, failedCount, results }` | implemented | 必须逐项目满足当前评审负责人负责项目；`mode=append/replace`；项目间互不影响；锁定项目按项目级失败返回 `EXPERT_ASSIGNMENT_LOCKED` |
| project-imports | `POST` | `/admin/project-imports/upload` | `ProjectImportsController` | `ProjectImportsService` | `SessionAuthGuard` + `RolesGuard(admin)` | multipart `file` + `UploadProjectImportDto` | `ProjectImportJobResponse` | implemented | 仅允许 `.xlsx/.xls`，10MB 上限；使用 `xlsx` 解析第一个工作表；表头匹配优先消费启用的字段映射配置，未配置或停用回退内置默认别名；缺关键表头或无有效数据行返回 `400`；不保存原 Excel 文件 |
| project-import-field-mappings | `GET` | `/admin/project-import-field-mappings/standard-fields` | `ProjectImportFieldMappingsController` | `ProjectImportFieldMappingsService` | `SessionAuthGuard` + `RolesGuard(admin)` | 无 | `{ items: ProjectImportStandardFieldResponse[] }` | implemented | 返回固定标准字段、中文 label、是否必填和默认内置别名；管理员不能新增或修改标准字段枚举 |
| project-import-field-mappings | `GET` | `/admin/project-import-field-mappings` | `ProjectImportFieldMappingsController` | `ProjectImportFieldMappingsService` | `SessionAuthGuard` + `RolesGuard(admin)` | `QueryProjectImportFieldMappingsDto` | `{ items: ProjectImportFieldMappingResponse[] }` | implemented | 返回所有标准字段配置视图；未配置字段也返回，`isConfigured=false`，`effectiveAliases=defaultAliases`；支持 `keyword/isActive` |
| project-import-field-mappings | `GET` | `/admin/project-import-field-mappings/:standardField` | `ProjectImportFieldMappingsController` | `ProjectImportFieldMappingsService` | `SessionAuthGuard` + `RolesGuard(admin)` | path `standardField` | `ProjectImportFieldMappingResponse` | implemented | 非法标准字段返回 `400`；未配置字段返回默认视图而不是 `404` |
| project-import-field-mappings | `PUT` | `/admin/project-import-field-mappings/:standardField` | `ProjectImportFieldMappingsController` | `ProjectImportFieldMappingsService` | `SessionAuthGuard` + `RolesGuard(admin)` | `UpsertProjectImportFieldMappingDto` | `ProjectImportFieldMappingResponse` | implemented | 创建或覆盖自定义配置；aliases 必填且非空；校验空别名、同字段重复、跨字段配置/默认别名冲突；冲突返回 `409` |
| project-import-field-mappings | `PATCH` | `/admin/project-import-field-mappings/:standardField` | `ProjectImportFieldMappingsController` | `ProjectImportFieldMappingsService` | `SessionAuthGuard` + `RolesGuard(admin)` | `UpdateProjectImportFieldMappingDto` | `ProjectImportFieldMappingResponse` | implemented | 只更新已有配置；配置不存在返回 `404`；可更新 aliases、`isActive`、description；`isActive=false` 语义为停用自定义配置并回退默认别名 |
| project-import-field-mappings | `DELETE` | `/admin/project-import-field-mappings/:standardField` | `ProjectImportFieldMappingsController` | `ProjectImportFieldMappingsService` | `SessionAuthGuard` + `RolesGuard(admin)` | path `standardField` | `{ success: true }` | implemented | 删除数据库中的自定义配置；不删除标准字段；删除后该字段回退默认内置别名；配置不存在返回 `404` |
| project-import-field-mappings | `POST` | `/admin/project-import-field-mappings/:standardField/reset-defaults` | `ProjectImportFieldMappingsController` | `ProjectImportFieldMappingsService` | `SessionAuthGuard` + `RolesGuard(admin)` | path `standardField` | `ProjectImportFieldMappingResponse` | implemented | 将该标准字段 aliases 重置为内置默认别名并设置 `isActive=true`；配置不存在则创建；不是删除配置 |
| project-imports | `GET` | `/admin/project-imports` | `ProjectImportsController` | `ProjectImportsService` | `SessionAuthGuard` + `RolesGuard(admin)` | `QueryProjectImportJobsDto` | `{ items, page, pageSize, total }` | implemented | 任务列表分页，`pageSize` 最大 `1000`；支持 `status/batchId/keyword` |
| project-imports | `GET` | `/admin/project-imports/:id` | `ProjectImportsController` | `ProjectImportsService` | `SessionAuthGuard` + `RolesGuard(admin)` | path `id` | `ProjectImportJobResponse` | implemented | 返回任务基本信息、字段映射快照和统计计数，不内联全部 rows |
| project-imports | `DELETE` | `/admin/project-imports/:id` | `ProjectImportsController` | `ProjectImportsService` | `SessionAuthGuard` + `RolesGuard(admin)` | path `id` | `{ success: true, deletedJobId, deletedRows }` | implemented | 物理删除导入任务和对应导入行；不删除正式项目；`parsing` 或已有 `confirmed` 行的任务返回 `409`；任务不存在返回 `404` |
| project-imports | `GET` | `/admin/project-imports/:id/rows` | `ProjectImportsController` | `ProjectImportsService` | `SessionAuthGuard` + `RolesGuard(admin)` | `QueryProjectImportRowsDto` | `{ items, page, pageSize, total }` | implemented | 导入行分页，`pageSize` 最大 `1000`；支持 `status/keyword` |
| project-imports | `PATCH` | `/admin/project-imports/:id/rows/:rowId` | `ProjectImportsController` | `ProjectImportsService` | `SessionAuthGuard` + `RolesGuard(admin)` | `UpdateProjectImportRowDto` | `ProjectImportRowResponse` | implemented | 人工修正 normalized/resolved；可创建单位和项目负责人用户；不可创建项目类型、学科、受理处室、项目状态 |
| project-imports | `POST` | `/admin/project-imports/:id/rows/:rowId/confirm` | `ProjectImportsController` | `ProjectImportsService` | `SessionAuthGuard` + `RolesGuard(admin)` | 无 | `ProjectImportRowResponse` | implemented | 仅 `importable` 可确认；创建或更新 Project，记录 `projectId/confirmedByUserId/confirmedAt` |
| project-imports | `POST` | `/admin/project-imports/:id/confirm` | `ProjectImportsController` | `ProjectImportsService` | `SessionAuthGuard` + `RolesGuard(admin)` | 无 | `{ successCount, failedCount, skippedCount }` | implemented | 批量处理所有 `importable` 行；`pending_confirmation/skipped/confirmed` 行跳过 |
| project-imports | `POST` | `/admin/project-imports/:id/rows/:rowId/skip` | `ProjectImportsController` | `ProjectImportsService` | `SessionAuthGuard` + `RolesGuard(admin)` | 无 | `ProjectImportRowResponse` | implemented | `importable/pending_confirmation/failed` 可跳过；`confirmed` 返回 `409` |
| portal-reference-data | `GET` | `/portal/reference-data/dictionaries` | `PortalReferenceDataController` | `PortalReferenceDataService` | `SessionAuthGuard` + `RolesGuard(project_owner/expert/review_manager/client/admin)` | `QueryPortalDictionariesDto` | `{ items: PortalDictionarySummary[] }` | implemented | 门户端普通字典只读摘要；支持 `dictType/dictTypes/keyword/isActive`，默认 `isActive=true`；返回 `id/dictType/code/name/sortOrder/isActive`；不替代 `/admin/dictionaries` CRUD |
| portal-reference-data | `GET` | `/portal/reference-data/tree-dictionaries` | `PortalReferenceDataController` | `PortalReferenceDataService` | `SessionAuthGuard` + `RolesGuard(project_owner/expert/review_manager/client/admin)` | `QueryPortalTreeDictionariesDto` | `{ items: PortalTreeDictionarySummary[] }` | implemented | 门户端树形字典平铺只读摘要；支持 `treeType/treeTypes/keyword/isActive`，默认 `isActive=true`；返回 `id/treeType/parentId/code/name/sortOrder/isActive` |
| portal-reference-data | `GET` | `/portal/reference-data/batches` | `PortalReferenceDataController` | `PortalReferenceDataService` | `SessionAuthGuard` + `RolesGuard(project_owner/expert/review_manager/client/admin)` | `QueryPortalCommonDto` | `{ items: PortalBatchSummary[] }` | implemented | 门户端批次只读摘要；支持 `keyword/isActive`，默认 `isActive=true`；按 `name` 倒序；返回 `id/name/isActive/createdAt/updatedAt` |
| portal-reference-data | `GET` | `/portal/reference-data/organizations` | `PortalReferenceDataController` | `PortalReferenceDataService` | `SessionAuthGuard` + `RolesGuard(project_owner/expert/review_manager/client/admin)` | `QueryPortalCommonDto` | `{ items: PortalOrganizationSummary[] }` | implemented | 门户端单位只读摘要；支持 `keyword/isActive`，默认 `isActive=true`；keyword 可匹配 `name/contactName/contactPhone`，响应只返回 `id/name/regionId/isActive` |
| portal-reference-data | `GET` | `/portal/reference-data/review-schemes` | `PortalReferenceDataController` | `PortalReferenceDataService` | `SessionAuthGuard` + `RolesGuard(project_owner/expert/review_manager/client/admin)` | `QueryPortalCommonDto` | `{ items: PortalReviewSchemeSummary[] }` | implemented | 门户端评审方案只读摘要；支持 `keyword/isActive`，默认 `isActive=true`；返回 `id/name/totalScore/isActive`，不返回完整评分项 |
| portal-reference-data | `GET` | `/portal/reference-data/users` | `PortalReferenceDataController` | `PortalReferenceDataService` | `SessionAuthGuard` + `RolesGuard(project_owner/expert/review_manager/client/admin)` | `QueryPortalUsersDto` | `{ items: PortalUserSummary[] }` | implemented | 门户端业务用户摘要；必须提供 `role` 或 `roles`，仅允许 `review_manager/expert/project_owner`；`role=admin` 返回 `400`；查询结果排除含 `admin` 角色用户；不返回 `passwordHash/mustChangePassword/session/token` |
| project-owner-projects | `GET` | `/project-owner/projects` | `ProjectOwnerProjectsController` | `ProjectMaterialsService` | `SessionAuthGuard` + `RolesGuard(project_owner)` | `QueryProjectOwnerProjectsDto` | `{ items, page, pageSize, total }` | implemented | 只返回当前用户 `ownerUserId` 对应的启用项目；分页默认 `page=1/pageSize=100`，最大 `1000`；返回评审安排、`followUpNeeds`、`materialCount`、`reviewManager` 摘要和 `ownerContentLocked` |
| project-owner-projects | `GET` | `/project-owner/projects/:id` | `ProjectOwnerProjectsController` | `ProjectMaterialsService` | `SessionAuthGuard` + `RolesGuard(project_owner)` | path `id` | `ProjectPortalResponse` | implemented | 当前用户必须是项目负责人；返回项目基础信息、评审负责人 `reviewManager?: { id, name, phone? } | null`、评审方案摘要、评审安排、`followUpNeeds`、`finalLevel/originalLevel`、`ownerContentLocked` 和 `materialCount`；负责人用户不存在时 `reviewManager=null`，不返回敏感字段 |
| project-owner-projects | `PATCH` | `/project-owner/projects/:id/follow-up-needs` | `ProjectOwnerProjectsController` | `ProjectMaterialsService` | `SessionAuthGuard` + `RolesGuard(project_owner)` | `UpdateFollowUpNeedsDto` | `ProjectPortalResponse` | implemented | 仅更新 `Project.followUpNeeds`；字符串 trim，最长 5000，允许空字符串清空；评审结果已确认、项目已有 `finalLevel` 或 `originalLevel` 时返回 `409 PROJECT_OWNER_CONTENT_LOCKED` |
| project-materials | `GET` | `/project-owner/projects/:id/materials` | `ProjectOwnerMaterialsController` | `ProjectMaterialsService` | `SessionAuthGuard` + `RolesGuard(project_owner)` | `QueryProjectMaterialsDto` | `ProjectMaterialResponse[]` | implemented | 当前用户必须是项目负责人；返回 `draft/submitted/legacy active` 材料；不返回 legacy `deleted`；支持 `materialTypeId` 过滤；不分页 |
| project-materials | `POST` | `/project-owner/projects/:id/materials` | `ProjectOwnerMaterialsController` | `ProjectMaterialsService` | `SessionAuthGuard` + `RolesGuard(project_owner)` | multipart `files` + `UploadProjectMaterialsDto` | `{ materials, successCount, failedCount, failures }` | implemented | 文件字段名 `files`，单次最多 20 个，单文件最大 500MB；材料类型必须是启用 `dictType=material_type`；保存 `originalFilename`、生成 `safeFilename/objectKey` 和多文件失败明细前会执行上传文件名归一化；使用 storage 上传后写入 `ProjectMaterial(status=draft)`；评审结果已确认、项目已有 `finalLevel` 或 `originalLevel` 时返回 `409 PROJECT_OWNER_CONTENT_LOCKED` |
| project-materials | `POST` | `/project-owner/projects/:id/materials/submit` | `ProjectOwnerMaterialsController` | `ProjectMaterialsService` | `SessionAuthGuard` + `RolesGuard(project_owner)` | `SubmitProjectMaterialsDto` | `{ submittedCount, alreadySubmittedCount, skippedCount, submittedMaterialIds, skipped }` | implemented | 未传或空 `materialIds` 时提交该项目全部 `draft/active`；传入时只提交指定材料；`active` 作为 legacy draft 提交为 `submitted`；写 `submittedAt/submittedByUserId`；评审结果已确认、项目已有 `finalLevel` 或 `originalLevel` 时返回 `409 PROJECT_OWNER_CONTENT_LOCKED` |
| project-materials | `GET` | `/project-owner/projects/:id/materials/:materialId/download-url` | `ProjectOwnerMaterialsController` | `ProjectMaterialsService` | `SessionAuthGuard` + `RolesGuard(project_owner)` | path `id/materialId` | `{ url, expiresAt }` | implemented | 当前用户必须是项目负责人；材料必须属于项目且为 `draft/submitted/active`；默认 10 分钟签名 URL |
| project-materials | `DELETE` | `/project-owner/projects/:id/materials/:materialId` | `ProjectOwnerMaterialsController` | `ProjectMaterialsService` | `SessionAuthGuard` + `RolesGuard(project_owner)` | path `id/materialId` | `{ deleted, alreadyDeleted?, deletionLogId? }` | implemented | 仅允许删除 `draft/legacy active`；先 `storageService.deleteObject(objectKey)`，成功后写 `project_material_deletion_logs` 并物理删除 `project_materials` 主记录；`submitted` 返回 `409`；评审结果已确认、项目已有 `finalLevel` 或 `originalLevel` 时返回 `409 PROJECT_OWNER_CONTENT_LOCKED`；不再返回 `alreadyDeleted=true` |
| project-materials | `GET` | `/review-manager/projects/:id/materials` | `ReviewManagerMaterialsController` | `ProjectMaterialsService` | `SessionAuthGuard` + `RolesGuard(review_manager)` | `QueryProjectMaterialsDto` | `ProjectMaterialResponse[]` | implemented | 必须是当前评审负责人负责项目；只读 `submitted` 材料，支持 `materialTypeId`，不分页 |
| project-materials | `GET` | `/review-manager/projects/:id/materials/:materialId/download-url` | `ReviewManagerMaterialsController` | `ProjectMaterialsService` | `SessionAuthGuard` + `RolesGuard(review_manager)` | path `id/materialId` | `{ url, expiresAt }` | implemented | 必须是当前评审负责人负责项目；材料必须属于项目且为 `submitted` |
| expert-projects | `GET` | `/expert/projects` | `ExpertMaterialsController` | `ProjectMaterialsService` | `SessionAuthGuard` + `RolesGuard(expert)` | `QueryExpertProjectsDto` | `{ items, page, pageSize, total }` | implemented | 只返回当前专家 `status=assigned` 的启用项目；支持 `batchId/keyword/statusId`；返回评审安排和 `materialCount` |
| expert-projects | `GET` | `/expert/projects/:id` | `ExpertMaterialsController` | `ProjectMaterialsService` | `SessionAuthGuard` + `RolesGuard(expert)` | path `id` | `ProjectPortalResponse` | implemented | 当前专家必须已分配到项目且 `status=assigned`；返回项目基础信息、评审安排、`followUpNeeds` 和材料摘要 |
| project-materials | `GET` | `/expert/projects/:id/materials` | `ExpertMaterialsController` | `ProjectMaterialsService` | `SessionAuthGuard` + `RolesGuard(expert)` | `QueryProjectMaterialsDto` | `ProjectMaterialResponse[]` | implemented | 当前专家必须已分配到项目；只读 `submitted` 材料，支持 `materialTypeId`，不分页 |
| project-materials | `GET` | `/expert/projects/:id/materials/:materialId/download-url` | `ExpertMaterialsController` | `ProjectMaterialsService` | `SessionAuthGuard` + `RolesGuard(expert)` | path `id/materialId` | `{ url, expiresAt }` | implemented | 当前专家必须已分配到项目；材料必须属于项目且为 `submitted` |
| project-materials | `GET` | `/admin/projects/:id/materials` | `AdminMaterialsController` | `ProjectMaterialsService` | `SessionAuthGuard` + `RolesGuard(admin)` | `QueryProjectMaterialsDto` | `ProjectMaterialResponse[]` | implemented | admin 可查看任意项目 `draft/submitted/legacy active` 材料；支持 `materialTypeId`，不分页；不展示 legacy `deleted` |
| project-materials | `GET` | `/admin/projects/:id/materials/:materialId/download-url` | `AdminMaterialsController` | `ProjectMaterialsService` | `SessionAuthGuard` + `RolesGuard(admin)` | path `id/materialId` | `{ url, expiresAt }` | implemented | admin 可获取任意项目 `draft/submitted/active` 材料的短期签名 URL |
| project-materials | `DELETE` | `/admin/projects/:id/materials/:materialId` | `AdminMaterialsController` | `ProjectMaterialsService` | `SessionAuthGuard` + `RolesGuard(admin)` | `DeleteProjectMaterialAdminDto` | `{ deleted: true, deletionLogId }` | implemented | `reason` 必填且 trim 后 1..1000；admin 可删除 `draft/submitted/legacy active`；先删除 storage object，成功后写 deletion log 并物理删除 `project_materials` 主记录 |
| expert-reviews | `GET` | `/expert/review-tasks` | `ExpertReviewTasksController` | `ExpertReviewsService` | `SessionAuthGuard` + `RolesGuard(expert)` | `QueryExpertReviewTasksDto` | `{ items, page, pageSize, total }`；`items[].project.reviewManager` 为 `{ id, name, phone? }` 或 `null` | implemented | 只返回当前专家 `status=assigned` 的启用项目；支持 `batchId/keyword/status/reviewManagerId/reviewSchemeId`；无评分显示 `not_started`；列表批量查询当前页项目评审负责人摘要，不返回敏感字段 |
| expert-reviews | `GET` | `/expert/review-tasks/:projectId` | `ExpertReviewTasksController` | `ExpertReviewsService` | `SessionAuthGuard` + `RolesGuard(expert)` | path `projectId` | `{ project, materialCount, materials, reviewSchemeSnapshot, review }`；`project.reviewManager` 为 `{ id, name, phone? }` 或 `null` | implemented | 当前专家必须已分配；项目无 `reviewSchemeSnapshot` 返回 `409`；无评分时返回空评分结构；按当前项目 `reviewManagerId` 内联负责人摘要，支持 admin + review_manager 多角色用户 |
| expert-reviews | `PUT` | `/expert/review-tasks/:projectId` | `ExpertReviewTasksController` | `ExpertReviewsService` | `SessionAuthGuard` + `RolesGuard(expert)` | `SaveExpertReviewDto` | `ExpertReviewResponse` | implemented | 保存草稿；仅 `draft/returned/not_started` 可写；不受 `Project.reviewTime` 限制；`submitted` 返回 `409`；`totalScore` 后端计算 |
| expert-reviews | `DELETE` | `/expert/review-tasks/:projectId/draft` | `ExpertReviewTasksController` | `ExpertReviewsService` | `SessionAuthGuard` + `RolesGuard(expert)` | path `projectId`；无 body | `204 No Content` | implemented | 当前专家必须仍为该项目 `status=assigned` 专家；仅物理删除本人 `status=draft` 的 `expert_reviews` 记录；无记录返回 `404` 和“未找到可删除的评分草稿。”；`submitted/returned` 返回 `409 EXPERT_REVIEW_DRAFT_NOT_DELETABLE`；不受 `Project.reviewTime` 限制，不删除 assignment、项目或材料 |
| expert-reviews | `POST` | `/expert/review-tasks/:projectId/submit` | `ExpertReviewTasksController` | `ExpertReviewsService` | `SessionAuthGuard` + `RolesGuard(expert)` | `SaveExpertReviewDto` | `ExpertReviewResponse` | implemented | 提交最终评分；若 `Project.reviewTime` 存在且服务器当前时间早于评审时间，返回 `409 REVIEW_NOT_STARTED` 且不写 `submittedAt`；`reviewTime` 缺失时兼容允许提交；完整校验 score、评价描述、改进建议条件必填；重复 submitted 返回 `409` |
| expert-reviews | `GET` | `/review-manager/projects/:id/expert-reviews` | `ReviewManagerExpertReviewsController` | `ExpertReviewsService` | `SessionAuthGuard` + `RolesGuard(review_manager)` | path `id` | `ReviewManagerExpertReviewListItem[]` | implemented | 必须是当前评审负责人负责项目；返回已分配专家评分状态，未创建评分显示 `not_started` |
| expert-reviews | `GET` | `/review-manager/projects/:id/expert-reviews/:expertUserId` | `ReviewManagerExpertReviewsController` | `ExpertReviewsService` | `SessionAuthGuard` + `RolesGuard(review_manager)` | path `id/expertUserId` | `ExpertReviewResponse` 或 `not_started` 结构 | implemented | 必须是当前评审负责人负责项目；expert 必须是当前或曾经分配且有评分记录；不返回 `passwordHash` |
| expert-reviews | `POST` | `/review-manager/projects/:id/expert-reviews/:expertUserId/return` | `ReviewManagerExpertReviewsController` | `ExpertReviewsService` | `SessionAuthGuard` + `RolesGuard(review_manager)` | `ReturnExpertReviewDto` | `ExpertReviewResponse` | implemented | 必须是当前评审负责人负责项目；仅 `submitted` 可退回；写 `returnedAt/returnedByUserId/returnReason`；专家可重新编辑提交 |
| expert-reviews | `GET` | `/review-manager/projects/:id/review-summary` | `ReviewManagerExpertReviewsController` | `ExpertReviewsService` | `SessionAuthGuard` + `RolesGuard(review_manager)` | path `id` | `ReviewSummaryResponse` | implemented | 必须是当前评审负责人负责项目；仅 submitted 评分参与分数统计；无 submitted 时分数统计为 `null` |
| expert-reviews | `GET` | `/admin/projects/:id/expert-reviews` | `AdminExpertReviewsController` | `ExpertReviewsService` | `SessionAuthGuard` + `RolesGuard(admin)` | path `id` | `ReviewManagerExpertReviewListItem[]` | implemented | admin 可查看任意项目专家评分状态 |
| expert-reviews | `GET` | `/admin/projects/:id/expert-reviews/:expertUserId` | `AdminExpertReviewsController` | `ExpertReviewsService` | `SessionAuthGuard` + `RolesGuard(admin)` | path `id/expertUserId` | `ExpertReviewResponse` 或 `not_started` 结构 | implemented | admin 可查看任意项目某专家评分详情 |
| expert-reviews | `GET` | `/admin/projects/:id/review-summary` | `AdminExpertReviewsController` | `ExpertReviewsService` | `SessionAuthGuard` + `RolesGuard(admin)` | path `id` | `ReviewSummaryResponse` | implemented | admin 可查看任意项目评分汇总 |
| consensus-reviews | `POST` | `/review-manager/projects/:id/consensus/draft` | `ReviewManagerConsensusController` | `ConsensusReviewsService` | `SessionAuthGuard` + `RolesGuard(review_manager)` | query `force` | `ConsensusReviewResponse` | implemented | 必须是当前评审负责人负责项目；基于 submitted 专家评分生成 `rule_based` 草稿；无 submitted 返回 `409`；已有 draft 默认 `409`，`force=true` 可覆盖；confirmed 后不可覆盖；响应含 `confirmedByUser?: { id, name, phone? } | null` |
| consensus-reviews | `GET` | `/review-manager/projects/:id/consensus` | `ReviewManagerConsensusController` | `ConsensusReviewsService` | `SessionAuthGuard` + `RolesGuard(review_manager)` | path `id` | `ConsensusReviewResponse` | implemented | 必须是当前评审负责人负责项目；未生成返回 `404`；confirmed 记录响应补充 `confirmedByUser` 摘要，确认人用户不可解析时为 `null` |
| consensus-reviews | `POST` | `/review-manager/projects/:id/consensus/confirm` | `ReviewManagerConsensusController` | `ConsensusReviewsService` | `SessionAuthGuard` + `RolesGuard(review_manager)` | `ConfirmConsensusReviewDto` | `ConsensusReviewResponse` | implemented | 必须是当前评审负责人负责项目；请求仅含 `finalOpinion/finalScore/finalLevel`；未确认记录可写 ConsensusReview 和 Project 等级字段；已有 confirmed 记录返回 `409 CONSENSUS_ALREADY_CONFIRMED` 且不覆盖最终结论、确认人、确认时间或项目等级；成功响应含确认人 `confirmedByUser` 摘要 |
| consensus-reviews | `GET` | `/admin/projects/:id/consensus` | `AdminConsensusController` | `ConsensusReviewsService` | `SessionAuthGuard` + `RolesGuard(admin)` | path `id` | `ConsensusReviewResponse` | implemented | admin 可查看任意项目合议记录；响应含 `confirmedByUser` 摘要，不返回密码或权限字段 |
| consensus-reviews | `POST` | `/admin/projects/:id/consensus/confirm` | `AdminConsensusController` | `ConsensusReviewsService` | `SessionAuthGuard` + `RolesGuard(admin)` | `ConfirmConsensusReviewDto` | `ConsensusReviewResponse` | implemented | admin 可兜底确认任意未确认项目合议；已有 confirmed 记录同样返回 `409 CONSENSUS_ALREADY_CONFIRMED`，不能绕过合议页不可覆盖规则；成功响应含确认人 `confirmedByUser` 摘要 |
| project-appeals | `GET` | `/project-owner/projects/:id/consensus` | `ProjectOwnerAppealsController` | `ProjectAppealsService` | `SessionAuthGuard` + `RolesGuard(project_owner)` | path `id` | `ProjectOwnerConsensusResponse` | implemented | 项目负责人只能查看本人项目 `status=confirmed` 的正式合议结果；未 confirmed 返回 `404`；响应兼容 `confirmedByUserId` 和 `confirmedByUser` 摘要 |
| project-appeals | `GET` | `/project-owner/projects/:id/level-history` | `ProjectOwnerAppealsController` | `ProjectAppealsService` | `SessionAuthGuard` + `RolesGuard(project_owner)` | path `id` | `ProjectLevelChangeLogResponse[]` | implemented | 项目负责人查看本人项目等级变更历史；响应含 `changedByUser?: { id, name, phone? } \| null`，无日志返回空数组 |
| project-appeals | `GET` | `/project-owner/projects/:id/appeals` | `ProjectOwnerAppealsController` | `ProjectAppealsService` | `SessionAuthGuard` + `RolesGuard(project_owner)` | path `id` | `ProjectAppealResponse[]` | implemented | 本人项目、本用户提交的申诉列表；单项目最多 3 条，按 `appealNo` 升序 |
| project-appeals | `GET` | `/project-owner/projects/:id/appeals/:appealId` | `ProjectOwnerAppealsController` | `ProjectAppealsService` | `SessionAuthGuard` + `RolesGuard(project_owner)` | path `id/appealId` | `ProjectAppealDetailResponse` | implemented | 返回申诉详情、处理信息、附件数量；不内联附件列表 |
| project-appeals | `POST` | `/project-owner/projects/:id/appeals` | `ProjectOwnerAppealsController` | `ProjectAppealsService` | `SessionAuthGuard` + `RolesGuard(project_owner)` | `CreateProjectAppealDto`；multipart 可选 `files` | `ProjectAppealResponse` | implemented | 仅本人项目；必须已有 confirmed 合议且有效最终等级 `project.finalLevel ?? confirmedConsensus.finalLevel` 非空；`Project.finalLevel` 缺失但 confirmed 合议有等级时懒回填 `Project.finalLevel/originalLevel`；最多 3 次；存在未处理申诉返回 `409`；`appealNo` 后端生成 |
| project-appeals | `POST` | `/project-owner/projects/:id/appeals/:appealId/attachments` | `ProjectOwnerAppealsController` | `ProjectAppealsService` | `SessionAuthGuard` + `RolesGuard(project_owner)` | multipart `files` + `UploadProjectAppealAttachmentsDto` | `{ attachments, successCount, failedCount, failures }` | implemented | 仅 `submitted` 申诉可追加；文件字段名 `files`，单次最多 20 个，单文件最大 500MB；保存 `originalFilename`、生成 `safeFilename/objectKey` 和多文件失败明细前会执行上传文件名归一化；不使用 material_type |
| project-appeals | `GET` | `/project-owner/projects/:id/appeals/:appealId/attachments` | `ProjectOwnerAppealsController` | `ProjectAppealsService` | `SessionAuthGuard` + `RolesGuard(project_owner)` | path `id/appealId` | `ProjectAppealAttachmentResponse[]` | implemented | 只返回 active 附件，不分页 |
| project-appeals | `GET` | `/project-owner/projects/:id/appeals/:appealId/attachments/:attachmentId/download-url` | `ProjectOwnerAppealsController` | `ProjectAppealsService` | `SessionAuthGuard` + `RolesGuard(project_owner)` | path `id/appealId/attachmentId` | `{ url, expiresAt }` | implemented | active 附件生成默认 10 分钟短期签名 URL；deleted 返回 `404` |
| project-appeals | `DELETE` | `/project-owner/projects/:id/appeals/:appealId/attachments/:attachmentId` | `ProjectOwnerAppealsController` | `ProjectAppealsService` | `SessionAuthGuard` + `RolesGuard(project_owner)` | path `id/appealId/attachmentId` | `409 PROJECT_APPEAL_ATTACHMENT_DELETE_NOT_ALLOWED` | implemented | 路由保留兼容旧请求；归属校验后统一返回 409，不软删除，不修改 `ProjectAppealAttachment.deletedAt/deletedByUserId/status` |
| project-appeals | `GET` | `/review-manager/projects/:id/appeals` | `ReviewManagerAppealsController` | `ProjectAppealsService` | `SessionAuthGuard` + `RolesGuard(review_manager)` | path `id` | `ProjectAppealResponse[]` | implemented | 必须是当前评审负责人负责项目；单项目最多 3 条 |
| project-appeals | `GET` | `/review-manager/projects/:id/appeals/:appealId` | `ReviewManagerAppealsController` | `ProjectAppealsService` | `SessionAuthGuard` + `RolesGuard(review_manager)` | path `id/appealId` | `ProjectAppealDetailResponse` | implemented | 必须是当前评审负责人负责项目；返回申诉详情、confirmed 合议摘要、处理信息和附件数量 |
| project-appeals | `GET` | `/review-manager/projects/:id/appeals/:appealId/attachments` | `ReviewManagerAppealsController` | `ProjectAppealsService` | `SessionAuthGuard` + `RolesGuard(review_manager)` | path `id/appealId` | `ProjectAppealAttachmentResponse[]` | implemented | 必须是当前评审负责人负责项目；查看 active 申诉附件 |
| project-appeals | `GET` | `/review-manager/projects/:id/appeals/:appealId/attachments/:attachmentId/download-url` | `ReviewManagerAppealsController` | `ProjectAppealsService` | `SessionAuthGuard` + `RolesGuard(review_manager)` | path `id/appealId/attachmentId` | `{ url, expiresAt }` | implemented | 必须是当前评审负责人负责项目；获取 active 附件短期下载 URL |
| project-appeals | `POST` | `/review-manager/projects/:id/appeals/:appealId/handle` | `ReviewManagerAppealsController` | `ProjectAppealsService` | `SessionAuthGuard` + `RolesGuard(review_manager)` | `HandleProjectAppealDto` | `ProjectAppealDetailResponse` | implemented | 必须是当前评审负责人负责项目；`decision=accepted/rejected`；处理意见必填；处理时若 `Project.finalLevel` 缺失，会从申诉关联合议或 `appeal.levelBeforeAppeal` 兜底并懒回填；accepted 可传 `newFinalLevel` 调整 `Project.finalLevel`，仅真实等级变化写等级日志 |
| project-appeals | `GET` | `/admin/projects/:id/appeals` | `AdminAppealsController` | `ProjectAppealsService` | `SessionAuthGuard` + `RolesGuard(admin)` | path `id` | `ProjectAppealResponse[]` | implemented | admin 查看任意项目申诉 |
| project-appeals | `GET` | `/admin/projects/:id/appeals/:appealId` | `AdminAppealsController` | `ProjectAppealsService` | `SessionAuthGuard` + `RolesGuard(admin)` | path `id/appealId` | `ProjectAppealDetailResponse` | implemented | admin 查看任意项目申诉详情 |
| project-appeals | `GET` | `/admin/projects/:id/appeals/:appealId/attachments` | `AdminAppealsController` | `ProjectAppealsService` | `SessionAuthGuard` + `RolesGuard(admin)` | path `id/appealId` | `ProjectAppealAttachmentResponse[]` | implemented | admin 查看任意项目 active 申诉附件 |
| project-appeals | `GET` | `/admin/projects/:id/appeals/:appealId/attachments/:attachmentId/download-url` | `AdminAppealsController` | `ProjectAppealsService` | `SessionAuthGuard` + `RolesGuard(admin)` | path `id/appealId/attachmentId` | `{ url, expiresAt }` | implemented | admin 获取任意项目 active 附件短期下载 URL |
| project-appeals | `POST` | `/admin/projects/:id/appeals/:appealId/handle` | `AdminAppealsController` | `ProjectAppealsService` | `SessionAuthGuard` + `RolesGuard(admin)` | `HandleProjectAppealDto` | `ProjectAppealDetailResponse` | implemented | admin 兜底处理任意项目申诉；处理时同样执行最终等级兜底和懒回填；同样不修改 `ConsensusReview.finalLevel` |
| project-appeals | `GET` | `/admin/projects/:id/level-history` | `AdminAppealsController` | `ProjectAppealsService` | `SessionAuthGuard` + `RolesGuard(admin)` | path `id` | `ProjectLevelChangeLogResponse[]` | implemented | admin 查看任意项目等级变更历史；响应含 `changedByUser?: { id, name, phone? } \| null` |
| client-dashboard | `GET` | `/client/dashboard/overview` | `ClientDashboardController` | `ClientDashboardService` | `SessionAuthGuard` + `RolesGuard(client)` | `QueryClientDashboardOverviewDto` | `ClientDashboardOverviewResponse` | implemented | 甲方看板总览统计；只读查询全部 `isActive=true` 项目，支持基础字段和派生口径过滤，不写回业务数据 |
| client-dashboard | `GET` | `/client/dashboard/projects` | `ClientDashboardController` | `ClientDashboardService` | `SessionAuthGuard` + `RolesGuard(client)` | `QueryClientDashboardProjectsDto` | `{ items, page, pageSize, total }`，items 为 `ClientDashboardProjectItem[]` | implemented | 甲方看板项目钻取列表；支持分页与 overview 同口径过滤；默认按 `reviewTime` 升序、空时间排后、同时间按 `createdAt` 倒序 |

## 3.1 项目申诉最终等级有效口径

- 创建项目负责人申诉时，后端有效最终等级统一为 `effectiveFinalLevel = project.finalLevel ?? confirmedConsensus.finalLevel`；空字符串按缺失处理。
- 若没有 confirmed 合议，仍返回 `409 Confirmed consensus review is required`；若 `project.finalLevel` 和 `confirmedConsensus.finalLevel` 都缺失，仍返回 `409 Project finalLevel is required`。
- 若 `project.finalLevel` 缺失但 `confirmedConsensus.finalLevel` 有值，允许创建申诉，`levelBeforeAppeal` 使用该有效最终等级，并懒回填 `projects.finalLevel`；`projects.originalLevel` 缺失时同步回填为同一等级。
- 处理申诉时，如果 `Project.finalLevel` 缺失，会依次从申诉关联 confirmed 合议、当前项目 confirmed 合议和 `appeal.levelBeforeAppeal` 兜底；兜底成功时同样懒回填 `projects.finalLevel/originalLevel`。
- 懒回填是历史数据同步修复，不创建 `ProjectLevelChangeLog`；只有申诉处理 accepted 且 `newFinalLevel` 与当前有效等级不同才写 `source=appeal_handling` 的等级变更日志。
- 本小修未新增接口，未修改请求 / 响应结构、申诉次数上限、未处理申诉互斥、权限或附件规则。

## 3.2 专家分配锁定口径

- admin 和 review_manager 专家分配 mutation 统一由 `ProjectExpertAssignmentsService` 执行后端锁定校验；涉及：
  - `POST/PUT/DELETE /review-manager/projects/:id/experts*`
  - `PUT /review-manager/projects/experts/batch`
  - `POST/PUT/DELETE /admin/projects/:id/experts*`
  - `PUT /admin/projects/experts/batch`
- 满足任一条件即禁止追加、替换、移除专家：项目 `reviewTime` 存在且服务器当前时间已到或超过；项目存在任一 `ExpertReview`；项目存在任一 `ConsensusReview`；项目 `finalLevel/originalLevel` 已有有效值。
- 单项目 mutation 返回 `409 Conflict`，错误码为 `EXPERT_ASSIGNMENT_LOCKED`，典型响应：

```json
{
  "message": "专家名单已锁定，不能继续调整。",
  "code": "EXPERT_ASSIGNMENT_LOCKED",
  "reasons": [
    "REVIEW_TIME_REACHED",
    "EXPERT_REVIEW_EXISTS",
    "CONSENSUS_EXISTS",
    "FINAL_LEVEL_EXISTS"
  ]
}
```

- batch mutation 仍沿用逐项目结果口径；被锁项目不发生写入并在该项目结果中返回锁定消息，未锁项目按既有 append/replace 规则处理。
- GET 专家候选、GET 已分配专家、项目材料和项目摘要类读取接口不因锁定失败。

## 3.3 项目负责人内容锁定口径

- project-owner 命名空间下，满足任一条件即认为项目负责人端后续推进需求和项目材料内容已锁定：存在 `ConsensusReview.status=confirmed`；项目 `finalLevel` 有有效值；项目 `originalLevel` 有有效值。
- 锁定后以下写接口返回 `409 Conflict`，响应 `code=PROJECT_OWNER_CONTENT_LOCKED`，`message=评审结果已确认，项目材料和后续推进需求已锁定。如需补充说明，请通过申诉提交补充材料。`：
  - `PATCH /project-owner/projects/:id/follow-up-needs`
  - `POST /project-owner/projects/:id/materials`
  - `POST /project-owner/projects/:id/materials/submit`
  - `DELETE /project-owner/projects/:id/materials/:materialId`
- 锁定不影响读取：项目详情、材料列表、材料下载 URL、confirmed 合议、申诉和申诉附件读取仍可用。
- 锁定不影响申诉附件补充上传：project-owner submitted 状态申诉仍可继续上传附件；已上传申诉附件作为申诉材料留痕不可删除。
- admin 命名空间材料治理和 review-manager / expert 材料只读查看不使用该锁定错误。

## 3.4 合议确认人摘要口径

- `ConsensusReviewResponse` 和 `ProjectOwnerConsensusResponse` 兼容返回 `confirmedByUser?: { id, name, phone? } | null`；`confirmedByUserId` 保留向后兼容。
- `confirmedByUserId` 存在且用户可查到时，只返回确认人 `id/name/phone` 最小摘要，不返回密码、完整角色权限、改密状态、session/token 等敏感字段。
- `confirmedByUserId` 不存在时 `confirmedByUser` 为 `null`；存在但用户已删除或不可解析时，接口不失败，`confirmedByUser` 仍为 `null`。
- 本小修只调整合议响应展示契约，不修改 `consensus_reviews` schema、合议算法、申诉规则、专家评分、材料锁定或专家分配锁定；确认后的不可覆盖约束见 3.5。

## 3.5 confirmed 合议不可覆盖口径

- `POST /review-manager/projects/:id/consensus/confirm` 和 `POST /admin/projects/:id/consensus/confirm` 在已有 `ConsensusReview.status=confirmed` 时返回 `409 Conflict`。
- 错误码：`CONSENSUS_ALREADY_CONFIRMED`；错误消息：`最终合议结论已确认，不能在合议页重新覆盖。如需调整，请通过申诉处理或后续更正流程办理。`
- 返回 409 时不更新 `consensus_reviews.finalOpinion/finalScore/finalLevel/confirmedByUserId/confirmedAt`，也不更新 `projects.finalLevel/originalLevel`。
- draft 或无合议记录时的首次确认流程不变；确认成功仍写项目最终等级，`Project.originalLevel` 为空时同步写入。
- 本小修未修改合议草稿生成规则、合议算法、申诉规则、等级变更日志规则、专家评分、材料锁定或专家分配锁定；后续如需录入错误更正，应另行设计专门更正流程。

## 3.6 上传文件名归一化口径

- 后端 common `normalizeUploadedFilename()` 会保守修复常见 multipart 中文文件名 latin1 / Windows-1252 误读，正常中文、英文和无修复必要文件名保持不变。
- 归一化结果会清理控制字符、`/`、`\` 和路径穿越片段；空值兜底为 `unnamed-file`；不把中文删除、转拼音或改成随机用户可见名。
- `POST /project-owner/projects/:id/materials` 和 `POST /project-owner/projects/:id/appeals/:appealId/attachments` 在保存用户可见 `originalFilename`、生成 `safeFilename/objectKey` 和多文件失败明细前使用归一化结果。
- 前端继续展示后端返回的 `originalFilename`，不在 React 组件中做编码猜测或解码 hack。
- 历史已入库乱码文件名本次不批量修复，不新增迁移脚本，不重命名 OSS object，不修改 OSS 配置、schema、权限或申诉 / 材料规则。

## 3.7 申诉附件留痕与删除接口口径

- 申诉创建前本地待上传文件仍可由前端移除；申诉提交成功后，已上传附件立即成为申诉材料留痕。
- project-owner 只能在申诉 `submitted` 状态继续补充上传附件；新补充上传成功后的附件同样不可删除。
- 申诉进入 `processing/accepted/rejected/canceled` 等非 `submitted` 状态后，project-owner 不可继续上传附件；review_manager / admin 仍只读查看和下载附件。
- `DELETE /project-owner/projects/:id/appeals/:appealId/attachments/:attachmentId` 保留路由但不再软删除，统一返回 `409 Conflict`，`code=PROJECT_APPEAL_ATTACHMENT_DELETE_NOT_ALLOWED`，`message=申诉附件提交后将作为申诉材料留痕，不能删除。申诉处理前可继续补充上传材料。`
- 本口径不修改申诉处理规则、申诉次数规则、申诉状态流转、附件上传规则、下载 URL、OSS 配置、schema 或迁移。

## 3.8 等级变更历史用户摘要口径

- `GET /project-owner/projects/:id/level-history` 与 `GET /admin/projects/:id/level-history` 的每条记录保留 `changedByUserId`，并补充 `changedByUser?: { id, name, phone? } | null`。
- `changedByUserId` 可解析时只返回用户最小摘要 `id/name/phone`，不返回密码、角色权限、改密状态、session/token 等敏感字段。
- 用户不存在或不可解析时 `changedByUser=null`，接口不失败。
- 本口径只调整响应展示契约，不修改 `ProjectLevelChangeLog` schema、等级变更日志生成规则、申诉处理规则、合议、项目材料锁定或专家分配锁定。

## 3.9 甲方看板统计 API 口径

- `/client/dashboard/*` 只开放 `client` 角色，不开放 admin / review-manager / expert / project-owner 命名空间的新接口。
- 本阶段 client 可见全部 `isActive=true` 项目；不做单位、行政区划、处室账号绑定或细粒度数据隔离。
- overview 和 projects 均支持 `batchId/projectTypeId/statusId/departmentId/disciplineId/reviewManagerId/reviewSchemeId/finalLevel/progressStage/hasMeetingUrl/hasPendingAppeal/keyword` 过滤；projects 额外支持 `page/pageSize`。
- 有效最终等级为 `trim(Project.finalLevel) || trim(confirmed ConsensusReview.finalLevel) || ''`；项目最终等级优先，原始等级只展示，不参与计算；本接口不写回 `Project.finalLevel` 或 `ConsensusReview.finalLevel`。
- 材料只统计 `ProjectMaterial.status=submitted` 且 `deletedAt` 为空或不存在；`draft/active/deleted` 不计入 submitted 材料统计。
- 专家分配只统计 `ProjectExpertAssignment.status=assigned`；专家评分只统计 `ExpertReview.status=submitted`；完成口径为 `assignedExpertCount > 0 && submittedExpertReviewCount >= assignedExpertCount`。
- 合议 `confirmed` 计入 `consensus_confirmed`；`draft/reopened` 计入 `consensus_draft`；申诉 pending 为 `submitted/processing`，handled 为 `accepted/rejected/canceled`。
- `hasMeetingUrl` 按 `meetingUrl.trim()` 是否非空判断；projects 返回 `meetingUrl/reviewTime/reviewLocation` 供前端后续展示评审现场监管入口。
- 进度阶段可多选命中，`progressStage` 过滤表示项目命中该阶段；`primaryStage` 按 `appeal_pending > final_level_set > consensus_confirmed > consensus_draft > expert_reviews_completed > expert_reviews_started > materials_submitted > experts_assigned > scheduled > review_assigned > imported` 取最高阶段。

## 4. 列表返回结构口径

- 非分页数组：`GET /admin/dictionaries`、`GET /admin/tree-dictionaries`、`GET /admin/review-schemes`
- 分页对象：`GET /admin/users`、`GET /admin/batches`、`GET /admin/organizations`、`GET /admin/projects`、`GET /admin/project-imports`、`GET /admin/project-imports/:id/rows`、`GET /review-manager/projects`、`GET /project-owner/projects`、`GET /expert/projects`、`GET /expert/review-tasks`、`GET /client/dashboard/projects`、专家候选列表
- 非分页材料数组：`GET /project-owner/projects/:id/materials`、`GET /review-manager/projects/:id/materials`、`GET /expert/projects/:id/materials`、`GET /admin/projects/:id/materials`；项目负责人/admin 返回 `draft/submitted/legacy active`，评审负责人/专家只返回 `submitted`
- 非分页申诉数组：单项目 `appeals` 列表最多 3 条，返回数组；单个申诉 `attachments` 列表返回 active 附件数组；`level-history` 返回等级变更日志数组
- 非分页字段映射配置对象：`GET /admin/project-import-field-mappings/standard-fields` 和 `GET /admin/project-import-field-mappings` 返回 `{ items }`；配置列表始终覆盖所有固定标准字段
- 门户端只读基础数据对象：`GET /portal/reference-data/dictionaries`、`tree-dictionaries`、`batches`、`organizations`、`review-schemes`、`users` 均返回 `{ items }`；不分页；只返回展示所需最小字段；不提供 POST/PATCH/DELETE
- 管理员用户列表已实现分页对象，`pageSize` 最大 `1000`；当前只返回单位/学科 ID，不 populate 名称
- 后续审计类或跨项目长列表仍建议分页；当前单项目申诉列表和附件列表按本阶段小数据量返回数组

## 5. 管理端权限口径

- 未登录访问 `/admin/*`：`SessionAuthGuard` 返回 `401`
- 已登录但无 `admin` 角色访问 `/admin/*`：`RolesGuard` 返回 `403`
- 已登录且具备 `admin` 角色：允许访问本阶段管理接口
- 门户参考数据 `/portal/reference-data/*`：要求 `SessionAuthGuard` 登录，允许 `project_owner/expert/review_manager/client/admin` 读取；无角色或非允许角色返回 `403`；`users` 摘要接口禁止查询 `admin` 角色且不返回含 `admin` 角色用户
- 甲方看板 `/client/dashboard/*`：要求 `SessionAuthGuard` 登录和 `client` 角色；未登录返回 `401`，登录但非 client 返回 `403`；admin / review_manager / expert / project_owner 不通过该命名空间获得看板权限

## 6. 状态建议

- `planned`
- `implemented`
- `deprecated`
- `removed`
- `pending-review`

## 7. 维护规则

- 新增 API 必须补充本文档
- 修改路径、方法、权限、请求体、响应结构时必须同步本文档
- 删除或废弃 API 时必须标注状态
- 不得把未实现 API 写成 `implemented`
