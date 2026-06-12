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
| organizations | `POST/GET:id/PATCH:id/DELETE:id` | `/admin/organizations` | `OrganizationsController` | `OrganizationsService` | `SessionAuthGuard` + `RolesGuard(admin)` | `CreateOrganizationDto`、`UpdateOrganizationDto`、path `id` | `OrganizationResponse` | implemented | `regionId` 必须是 `treeType=region`；`name` 唯一；delete 为停用 |
| review-schemes | `GET` | `/admin/review-schemes` | `ReviewSchemesController` | `ReviewSchemesService` | `SessionAuthGuard` + `RolesGuard(admin)` | `QueryReviewSchemesDto` | `ReviewSchemeResponse[]` | implemented | 不分页，返回数组；支持 `keyword/isActive` |
| review-schemes | `POST/GET:id/PATCH:id/DELETE:id` | `/admin/review-schemes` | `ReviewSchemesController` | `ReviewSchemesService` | `SessionAuthGuard` + `RolesGuard(admin)` | `CreateReviewSchemeDto`、`UpdateReviewSchemeDto`、path `id` | `ReviewSchemeResponse` | implemented | items 至少 1 项；`totalScore` 后端计算；delete 为停用 |
| projects | `GET` | `/admin/projects` | `ProjectsController` | `ProjectsService` | `SessionAuthGuard` + `RolesGuard(admin)` | `QueryProjectsDto` | `{ items, page, pageSize, total }` | implemented | 保留分页；`page=1`、`pageSize=100`、最大 `1000`；支持 `batchId/keyword/isActive/reviewManagerId/reviewSchemeId/projectTypeId/statusId/departmentId/disciplineId/hasReviewManager/hasReviewScheme` |
| projects | `POST/GET:id/PATCH:id/DELETE:id` | `/admin/projects` | `ProjectsController` | `ProjectsService` | `SessionAuthGuard` + `RolesGuard(admin)` | `CreateProjectDto`、`UpdateProjectDto`、path `id` | `ProjectResponse` | implemented | 校验批次、字典/树类型、用户角色、单位和启用评审方案；`batchId+projectNo` 唯一；delete 为停用 |
| projects | `PATCH` | `/admin/projects/:id/review-assignment` | `ProjectsController` | `ProjectsService` | `SessionAuthGuard` + `RolesGuard(admin)` | `UpdateReviewAssignmentDto` | `ProjectResponse` | implemented | 设置项目评审负责人和/或评审方案；`reviewManagerId` 必须是启用 `review_manager` 用户；`reviewSchemeId` 必须是启用方案，并写入 `reviewSchemeSnapshot` |
| projects | `PATCH` | `/admin/projects/review-assignment/batch` | `ProjectsController` | `ProjectsService` | `SessionAuthGuard` + `RolesGuard(admin)` | `BatchUpdateReviewAssignmentDto` | `{ successCount, failedCount, failures }` | implemented | 对多个项目设置同一评审负责人和/或评审方案；单项目失败不影响其他项目 |
| projects | `PATCH` | `/admin/projects/:id/schedule` | `ProjectsController` | `ProjectsService` | `SessionAuthGuard` + `RolesGuard(admin)` | `UpdateProjectScheduleDto` | `ProjectResponse` | implemented | 管理员兜底维护评审时间、地点、meetingUrl；不调用腾讯会议 API |
| project-expert-assignments | `GET` | `/admin/projects/:id/expert-candidates` | `AdminProjectExpertCandidatesController` | `ProjectExpertAssignmentsService` | `SessionAuthGuard` + `RolesGuard(admin)` | `QueryExpertCandidatesDto` | `{ items, page, pageSize, total, reason? }` | implemented | 管理员兜底查看专家候选；候选按 expert 角色、启用状态、学科匹配、承担单位/合作单位回避过滤，已分配专家标记 `assigned=true` |
| projects | `GET` | `/review-manager/projects` | `ReviewManagerProjectsController` | `ProjectsService` | `SessionAuthGuard` + `RolesGuard(review_manager/admin)` | `QueryReviewManagerProjectsDto` | `{ items, page, pageSize, total }` | implemented | `review_manager` 只返回自己负责的启用项目；admin 兜底可访问并按过滤条件返回启用项目；支持 `batchId/keyword/reviewSchemeId/statusId` |
| projects | `PATCH` | `/review-manager/projects/:id/schedule` | `ReviewManagerProjectsController` | `ProjectsService` | `SessionAuthGuard` + `RolesGuard(review_manager/admin)` | `UpdateProjectScheduleDto` | `ProjectResponse` | implemented | 非 admin 必须是项目 `reviewManagerId`；只更新 `reviewTime/reviewLocation/meetingUrl` |
| project-expert-assignments | `GET` | `/review-manager/projects/:id/expert-candidates` | `ProjectExpertAssignmentsController` | `ProjectExpertAssignmentsService` | `SessionAuthGuard` + `RolesGuard(review_manager/admin)` | `QueryExpertCandidatesDto` | `{ items, page, pageSize, total, reason? }` | implemented | 项目无学科返回空分页和 `reason=project_discipline_missing`；不返回 `passwordHash` |
| project-expert-assignments | `GET` | `/review-manager/projects/:id/experts` | `ProjectExpertAssignmentsController` | `ProjectExpertAssignmentsService` | `SessionAuthGuard` + `RolesGuard(review_manager/admin)` | path `id` | `ExpertBasicResponse[]` | implemented | 返回当前 `status=assigned` 专家基本信息，不返回 `passwordHash` |
| project-expert-assignments | `POST` | `/review-manager/projects/:id/experts` | `ProjectExpertAssignmentsController` | `ProjectExpertAssignmentsService` | `SessionAuthGuard` + `RolesGuard(review_manager/admin)` | `AppendProjectExpertsDto` | `{ assignedExperts, successCount, failedCount, failures }` | implemented | 追加一个或多个专家；逐专家校验；重复添加已分配专家幂等成功 |
| project-expert-assignments | `PUT` | `/review-manager/projects/:id/experts` | `ProjectExpertAssignmentsController` | `ProjectExpertAssignmentsService` | `SessionAuthGuard` + `RolesGuard(review_manager/admin)` | `UpdateProjectExpertsDto` | `{ assignedExperts, addedOrRestoredCount, removedCount }` | implemented | 用传入集合替换当前专家；允许空数组清空；任一专家不合规则整体 `409` 拒绝 |
| project-expert-assignments | `DELETE` | `/review-manager/projects/:id/experts/:expertUserId` | `ProjectExpertAssignmentsController` | `ProjectExpertAssignmentsService` | `SessionAuthGuard` + `RolesGuard(review_manager/admin)` | path `id/expertUserId` | `{ removed, alreadyRemoved }` | implemented | 标记 `status=removed`，不物理删除；已 removed 再移除幂等成功 |
| project-expert-assignments | `PUT` | `/review-manager/projects/experts/batch` | `ProjectExpertAssignmentsController` | `ProjectExpertAssignmentsService` | `SessionAuthGuard` + `RolesGuard(review_manager/admin)` | `BatchProjectExpertsDto` | `{ successCount, failedCount, results }` | implemented | `mode=append/replace`；逐项目校验权限和专家规则，项目间互不影响 |
| project-imports | `POST` | `/admin/project-imports/upload` | `ProjectImportsController` | `ProjectImportsService` | `SessionAuthGuard` + `RolesGuard(admin)` | multipart `file` + `UploadProjectImportDto` | `ProjectImportJobResponse` | implemented | 仅允许 `.xlsx/.xls`，10MB 上限；使用 `xlsx` 解析第一个工作表；缺关键表头或无有效数据行返回 `400`；不保存原 Excel 文件 |
| project-imports | `GET` | `/admin/project-imports` | `ProjectImportsController` | `ProjectImportsService` | `SessionAuthGuard` + `RolesGuard(admin)` | `QueryProjectImportJobsDto` | `{ items, page, pageSize, total }` | implemented | 任务列表分页，`pageSize` 最大 `1000`；支持 `status/batchId/keyword` |
| project-imports | `GET` | `/admin/project-imports/:id` | `ProjectImportsController` | `ProjectImportsService` | `SessionAuthGuard` + `RolesGuard(admin)` | path `id` | `ProjectImportJobResponse` | implemented | 返回任务基本信息、字段映射快照和统计计数，不内联全部 rows |
| project-imports | `GET` | `/admin/project-imports/:id/rows` | `ProjectImportsController` | `ProjectImportsService` | `SessionAuthGuard` + `RolesGuard(admin)` | `QueryProjectImportRowsDto` | `{ items, page, pageSize, total }` | implemented | 导入行分页，`pageSize` 最大 `1000`；支持 `status/keyword` |
| project-imports | `PATCH` | `/admin/project-imports/:id/rows/:rowId` | `ProjectImportsController` | `ProjectImportsService` | `SessionAuthGuard` + `RolesGuard(admin)` | `UpdateProjectImportRowDto` | `ProjectImportRowResponse` | implemented | 人工修正 normalized/resolved；可创建单位和项目负责人用户；不可创建项目类型、学科、受理处室、项目状态 |
| project-imports | `POST` | `/admin/project-imports/:id/rows/:rowId/confirm` | `ProjectImportsController` | `ProjectImportsService` | `SessionAuthGuard` + `RolesGuard(admin)` | 无 | `ProjectImportRowResponse` | implemented | 仅 `importable` 可确认；创建或更新 Project，记录 `projectId/confirmedByUserId/confirmedAt` |
| project-imports | `POST` | `/admin/project-imports/:id/confirm` | `ProjectImportsController` | `ProjectImportsService` | `SessionAuthGuard` + `RolesGuard(admin)` | 无 | `{ successCount, failedCount, skippedCount }` | implemented | 批量处理所有 `importable` 行；`pending_confirmation/skipped/confirmed` 行跳过 |
| project-imports | `POST` | `/admin/project-imports/:id/rows/:rowId/skip` | `ProjectImportsController` | `ProjectImportsService` | `SessionAuthGuard` + `RolesGuard(admin)` | 无 | `ProjectImportRowResponse` | implemented | `importable/pending_confirmation/failed` 可跳过；`confirmed` 返回 `409` |
| project-owner-projects | `GET` | `/project-owner/projects` | `ProjectOwnerProjectsController` | `ProjectMaterialsService` | `SessionAuthGuard` + `RolesGuard(project_owner)` | `QueryProjectOwnerProjectsDto` | `{ items, page, pageSize, total }` | implemented | 只返回当前用户 `ownerUserId` 对应的启用项目；分页默认 `page=1/pageSize=100`，最大 `1000`；返回评审安排、`followUpNeeds` 和 `materialCount` |
| project-owner-projects | `GET` | `/project-owner/projects/:id` | `ProjectOwnerProjectsController` | `ProjectMaterialsService` | `SessionAuthGuard` + `RolesGuard(project_owner)` | path `id` | `ProjectPortalResponse` | implemented | 当前用户必须是项目负责人；返回项目基础信息、评审负责人/方案摘要、评审安排、`followUpNeeds` 和 `materialCount` |
| project-owner-projects | `PATCH` | `/project-owner/projects/:id/follow-up-needs` | `ProjectOwnerProjectsController` | `ProjectMaterialsService` | `SessionAuthGuard` + `RolesGuard(project_owner)` | `UpdateFollowUpNeedsDto` | `ProjectPortalResponse` | implemented | 仅更新 `Project.followUpNeeds`；字符串 trim，最长 5000，允许空字符串清空 |
| project-materials | `GET` | `/project-owner/projects/:id/materials` | `ProjectOwnerMaterialsController` | `ProjectMaterialsService` | `SessionAuthGuard` + `RolesGuard(project_owner)` | `QueryProjectMaterialsDto` | `ProjectMaterialResponse[]` | implemented | 当前用户必须是项目负责人；只返回 `active` 材料；支持 `materialTypeId` 过滤；不分页 |
| project-materials | `POST` | `/project-owner/projects/:id/materials` | `ProjectOwnerMaterialsController` | `ProjectMaterialsService` | `SessionAuthGuard` + `RolesGuard(project_owner)` | multipart `files` + `UploadProjectMaterialsDto` | `{ materials, successCount, failedCount, failures }` | implemented | 文件字段名 `files`，单次最多 20 个，单文件最大 500MB；材料类型必须是启用 `dictType=material_type`；使用 storage 上传后写入 `ProjectMaterial` |
| project-materials | `GET` | `/project-owner/projects/:id/materials/:materialId/download-url` | `ProjectOwnerMaterialsController` | `ProjectMaterialsService` | `SessionAuthGuard` + `RolesGuard(project_owner)` | path `id/materialId` | `{ url, expiresAt }` | implemented | 当前用户必须是项目负责人；材料必须属于项目且 `active`；默认 10 分钟签名 URL |
| project-materials | `DELETE` | `/project-owner/projects/:id/materials/:materialId` | `ProjectOwnerMaterialsController` | `ProjectMaterialsService` | `SessionAuthGuard` + `RolesGuard(project_owner)` | path `id/materialId` | `{ deleted, alreadyDeleted }` | implemented | 软删除，记录 `deletedAt/deletedByUserId`；不物理删除 OSS object；重复删除幂等成功 |
| project-materials | `GET` | `/review-manager/projects/:id/materials` | `ReviewManagerMaterialsController` | `ProjectMaterialsService` | `SessionAuthGuard` + `RolesGuard(review_manager/admin)` | `QueryProjectMaterialsDto` | `ProjectMaterialResponse[]` | implemented | 非 admin 必须是项目 `reviewManagerId`；只读 active 材料，支持 `materialTypeId`，不分页 |
| project-materials | `GET` | `/review-manager/projects/:id/materials/:materialId/download-url` | `ReviewManagerMaterialsController` | `ProjectMaterialsService` | `SessionAuthGuard` + `RolesGuard(review_manager/admin)` | path `id/materialId` | `{ url, expiresAt }` | implemented | 非 admin 必须是项目 `reviewManagerId`；材料必须属于项目且 `active` |
| expert-projects | `GET` | `/expert/projects` | `ExpertMaterialsController` | `ProjectMaterialsService` | `SessionAuthGuard` + `RolesGuard(expert)` | `QueryExpertProjectsDto` | `{ items, page, pageSize, total }` | implemented | 只返回当前专家 `status=assigned` 的启用项目；支持 `batchId/keyword/statusId`；返回评审安排和 `materialCount` |
| expert-projects | `GET` | `/expert/projects/:id` | `ExpertMaterialsController` | `ProjectMaterialsService` | `SessionAuthGuard` + `RolesGuard(expert)` | path `id` | `ProjectPortalResponse` | implemented | 当前专家必须已分配到项目且 `status=assigned`；返回项目基础信息、评审安排、`followUpNeeds` 和材料摘要 |
| project-materials | `GET` | `/expert/projects/:id/materials` | `ExpertMaterialsController` | `ProjectMaterialsService` | `SessionAuthGuard` + `RolesGuard(expert)` | `QueryProjectMaterialsDto` | `ProjectMaterialResponse[]` | implemented | 当前专家必须已分配到项目；只读 active 材料，支持 `materialTypeId`，不分页 |
| project-materials | `GET` | `/expert/projects/:id/materials/:materialId/download-url` | `ExpertMaterialsController` | `ProjectMaterialsService` | `SessionAuthGuard` + `RolesGuard(expert)` | path `id/materialId` | `{ url, expiresAt }` | implemented | 当前专家必须已分配到项目；材料必须属于项目且 `active` |
| project-materials | `GET` | `/admin/projects/:id/materials` | `AdminMaterialsController` | `ProjectMaterialsService` | `SessionAuthGuard` + `RolesGuard(admin)` | `QueryProjectMaterialsDto` | `ProjectMaterialResponse[]` | implemented | admin 可查看任意项目 active 材料；支持 `materialTypeId`，不分页 |
| project-materials | `GET` | `/admin/projects/:id/materials/:materialId/download-url` | `AdminMaterialsController` | `ProjectMaterialsService` | `SessionAuthGuard` + `RolesGuard(admin)` | path `id/materialId` | `{ url, expiresAt }` | implemented | admin 可获取任意项目 active 材料的短期签名 URL |
| expert-reviews | `GET` | `/expert/review-tasks` | `ExpertReviewTasksController` | `ExpertReviewsService` | `SessionAuthGuard` + `RolesGuard(expert)` | `QueryExpertReviewTasksDto` | `{ items, page, pageSize, total }` | implemented | 只返回当前专家 `status=assigned` 的启用项目；支持 `batchId/keyword/status/reviewManagerId/reviewSchemeId`；无评分显示 `not_started` |
| expert-reviews | `GET` | `/expert/review-tasks/:projectId` | `ExpertReviewTasksController` | `ExpertReviewsService` | `SessionAuthGuard` + `RolesGuard(expert)` | path `projectId` | `{ project, materialCount, materials, reviewSchemeSnapshot, review }` | implemented | 当前专家必须已分配；项目无 `reviewSchemeSnapshot` 返回 `409`；无评分时返回空评分结构 |
| expert-reviews | `PUT` | `/expert/review-tasks/:projectId` | `ExpertReviewTasksController` | `ExpertReviewsService` | `SessionAuthGuard` + `RolesGuard(expert)` | `SaveExpertReviewDto` | `ExpertReviewResponse` | implemented | 保存草稿；仅 `draft/returned/not_started` 可写；`submitted` 返回 `409`；`totalScore` 后端计算 |
| expert-reviews | `POST` | `/expert/review-tasks/:projectId/submit` | `ExpertReviewTasksController` | `ExpertReviewsService` | `SessionAuthGuard` + `RolesGuard(expert)` | `SaveExpertReviewDto` | `ExpertReviewResponse` | implemented | 提交最终评分；完整校验 score、评价描述、改进建议条件必填；重复 submitted 返回 `409` |
| expert-reviews | `GET` | `/review-manager/projects/:id/expert-reviews` | `ReviewManagerExpertReviewsController` | `ExpertReviewsService` | `SessionAuthGuard` + `RolesGuard(review_manager/admin)` | path `id` | `ReviewManagerExpertReviewListItem[]` | implemented | 非 admin 必须是项目 `reviewManagerId`；返回已分配专家评分状态，未创建评分显示 `not_started` |
| expert-reviews | `GET` | `/review-manager/projects/:id/expert-reviews/:expertUserId` | `ReviewManagerExpertReviewsController` | `ExpertReviewsService` | `SessionAuthGuard` + `RolesGuard(review_manager/admin)` | path `id/expertUserId` | `ExpertReviewResponse` 或 `not_started` 结构 | implemented | expert 必须是当前或曾经分配且有评分记录；不返回 `passwordHash` |
| expert-reviews | `POST` | `/review-manager/projects/:id/expert-reviews/:expertUserId/return` | `ReviewManagerExpertReviewsController` | `ExpertReviewsService` | `SessionAuthGuard` + `RolesGuard(review_manager/admin)` | `ReturnExpertReviewDto` | `ExpertReviewResponse` | implemented | 仅 `submitted` 可退回；写 `returnedAt/returnedByUserId/returnReason`；专家可重新编辑提交 |
| expert-reviews | `GET` | `/review-manager/projects/:id/review-summary` | `ReviewManagerExpertReviewsController` | `ExpertReviewsService` | `SessionAuthGuard` + `RolesGuard(review_manager/admin)` | path `id` | `ReviewSummaryResponse` | implemented | 仅 submitted 评分参与分数统计；无 submitted 时分数统计为 `null` |
| expert-reviews | `GET` | `/admin/projects/:id/expert-reviews` | `AdminExpertReviewsController` | `ExpertReviewsService` | `SessionAuthGuard` + `RolesGuard(admin)` | path `id` | `ReviewManagerExpertReviewListItem[]` | implemented | admin 可查看任意项目专家评分状态 |
| expert-reviews | `GET` | `/admin/projects/:id/expert-reviews/:expertUserId` | `AdminExpertReviewsController` | `ExpertReviewsService` | `SessionAuthGuard` + `RolesGuard(admin)` | path `id/expertUserId` | `ExpertReviewResponse` 或 `not_started` 结构 | implemented | admin 可查看任意项目某专家评分详情 |
| expert-reviews | `GET` | `/admin/projects/:id/review-summary` | `AdminExpertReviewsController` | `ExpertReviewsService` | `SessionAuthGuard` + `RolesGuard(admin)` | path `id` | `ReviewSummaryResponse` | implemented | admin 可查看任意项目评分汇总 |
| consensus-reviews | `POST` | `/review-manager/projects/:id/consensus/draft` | `ReviewManagerConsensusController` | `ConsensusReviewsService` | `SessionAuthGuard` + `RolesGuard(review_manager/admin)` | query `force` | `ConsensusReviewResponse` | implemented | 基于 submitted 专家评分生成 `rule_based` 草稿；无 submitted 返回 `409`；已有 draft 默认 `409`，`force=true` 可覆盖；confirmed 后不可覆盖 |
| consensus-reviews | `GET` | `/review-manager/projects/:id/consensus` | `ReviewManagerConsensusController` | `ConsensusReviewsService` | `SessionAuthGuard` + `RolesGuard(review_manager/admin)` | path `id` | `ConsensusReviewResponse` | implemented | 非 admin 必须是项目 `reviewManagerId`；未生成返回 `404` |
| consensus-reviews | `POST` | `/review-manager/projects/:id/consensus/confirm` | `ReviewManagerConsensusController` | `ConsensusReviewsService` | `SessionAuthGuard` + `RolesGuard(review_manager/admin)` | `ConfirmConsensusReviewDto` | `ConsensusReviewResponse` | implemented | 人工确认合议；校验 finalOpinion/finalScore/finalLevel；写 ConsensusReview 和 Project 等级字段 |
| consensus-reviews | `GET` | `/admin/projects/:id/consensus` | `AdminConsensusController` | `ConsensusReviewsService` | `SessionAuthGuard` + `RolesGuard(admin)` | path `id` | `ConsensusReviewResponse` | implemented | admin 可查看任意项目合议记录 |
| consensus-reviews | `POST` | `/admin/projects/:id/consensus/confirm` | `AdminConsensusController` | `ConsensusReviewsService` | `SessionAuthGuard` + `RolesGuard(admin)` | `ConfirmConsensusReviewDto` | `ConsensusReviewResponse` | implemented | admin 可兜底确认任意项目合议 |

## 4. 列表返回结构口径

- 非分页数组：`GET /admin/dictionaries`、`GET /admin/tree-dictionaries`、`GET /admin/review-schemes`
- 分页对象：`GET /admin/batches`、`GET /admin/organizations`、`GET /admin/projects`、`GET /admin/project-imports`、`GET /admin/project-imports/:id/rows`、`GET /review-manager/projects`、`GET /project-owner/projects`、`GET /expert/projects`、`GET /expert/review-tasks`、专家候选列表
- 非分页材料数组：`GET /project-owner/projects/:id/materials`、`GET /review-manager/projects/:id/materials`、`GET /expert/projects/:id/materials`、`GET /admin/projects/:id/materials`
- 当前尚未实现管理员用户列表；未来用户列表应保留分页，`pageSize` 最大 `1000`
- 后续申诉、材料、审计类记录仍建议分页，但当前未实现

## 5. 管理端权限口径

- 未登录访问 `/admin/*`：`SessionAuthGuard` 返回 `401`
- 已登录但无 `admin` 角色访问 `/admin/*`：`RolesGuard` 返回 `403`
- 已登录且具备 `admin` 角色：允许访问本阶段管理接口

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
