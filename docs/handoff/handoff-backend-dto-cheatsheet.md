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
| `QueryAdminUsersDto` | users | 管理员用户分页查询 | `page/pageSize/keyword/isActive/role/organizationId/disciplineId` | 全可选 | number / string / boolean / ObjectId | `page>=1`、`pageSize<=1000`；`keyword` trim；`isActive` 支持 `true/false` 字符串转换；`role` 必须是既有角色枚举；ID 必须是 ObjectId | `page=1`、`pageSize=100` | `{ role: "expert", keyword: "138" }` | `GET /admin/users` | 返回分页对象；当前只返回单位/学科 ID，不 populate 名称 |
| `CreateAdminUserDto` | users | 管理员创建用户 | `name`、`phone`、`roles`、`password`、`organizationIds`、`disciplineIds`、`isActive`、`mustChangePassword` | `name/phone/roles` 必填；`password` 可选；数组和布尔可选 | string / string array / boolean | `name/phone` trim 且非空；`roles` 至少 1 个且必须是既有角色枚举；`password` 如传入最少 6 位；数组 ID 去重且必须是 ObjectId；业务层校验单位/学科启用和类型 | `password` 未传默认手机号；`isActive=true`；`mustChangePassword=true` | `{ name, phone, roles: ["expert"], organizationIds, disciplineIds }` | `POST /admin/users` | `phone` 唯一；`organizationIds` 必须引用启用 Organization；`disciplineIds` 必须引用启用 `treeType=discipline` 节点；响应不返回 `passwordHash` |
| `UpdateAdminUserDto` | users | 管理员更新用户 | `name`、`roles`、`isActive`、`organizationIds`、`disciplineIds`、`mustChangePassword`；显式拒绝 `password/passwordHash` | 全可选；`roles` 如传入至少 1 个 | string / string array / boolean | `name` trim 且非空；`roles` 必须是既有角色枚举；数组 ID 去重且必须是 ObjectId；业务层校验单位/学科启用和类型 | 无 | `{ roles: ["expert", "project_owner"], isActive: true }` | `PATCH /admin/users/:id` | 本阶段不允许修改 `phone`；修改密码必须走 reset-password；后端保护当前 admin 和最后启用 admin |
| `UpdateAdminUserStatusDto` | users | 管理员启用/停用用户 | `isActive` | 必填 | boolean | 必须是 boolean | 无 | `{ isActive: false }` | `PATCH /admin/users/:id/status` | 与普通 PATCH 的 `isActive` 使用同一保护规则；不允许当前 admin 停用自己，不允许破坏最后启用 admin |
| `ResetAdminUserPasswordDto` | users | 管理员重置用户密码 | `password`、`mustChangePassword` | 均可选 | string / boolean | `password` 如传入最少 6 位；`mustChangePassword` 必须是 boolean | `password` 未传默认手机号；`mustChangePassword=true` | `{ password: "new-password" }` | `POST /admin/users/:id/reset-password` | 可重置管理员自己的密码；写入 bcrypt hash；响应不返回 `passwordHash` |
| `CreateBatchDto` / `UpdateBatchDto` / `QueryBatchesDto` | batches | 批次管理 | `name`、`year`、`description`、`isActive`；查询含 `page/pageSize/keyword/isActive` | create `name` 必填；update 全可选 | string / number / boolean | trim、分页范围校验、ObjectId 路径由 service 校验 | `page=1`、`pageSize=100`、最大 `1000` | `{ name: "2026", year: 2026 }` | `/admin/batches` | 当前仍分页；`name` 唯一 |
| `CreateDictionaryDto` / `UpdateDictionaryDto` / `QueryDictionariesDto` | dictionaries | 普通字典管理 | 写入含 `dictType`、`code`、`name`、`description`、`sortOrder`、`isActive`；查询含 `dictType`、`keyword`、`isActive` | create `dictType/code/name` 必填 | string / number / boolean | trim、`sortOrder >= 0`、查询支持 `dictType/keyword/isActive` | `sortOrder=0` | `{ dictType: "project_status", code: "in_progress", name: "实施中" }` | `/admin/dictionaries` | 列表不分页，返回数组；`dictType+code`、`dictType+name` 唯一 |
| `CreateTreeDictionaryDto` / `UpdateTreeDictionaryDto` / `QueryTreeDictionariesDto` | tree-dictionaries | 树形字典管理 | 写入含 `treeType`、`parentId`、`code`、`name`、`fullName`、`sortOrder`、`isActive`；查询含 `treeType`、`parentId`、`keyword`、`isActive` | create `treeType/name` 必填 | string / ObjectId / number / boolean | trim、`parentId` ObjectId 校验、查询支持 `treeType/parentId/keyword/isActive` | `level/pathIds` 后端计算 | `{ treeType: "administrative_division", name: "重庆市" }` | `/admin/tree-dictionaries` | 列表不分页，返回平铺数组；行政区划统一使用 `treeType=administrative_division`；当前未实现 tree children 接口 |
| `CreateOrganizationDto` / `UpdateOrganizationDto` / `QueryOrganizationsDto` | organizations | 单位管理 | `name`、`contactName`、`contactPhone`、`regionId`、`isActive`；查询含 `page/pageSize/keyword/isActive/regionId` | create `name` 必填 | string / ObjectId / boolean | trim、`regionId` ObjectId 且必须引用 `treeType=administrative_division` 节点；分页最大 `1000` | `page=1`、`pageSize=100` | `{ name: "测试单位", regionId }` | `/admin/organizations` | `regionId` 字段名保持不变；历史 `treeType=region` 不再作为行政区划；列表保留分页；`name` 唯一 |
| `CreateReviewSchemeDto` / `UpdateReviewSchemeDto` / `ReviewSchemeItemDto` / `QueryReviewSchemesDto` | review-schemes | 评审方案管理 | 写入含 `name`、`description`、`items[]`、`isActive`；查询含 `keyword`、`isActive`；item 含 `name/maxScore/scoringGuide/sortOrder/suggestionRequiredThresholdRatio` | create `name/items` 必填；items 至少 1 项 | string / number / boolean / array | `maxScore > 0`、阈值 `0..1`、嵌套 DTO 校验 | item 阈值默认 `0.8` | `{ name, items: [{ name, maxScore }] }` | `/admin/review-schemes` | 列表不分页，返回数组；`totalScore` 后端计算 |
| `CreateProjectDto` / `UpdateProjectDto` / `QueryProjectsDto` | projects | 项目基础管理 | 写入字段同 Project；查询含 `page/pageSize/keyword/isActive/batchId/reviewManagerId/reviewSchemeId/projectTypeId/statusId/departmentId/disciplineId/hasReviewManager/hasReviewScheme` | create `batchId/projectNo/name` 必填 | string / ObjectId / number / Date / boolean / array | ObjectId 校验、数组去重、资金 `>=0`、跨集合关联校验；分页最大 `1000` | `page=1`、`pageSize=100`；arrays 默认空数组 | `{ batchId, projectNo, name }` | `/admin/projects` | 列表保留分页；`batchId+projectNo` 唯一；负责人角色硬校验 |
| `UpdateReviewAssignmentDto` / `BatchUpdateReviewAssignmentDto` | projects | 管理员设置评审负责人/评审方案 | 单个含 `reviewManagerId`、`reviewSchemeId`；批量额外含 `projectIds` | 单个至少传 `reviewManagerId/reviewSchemeId` 之一；批量 `projectIds` 非空 | ObjectId / array | ObjectId 校验、数组去重；`reviewManagerId` 必须启用且具备 `review_manager`；`reviewSchemeId` 必须启用 | 无 | `{ reviewManagerId, reviewSchemeId }` | `PATCH /admin/projects/:id/review-assignment`、`PATCH /admin/projects/review-assignment/batch` | 设置 `reviewSchemeId` 时写入 `reviewSchemeSnapshot`；批量返回成功/失败明细 |
| `UpdateProjectScheduleDto` | projects | 设置评审安排 | `reviewTime`、`reviewLocation`、`meetingUrl` | 全可选 | Date / string | `reviewTime` 必须为合法日期；地点最长 200；meetingUrl 最长 500；字符串 trim | 无 | `{ reviewTime, reviewLocation, meetingUrl }` | `PATCH /review-manager/projects/:id/schedule`、`PATCH /admin/projects/:id/schedule` | 仅更新评审安排字段，不调用腾讯会议 API |
| `QueryReviewManagerProjectsDto` | projects | 评审负责人项目列表 | `page/pageSize/keyword/isActive/batchId/reviewSchemeId/statusId` | 全可选 | number / string / ObjectId / boolean | ObjectId 校验；分页最大 `1000` | `page=1`、`pageSize=100` | `{ batchId, keyword }` | `GET /review-manager/projects` | 只返回当前登录用户作为 `reviewManagerId` 的启用项目；admin + review_manager 多角色也只看自己负责项目；admin 全局视角走 `/admin/projects` |
| `QueryExpertCandidatesDto` | project-expert-assignments | 专家候选列表 | `page/pageSize/keyword/isActive` | 全可选 | number / string / boolean | 分页最大 `1000`；keyword 按姓名/手机号匹配 | `page=1`、`pageSize=100` | `{ keyword: "138" }` | `GET /review-manager/projects/:id/expert-candidates`、`GET /admin/projects/:id/expert-candidates` | 候选强校验 expert 角色、启用、学科匹配、承担单位/合作单位回避；项目无学科返回空分页 |
| `AppendProjectExpertsDto` / `UpdateProjectExpertsDto` / `BatchProjectExpertsDto` | project-expert-assignments | 专家追加、替换和批量分配 | 追加/替换含 `expertUserIds`；批量含 `projectIds`、`expertUserIds`、`mode` | 追加 `expertUserIds` 非空；替换允许空数组；批量 `projectIds` 非空，`mode=append` 时专家非空 | ObjectId array / enum | ObjectId 校验、数组去重；`mode` 仅 `replace/append` | 无 | `{ expertUserIds: ["..."] }` | `/review-manager/projects/:id/experts`、`PUT /review-manager/projects/experts/batch`、`/admin/projects/:id/experts`、`PUT /admin/projects/experts/batch` | review-manager 命名空间必须是当前评审负责人负责项目；admin 命名空间保留全局管理；`PUT replace` 任一专家不合规则整体 `409`；`POST append` 返回逐专家成功/失败明细 |
| `QueryProjectOwnerProjectsDto` | project-materials | 项目负责人项目列表 | `page/pageSize/keyword/batchId/statusId/projectTypeId/reviewManagerId/reviewSchemeId` | 全可选 | number / string / ObjectId | ObjectId 校验；分页最大 `1000`；keyword 按项目编号/名称匹配 | `page=1`、`pageSize=100` | `{ pageSize: 1000, keyword }` | `GET /project-owner/projects` | 只返回当前 `project_owner` 用户负责的启用项目，响应含评审安排、`followUpNeeds`、`materialCount`、`reviewManager` 摘要和 `ownerContentLocked` |
| `QueryExpertProjectsDto` | project-materials | 专家项目列表 | `page/pageSize/keyword/batchId/statusId` | 全可选 | number / string / ObjectId | ObjectId 校验；分页最大 `1000`；keyword 按项目编号/名称匹配 | `page=1`、`pageSize=100` | `{ batchId, keyword }` | `GET /expert/projects` | 只返回当前专家 `status=assigned` 的启用项目 |
| `UpdateFollowUpNeedsDto` | project-materials | 项目负责人更新后续推进需求 | `followUpNeeds` | 必填，可为空字符串 | string | trim；最长 5000 | 无 | `{ followUpNeeds: "需协调..." }` | `PATCH /project-owner/projects/:id/follow-up-needs` | 只更新 `Project.followUpNeeds`，不得更新项目其他字段；项目负责人内容锁定时返回 `409 PROJECT_OWNER_CONTENT_LOCKED` |
| `QueryProjectMaterialsDto` | project-materials | 单项目材料列表过滤 | `materialTypeId` | 可选 | ObjectId | ObjectId 校验 | 无 | `{ materialTypeId }` | `/project-owner/projects/:id/materials`、`/review-manager/projects/:id/materials`、`/expert/projects/:id/materials`、`/admin/projects/:id/materials` | 单项目材料列表不分页；项目负责人/admin 返回 `draft/submitted/legacy active`，评审负责人/专家只返回 `submitted` |
| `QueryPortalCommonDto` | portal-reference-data | 门户参考数据通用查询 | `keyword`、`isActive` | 全可选 | string / boolean | `keyword` trim；`isActive` 支持 `true/false` 字符串转换 | `isActive` 未传时由 service 按 `true` 查询 | `{ keyword: "2026" }` | `/portal/reference-data/batches`、`organizations`、`review-schemes` | 不分页，返回 `{ items }` |
| `QueryPortalDictionariesDto` | portal-reference-data | 门户普通字典查询 | `dictType`、`dictTypes`、`keyword`、`isActive` | 全可选 | string / string array / boolean | `dictType` trim；`dictTypes` 支持逗号分隔并逐项 trim；`keyword` trim | `isActive=true` | `{ dictTypes: "material_type,project_status" }` | `GET /portal/reference-data/dictionaries` | `dictType` 与 `dictTypes` 同时存在时合并去重；只返回最小摘要字段 |
| `QueryPortalTreeDictionariesDto` | portal-reference-data | 门户树形字典查询 | `treeType`、`treeTypes`、`keyword`、`isActive` | 全可选 | string / string array / boolean | `treeType` trim；`treeTypes` 支持逗号分隔并逐项 trim；`keyword` trim | `isActive=true` | `{ treeTypes: "project_type,discipline,department,administrative_division" }` | `GET /portal/reference-data/tree-dictionaries` | 返回平铺 `{ items }`，不做树形嵌套 |
| `QueryPortalUsersDto` | portal-reference-data | 门户业务用户摘要查询 | `role`、`roles`、`keyword`、`isActive` | `role/roles` 至少一个由 service 强制；其他可选 | string / string array / boolean | `role/roles` 仅允许 `review_manager/expert/project_owner`；`roles` 支持逗号分隔；`keyword` 匹配姓名/手机号 | `isActive=true` | `{ role: "review_manager" }` | `GET /portal/reference-data/users` | `role=admin` 或 `roles` 包含 `admin` 返回 `400`；查询结果排除含 `admin` 角色用户；不返回 `passwordHash/mustChangePassword/session/token` |
| `UploadProjectMaterialsDto` | project-materials | 项目负责人上传项目材料 | `materialTypeId`、`remark`；multipart `files` | `materialTypeId/files` 必填；`remark` 可选 | ObjectId / string / file array | `materialTypeId` ObjectId 且必须是启用 `dictType=material_type`；`remark` trim 且最长 1000；文件数量最大 20，单文件最大 500MB，禁止空文件和危险扩展名 | 无 | multipart form-data | `POST /project-owner/projects/:id/materials` | 文件字段名 `files`，支持多文件；新上传材料默认 `status=draft`；数据库只保存文件引用和元数据，不保存文件内容；项目负责人内容锁定时返回 `409 PROJECT_OWNER_CONTENT_LOCKED` |
| `SubmitProjectMaterialsDto` | project-materials | 项目负责人提交评审材料 | `materialIds` | 可选；未传或空数组表示提交全部 draft/active | ObjectId array | 数组每项必须是 ObjectId | 无 | `{ materialIds: ["..."] }` | `POST /project-owner/projects/:id/materials/submit` | draft 和 legacy active 改为 `submitted` 并写 `submittedAt/submittedByUserId`；已 submitted 计入 `alreadySubmittedCount`；不存在或不可见项进入 `skipped`；项目负责人内容锁定时返回 `409 PROJECT_OWNER_CONTENT_LOCKED` |
| `DeleteProjectMaterialAdminDto` | project-materials | admin 删除项目材料 | `reason` | 必填 | string | trim；长度 1..1000 | 无 | `{ reason: "重复上传" }` | `DELETE /admin/projects/:id/materials/:materialId` | admin 可删除 `draft/submitted/legacy active`；删除前必须先通过 storage 删除 object，成功后写 deletion log 并物理删除主记录 |
| `UploadProjectImportDto` | project-imports | Excel 项目导入上传 | `batchId`；multipart `file` | `batchId/file` 必填 | `batchId: ObjectId`；file buffer | `batchId` ObjectId；文件扩展名 `.xlsx/.xls`；文件大小 10MB 上限 | 无 | multipart form-data | `POST /admin/project-imports/upload` | 使用 `xlsx` 解析第一个工作表；关键表头缺失或无有效数据行返回 `400` |
| `QueryProjectImportFieldMappingsDto` | project-imports | Excel 字段映射配置列表查询 | `keyword`、`isActive` | 全可选 | string / boolean | `keyword` trim；`isActive` 支持 `true/false` 字符串转换 | 无 | `{ keyword: "项目", isActive: "true" }` | `GET /admin/project-import-field-mappings` | 返回所有固定标准字段的配置视图，不分页 |
| `UpsertProjectImportFieldMappingDto` | project-imports | 创建或覆盖某个标准字段的自定义别名配置 | `aliases`、`isActive`、`description` | `aliases` 必填；其他可选 | string array / boolean / string | DTO 要求 aliases 数组且至少 1 项；description 最长 500；业务层 trim、压缩空白、归一化、校验空别名/重复/冲突 | `isActive=true`；description 未传保存为空字符串 | `{ aliases: ["项目唯一编号"], isActive: true }` | `PUT /admin/project-import-field-mappings/:standardField` | `standardField` 只来自 path 且必须是后端固定枚举；管理员不能自定义标准字段 |
| `UpdateProjectImportFieldMappingDto` | project-imports | 更新已有字段映射配置 | `aliases`、`isActive`、`description` | 全可选；配置必须已存在 | string array / boolean / string | aliases 如传入至少 1 项；description 最长 500；业务层校验同 upsert | 无 | `{ isActive: false }` | `PATCH /admin/project-import-field-mappings/:standardField` | 配置不存在返回 `404`；`isActive=false` 表示停用自定义配置并回退默认别名 |
| `QueryProjectImportJobsDto` | project-imports | 导入任务列表查询 | `page/pageSize/status/batchId/keyword` | 全可选 | number / string / ObjectId | status 枚举、`batchId` ObjectId、分页最大 `1000` | `page=1`、`pageSize=100` | `{ status, batchId, pageSize: 1000 }` | `GET /admin/project-imports` | 返回分页对象 |
| `QueryProjectImportRowsDto` | project-imports | 导入行列表查询 | `page/pageSize/status/keyword` | 全可选 | number / string | status 枚举、分页最大 `1000` | `page=1`、`pageSize=100` | `{ status, keyword, pageSize: 1000 }` | `GET /admin/project-imports/:id/rows` | 返回分页对象 |
| `UpdateProjectImportRowDto` | project-imports | 导入行人工修正 | `normalized`、`resolved`、`createOrganization`、`createOwnerUser` | 全可选；按修正场景传入 | nested object | ObjectId 校验、数组去重、资金 `>=0`、创建单位/用户字段 trim | 无 | `{ resolved: { leadOrganizationId }, createOwnerUser: { name, phone } }` | `PATCH /admin/project-imports/:id/rows/:rowId` | 可选择既有主数据；可创建单位和项目负责人用户；不可创建字典/树形字典 |
| `QueryExpertReviewTasksDto` | expert-reviews | 专家评分任务列表 | `page/pageSize/keyword/batchId/status/reviewManagerId/reviewSchemeId` | 全可选 | number / string / ObjectId / enum | ObjectId 校验；`status` 为 `not_started/draft/submitted/returned`；分页最大 `1000` | `page=1`、`pageSize=100` | `{ status: "submitted" }` | `GET /expert/review-tasks` | 只返回当前专家已分配项目 |
| `SaveExpertReviewDto` / `ExpertReviewItemInputDto` | expert-reviews | 保存草稿或提交评分 | `items[]`；item 含 `name/score/evaluationDescription/improvementSuggestion/hasMajorIssue` | 草稿 items 可选；提交时业务层要求每项完整 | string / number / boolean / array | DTO 校验字符串长度；业务层校验 score 范围、快照项存在、提交必填和改进建议条件必填 | 无 | `{ items: [{ name: "技术", score: 55 }] }` | `PUT /expert/review-tasks/:projectId`、`POST /expert/review-tasks/:projectId/submit` | `totalScore` 不接收前端值，由后端计算 |
| `ReturnExpertReviewDto` | expert-reviews | 退回专家评分 | `returnReason` | 必填 | string | trim，1..1000 | 无 | `{ returnReason: "请补充说明" }` | `POST /review-manager/projects/:id/expert-reviews/:expertUserId/return` | 仅 submitted 可退回 |
| `GenerateConsensusDraftDto` | consensus-reviews | 合议草稿生成查询参数 | `force` | 可选 | boolean | 支持 `true/false` 字符串转换 | `false` | `?force=true` | `POST /review-manager/projects/:id/consensus/draft` | 已有 draft 时需 `force=true` 才覆盖；confirmed 不可覆盖 |
| `ConfirmConsensusReviewDto` | consensus-reviews | 人工确认合议 | `finalOpinion/finalScore/finalLevel` | 三者必填 | string / number | `finalOpinion` 1..10000；`finalScore` 业务层校验 `0..reviewSchemeSnapshot.totalScore`；`finalLevel` 校验 review_level 字典或 A/B/C/D 兜底 | 无 | `{ finalOpinion, finalScore: 82, finalLevel: "A" }` | `POST /review-manager/projects/:id/consensus/confirm`、`POST /admin/projects/:id/consensus/confirm` | `useDraftAsBase` 已删除，不再是有效字段；当前允许再次确认覆盖最新确认结果，不做完整等级变更历史 |
| `CreateProjectAppealDto` | project-appeals | 项目负责人提交申诉 | `reason`；multipart 可选 `files` | `reason` 必填；`files` 可选 | string / file array | `reason` trim，1..10000；如带文件，文件字段名 `files`，单次最多 20 个、单文件最大 500MB、禁止空文件和危险扩展名 | 无 | `{ reason: "请复核最终等级" }` | `POST /project-owner/projects/:id/appeals` | 后端生成 `appealNo`；必须已有 confirmed 合议且 `Project.finalLevel` 非空；最多 3 次；未处理申诉互斥 |
| `UploadProjectAppealAttachmentsDto` | project-appeals | 追加申诉补充材料 | `remark`；multipart `files` | `files` 必填；`remark` 可选 | string / file array | `remark` trim，最大 1000；文件字段名 `files`；单次最多 20 个、单文件最大 500MB、禁止空文件和危险扩展名 | 无 | multipart form-data | `POST /project-owner/projects/:id/appeals/:appealId/attachments` | 仅 `submitted` 申诉可追加；不使用 `material_type` 字典 |
| `HandleProjectAppealDto` | project-appeals | 处理申诉 | `decision`、`handlingOpinion`、`newFinalLevel` | `decision/handlingOpinion` 必填；`newFinalLevel` 可选 | enum / string | `decision` 仅 `accepted/rejected`；`handlingOpinion` trim，1..10000；`newFinalLevel` 校验启用 `review_level` 字典 code/name，字典为空时允许 A/B/C/D | 无 | `{ decision: "accepted", handlingOpinion: "申诉有效", newFinalLevel: "B" }` | `POST /review-manager/projects/:id/appeals/:appealId/handle`、`POST /admin/projects/:id/appeals/:appealId/handle` | 已处理申诉不可重复处理；等级变更只写 `Project.finalLevel` 和 `ProjectLevelChangeLog` |

