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

## 4. 列表返回结构口径

- 非分页数组：`GET /admin/dictionaries`、`GET /admin/tree-dictionaries`、`GET /admin/review-schemes`
- 分页对象：`GET /admin/batches`、`GET /admin/organizations`、`GET /admin/projects`、`GET /admin/project-imports`、`GET /admin/project-imports/:id/rows`、`GET /review-manager/projects`、专家候选列表
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
