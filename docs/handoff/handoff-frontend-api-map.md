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
| `listAssignedProjectExperts` | `GET /review-manager/projects/:id/experts` | `ExpertBasic[]`；admin 角色可访问 | `/admin/projects/[projectId]/review-organization` |
| `appendProjectExperts` | `POST /review-manager/projects/:id/experts` | `{ assignedExperts, successCount, failedCount, failures }`；逐专家返回失败原因 | `/admin/projects/[projectId]/review-organization` |
| `replaceProjectExperts` | `PUT /review-manager/projects/:id/experts` | `{ assignedExperts, addedOrRestoredCount, removedCount }` | `/admin/projects/[projectId]/review-organization` |
| `removeProjectExpert` | `DELETE /review-manager/projects/:id/experts/:expertUserId` | `{ removed, alreadyRemoved }` | `/admin/projects/[projectId]/review-organization` |
| `batchUpdateProjectExperts` | `PUT /review-manager/projects/experts/batch` | `{ successCount, failedCount, results }`；逐项目返回成功/失败和专家规则失败原因 | `/admin/projects` |
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
| `listProjectOwnerProjects` | `GET /project-owner/projects` | 分页对象；只提交 `page/pageSize/batchId/statusId/projectTypeId/reviewManagerId/reviewSchemeId`，不提交 `ownerUserId`，不提交 `keyword` | `/project-owner`、`/project-owner/projects` |
| `getProjectOwnerProject` | `GET /project-owner/projects/:id` | `ProjectOwnerProject`；后端按当前登录用户校验 owner 权限 | `/project-owner/projects/[projectId]` |
| `updateProjectOwnerFollowUpNeeds` | `PATCH /project-owner/projects/:id/follow-up-needs` | 只提交 `{ followUpNeeds }`，最大长度 5000 由前后端共同校验 | `/project-owner/projects/[projectId]` |
| `listProjectOwnerMaterials` | `GET /project-owner/projects/:id/materials` | `ProjectMaterial[]`；项目负责人可见 `draft/submitted/legacy active`，`deleted` 仅作 legacy 兜底；材料类型名称优先使用响应内联 `materialType.name`，否则使用 portal `material_type` 映射 | `/project-owner/projects/[projectId]` |
| `uploadProjectOwnerMaterials` | `POST /project-owner/projects/:id/materials` | `FormData`；字段名固定为 `files/materialTypeId/remark`；不手动设置 `Content-Type`；新上传材料为 `draft`，提交前评审负责人和专家不可见；材料类型来自 portal active `material_type` 字典 | `/project-owner/projects/[projectId]` |
| `submitProjectOwnerMaterials` | `POST /project-owner/projects/:id/materials/submit` | 请求 `{ materialIds?: string[] }`；当前前端提交全部草稿材料时传 `{}`；返回 `submittedCount/alreadySubmittedCount/skippedCount/submittedMaterialIds/skipped`；不修改文件本体或 objectKey | `/project-owner/projects/[projectId]` |
| `getProjectOwnerMaterialDownloadUrl` | `GET /project-owner/projects/:id/materials/:materialId/download-url` | 兼容后端返回 `string`、`{ url }`、`{ downloadUrl }`；不在前端拼接 OSS objectKey | `/project-owner/projects/[projectId]` |
| `deleteProjectOwnerMaterial` | `DELETE /project-owner/projects/:id/materials/:materialId` | `{ deleted, alreadyDeleted?, deletionLogId? }`；项目负责人仅可物理删除 `draft/legacy active`，`submitted` 返回 `409`；删除前二次确认说明物理删除且不可恢复；不调用 `/admin/*` 删除接口 | `/project-owner/projects/[projectId]` |
| `resolveProjectMaterialDownloadUrl` | 前端解析辅助 | 从下载 URL 响应中解析 URL；无法解析时展示错误，不生成假 URL | `/project-owner/projects/[projectId]` |
| `listPortalDictionaries` | `GET /portal/reference-data/dictionaries` | `{ items }`；读取 `dictTypes=material_type,project_status`，用于材料类型、项目状态和普通字典名称映射 | `/project-owner/projects`、`/project-owner/projects/[projectId]` |
| `listPortalTreeDictionaries` | `GET /portal/reference-data/tree-dictionaries` | `{ items }`；读取 `treeTypes=project_type,discipline,department,administrative_division`，用于项目类型、学科、受理处室和行政区划名称映射 | `/project-owner/projects`、`/project-owner/projects/[projectId]` |
| `listPortalBatches` | `GET /portal/reference-data/batches` | `{ items }`；用于批次筛选和名称映射 | `/project-owner/projects`、`/project-owner/projects/[projectId]` |
| `listPortalOrganizations` | `GET /portal/reference-data/organizations` | `{ items }`；只使用单位名称和 `regionId` 摘要，不期待联系人字段 | `/project-owner/projects`、`/project-owner/projects/[projectId]` |
| `listPortalReviewSchemes` | `GET /portal/reference-data/review-schemes` | `{ items }`；用于评审方案筛选和名称映射 | `/project-owner/projects`、`/project-owner/projects/[projectId]` |
| `listPortalUsers` | `GET /portal/reference-data/users` | `{ items }`；项目负责人页面只调用 `role=review_manager`，不查询 admin | `/project-owner/projects`、`/project-owner/projects/[projectId]` |
| `loadProjectOwnerReferenceData` | 前端聚合辅助 | 并发读取 `/portal/reference-data/*`，构造材料类型、项目状态和名称映射数据源；失败时页面展示错误，详情页上传禁用 | `/project-owner/projects`、`/project-owner/projects/[projectId]` |