## 3.1 专家分配锁定错误

- `AppendProjectExpertsDto`、`UpdateProjectExpertsDto`、`BatchProjectExpertsDto` 本次未新增请求字段。
- admin 和 review_manager 专家分配 mutation 在后端统一执行锁定校验；单项目锁定时返回 `409`。
- 错误码：`EXPERT_ASSIGNMENT_LOCKED`。
- 响应字段：
  - `message`: 固定为“专家名单已锁定，不能继续调整。”
  - `code`: `EXPERT_ASSIGNMENT_LOCKED`
  - `reasons`: 字符串数组，可能包含 `REVIEW_TIME_REACHED`、`EXPERT_REVIEW_EXISTS`、`CONSENSUS_EXISTS`、`FINAL_LEVEL_EXISTS`
- 该错误仅影响专家名单 mutation；专家候选、已分配专家、材料和项目摘要读取接口不使用该锁定错误。

## 3.2 项目负责人内容锁定错误

- 本次不新增请求 DTO 或 schema 字段。
- project-owner 后续推进需求和材料写接口在服务层统一判断项目负责人内容是否可变；锁定条件为 confirmed 合议存在、项目 `finalLevel` 有有效值或项目 `originalLevel` 有有效值。
- 锁定时返回 `409 Conflict`。
- 错误码：`PROJECT_OWNER_CONTENT_LOCKED`。
- 响应字段：
  - `message`: 固定为“评审结果已确认，项目材料和后续推进需求已锁定。如需补充说明，请通过申诉提交补充材料。”
  - `code`: `PROJECT_OWNER_CONTENT_LOCKED`
