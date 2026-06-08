# ReviewX 后端 DTO 速查

## 1. 用途

- 记录后端 DTO、请求体、查询参数、响应结构和关键枚举
- 防止 Codex 修改接口时误改契约

## 2. 当前状态

- `backend` 已初始化
- 当前 users 模块新增内部 Input 和类型
- 本次未创建 UsersController，因此以下内容不是 HTTP DTO 契约

## 3. 当前 DTO / Input

| DTO 名称          | 所属模块 | 用途                 | 字段                                               | 必填 / 可选                                         | 类型                                                                       | 校验规则                                        | 默认值                                   | 示例                            | 关联 API | 备注                                     |
| ----------------- | -------- | -------------------- | -------------------------------------------------- | --------------------------------------------------- | -------------------------------------------------------------------------- | ----------------------------------------------- | ---------------------------------------- | ------------------------------- | -------- | ---------------------------------------- |
| `CreateUserInput` | users    | Service 创建用户输入 | `phone`、`passwordHash`、`name`、`roles`、`status` | `phone/passwordHash/name` 必填；`roles/status` 可选 | `phone/passwordHash/name: string`；`roles: string[]`；`status: UserStatus` | 当前为 TypeScript interface，无 HTTP validation | `roles` 与 `status` 由 schema 默认值兜底 | `{ phone, passwordHash, name }` | 无       | 不包含明文密码、email 或 phone code 字段 |

## 4. 类型 / 状态

| 名称           | 可选值 / 字段                                                                     | 含义              | 是否对前端暴露        | 是否可持久化 | 备注                       |
| -------------- | --------------------------------------------------------------------------------- | ----------------- | --------------------- | ------------ | -------------------------- |
| `UserStatus`   | `active`、`disabled`                                                              | 用户基础状态      | 后续如暴露 API 再确认 | 是           | 当前不扩展复杂状态机       |
| `UserRole`     | `string`                                                                          | 用户角色占位类型  | 后续如暴露 API 再确认 | 是           | 当前不绑定最终业务角色集合 |
| `PublicUser`   | `id`、`phone`、`name`、`roles`、`status`、`createdAt`、`updatedAt`、`lastLoginAt` | 公开用户返回类型  | 后续如暴露 API 再确认 | 否           | 不包含 `passwordHash`      |
| `AuthIdentity` | `id`、`phone`、`passwordHash`、`roles`、`status`                                  | auth 内部身份类型 | 否                    | 否           | 仅供后续认证流程内部使用   |

## 5. 维护规则

- 新增或修改 DTO 必须同步本文档
- 修改请求体、响应结构或枚举值必须同步本文档
- 只修改 Service 内部逻辑且不影响接口契约时，可不更新本文档