材料类型读取口径：

- 项目负责人页面通过 `GET /portal/reference-data/dictionaries?dictTypes=material_type,project_status` 读取材料类型和项目状态。
- 上传区域只使用 active `material_type` 选项；为空时提示维护普通字典 `material_type` 并禁用上传。
- reference-data 加载失败时详情页仍可展示项目原始信息兜底，但上传禁用并显示错误。
- 项目负责人页面不调用 admin-only 字典接口，不写死材料类型 ID，不使用 mock 材料类型作为真实数据源。
- 材料上传仍使用 `POST /project-owner/projects/:id/materials`，FormData 字段名固定为 `files/materialTypeId/remark`，不手动设置 multipart `Content-Type`。
- 新上传材料为草稿；项目负责人详情页通过 `submitProjectOwnerMaterials` 调用 `POST /project-owner/projects/:id/materials/submit` 提交草稿材料后，评审负责人和专家才可见。
- 材料状态展示统一为：`draft=草稿`、`submitted=已提交评审`、`active=历史草稿`、`deleted=已删除/legacy 兜底`；只有 `draft/active` 可提交或由项目负责人删除。
- 材料下载只使用后端 download-url 返回的签名 URL，不前端拼接 `objectKey`。
- 项目负责人删除材料只调用 `DELETE /project-owner/projects/:id/materials/:materialId`，不调用 admin-only 删除接口；`409` 映射为“该材料已提交评审，项目负责人不能删除。如确需删除，请联系管理员。”。

## 4. 错误处理

- `401`：未登录，守卫跳转登录页
- `403`：无权限，管理员守卫显示 403
- `400`：展示后端 message 或默认输入错误提示
- `409`：展示后端 message 或默认冲突提示；项目负责人删除 submitted 材料时固定展示“该材料已提交评审，项目负责人不能删除。如确需删除，请联系管理员。”
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
- 专家分配操作使用 `/review-manager/projects*` 系列接口，admin 角色按后端权限允许访问；前端不新增 `/admin/projects/:id/experts` 假接口
- 专家候选和分配不在前端自行实现学科匹配或单位回避；页面只展示后端返回候选、assigned 标记和失败原因
- 评审安排只保存 `reviewTime/reviewLocation/meetingUrl`，不接腾讯会议 API、直播、推流或回看
- 管理员项目材料查看、下载和删除只调用 `/admin/projects/:id/materials`、`/admin/projects/:id/materials/:materialId/download-url`、`DELETE /admin/projects/:id/materials/:materialId`；删除必须提交 `reason`，不调用 project_owner / review_manager / expert 材料接口，不调用 `/admin/users` 只为补上传人名称。
- 管理员材料删除成功后刷新列表；`400` reason 问题、`403` 权限、`404` 已删除和 `500`/storage 删除失败均在材料卡片或删除弹窗内展示，不在成功前从列表乐观移除。
- 项目负责人列表和详情通过 `/portal/reference-data/*` 构造批次、普通字典、材料类型、树形字典、单位、评审方案和评审负责人名称映射；未命中时显示“未知项（短ID）”类兜底，不默认展示裸 ID
- 项目负责人项目列表筛选使用批次、项目类型、项目状态、评审负责人、评审方案 select；提交给后端的仍是对应 ID，不新增 keyword
- 项目负责人材料列表类型展示优先使用 `ProjectMaterial.materialType.name`，其次使用 portal `material_type` 映射，仍未命中时显示“未知材料类型（短ID）”
- 项目负责人材料列表显示材料状态 Badge；`draft/active` 可提交或删除，`submitted` 禁用删除，`deleted/unknown` 禁用操作。

## 5. 当前未对接的后端接口

- 用户自助改密、忘记密码、短信验证码、用户批量导入、权限矩阵配置相关接口
- `/review-manager/projects/:id/materials*`
- `/review-manager/projects/:id/expert-reviews*`
- `/review-manager/projects/:id/consensus*`
- `/review-manager/projects/:id/appeals*`
- `/expert/*`
- `/admin/projects/:id/expert-reviews*`
- `/admin/projects/:id/consensus*`
- `/admin/projects/:id/appeals*`
