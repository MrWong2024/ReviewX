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

## 4. 错误处理

- `401`：未登录，守卫跳转登录页
- `403`：无权限，管理员守卫显示 403
- `400`：展示后端 message 或默认输入错误提示
- `409`：展示后端 message 或默认冲突提示
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

## 5. 当前未对接的后端接口

- 用户自助改密、忘记密码、短信验证码、用户批量导入、权限矩阵配置相关接口
- `/review-manager/projects/:id/materials*`
- `/review-manager/projects/:id/expert-reviews*`
- `/review-manager/projects/:id/consensus*`
- `/review-manager/projects/:id/appeals*`
- `/project-owner/*`
- `/expert/*`
- `/admin/projects/:id/materials*`
- `/admin/projects/:id/expert-reviews*`
- `/admin/projects/:id/consensus*`
- `/admin/projects/:id/appeals*`
