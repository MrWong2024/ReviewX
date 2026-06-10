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
| `CreateBatchDto` / `UpdateBatchDto` / `QueryBatchesDto` | batches | 批次管理 | `name`、`year`、`description`、`isActive`；查询含 `page/pageSize/keyword/isActive` | create `name` 必填；update 全可选 | string / number / boolean | trim、分页范围校验、ObjectId 路径由 service 校验 | `page=1`、`pageSize=20` | `{ name: "2026", year: 2026 }` | `/admin/batches` | `name` 唯一 |
| `CreateDictionaryDto` / `UpdateDictionaryDto` / `QueryDictionariesDto` | dictionaries | 普通字典管理 | `dictType`、`code`、`name`、`description`、`sortOrder`、`isActive` | create `dictType/code/name` 必填 | string / number / boolean | trim、`sortOrder >= 0`、查询支持 `dictType` | `sortOrder=0` | `{ dictType: "project_status", code: "in_progress", name: "实施中" }` | `/admin/dictionaries` | `dictType+code`、`dictType+name` 唯一 |
| `CreateTreeDictionaryDto` / `UpdateTreeDictionaryDto` / `QueryTreeDictionariesDto` | tree-dictionaries | 树形字典管理 | `treeType`、`parentId`、`code`、`name`、`fullName`、`sortOrder`、`isActive` | create `treeType/name` 必填 | string / ObjectId / number / boolean | trim、`parentId` ObjectId 校验、查询支持 `treeType/parentId` | `level/pathIds` 后端计算 | `{ treeType: "region", name: "重庆市" }` | `/admin/tree-dictionaries` | 同 treeType + parentId 下 name 唯一 |
| `CreateOrganizationDto` / `UpdateOrganizationDto` / `QueryOrganizationsDto` | organizations | 单位管理 | `name`、`contactName`、`contactPhone`、`regionId`、`isActive` | create `name` 必填 | string / ObjectId / boolean | trim、`regionId` ObjectId 且必须为 `treeType=region` | 无 | `{ name: "测试单位", regionId }` | `/admin/organizations` | `name` 唯一 |
| `CreateReviewSchemeDto` / `UpdateReviewSchemeDto` / `ReviewSchemeItemDto` / `QueryReviewSchemesDto` | review-schemes | 评审方案管理 | `name`、`description`、`items[]`、`isActive`；item 含 `name/maxScore/scoringGuide/sortOrder/suggestionRequiredThresholdRatio` | create `name/items` 必填；items 至少 1 项 | string / number / boolean / array | `maxScore > 0`、阈值 `0..1`、嵌套 DTO 校验 | item 阈值默认 `0.8` | `{ name, items: [{ name, maxScore }] }` | `/admin/review-schemes` | `totalScore` 后端计算，不信任前端 |
| `CreateProjectDto` / `UpdateProjectDto` / `QueryProjectsDto` | projects | 项目基础管理 | `batchId`、`projectNo`、`name`、`projectTypeId`、`statusId`、`ownerUserId`、`leadOrganizationId`、`cooperationOrganizationIds`、`totalFunding`、`allocatedFunding`、`disciplineIds`、`departmentId`、`reviewManagerId`、`reviewSchemeId`、`reviewTime`、`reviewLocation`、`meetingUrl`、`followUpNeeds`、`finalLevel`、`originalLevel`、`importedFromJobId`、`isActive` | create `batchId/projectNo/name` 必填 | string / ObjectId / number / Date / boolean / array | ObjectId 校验、数组去重、资金 `>=0`、跨集合关联校验 | arrays 默认空数组 | `{ batchId, projectNo, name }` | `/admin/projects` | `batchId+projectNo` 唯一；负责人角色硬校验 |

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

## 5. 当前 HTTP 响应结构

| API | 成功响应 | 敏感字段规则 | 备注 |
| --- | --- | --- | --- |
| `POST /auth/login` | `PublicUser` | 不包含 `passwordHash`、session token 或 Cookie 内容 | session token 只通过 HttpOnly Cookie 下发 |
| `POST /auth/logout` | `{ success: true }` | 不泄露 session 是否存在 | 幂等清理 Cookie |
| `GET /auth/me` | `PublicUser` | 不包含 `passwordHash`、session token 或 Cookie 内容 | 未登录返回 `401` |
| `/admin/*` 列表 | `{ items: [], page: 1, pageSize: 20, total: 0 }` | 不返回用户密码哈希或 session token | 未登录 `401`；已登录但非 admin `403` |

## 6. 维护规则

- 新增或修改 DTO 必须同步本文档
- 修改请求体、响应结构或枚举值必须同步本文档
- 只修改 Service 内部逻辑且不影响接口契约时，可不更新本文档