- 该错误仅影响 `PATCH /project-owner/projects/:id/follow-up-needs`、`POST /project-owner/projects/:id/materials`、`POST /project-owner/projects/:id/materials/submit`、`DELETE /project-owner/projects/:id/materials/:materialId`；项目详情、材料列表、材料下载 URL、评审结果、申诉和申诉附件接口不使用该锁定错误。

## 4. 类型 / 状态

| 名称           | 可选值 / 字段                                                                     | 含义              | 是否对前端暴露        | 是否可持久化 | 备注                       |
| -------------- | --------------------------------------------------------------------------------- | ----------------- | --------------------- | ------------ | -------------------------- |
| `UserStatus`   | `active`、`disabled`                                                              | 用户基础状态      | 后续如暴露 API 再确认 | 是           | 当前不扩展复杂状态机       |
| `UserRole`     | `admin`、`client`、`review_manager`、`expert`、`project_owner` | 用户角色枚举 | 是 | 是 | `/admin/*` 当前只使用 `admin` |
| `PublicUser`   | `id`、`phone`、`name`、`roles`、`organizationIds`、`disciplineIds`、`mustChangePassword`、`isActive`、`status`、`createdAt`、`updatedAt`、`lastLoginAt` | 公开用户返回类型 | 是 | 否 | 不包含 `passwordHash` |
| `AdminUserResponse` | `id`、`phone`、`name`、`roles`、`organizationIds`、`disciplineIds`、`mustChangePassword`、`isActive`、`createdAt`、`updatedAt` | 管理员用户维护返回类型 | 是 | 否 | 不包含 `passwordHash`；当前不返回 `status/lastLoginAt`，不 populate 单位/学科名称 |
| `PortalDictionarySummary` | `id`、`dictType`、`code`、`name`、`sortOrder`、`isActive` | 门户普通字典展示摘要 | 是 | 否 | 最小字段；不含审计字段 |
| `PortalTreeDictionarySummary` | `id`、`treeType`、`parentId`、`code`、`name`、`sortOrder`、`isActive` | 门户树形字典展示摘要 | 是 | 否 | 平铺返回，不含 `pathIds/fullName/level` |
| `PortalBatchSummary` | `id`、`name`、`isActive`、`createdAt?`、`updatedAt?` | 门户批次展示摘要 | 是 | 否 | 不含描述字段 |
| `PortalOrganizationSummary` | `id`、`name`、`regionId`、`isActive` | 门户单位展示摘要 | 是 | 否 | 当前最小化不返回 `contactName/contactPhone`，但 keyword 可匹配联系人和电话 |
| `PortalReviewSchemeSummary` | `id`、`name`、`totalScore`、`isActive` | 门户评审方案展示摘要 | 是 | 否 | 不返回完整评分项；专家评分仍应使用项目 `reviewSchemeSnapshot` |
| `PortalUserSummary` | `id`、`name`、`phone`、`roles`、`organizationIds`、`disciplineIds`、`isActive` | 门户业务用户展示摘要 | 是 | 否 | 仅允许查询 `review_manager/expert/project_owner`，结果排除 `admin` 用户；不含密码、改密、session/token 字段 |
| `ProjectOwnerUserSummary` | `id`、`name`、`phone?` | project-owner 项目响应中的评审负责人摘要 | 是 | 否 | `ProjectPortalResponse.reviewManager` 使用；只返回展示必要字段，不返回 `roles/passwordHash/mustChangePassword/session/token`；负责人用户不存在时为 `null` |
| `PortalListResponse<T>` | `items: T[]` | 门户参考数据列表包装结构 | 是 | 否 | `/portal/reference-data/*` 统一非分页 `{ items }` |
| `AuthIdentity` | `id`、`phone`、`passwordHash`、`roles`、`isActive`、`status` | auth 内部身份类型 | 否 | 否 | 仅供认证流程内部使用 |
| `PublicSession` | `id`、`userId`、`expiresAt`、`revokedAt`、`lastSeenAt`、`userAgent`、`ip`、`createdAt`、`updatedAt` | 公开 session 返回类型 | 后续如暴露 API 再确认 | 否 | 不包含 `token` |
| `CreatedSessionResult` | `token`、`session`、`expiresAt` | session 创建结果 | 否 | 否 | `createSession()` 专用返回，允许把 token 交给后续 auth 层 |
| `AuthSessionRecord` | 当前等同 `PublicSession` | auth 内部 session 记录类型 | 否 | 否 | 预留给后续 Guard / auth 流程使用 |
| `LoginResult` | `user`、`sessionToken`、`expiresAt` | AuthService 登录结果 | 否 | 否 | `sessionToken` 只交给 Controller 设置 HttpOnly Cookie，不进入响应 body |
| `AuthenticatedUser` | `user`、`session` | Guard 挂载到 request 的认证上下文 | 否 | 否 | `GET /auth/me` 只返回其中的 `user` |
| `ProjectImportJobStatus` | `parsing`、`pending_confirmation`、`completed`、`failed`、`canceled` | 导入任务状态 | 是 | 是 | 当前同步解析；正常上传后通常进入 `pending_confirmation`，全部处理后进入 `completed` |
| `ProjectImportRowStatus` | `importable`、`pending_confirmation`、`confirmed`、`skipped`、`failed` | 导入行状态 | 是 | 是 | 只有 `importable` 可确认入库；`confirmed` 不可重复确认或跳过 |
| `ProjectImportIssueCode` | `required_field_missing`、`invalid_number`、`funding_inconsistent`、`project_type_not_found`、`project_type_ambiguous`、`status_not_found`、`status_ambiguous`、`owner_not_found`、`owner_ambiguous`、`lead_organization_not_found`、`lead_organization_ambiguous`、`cooperation_organization_not_found`、`cooperation_organization_ambiguous`、`discipline_not_found`、`discipline_ambiguous`、`department_not_found`、`department_ambiguous`、`duplicate_project_no_in_file`、`existing_project_matched`、`lead_organization_duplicated_in_cooperation`、`unknown_error` | 导入行结构化问题编码 | 是 | 是 | `existing_project_matched` 和 `lead_organization_duplicated_in_cooperation` 当前为非阻断提示；其他 issue 阻断确认 |
| `ProjectImportStandardField` | `projectNo`、`name`、`projectTypeName`、`ownerName`、`ownerPhone`、`leadOrganizationName`、`totalFunding`、`allocatedFunding`、`disciplineName`、`departmentName`、`cooperationOrganizationNames`、`statusName`、`organizationContactName`、`organizationContactPhone` | Excel 导入标准字段固定枚举 | 是 | 是 | 管理员只能维护别名配置，不能新增或改名标准字段 |
| `DeleteProjectImportJobResponse` | `success: true`、`deletedJobId`、`deletedRows` | 删除导入任务响应 | 是 | 否 | `DELETE /admin/project-imports/:id` 返回；只表示导入任务和行级解析记录被清理，不代表删除正式项目 |
| `ProjectImportFieldMappingResponse` | `id?`、`standardField`、`label`、`required`、`aliases`、`normalizedAliases`、`defaultAliases`、`effectiveAliases`、`isConfigured`、`isActive`、`description?`、`createdByUserId?`、`updatedByUserId?`、`createdAt?`、`updatedAt?` | Excel 字段映射配置视图 | 是 | 否 | 未配置字段 `aliases=[]`、`isConfigured=false`、`effectiveAliases=defaultAliases`；配置停用时 `effectiveAliases` 也回退默认别名 |
| `ProjectExpertAssignmentSource` | `manual`、`batch` | 专家分配来源 | 是 | 是 | 单项目接口写 `manual`，批量接口写 `batch` |
| `ProjectExpertAssignmentStatus` | `assigned`、`removed` | 专家分配关系状态 | 是 | 是 | 移除专家只标记 `removed`，不物理删除 |
| `ExpertEligibilityReason` | `expert_not_found`、`expert_inactive`、`expert_role_missing`、`project_not_found`、`project_inactive`、`project_discipline_missing`、`expert_discipline_missing`、`discipline_mismatch`、`lead_organization_conflict`、`cooperation_organization_conflict`、`duplicate_expert`、`invalid_object_id` | 专家资格校验原因码 | 是 | 否 | 由 `ExpertEligibilityService` 输出；当前未使用 `duplicate_expert` 阻断重复添加，重复添加按幂等成功处理 |
| `ProjectMaterialStatus` | `draft`、`submitted`、`active` | 项目材料状态 | 是 | 是 | `draft` 为新上传默认草稿；`submitted` 对评审负责人/专家可见；`active` 仅为 legacy 兼容并按草稿处理；schema 可读取 legacy `deleted`，但业务不再新写 `deleted` |
| `StorageDriver` | `fake`、`oss` | 项目材料存储驱动 | 是 | 是 | `ProjectMaterial.storageDriver` 保存上传时使用的驱动；接口不返回任何 AccessKey |
| `ExpertReviewStatus` | `draft`、`submitted`、`returned` | 专家评分持久化状态 | 是 | 是 | 无记录时接口返回视图状态 `not_started`，不入库 |
| `ExpertReviewViewStatus` | `not_started`、`draft`、`submitted`、`returned` | 专家评分接口视图状态 | 是 | 否 | 任务列表和负责人评分列表使用 |
| `ConsensusReviewStatus` | `draft`、`confirmed`、`reopened` | 合议评审状态 | 是 | 是 | `reopened` 当前仅预留 |
| `ConsensusDraftSource` | `rule_based`、`manual`、`ai` | 合议草稿来源 | 是 | 是 | 当前阶段只生成 `rule_based`；`ai` 仅预留，不代表已实现真实 AI |
| `ProjectAppealStatus` | `submitted`、`processing`、`accepted`、`rejected`、`canceled` | 项目申诉状态 | 是 | 是 | 本阶段实际使用 `submitted/accepted/rejected`；`processing/canceled` 仅预留，不实现撤回 |
| `ProjectAppealAttachmentStatus` | `active`、`deleted` | 申诉附件状态 | 是 | 是 | 删除只标记 `deleted`，不物理删除 OSS object |
| `ProjectLevelChangeSource` | `consensus_confirm`、`appeal_handling`、`admin_correction` | 项目等级变更来源 | 是 | 是 | 本阶段只在申诉处理等级变更时写 `appeal_handling`；不回填第五阶段历史合议确认 |

