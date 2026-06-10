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
| projects | `GET` | `/admin/projects` | `ProjectsController` | `ProjectsService` | `SessionAuthGuard` + `RolesGuard(admin)` | `QueryProjectsDto` | `{ items, page, pageSize, total }` | implemented | 保留分页；`page=1`、`pageSize=100`、最大 `1000`；支持 `batchId/keyword/isActive` |
| projects | `POST/GET:id/PATCH:id/DELETE:id` | `/admin/projects` | `ProjectsController` | `ProjectsService` | `SessionAuthGuard` + `RolesGuard(admin)` | `CreateProjectDto`、`UpdateProjectDto`、path `id` | `ProjectResponse` | implemented | 校验批次、字典/树类型、用户角色、单位和启用评审方案；`batchId+projectNo` 唯一；delete 为停用 |

## 4. 列表返回结构口径

- 非分页数组：`GET /admin/dictionaries`、`GET /admin/tree-dictionaries`、`GET /admin/review-schemes`
- 分页对象：`GET /admin/batches`、`GET /admin/organizations`、`GET /admin/projects`
- 当前尚未实现管理员用户列表；未来用户列表应保留分页，`pageSize` 最大 `1000`
- 后续导入待确认行、申诉、材料、审计类记录仍建议分页，但当前未实现

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
