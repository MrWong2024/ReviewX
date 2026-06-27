# ReviewX 前端 API 对接地图

## 1. API Client

- 文件：`frontend/src/lib/api/client.ts`
- baseUrl：`NEXT_PUBLIC_API_BASE_URL`
- 默认值：`http://localhost:5001`
- fetch 默认 `credentials: 'include'`
- JSON 请求默认设置 `Content-Type: application/json`
- `FormData` 请求不手动设置 `Content-Type`
- 非 2xx 响应抛出 `ApiError`
- `ApiError` 包含 `status`、`code`、`message`、`details`
- 当前不使用 token，不读取 Cookie

## 2. Auth API

| 前端函数 | 后端接口 | 文件 | 状态 |
| --- | --- | --- | --- |
| `login` | `POST /auth/login` | `frontend/src/features/auth/api.ts` | implemented |
| `getCurrentUser` | `GET /auth/me` | `frontend/src/features/auth/api.ts` | implemented |
| `logout` | `POST /auth/logout` | `frontend/src/features/auth/api.ts` | implemented |

## 3. Admin API

| 前端函数 | 后端接口 | 返回口径 | 页面 |
| --- | --- | --- | --- |
| `listUsers` | `GET /admin/users` | 分页对象；不返回 `passwordHash` | `/admin/users` |
| `getUser` | `GET /admin/users/:id` | 单对象；不返回 `passwordHash` | `/admin/users` 后续扩展 |
| `createUser` | `POST /admin/users` | 单对象；密码可空，空则后端默认手机号；不返回 `passwordHash` | `/admin/users` |
| `updateUser` | `PATCH /admin/users/:id` | 单对象；只提交 `name/roles/isActive/organizationIds/disciplineIds/mustChangePassword`；不提交 `phone/password/passwordHash` | `/admin/users` |
| `updateUserStatus` | `PATCH /admin/users/:id/status` | 单对象；启用/停用；不返回 `passwordHash` | `/admin/users` |
| `resetUserPassword` | `POST /admin/users/:id/reset-password` | 单对象；密码可空，空则后端默认手机号；不返回 `passwordHash` | `/admin/users` |
| `listBatches` | `GET /admin/batches` | 分页对象 | `/admin/batches`、`/admin/projects` |
| `createBatch` | `POST /admin/batches` | 单对象 | `/admin/batches` |
| `updateBatch` | `PATCH /admin/batches/:id` | 单对象 | `/admin/batches` |
| `deleteBatch` | `DELETE /admin/batches/:id` | 单对象，后端停用语义 | `/admin/batches` |
| `listDictionaries` | `GET /admin/dictionaries` | 数组 | `/admin/dictionaries`、`/admin/projects` |
| `createDictionary` | `POST /admin/dictionaries` | 单对象 | `/admin/dictionaries` |
| `updateDictionary` | `PATCH /admin/dictionaries/:id` | 单对象 | `/admin/dictionaries` |
| `deleteDictionary` | `DELETE /admin/dictionaries/:id` | 单对象，后端停用语义 | `/admin/dictionaries` |
| `listTreeDictionaries` | `GET /admin/tree-dictionaries` | 数组 | `/admin/tree-dictionaries`、`/admin/organizations`、`/admin/projects` |
| `createTreeDictionary` | `POST /admin/tree-dictionaries` | 单对象 | `/admin/tree-dictionaries` |
| `updateTreeDictionary` | `PATCH /admin/tree-dictionaries/:id` | 单对象 | `/admin/tree-dictionaries` |
| `deleteTreeDictionary` | `DELETE /admin/tree-dictionaries/:id` | 单对象；有子节点可能 409 | `/admin/tree-dictionaries` |
| `listOrganizations` | `GET /admin/organizations` | 分页对象 | `/admin/organizations`、`/admin/projects` |
| `createOrganization` | `POST /admin/organizations` | 单对象 | `/admin/organizations` |
| `updateOrganization` | `PATCH /admin/organizations/:id` | 单对象 | `/admin/organizations` |
| `deleteOrganization` | `DELETE /admin/organizations/:id` | 单对象，后端停用语义 | `/admin/organizations` |
| `listReviewSchemes` | `GET /admin/review-schemes` | 数组 | `/admin/review-schemes`、`/admin/projects` |
| `createReviewScheme` | `POST /admin/review-schemes` | 单对象 | `/admin/review-schemes` |
| `updateReviewScheme` | `PATCH /admin/review-schemes/:id` | 单对象 | `/admin/review-schemes` |
| `deleteReviewScheme` | `DELETE /admin/review-schemes/:id` | 单对象，后端停用语义 | `/admin/review-schemes` |
| `listProjects` | `GET /admin/projects` | 分页对象；支持 `page/pageSize/batchId/projectTypeId/statusId/departmentId/disciplineId/reviewManagerId/reviewSchemeId/hasReviewManager/hasReviewScheme/keyword/isActive` | `/admin/projects` |
| `getProject` | `GET /admin/projects/:id` | `Project` | `/admin/projects/[projectId]/review-organization` |
| `listAdminProjectMaterials` | `GET /admin/projects/:id/materials` | `AdminProjectMaterial[]`；管理员可见 `draft/submitted/legacy active`，`deleted` 仅作 legacy 兜底；不传臆造查询参数 | `/admin/projects/[projectId]/review-organization` |
| `getAdminProjectMaterialDownloadUrl` | `GET /admin/projects/:id/materials/:materialId/download-url` | 兼容后端返回 `string`、`{ url }`、`{ downloadUrl }`；只打开后端返回 URL，不在前端拼接 OSS objectKey | `/admin/projects/[projectId]/review-organization` |
| `deleteAdminProjectMaterial` | `DELETE /admin/projects/:id/materials/:materialId` | 请求体 `{ reason: string }` 必填，trim 后不能为空且最长 1000；成功返回 `{ deleted, deletionLogId }`；前端不展示删除日志，不乐观移除 | `/admin/projects/[projectId]/review-organization` |
| `updateProjectReviewAssignment` | `PATCH /admin/projects/:id/review-assignment` | `Project`；至少提交负责人或方案之一；设置方案时后端生成 `reviewSchemeSnapshot` | `/admin/projects`、`/admin/projects/[projectId]/review-organization` |
| `batchUpdateProjectReviewAssignment` | `PATCH /admin/projects/review-assignment/batch` | `{ successCount, failedCount, failures }`；部分失败显示明细 | `/admin/projects` |
| `updateProjectSchedule` | `PATCH /admin/projects/:id/schedule` | `Project`；只保存 `reviewTime/reviewLocation/meetingUrl`，不接腾讯会议 API | `/admin/projects/[projectId]/review-organization` |
| `listProjectExpertCandidates` | `GET /admin/projects/:id/expert-candidates` | `{ items, page, pageSize, total, reason? }`；候选由后端按学科匹配并回避承担单位/合作单位 | `/admin/projects/[projectId]/review-organization` |
| `listAssignedProjectExperts` | `GET /admin/projects/:id/experts` | `ExpertBasic[]`；管理员全局专家分配命名空间；已分配专家可带 `hasReviewRecord/reviewStatus`，用于展示评分状态并参与专家名单锁定提示 | `/admin/projects/[projectId]/review-organization` |
| `appendProjectExperts` | `POST /admin/projects/:id/experts` | `{ assignedExperts, successCount, failedCount, failures }`；逐专家返回失败原因；项目专家名单已锁定时返回 `409 EXPERT_ASSIGNMENT_LOCKED` | `/admin/projects/[projectId]/review-organization` |
| `replaceProjectExperts` | `PUT /admin/projects/:id/experts` | `{ assignedExperts, addedOrRestoredCount, removedCount }`；专家名单锁定时返回 `409 EXPERT_ASSIGNMENT_LOCKED`，前端禁用替换并展示锁定原因 | `/admin/projects/[projectId]/review-organization` |
| `removeProjectExpert` | `DELETE /admin/projects/:id/experts/:expertUserId` | `{ removed, alreadyRemoved }`；专家名单锁定时返回 `409 EXPERT_ASSIGNMENT_LOCKED`，前端禁用移除并展示锁定原因 | `/admin/projects/[projectId]/review-organization` |
| `batchUpdateProjectExperts` | `PUT /admin/projects/experts/batch` | `{ successCount, failedCount, results }`；逐项目返回成功/失败和专家规则失败原因；锁定项目按项目级失败返回 `EXPERT_ASSIGNMENT_LOCKED` | `/admin/projects` |
| `uploadProjectImport` | `POST /admin/project-imports/upload` | `ProjectImportJob`；上传使用 `FormData`，字段名固定为 `file` 和 `batchId`，不手动设置 `Content-Type` | `/admin/project-imports` |
| `listProjectImportJobs` | `GET /admin/project-imports` | 分页对象；支持 `page/pageSize/status/batchId/keyword` | `/admin/project-imports` |
| `getProjectImportJob` | `GET /admin/project-imports/:id` | `ProjectImportJob`；不内联全部 rows | `/admin/project-imports/[jobId]` |
| `deleteProjectImportJob` | `DELETE /admin/project-imports/:id` | `{ success, deletedJobId, deletedRows }`；admin 权限；只删除导入任务和行级解析记录，不删除正式项目；`parsing` 或已有 confirmed 行返回 `409` | `/admin/project-imports` |
| `listProjectImportRows` | `GET /admin/project-imports/:id/rows` | 分页对象；支持 `page/pageSize/status/keyword` | `/admin/project-imports/[jobId]` |
| `updateProjectImportRow` | `PATCH /admin/project-imports/:id/rows/:rowId` | `ProjectImportRow`；提交 `normalized/resolved/createOrganization/createOwnerUser` | `/admin/project-imports/[jobId]` |
| `confirmProjectImportRow` | `POST /admin/project-imports/:id/rows/:rowId/confirm` | `ProjectImportRow`；仅 `importable` 行可确认 | `/admin/project-imports/[jobId]` |
| `confirmProjectImportJob` | `POST /admin/project-imports/:id/confirm` | `{ successCount, failedCount, skippedCount }`；只处理所有 `importable` 行 | `/admin/project-imports/[jobId]` |
| `skipProjectImportRow` | `POST /admin/project-imports/:id/rows/:rowId/skip` | `ProjectImportRow`；`confirmed` 行会返回 409 | `/admin/project-imports/[jobId]` |
| `listProjectImportStandardFields` | `GET /admin/project-import-field-mappings/standard-fields` | `{ items }`；admin 权限；标准字段、中文名、必填和默认内置别名 | `/admin/project-import-field-mappings` |
| `listProjectImportFieldMappings` | `GET /admin/project-import-field-mappings` | `{ items }`；admin 权限；支持 `keyword/isActive`；返回所有标准字段配置视图，未配置字段 `effectiveAliases=defaultAliases` | `/admin/project-import-field-mappings` |
| `getProjectImportFieldMapping` | `GET /admin/project-import-field-mappings/:standardField` | 单个 `ProjectImportFieldMappingView`；admin 权限；非法标准字段返回 400 | `/admin/project-import-field-mappings` |
| `upsertProjectImportFieldMapping` | `PUT /admin/project-import-field-mappings/:standardField` | 单个 `ProjectImportFieldMappingView`；admin 权限；创建或覆盖 `aliases/isActive/description`；JSON 请求，不使用 FormData | `/admin/project-import-field-mappings` |
| `updateProjectImportFieldMapping` | `PATCH /admin/project-import-field-mappings/:standardField` | 单个 `ProjectImportFieldMappingView`；admin 权限；部分更新已有配置；配置不存在返回 404；JSON 请求，不使用 FormData | `/admin/project-import-field-mappings` |
| `deleteProjectImportFieldMapping` | `DELETE /admin/project-import-field-mappings/:standardField` | `{ success: boolean }`；admin 权限；删除自定义配置后标准字段仍保留并回退默认别名 | `/admin/project-import-field-mappings` |
| `resetProjectImportFieldMappingDefaults` | `POST /admin/project-import-field-mappings/:standardField/reset-defaults` | 单个 `ProjectImportFieldMappingView`；admin 权限；创建或覆盖配置，使自定义别名等于默认别名并启用 | `/admin/project-import-field-mappings` |