## 5. 当前 HTTP 响应结构

| API | 成功响应 | 敏感字段规则 | 备注 |
| --- | --- | --- | --- |
| `POST /auth/login` | `PublicUser` | 不包含 `passwordHash`、session token 或 Cookie 内容 | session token 只通过 HttpOnly Cookie 下发 |
| `POST /auth/logout` | `{ success: true }` | 不泄露 session 是否存在 | 幂等清理 Cookie |
| `GET /auth/me` | `PublicUser` | 不包含 `passwordHash`、session token 或 Cookie 内容 | 未登录返回 `401` |
| `/admin/users` 管理员用户维护 | 列表 `{ items: AdminUserResponse[], page, pageSize, total }`；创建/详情/更新/状态/重置密码返回 `AdminUserResponse` | 不返回 `passwordHash`、明文密码、session token 或 Cookie 内容 | 支持多角色、启用状态、单位/学科 ID 和 `mustChangePassword`；当前不 populate 名称；创建/重置默认密码为手机号 |
| `/admin/dictionaries` 列表 | `DictionaryResponse[]` | 不返回用户密码哈希或 session token | 不分页；支持 `dictType/keyword/isActive` |
| `/admin/tree-dictionaries` 列表 | `TreeDictionaryResponse[]` | 不返回用户密码哈希或 session token | 不分页；平铺数组；支持 `treeType/parentId/keyword/isActive` |
| `/admin/review-schemes` 列表 | `ReviewSchemeResponse[]` | 不返回用户密码哈希或 session token | 不分页；支持 `keyword/isActive` |
| `/admin/batches`、`/admin/organizations`、`/admin/projects` 列表 | `{ items: [], page: 1, pageSize: 100, total: 0 }` | 不返回用户密码哈希或 session token | 分页；`pageSize` 最大 `1000`；超过最大值由 DTO 校验返回 `400` |
| `/admin/project-imports`、`/admin/project-imports/:id/rows` 列表 | `{ items: [], page: 1, pageSize: 100, total: 0 }` | 不返回用户密码哈希或 session token | 分页；`pageSize` 最大 `1000` |
| `/admin/project-imports/upload` | `ProjectImportJobResponse` | 不返回用户密码哈希或原 Excel 文件 | `fieldMapping` 保存本次表头识别快照 |
| `DELETE /admin/project-imports/:id` | `{ success: true, deletedJobId, deletedRows }` | 不返回用户密码哈希或正式项目数据 | 只删除 `ProjectImportJob` 和对应 `ProjectImportRow`；`parsing` 或已有 confirmed 行返回 `409`；不删除正式项目 |
| `/admin/project-imports/:id/rows/:rowId` | `ProjectImportRowResponse` | `resolved` 仅返回 ID，不内联用户密码哈希 | 包含 `raw/normalized/resolved/issues/status/projectId/confirmedByUserId/confirmedAt` |
| `/admin/project-import-field-mappings/standard-fields` | `{ items: ProjectImportStandardFieldResponse[] }` | 不返回用户密码哈希或 session token | 返回固定标准字段、label、required、defaultAliases |
| `/admin/project-import-field-mappings` | `{ items: ProjectImportFieldMappingResponse[] }` | 不返回用户密码哈希或 session token | 列表覆盖所有固定标准字段；未配置字段没有持久化 id/timestamps，`effectiveAliases=defaultAliases` |
| `/admin/project-import-field-mappings/:standardField` | `ProjectImportFieldMappingResponse` 或 `{ success: true }` | 不返回用户密码哈希或 session token | GET/PUT/PATCH/reset-defaults 返回配置视图；DELETE 只删除自定义配置并回退默认别名 |
| `/portal/reference-data/*` | `{ items }`，其中 items 为对应 `Portal*Summary[]` | 所有接口要求登录和 `project_owner/expert/review_manager/client/admin` 之一；不返回 `passwordHash/mustChangePassword/session/token`、OSS 配置、材料 objectKey 或管理员 CRUD 字段 | 只读接口；无 POST/PATCH/DELETE；`users` 必须传 `role/roles` 且禁止 `admin` |
| 专家候选/专家列表 | `ExpertBasicResponse[]` 或分页对象 | 不返回 `passwordHash` | 字段含 `id/name/phone/organizationIds/disciplineIds`；候选额外含 `assigned` |
| `GET /project-owner/projects`、`GET /expert/projects` | `{ items: ProjectPortalResponse[], page, pageSize, total }` | 不返回用户密码哈希、OSS AccessKey 或 session token | `ProjectPortalResponse` 含项目基础字段、评审安排、`followUpNeeds`、`materialCount`；project-owner 响应含 `reviewManager?: { id, name, phone? } | null`、`finalLevel/originalLevel` 和 `ownerContentLocked` |
| 单项目材料列表 | `ProjectMaterialResponse[]` | 不返回 OSS AccessKey、文件内容或持久化 URL | 字段含材料 ID、项目 ID、材料类型摘要、文件名、objectKey、bucket、storageDriver、mimeType、extension、sizeBytes、sha256、remark、status、`submittedAt/submittedByUserId`、createdAt、updatedAt；列表可见性按角色区分 |
| 材料上传 | `{ materials, successCount, failedCount, failures }` | 不返回 OSS AccessKey 或文件内容 | 多文件上传允许部分成功；全部失败时按错误返回 |
| 材料下载 URL | `{ url, expiresAt }` | 不返回 OSS AccessKey 或持久化 URL | 默认有效期 10 分钟；deleted 材料不可生成 URL |
| 材料提交 | `{ submittedCount, alreadySubmittedCount, skippedCount, submittedMaterialIds, skipped }` | 不返回 OSS AccessKey 或文件内容 | `POST /project-owner/projects/:id/materials/submit` 返回；未传或空 `materialIds` 表示提交全部 draft/active |
| 项目负责人材料删除 | `{ deleted, alreadyDeleted?, deletionLogId? }` | 不返回 OSS AccessKey 或文件内容 | 仅 `draft/legacy active` 可删除；先删 storage object，成功后写 `project_material_deletion_logs` 并物理删除 `project_materials` 主记录；`submitted` 返回 `409`；项目负责人内容锁定时返回 `409 PROJECT_OWNER_CONTENT_LOCKED`；不再返回 `alreadyDeleted=true` |
| admin 材料删除 | `{ deleted: true, deletionLogId }` | 不返回 OSS AccessKey 或文件内容 | `reason` 必填；可删除 `draft/submitted/legacy active`；删除成功后保留材料快照审计日志 |
| 项目负责人 confirmed 合议结果 | `ProjectOwnerConsensusResponse` | 不返回未确认草稿、不返回用户密码或 session token | 只返回 `ConsensusReview.status=confirmed` 的 `finalOpinion/finalScore/finalLevel/confirmedAt/expertReviewStats` |
| 申诉列表/详情 | `ProjectAppealResponse` / `ProjectAppealDetailResponse` | 不返回文件内容、OSS AccessKey 或 session token | 包含 `appealNo/status/reason/handlingOpinion/causedLevelChange/levelBeforeAppeal/levelAfterHandling/attachmentCount`；负责人/管理员详情额外含 confirmed 合议摘要 |
| 申诉附件列表 | `ProjectAppealAttachmentResponse[]` | 不返回文件内容、OSS AccessKey 或持久化 URL | 只返回 active 附件；字段含 objectKey、bucket、storageDriver、文件名、MIME、扩展名、大小、sha256、remark、status |
| 申诉附件上传 | `{ attachments, successCount, failedCount, failures }` | 不返回文件内容或 OSS AccessKey | 多文件允许部分成功；全部失败时按错误返回；数据库只保存文件引用和元数据 |
| 申诉附件下载 URL | `{ url, expiresAt }` | 不返回 OSS AccessKey 或持久化 URL | 默认有效期 10 分钟；deleted 附件不可生成 URL |
| 申诉附件软删除 | `{ deleted, alreadyDeleted }` | 不返回文件内容或 OSS AccessKey | 重复删除幂等成功；不物理删除 OSS object |
| 等级变更历史 | `ProjectLevelChangeLogResponse[]` | 不返回用户密码或 session token | 包含 `fromLevel/toLevel/source/reason/changedByUserId/changedAt/appealId/consensusReviewId`；无日志返回空数组 |
| 管理员用户列表 | `{ items: AdminUserResponse[], page, pageSize, total }` | 不返回 `passwordHash` | `page=1`、`pageSize=100`、最大 `1000`；支持 `keyword/role/isActive/organizationId/disciplineId` |

