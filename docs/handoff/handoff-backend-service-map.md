# ReviewX 后端 Service 职责地图

## 1. 用途

- 记录 Service 职责边界、依赖关系、外部副作用和不应承担的职责
- 防止 Service 职责膨胀或跨模块串台

## 2. 当前状态

- `backend` 已初始化
- 当前已确认最小根服务
- 当前已新增 users 基础 Service
- 当前已新增 sessions 基础 Service
- 当前已新增 auth 第一阶段 Service 和 SessionAuthGuard

## 3. 当前 Service

| Service 名称   | 所属模块 | 核心职责                                                       | 依赖 Model / Service / 外部服务 | 主要方法                                                                                      | 副作用                                | 不应承担的职责                                                              | 关联 API                      | 关联测试                                             | 备注                                                                                  |
| -------------- | -------- | -------------------------------------------------------------- | ------------------------------- | --------------------------------------------------------------------------------------------- | ------------------------------------- | --------------------------------------------------------------------------- | ----------------------------- | ---------------------------------------------------- | ------------------------------------------------------------------------------------- |
| `AppService`   | app      | 提供最小健康检查响应                                           | 无                              | `getHealth()`                                                                                 | 无                                    | 不承载业务规则、认证、数据库访问或外部集成                                  | `GET /health`                 | `src/app.controller.spec.ts`、`test/app.e2e-spec.ts` | 仅用于证明后端骨架可运行                                                              |
| `UsersService` | users    | 提供用户基础创建、公开查询、认证内部身份查询和登录时间更新能力 | `UserModel`                     | `create()`、`findById()`、`findByPhone()`、`findAuthIdentityByPhone()`、`updateLastLoginAt()` | 写入 `users` 集合；更新 `lastLoginAt` | 不负责登录、密码哈希、phone one-time code、Session、HTTP 契约或角色权限矩阵 | 无，本次未创建 Controller/API | `src/modules/users/users.service.spec.ts`            | `findAuthIdentityByPhone()` 是后续 auth 内部预留能力，唯一允许显式读取 `passwordHash` |
| `SessionsService` | sessions | 提供服务端 session 创建、有效 token 查询、撤销、最近访问时间更新和旧 session 回收能力 | `SessionModel` | `createSession()`、`findValidByToken()`、`revokeByToken()`、`revokeAllForUser()`、`touchSession()`、`pruneOldSessionsForUser()` | 写入 `sessions` 集合；更新 `revokedAt`、`lastSeenAt` | 不负责 Cookie、登录、密码校验、phone one-time code、Guard、HTTP 契约或角色权限矩阵 | 无，本次未创建 Controller/API | `src/modules/sessions/sessions.service.spec.ts` | `createSession()` 是唯一返回 token 的方法；其他公开返回类型不包含 token |
| `AuthService` | auth | 编排手机号 + 密码登录、当前用户解析和登出 | `UsersService`、`SessionsService`、`ConfigService`、`bcryptjs.compare` | `login()`、`getCurrentUserFromToken()`、`logout()` | 创建 / 撤销 session；更新 `lastLoginAt`；触发旧 session 回收 | 不负责用户注册、找回密码、修改密码、phone one-time code、角色权限矩阵或 Cookie 写入 | `POST /auth/login`、`POST /auth/logout`、`GET /auth/me` | `src/modules/auth/auth.service.spec.ts`、`test/auth.e2e-spec.ts` | 对用户不存在、密码错误、用户禁用和 session 失效统一抛 `401`；token 不进入响应 body |

## 4. 当前 Guard

| Guard 名称 | 所属模块 | 核心职责 | 依赖 | 使用范围 | 不应承担的职责 | 关联测试 | 备注 |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `SessionAuthGuard` | auth | 从 HttpOnly Cookie 对应名称读取 session token，校验 session 和用户，挂载 `request.user` | `AuthService`、`ConfigService` | 当前用于 `GET /auth/me` | 不负责 RolesGuard、角色权限矩阵、Cookie 写入或业务权限 | `test/auth.e2e-spec.ts` | 校验失败统一 `401` |

## 5. 维护规则

- 新增核心 Service 必须同步本文档
- 修改 Service 职责边界必须同步本文档
- 新增外部服务依赖必须同步本文档
- 局部私有方法调整不一定同步，除非影响职责理解