## 3.1 Project Owner API

文件：`frontend/src/features/project-owner/api.ts`

| 前端函数 | 后端接口 | 返回 / 请求口径 | 页面 |
| --- | --- | --- | --- |
| `listProjectOwnerProjects` | `GET /project-owner/projects` | 分页对象；只提交 `page/pageSize/batchId/statusId/projectTypeId/reviewManagerId/reviewSchemeId`，不提交 `ownerUserId`，不提交 `keyword`；响应可含 `reviewManager` 摘要和 `ownerContentLocked` | `/project-owner`、`/project-owner/projects` |
| `getProjectOwnerProject` | `GET /project-owner/projects/:id` | `ProjectOwnerProject`；后端按当前登录用户校验 owner 权限；响应优先使用 `reviewManager?.name` 展示评审负责人，`ownerContentLocked` 作为详情页只读体验判断之一 | `/project-owner/projects/[projectId]` |
| `updateProjectOwnerFollowUpNeeds` | `PATCH /project-owner/projects/:id/follow-up-needs` | 只提交 `{ followUpNeeds }`，最大长度 5000 由前后端共同校验；`409 PROJECT_OWNER_CONTENT_LOCKED` 显示固定业务文案 | `/project-owner/projects/[projectId]` |
| `listProjectOwnerMaterials` | `GET /project-owner/projects/:id/materials` | `ProjectMaterial[]`；项目负责人可见 `draft/submitted/legacy active`，`deleted` 仅作 legacy 兜底；材料类型名称优先使用响应内联 `materialType.name`，否则使用 portal `material_type` 映射 | `/project-owner/projects/[projectId]` |
| `uploadProjectOwnerMaterials` | `POST /project-owner/projects/:id/materials` | `FormData`；字段名固定为 `files/materialTypeId/remark`；不手动设置 `Content-Type`；新上传材料为 `draft`，提交前评审负责人和专家不可见；材料类型来自 portal active `material_type` 字典；`409 PROJECT_OWNER_CONTENT_LOCKED` 显示固定业务文案 | `/project-owner/projects/[projectId]` |
| `submitProjectOwnerMaterials` | `POST /project-owner/projects/:id/materials/submit` | 请求 `{ materialIds?: string[] }`；当前前端提交全部草稿材料时传 `{}`；返回 `submittedCount/alreadySubmittedCount/skippedCount/submittedMaterialIds/skipped`；不修改文件本体或 objectKey；锁定时禁用入口，后端 `409 PROJECT_OWNER_CONTENT_LOCKED` 仍会刷新权威数据并显示业务文案 | `/project-owner/projects/[projectId]` |
| `getProjectOwnerMaterialDownloadUrl` | `GET /project-owner/projects/:id/materials/:materialId/download-url` | 兼容后端返回 `string`、`{ url }`、`{ downloadUrl }`；不在前端拼接 OSS objectKey | `/project-owner/projects/[projectId]` |
| `deleteProjectOwnerMaterial` | `DELETE /project-owner/projects/:id/materials/:materialId` | `{ deleted, alreadyDeleted?, deletionLogId? }`；项目负责人仅可物理删除 `draft/legacy active`，`submitted` 返回 `409`；锁定时禁用删除入口，后端 `409 PROJECT_OWNER_CONTENT_LOCKED` 显示固定业务文案；删除前二次确认说明物理删除且不可恢复；不调用 `/admin/*` 删除接口 | `/project-owner/projects/[projectId]` |
| `resolveProjectMaterialDownloadUrl` | 前端解析辅助 | 从下载 URL 响应中解析 URL；无法解析时展示错误，不生成假 URL | `/project-owner/projects/[projectId]` |
| `getProjectOwnerConsensus` | `GET /project-owner/projects/:id/consensus` | 获取本人项目 confirmed 合议；404 在评审结果页展示“暂无已确认合议结果”，在项目详情页视为未查到 confirmed 合议且不作为整页错误；响应类型兼容 `confirmedByUser?: { id, name, phone? } | null`，项目详情页用它辅助计算只读锁定态 | `/project-owner/projects/[projectId]`、`/project-owner/projects/[projectId]/review-result`、`/project-owner/projects/[projectId]/appeals/[appealId]` |
| `listProjectOwnerLevelHistory` | `GET /project-owner/projects/:id/level-history` | 获取本人项目等级变更历史，展示原等级、变更后等级、原因、来源、时间和操作人 | `/project-owner/projects/[projectId]/review-result` |
| `listProjectOwnerAppeals` | `GET /project-owner/projects/:id/appeals` | 获取当前项目负责人对该项目提交的本人申诉列表 | `/project-owner/projects/[projectId]/review-result` |
| `getProjectOwnerAppeal` | `GET /project-owner/projects/:id/appeals/:appealId` | 获取本人申诉详情；附件列表另行调用附件接口 | `/project-owner/projects/[projectId]/appeals/[appealId]` |
| `createProjectOwnerAppeal` | `POST /project-owner/projects/:id/appeals` | `FormData`，字段名 `reason/files`；前端展示最多 3 次、confirmed 合议、有效最终等级 `project.finalLevel ?? consensus.finalLevel` 和未处理互斥规则，后端最终校验；本小修未新增接口 | `/project-owner/projects/[projectId]/review-result` |
| `uploadProjectOwnerAppealAttachments` | `POST /project-owner/projects/:id/appeals/:appealId/attachments` | `FormData`，字段名 `files`，批次备注 `remark` 选填；仅 submitted 状态可追加，成功后重新拉取详情和附件 | `/project-owner/projects/[projectId]/appeals/[appealId]` |
| `listProjectOwnerAppealAttachments` | `GET /project-owner/projects/:id/appeals/:appealId/attachments` | 获取本人申诉 active 附件列表 | `/project-owner/projects/[projectId]/appeals/[appealId]` |
| `getProjectOwnerAppealAttachmentDownloadUrl` | `GET /project-owner/projects/:id/appeals/:appealId/attachments/:attachmentId/download-url` | 获取申诉附件短期下载 URL，前端只打开后端返回 URL，不拼接 OSS URL | `/project-owner/projects/[projectId]/appeals/[appealId]` |
| `deleteProjectOwnerAppealAttachment` | `DELETE /project-owner/projects/:id/appeals/:appealId/attachments/:attachmentId` | 软删除申诉附件；仅 submitted 状态允许，删除前二次确认，成功后重新拉取附件 | `/project-owner/projects/[projectId]/appeals/[appealId]` |
| `listPortalDictionaries` | `GET /portal/reference-data/dictionaries` | `{ items }`；读取 `dictTypes=material_type,project_status,review_level`，用于材料类型、项目状态、评审等级和普通字典名称映射 | `/project-owner/projects`、`/project-owner/projects/[projectId]`、`/project-owner/projects/[projectId]/review-result` |
| `listPortalTreeDictionaries` | `GET /portal/reference-data/tree-dictionaries` | `{ items }`；读取 `treeTypes=project_type,discipline,department,administrative_division`，用于项目类型、学科、受理处室和行政区划名称映射 | `/project-owner/projects`、`/project-owner/projects/[projectId]` |
| `listPortalBatches` | `GET /portal/reference-data/batches` | `{ items }`；用于批次筛选和名称映射 | `/project-owner/projects`、`/project-owner/projects/[projectId]` |
| `listPortalOrganizations` | `GET /portal/reference-data/organizations` | `{ items }`；只使用单位名称和 `regionId` 摘要，不期待联系人字段 | `/project-owner/projects`、`/project-owner/projects/[projectId]` |
| `listPortalReviewSchemes` | `GET /portal/reference-data/review-schemes` | `{ items }`；用于评审方案筛选和名称映射 | `/project-owner/projects`、`/project-owner/projects/[projectId]` |
| `listPortalUsers` | `GET /portal/reference-data/users` | `{ items }`；项目负责人页面只调用 `role=review_manager`，不查询 admin | `/project-owner/projects`、`/project-owner/projects/[projectId]` |
| `loadProjectOwnerReferenceData` | 前端聚合辅助 | 并发读取 `/portal/reference-data/*`，构造材料类型、项目状态和名称映射数据源；失败时页面展示错误，详情页上传禁用 | `/project-owner/projects`、`/project-owner/projects/[projectId]` |

