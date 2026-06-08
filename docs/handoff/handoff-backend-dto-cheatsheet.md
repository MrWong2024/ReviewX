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
| `CreateUserInput` | users    | Service 创建用户输入 | `phone`、`passwordHash`、`name`、`roles`、`status` | `phone/passwordHash/name` 必填；`roles/status` 可选 | `phone/passwordHash/name: string`；`roles: string[]`；`status: UserStatus` | 当前为 TypeScript interface，无 HTTP validation | `roles` 与 `status` 由 schema 默认值兜底 | `{ phone, passwordHash, name }` | 无       | 不包含明文密码、email 或 phone code 字段 |
| `CreateSessionInput` | sessions | Service 创建 session 输入 | `userId`、`ttlMs` 或 `expiresAt`、`userAgent`、`ip` | `userId` 必填；`ttlMs/expiresAt` 二选一；`userAgent/ip` 可选 | `userId: string \| ObjectId`；`ttlMs: number`；`expiresAt: Date`；`userAgent/ip: string` | 当前为 TypeScript type，无 HTTP validation | 无全局默认 TTL，由调用方显式传入 | `{ userId, ttlMs }` | 无 | 不包含 Cookie 配置、角色权限或业务字段 |
| `LoginDto` | auth | `POST /auth/login` 请求体 | `phone`、`password` | 均必填 | `phone/password: string` | `phone` trim、非空字符串；`password` 非空字符串 | 无 | `{ phone, password }` | `POST /auth/login` | 不包含 email、rememberMe 或 phone code 字段 |

## 4. 类型 / 状态

| 名称           | 可选值 / 字段                                                                     | 含义              | 是否对前端暴露        | 是否可持久化 | 备注                       |
| -------------- | --------------------------------------------------------------------------------- | ----------------- | --------------------- | ------------ | -------------------------- |
| `UserStatus`   | `active`、`disabled`                                                              | 用户基础状态      | 后续如暴露 API 再确认 | 是           | 当前不扩展复杂状态机       |
| `UserRole`     | `string`                                                                          | 用户角色占位类型  | 后续如暴露 API 再确认 | 是           | 当前不绑定最终业务角色集合 |
| `PublicUser`   | `id`、`phone`、`name`、`roles`、`status`、`createdAt`、`updatedAt`、`lastLoginAt` | 公开用户返回类型  | 后续如暴露 API 再确认 | 否           | 不包含 `passwordHash`      |
| `AuthIdentity` | `id`、`phone`、`passwordHash`、`roles`、`status`                                  | auth 内部身份类型 | 否                    | 否           | 仅供后续认证流程内部使用   |
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

## 6. 维护规则

- 新增或修改 DTO 必须同步本文档
- 修改请求体、响应结构或枚举值必须同步本文档
- 只修改 Service 内部逻辑且不影响接口契约时，可不更新本文档
