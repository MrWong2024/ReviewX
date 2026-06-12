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

## 5. 当前未对接的后端接口

- `/admin/project-imports*`
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