材料类型读取口径：

- 项目负责人页面通过 `GET /portal/reference-data/dictionaries?dictTypes=material_type,project_status,review_level` 读取材料类型、项目状态和评审等级。
- 上传区域只使用 active `material_type` 选项；为空时提示维护普通字典 `material_type` 并禁用上传。
- reference-data 加载失败时详情页仍可展示项目原始信息兜底，但上传禁用并显示错误。
- 项目负责人页面不调用 admin-only 字典接口，不写死材料类型 ID，不使用 mock 材料类型作为真实数据源。
- 材料上传仍使用 `POST /project-owner/projects/:id/materials`，FormData 字段名固定为 `files/materialTypeId/remark`，不手动设置 multipart `Content-Type`。
- 新上传材料为草稿；项目负责人详情页通过 `submitProjectOwnerMaterials` 调用 `POST /project-owner/projects/:id/materials/submit` 提交草稿材料后，评审负责人和专家才可见。
- 材料状态展示统一为：`draft=草稿`、`submitted=已提交评审`、`active=历史草稿`、`deleted=已删除/legacy 兜底`；只有 `draft/active` 可提交或由项目负责人删除。
- 材料下载只使用后端 download-url 返回的签名 URL，不前端拼接 `objectKey`。
- 项目负责人删除材料只调用 `DELETE /project-owner/projects/:id/materials/:materialId`，不调用 admin-only 删除接口；`409` 映射为“该材料已提交评审，项目负责人不能删除。如确需删除，请联系管理员。”。

