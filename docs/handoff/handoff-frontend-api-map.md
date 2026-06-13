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
| `listProjects` | `GET /admin/projects` | 分页对象 | `/admin/projects` |

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

## 5. 当前未对接的后端接口

- `/admin/project-imports*`
- 用户自助改密、忘记密码、短信验证码、用户批量导入、权限矩阵配置相关接口
- `/admin/projects/:id/review-assignment`
- `/admin/projects/review-assignment/batch`
- `/admin/projects/:id/schedule`
- `/review-manager/*`
- `/project-owner/*`
- `/expert/*`
- `/admin/projects/:id/materials*`
- `/admin/projects/:id/expert-reviews*`
- `/admin/projects/:id/consensus*`
- `/admin/projects/:id/appeals*`