## 6. Excel 导入字段映射

- 标准字段：`projectNo`、`name`、`projectTypeName`、`ownerName`、`ownerPhone`、`leadOrganizationName`、`totalFunding`、`allocatedFunding`、`disciplineName`、`departmentName`、`cooperationOrganizationNames`、`statusName`、`organizationContactName`、`organizationContactPhone`
- 关键表头：`projectNo`、`name`、`leadOrganizationName`；缺失时上传接口直接返回 `400`
- 标准字段仍由后端固定枚举控制，管理员不能新增标准字段；管理员只能通过 `/admin/project-import-field-mappings*` 维护每个标准字段的自定义别名、启用状态和备注
- `PROJECT_IMPORT_FIELD_ALIASES` 仍是内置默认别名；上传解析优先使用数据库中 `isActive=true` 的配置，未配置或 `isActive=false` 的字段回退默认内置别名，不会导致核心字段完全不可识别
- 别名归一化口径：全角空格转半角、trim、连续空白压缩为一个空格、英文字母小写；中文保持原样；不激进删除标点或内部单空格
- 保存配置时拦截空别名、同一标准字段下重复归一化别名、跨标准字段配置别名冲突，并拦截与其他标准字段保留默认别名的冲突
- `ProjectImportJob.fieldMapping` 仍保存本次 Excel 表头到 standardField 的解析快照；不改变导入任务、导入行和确认入库响应结构

## 7. 维护规则

- 新增或修改 DTO 必须同步本文档
- 修改请求体、响应结构或枚举值必须同步本文档
- 只修改 Service 内部逻辑且不影响接口契约时，可不更新本文档