## 3.2 Expert API

文件：`frontend/src/features/expert/api.ts`

| 前端函数 | 后端接口 | 返回 / 请求口径 | 页面 |
| --- | --- | --- | --- |
| `listExpertReviewTasks` | `GET /expert/review-tasks` | 分页对象；提交 `page/pageSize/batchId/status/reviewManagerId/reviewSchemeId`，状态支持 `not_started/draft/submitted/returned`；`project.reviewManager` 兼容 `{ id, name, phone? }` 或 `null` | `/expert/review-tasks` |
| `getExpertReviewTask` | `GET /expert/review-tasks/:projectId` | `ExpertReviewTaskDetail`；包含 `project/reviewSchemeSnapshot/review`；`project.reviewManager` 兼容 `{ id, name, phone? }` 或 `null`；未开始时 `review.status=not_started` 且 `review.id` 可不存在 | `/expert/review-tasks/[projectId]` |
| `saveExpertReviewDraft` | `PUT /expert/review-tasks/:projectId` | 请求 `{ items?: [...] }`；保存草稿允许空分数、空评价描述和空改进建议，不受 `reviewTime` 限制，但前端仍校验已填写分数的范围 | `/expert/review-tasks/[projectId]` |
| `deleteExpertReviewDraft` | `DELETE /expert/review-tasks/:projectId/draft` | 无请求体；成功响应为 `204 No Content`；只用于删除当前专家本人的 `draft` 草稿，`submitted/returned` 后端返回 `409`，无草稿返回 `404` | `/expert/review-tasks/[projectId]` |
| `submitExpertReview` | `POST /expert/review-tasks/:projectId/submit` | 请求 `{ items?: [...] }`；提交前前端校验所有分数、评价描述、低分 / 重大问题改进建议，并在 `project.reviewTime` 未到时禁用提交；后端仍最终校验，可能返回 `409 REVIEW_NOT_STARTED` | `/expert/review-tasks/[projectId]` |
| `listExpertProjectMaterials` | `GET /expert/projects/:id/materials` | `ExpertMaterial[]`；专家只可见 submitted 材料，支持后端 `materialTypeId` 查询参数但当前详情页默认不传 | `/expert/review-tasks/[projectId]` |
| `getExpertProjectMaterialDownloadUrl` | `GET /expert/projects/:id/materials/:materialId/download-url` | 兼容后端返回 `string`、`{ url }`、`{ downloadUrl }`；只打开后端返回 URL，不在前端拼接 OSS objectKey | `/expert/review-tasks/[projectId]` |
| `resolveExpertMaterialDownloadUrl` | 前端解析辅助 | 从下载 URL 响应中解析 URL；无法解析时展示错误，不生成假 URL | `/expert/review-tasks/[projectId]` |
| `listPortalDictionaries` | `GET /portal/reference-data/dictionaries` | `{ items }`；读取 `dictTypes=material_type,project_status`，用于材料类型和项目状态名称映射 | `/expert/review-tasks`、`/expert/review-tasks/[projectId]` |
| `listPortalTreeDictionaries` | `GET /portal/reference-data/tree-dictionaries` | `{ items }`；读取 `treeTypes=project_type,discipline,department,administrative_division`，保留后续名称映射能力 | `/expert/review-tasks`、`/expert/review-tasks/[projectId]` |
| `listPortalBatches` | `GET /portal/reference-data/batches` | `{ items }`；用于批次筛选和名称映射 | `/expert/review-tasks`、`/expert/review-tasks/[projectId]` |
| `listPortalOrganizations` | `GET /portal/reference-data/organizations` | `{ items }`；作为专家端通用 reference-data 摘要保留 | `/expert/review-tasks`、`/expert/review-tasks/[projectId]` |
| `listPortalReviewSchemes` | `GET /portal/reference-data/review-schemes` | `{ items }`；用于评审方案筛选和名称映射 | `/expert/review-tasks`、`/expert/review-tasks/[projectId]` |
| `listPortalUsers` | `GET /portal/reference-data/users` | `{ items }`；专家页面只调用 `role=review_manager`，不查询 admin | `/expert/review-tasks`、`/expert/review-tasks/[projectId]` |
| `loadExpertReferenceData` | 前端聚合辅助 | 并发读取 `/portal/reference-data/*`；失败时显示基础数据加载失败并用短 ID 兜底，不阻断评分主流程 | `/expert/review-tasks`、`/expert/review-tasks/[projectId]` |

专家评分和材料口径：

- 专家任务列表和详情只调用 `/expert/review-tasks*`，不新增专家任意用户查询接口或跨角色接口；评审负责人名称优先使用任务响应内联 `project.reviewManager.name`，其次使用 portal `review_manager` 用户映射，最后显示“未知评审负责人（短ID）”或“未指定评审负责人”。
- 专家详情页材料展示以 `listExpertProjectMaterials(projectId)` 即 `GET /expert/projects/:id/materials` 为准；即使评分详情响应包含 `materials/materialCount`，也不作为页面材料展示主数据源。
- 专家材料下载只调用 `GET /expert/projects/:id/materials/:materialId/download-url`，不调用 project_owner / review_manager / admin 材料接口，不前端拼接 `objectKey`。
- 专家评分保存 / 提交请求只提交评分项 `name/score/evaluationDescription/improvementSuggestion/hasMajorIssue`，不在前端保存 token，不读取 HttpOnly Cookie。
- 专家删除评分草稿只调用 `DELETE /expert/review-tasks/:projectId/draft`，不提交 body，不调用 `/admin/*`、project_owner 或 review_manager 接口；删除成功后重新拉取详情，不只在前端手动清空。
- 专家评分提交前按客户端当前时间和 `project.reviewTime` 做体验层禁用：评审未开始时显示“评审尚未开始，暂不能提交评分；可先保存草稿。”，保存草稿仍可用；后端服务器时间仍是最终约束。
- `submitted` 评分只读且不显示保存 / 提交按钮；`returned` 显示退回时间和原因，可保存草稿并重新提交。

## 3.3 Review Manager API

文件：`frontend/src/features/review-manager/api.ts`

| 前端函数 | 后端接口 | 返回 / 请求口径 | 页面 |
| --- | --- | --- | --- |
| `listReviewManagerProjects` | `GET /review-manager/projects` | 分页对象；提交 `page/pageSize/keyword/batchId/statusId/reviewSchemeId`；后端固定按当前用户 `reviewManagerId` 过滤，admin + review_manager 也只看自己负责项目，admin 全局视角走 `/admin/projects` | `/review-manager/projects` |
| `getReviewManagerProjectSummary` | `GET /review-manager/projects?page=1&pageSize=1000` | 当前无 `GET /review-manager/projects/:id`，项目总览、评审组织页和合议页摘要临时用小数据量大页列表按 `projectId` 前端匹配；未匹配时显示“项目摘要不可用或无权限”，不调用 admin 项目详情接口 | `/review-manager/projects/[projectId]`、`/review-manager/projects/[projectId]/review-organization`、`/review-manager/projects/[projectId]/consensus` |
| `listReviewManagerProjectExpertCandidates` | `GET /review-manager/projects/:projectId/expert-candidates` | `{ items, page, pageSize, total, reason? }`；候选由后端按项目学科匹配并回避承担单位/合作单位；仅当前评审负责人负责项目可访问；锁定时仍允许读取 | `/review-manager/projects/[projectId]/review-organization` |
| `listReviewManagerAssignedProjectExperts` | `GET /review-manager/projects/:projectId/experts` | `ReviewManagerAssignedExpert[]`；含 `hasReviewRecord/reviewStatus`，用于锁定原因和状态展示；仅当前评审负责人负责项目可访问；锁定时仍允许读取 | `/review-manager/projects/[projectId]/review-organization` |
| `appendReviewManagerProjectExperts` | `POST /review-manager/projects/:projectId/experts` | 请求 `{ expertUserIds }`；返回 `{ assignedExperts, successCount, failedCount, failures }`；专家名单锁定时返回 `409 EXPERT_ASSIGNMENT_LOCKED`；成功后重新拉取权威数据 | `/review-manager/projects/[projectId]/review-organization` |
| `replaceReviewManagerProjectExperts` | `PUT /review-manager/projects/:projectId/experts` | 请求 `{ expertUserIds }`；返回 `{ assignedExperts, addedOrRestoredCount, removedCount }`；专家名单锁定时返回 `409 EXPERT_ASSIGNMENT_LOCKED`；替换前二次确认 | `/review-manager/projects/[projectId]/review-organization` |
| `removeReviewManagerProjectExpert` | `DELETE /review-manager/projects/:projectId/experts/:expertUserId` | `{ removed, alreadyRemoved }`；专家名单锁定时返回 `409 EXPERT_ASSIGNMENT_LOCKED`；移除前二次确认 | `/review-manager/projects/[projectId]/review-organization` |
| `updateReviewManagerProjectSchedule` | `PATCH /review-manager/projects/:projectId/schedule` | 请求只包含 `reviewTime/reviewLocation/meetingUrl`；评审负责人只能维护自己负责项目的评审安排，不接腾讯会议 API | `/review-manager/projects/[projectId]/review-organization` |
| `listReviewManagerProjectMaterials` | `GET /review-manager/projects/:projectId/materials` | `ReviewManagerProjectMaterialListItem[]`；评审负责人只读查看 submitted 材料，不提供上传或删除 | `/review-manager/projects/[projectId]/review-organization` |
| `getReviewManagerProjectMaterialDownloadUrl` | `GET /review-manager/projects/:projectId/materials/:materialId/download-url` | 兼容后端返回 `string`、`{ url }`、`{ downloadUrl }`；只打开后端返回 URL，不前端拼接 OSS objectKey | `/review-manager/projects/[projectId]/review-organization` |
| `resolveReviewManagerProjectMaterialDownloadUrl` | 前端解析辅助 | 从下载 URL 响应中解析 URL；无法解析时展示错误，不生成假 URL | `/review-manager/projects/[projectId]/review-organization` |
| `listProjectExpertReviews` | `GET /review-manager/projects/:projectId/expert-reviews` | 专家评分列表；展示 expert、status、totalScore、submittedAt、returnedAt；状态保持后端 `not_started/draft/submitted/returned` 口径 | `/review-manager/projects/[projectId]/consensus` |
| `getProjectExpertReview` | `GET /review-manager/projects/:projectId/expert-reviews/:expertUserId` | 专家评分详情；`not_started` 初始化记录按“该专家尚未开始评分”展示，不作为错误 | `/review-manager/projects/[projectId]/consensus` |
| `returnProjectExpertReview` | `POST /review-manager/projects/:projectId/expert-reviews/:expertUserId/return` | 请求 `{ returnReason }`，trim 后 1-1000；仅 submitted 状态显示退回按钮；提交前二次确认；成功后刷新专家列表、评分汇总和当前详情 | `/review-manager/projects/[projectId]/consensus` |
| `getProjectReviewSummary` | `GET /review-manager/projects/:projectId/review-summary` | 只读展示 assigned/submitted/draft/returned/notStarted、平均分、最高分、最低分和 perItemAverageScores；空分数显示“暂无” | `/review-manager/projects/[projectId]`、`/review-manager/projects/[projectId]/consensus` |
| `getProjectConsensus` | `GET /review-manager/projects/:projectId/consensus` | `404` 转换为 `null`，前端视为“暂无合议草稿”，不作为页面级错误；confirmed 记录可带 `confirmedByUser?: { id, name, phone? } | null`，其他错误继续抛出 | `/review-manager/projects/[projectId]`、`/review-manager/projects/[projectId]/review-organization`、`/review-manager/projects/[projectId]/consensus` |
| `generateProjectConsensusDraft` | `POST /review-manager/projects/:projectId/consensus/draft` | 默认不传 `force`；后端提示已存在 draft 时二次确认后以 `force=true` 重试；confirmed 状态不提供覆盖草稿入口 | `/review-manager/projects/[projectId]/consensus` |
| `confirmProjectConsensus` | `POST /review-manager/projects/:projectId/consensus/confirm` | 请求仅包含 `finalOpinion/finalScore/finalLevel`；“使用草稿填入”只是把 draftOpinion/draftScore 填入表单；finalOpinion 1-10000，finalScore 优先按评分方案总分前端校验，finalLevel 优先提交 `review_level.code`，字典为空 fallback A/B/C/D；confirmed 状态前端不展示确认表单，若旧状态或并发导致接口返回 `409 CONSENSUS_ALREADY_CONFIRMED`，展示后端业务 message 并重新拉取 consensus；成功响应兼容确认人 `confirmedByUser` 摘要 | `/review-manager/projects/[projectId]/consensus` |
| `listReviewManagerAppeals` | `GET /review-manager/projects/:projectId/appeals` | 当前评审负责人负责项目的申诉列表；只读展示状态、原因摘要、等级前后变化和附件数量 | `/review-manager/projects/[projectId]/appeals` |
| `getReviewManagerAppeal` | `GET /review-manager/projects/:projectId/appeals/:appealId` | 当前评审负责人负责项目的申诉详情；附件另行调用附件接口 | `/review-manager/projects/[projectId]/appeals/[appealId]` |
| `listReviewManagerAppealAttachments` | `GET /review-manager/projects/:projectId/appeals/:appealId/attachments` | 只读获取申诉附件列表；评审负责人不提供上传、删除 | `/review-manager/projects/[projectId]/appeals/[appealId]` |
| `getReviewManagerAppealAttachmentDownloadUrl` | `GET /review-manager/projects/:projectId/appeals/:appealId/attachments/:attachmentId/download-url` | 获取申诉附件短期下载 URL，前端只打开后端返回 URL，不拼接 OSS URL | `/review-manager/projects/[projectId]/appeals/[appealId]` |
| `handleReviewManagerAppeal` | `POST /review-manager/projects/:projectId/appeals/:appealId/handle` | 请求 `{ handlingResult, handlingOpinion, newFinalLevel? }`；accepted 必须选择新最终等级，rejected 不提交新等级；成功后重新拉取申诉、附件和项目摘要 | `/review-manager/projects/[projectId]/appeals/[appealId]` |
| `loadReviewManagerReferenceData` | `GET /portal/reference-data/*` | 读取 `dictionaries?dictTypes=project_status,review_level,material_type`、`tree-dictionaries?treeTypes=project_type,discipline,department,administrative_division`、batches、organizations、review-schemes、`users?role=project_owner`、`users?role=review_manager`；不调用 admin-only 基础数据接口 | `/review-manager/projects`、`/review-manager/projects/[projectId]`、`/review-manager/projects/[projectId]/review-organization`、`/review-manager/projects/[projectId]/consensus`、`/review-manager/projects/[projectId]/appeals*` |

评审负责人项目页口径：

- `/workspace` 仅对拥有 `review_manager` 角色的用户放开评审负责人入口；只有 admin 角色的用户不会被默认引导到 `/review-manager`。
- `/review-manager/projects/[projectId]` 是项目总览 / 工作入口页，不混放专家分配表格和合议确认表单。
- 项目摘要不调用不存在的 `GET /review-manager/projects/:id`，也不调用 `/admin/projects/:id`；临时适配方式为 `GET /review-manager/projects?page=1&pageSize=1000` 后按当前 `projectId` 匹配。
- `/review-manager/projects/[projectId]/review-organization` 是评审前组织页，只调用 `/review-manager/projects/:projectId/*` 中评审负责人有权使用的安排、材料和专家分配接口；可维护评审时间 / 地点 / 会议链接，可查看 submitted 材料并下载，不提供材料上传、删除或管理员治理能力。
- 评审组织页可查看已分配专家和候选专家，支持追加、替换和移除；若 `reviewTime` 已到、已有专家评分、已有合议记录或已有最终等级 / 最终结论，后端返回 `409 EXPERT_ASSIGNMENT_LOCKED`，前端展示锁定原因并禁用专家名单调整。
- `/review-manager/projects/[projectId]/consensus` 是评审后合议页，不包含专家分配和评审安排表单。
- 合议草稿生成只使用后端 `rule_based` draft，不做真实 AI 或大模型调用。
- `GET /consensus` 的 404 表示暂无合议记录，展示“暂无合议草稿”。
- 已有 draft 时覆盖生成必须经后端 409 提示后用户二次确认，再以 `force=true` 重试。
- 已 confirmed 时前端只读展示最终意见、最终分数、最终等级、确认人、确认时间和既有只读统计；不展示“覆盖草稿”入口、“使用草稿填入”、确认表单或“重新确认最终结论”按钮；后续调整走申诉处理或未来专门更正流程。
- `/review-manager/projects/[projectId]/appeals` 和 `/review-manager/projects/[projectId]/appeals/[appealId]` 只调用 review-manager 命名空间的申诉接口；不调用 admin 或 project_owner 申诉接口。
- 评审负责人当前无 `GET /review-manager/projects/:projectId/level-history`，前端不得伪造或调用该接口；等级变更历史只在 project-owner 和 admin 侧读取。
- 评审负责人申诉处理支持 accepted / rejected；accepted 需提交 active `review_level.code`，rejected 不提交 `newFinalLevel`。
- 本阶段不接入甲方看板、腾讯会议、文件预览、材料上传 / 删除或真实 AI。

## 3.4 Admin Project Appeals API

文件：`frontend/src/features/admin/api/project-appeals.ts`

| 前端函数 | 后端接口 | 返回 / 请求口径 | 页面 |
| --- | --- | --- | --- |
| `listAdminProjectAppeals` | `GET /admin/projects/:projectId/appeals` | 管理员项目申诉列表；展示状态、原因摘要、等级前后变化、附件数量和处理信息 | `/admin/projects/[projectId]/appeals` |
| `getAdminProjectAppeal` | `GET /admin/projects/:projectId/appeals/:appealId` | 管理员项目申诉详情；附件另行调用附件接口 | `/admin/projects/[projectId]/appeals/[appealId]` |
| `listAdminProjectAppealAttachments` | `GET /admin/projects/:projectId/appeals/:appealId/attachments` | 只读获取申诉附件列表；管理员不提供上传、删除 | `/admin/projects/[projectId]/appeals/[appealId]` |
| `getAdminProjectAppealAttachmentDownloadUrl` | `GET /admin/projects/:projectId/appeals/:appealId/attachments/:attachmentId/download-url` | 获取申诉附件短期下载 URL，前端只打开后端返回 URL，不拼接 OSS URL | `/admin/projects/[projectId]/appeals/[appealId]` |
| `handleAdminProjectAppeal` | `POST /admin/projects/:projectId/appeals/:appealId/handle` | 请求 `{ handlingResult, handlingOpinion, newFinalLevel? }`；accepted 必须选择新最终等级，rejected 不提交新等级；成功后重新拉取申诉、附件、等级历史和项目详情 | `/admin/projects/[projectId]/appeals/[appealId]` |
| `listAdminProjectLevelHistory` | `GET /admin/projects/:projectId/level-history` | 管理员读取项目等级变更历史，展示申诉处理导致的等级变更留痕 | `/admin/projects/[projectId]/appeals`、`/admin/projects/[projectId]/appeals/[appealId]` |

管理员项目申诉页口径：

- `/admin/projects/[projectId]/appeals` 和 `/admin/projects/[projectId]/appeals/[appealId]` 只调用 admin 命名空间的申诉与等级历史接口，不调用 review-manager 或 project-owner 命名空间。
- 管理员申诉附件只读下载，不提供上传或删除；项目负责人附件上传 / 删除能力只在 project-owner 命名空间开放。
- 管理员处理申诉后重新拉取申诉详情、附件列表、等级历史和项目详情，不在前端乐观改写最终等级。

## 4. 错误处理

- `401`：未登录，守卫跳转登录页
- `403`：无权限，管理员守卫显示 403
- `400`：展示后端 message 或默认输入错误提示
- `409`：展示后端 message 或默认冲突提示；项目负责人后续推进需求、材料上传、提交和删除遇到 `PROJECT_OWNER_CONTENT_LOCKED` 时固定展示“评审结果已确认，项目材料和后续推进需求已锁定。如需补充说明，请通过申诉提交补充材料。”，不显示 HTTP 状态码或技术字段；项目负责人删除 submitted 材料时固定展示“该材料已提交评审，项目负责人不能删除。如确需删除，请联系管理员。”；专家分配返回 `EXPERT_ASSIGNMENT_LOCKED` 时展示“专家名单已锁定，不能继续调整。”并结合 `reasons` 展示评审已开始 / 已产生评分 / 已生成合议 / 已形成最终等级等锁定原因；专家 submitted 后再次保存或提交时展示“评分已提交，不能修改。”；专家提交评分返回 `REVIEW_NOT_STARTED` 或“评审尚未开始”时展示“评审尚未开始，暂不能提交评分。”；专家删除非 draft 评分草稿时展示“只有未提交的评分草稿可以删除。”；评审负责人生成合议草稿遇到已有 draft 时二次确认后 `force=true` 重试，遇到 confirmed 不提供覆盖草稿入口；评审负责人确认合议遇到 `CONSENSUS_ALREADY_CONFIRMED` 时展示后端业务 message 并重新拉取 consensus
- `500`：展示默认服务异常提示

## 4.1 前端展示映射口径

- 普通字典预设 `dictType`：`project_status=项目状态`、`material_type=材料类型`、`review_level=评审等级`
- 自定义普通字典类型保存时提交用户输入的真实 `dictType`，不提交 literal `"custom"` 或空值
- 树形字典预设 `treeType`：`project_type=项目类型`、`discipline=学科`、`department=受理处室`、`administrative_division=行政区划`
- 后端字段名仍保持英文，前端仅做中文显示映射
- 树形字典仍调用 `GET /admin/tree-dictionaries` 平铺数组接口，由前端构建缩进树
- 单位 `regionId` 仍提交区划节点 ObjectId；前端只读取 `administrative_division` 行政区划树，不再兼容历史 `region`
- 用户角色显示中文：`admin=管理员`、`client=甲方`、`review_manager=评审负责人`、`expert=评审专家`、`project_owner=项目负责人`；请求仍提交英文角色值
- 用户管理关联单位通过 `GET /admin/organizations?page=1&pageSize=1000` 映射名称并多选提交 `organizationIds`
- 用户管理关联学科通过 `GET /admin/tree-dictionaries?treeType=discipline` 映射名称并树形/缩进多选提交 `disciplineIds`
- 用户创建和重置密码留空时不提交 `password`，由后端默认手机号；编辑用户手机号只读，不提交 `phone/password/passwordHash`
- 项目导入任务状态、行状态和 issue code 通过 `frontend/src/lib/labels/project-import-labels.ts` 中文化展示；请求仍提交后端英文枚举值
- 项目导入详情页读取批次、项目类型、学科、受理处室、行政区划、项目状态、单位和 `project_owner` 用户作为修正选项；行政区划只读取 `treeType=administrative_division`
- 项目导入行修正允许通过 `createOrganization` 创建新承担单位，通过 `createOwnerUser` 创建新项目负责人用户；不在本页面创建项目类型、学科、受理处室或项目状态
- 项目导入任务删除入口只在列表页提供；前端对 `confirmedRows > 0` 的任务禁用删除按钮，后端仍以 `409` 做最终限制
- 字段映射配置页通过 `frontend/src/lib/labels/project-import-field-mapping-labels.ts` 中文化必填、配置状态、启用状态和 fallback 说明
- 字段映射配置页只使用 JSON 请求，不使用 FormData；`isActive=''` 和空 keyword 不提交 query
- 字段映射标准字段由后端标准字段清单 / 配置视图返回，前端不允许新增、删除或重命名标准字段
- 字段映射停用和删除自定义配置均不是禁用标准字段，而是回退系统默认别名；reset-defaults 是创建或覆盖配置，使自定义别名等于默认别名
- 项目评审组织页面读取 `review_manager` active 用户作为负责人选项，读取 active expert 用户作为批量专家设置通用选择源；真实专家候选优先使用 `/admin/projects/:id/expert-candidates`
- 管理员专家分配操作使用 `/admin/projects*` 系列接口；评审负责人专家分配操作使用 `/review-manager/projects*` 系列接口；两者共用后端专家名单锁定规则，前端不跨角色混用接口
- 专家候选和分配不在前端自行实现学科匹配、单位回避或已评分专家替换判断；页面只展示后端返回候选、assigned 标记、`hasReviewRecord/reviewStatus` 和失败原因
- 已分配专家评分状态展示为：`draft=草稿`、`submitted=已提交`、`returned=已退回`、空值=未开始；`hasReviewRecord=true` 时项目专家名单进入锁定态，追加 / 替换 / 移除均禁用
- 评审安排只保存 `reviewTime/reviewLocation/meetingUrl`，不接腾讯会议 API、直播、推流或回看
- 管理员项目材料查看、下载和删除只调用 `/admin/projects/:id/materials`、`/admin/projects/:id/materials/:materialId/download-url`、`DELETE /admin/projects/:id/materials/:materialId`；删除必须提交 `reason`，不调用 project_owner / review_manager / expert 材料接口，不调用 `/admin/users` 只为补上传人名称。
- 管理员材料删除成功后刷新列表；`400` reason 问题、`403` 权限、`404` 已删除和 `500`/storage 删除失败均在材料卡片或删除弹窗内展示，不在成功前从列表乐观移除。
- 项目负责人列表和详情通过 `/portal/reference-data/*` 构造批次、普通字典、材料类型、树形字典、单位、评审方案和评审负责人名称映射；项目详情评审负责人显示优先级为 `project.reviewManager?.name`、`lookupMaps.userNameById.get(project.reviewManagerId)`、有 `reviewManagerId` 时“评审负责人信息暂不可用”、无 `reviewManagerId` 时“暂未设置评审负责人”，不再显示“未知评审负责人（短ID）”；其他基础数据未命中时仍可显示“未知项（短ID）”类兜底，不默认展示裸 ID
- 项目负责人详情页只读锁定体验层判断优先使用 `project.ownerContentLocked` / `project.reviewFinalized`，再看 `project.finalLevel`、`project.originalLevel` 和 `GET /project-owner/projects/:id/consensus` 是否返回 confirmed 合议；consensus 404 视为未确认，其他错误仅提示并以后端 409 兜底。
- 项目负责人详情页锁定后，后续推进需求 textarea 禁用且隐藏保存按钮；材料上传表单不渲染；提交全部草稿材料按钮禁用；材料列表删除按钮禁用；材料筛选和下载继续可用；“查看评审结果与申诉”入口继续可用。
- 项目负责人项目列表筛选使用批次、项目类型、项目状态、评审负责人、评审方案 select；提交给后端的仍是对应 ID，不新增 keyword
- 项目负责人材料列表类型展示优先使用 `ProjectMaterial.materialType.name`，其次使用 portal `material_type` 映射，仍未命中时显示“未知材料类型（短ID）”
- 项目负责人材料列表显示材料状态 Badge；`draft/active` 可提交或删除，`submitted` 禁用删除，`deleted/unknown` 禁用操作。
- 专家任务列表和详情通过 `/portal/reference-data/*` 构造批次、项目状态、评审负责人、评审方案和材料类型名称映射；评审负责人优先使用 `/expert/review-tasks*` 响应内联 `project.reviewManager`，reference-data 只作 fallback；未命中时显示“未知项（短ID）”类兜底，不调用 `/admin/*` 主数据接口。
- 专家评分状态展示为：`not_started=未开始`、`draft=草稿`、`submitted=已提交`、`returned=已退回`；列表操作文案分别为“开始评分 / 继续评分 / 查看评分 / 修改重提”。
- 专家提交评分前校验：score 必填且在 `0..maxScore`，评价描述必填，score 严格低于 `maxScore * suggestionRequiredThresholdRatio` 或存在重大问题时改进建议必填；评审时间未到时禁用提交但允许保存草稿；草稿保存只校验已填写 score 范围。
- 专家评分详情页仅在 `review.status === 'draft'` 时显示“删除草稿”，删除前二次确认；`not_started/submitted/returned` 不显示；删除失败时 `404` 展示“未找到可删除的评分草稿。”，`409` 展示“只有未提交的评分草稿可以删除。”。
- 专家材料列表材料类型展示优先使用材料响应内联 `materialType.name`，其次使用 portal `material_type` 映射，仍未命中时显示“未知材料类型（短ID）”。
- 评审负责人项目列表和详情通过 `/portal/reference-data/*` 构造批次、项目状态、项目类型、单位、项目负责人、评审方案和评审等级名称映射；未命中时显示“未知项（短ID）”类兜底，不调用 admin-only 主数据接口。
- 评审负责人评审组织页只读查看 submitted 项目材料，下载只使用 `/review-manager/projects/:id/materials/:materialId/download-url` 返回 URL，不拼接 OSS objectKey，不提供上传、删除或预览。
- 评审负责人专家评分状态展示为：`not_started=未开始`、`draft=草稿`、`submitted=已提交`、`returned=已退回`；只有 submitted 显示退回入口。
- 评审负责人合议最终等级优先使用 active `review_level` 字典项的 `code` 作为提交值、`name` 作为展示文案；字典为空时使用 A/B/C/D 兜底。
- 评审负责人合议确认人显示优先使用 `consensus.confirmedByUser.name`，有手机号时显示“姓名（手机号）”；`confirmedByUserId` 存在但摘要缺失时显示“确认人信息暂不可用”；无 `confirmedByUserId` 时显示“-”；不得显示“用户（短ID）”或原始 ObjectId。
- 申诉状态展示为：`submitted=已提交`、`processing=处理中`、`accepted=已通过`、`rejected=已驳回`；submitted / processing 为待处理状态。
- 项目负责人发起申诉要求已确认合议且存在有效最终等级 `project.finalLevel ?? consensus.finalLevel`；最多 3 次申诉，存在 submitted / processing 申诉时禁用再次提交。若 `project.finalLevel` 缺失但 confirmed 合议 `finalLevel` 存在，前端允许打开申诉弹窗，后端创建成功后会懒回填项目主表。
- 申诉附件下载只使用各角色命名空间下 `download-url` 返回 URL；项目负责人仅 submitted 状态可上传 / 删除附件，评审负责人和管理员附件只读。
- 申诉处理 accepted 必须选择新最终等级，rejected 不提交新等级；等级变更历史由后端 `level-history` 返回，前端只展示不自行生成。

## 5. 当前未对接的后端接口

- 用户自助改密、忘记密码、短信验证码、用户批量导入、权限矩阵配置相关接口
- `/admin/projects/:id/expert-reviews*`
- `/admin/projects/:id/consensus*`
