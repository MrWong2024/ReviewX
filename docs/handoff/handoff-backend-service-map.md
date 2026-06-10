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
| `BatchesService` | batches | 批次 CRUD、分页查询、`name` 唯一检查 | `BatchModel` | `create()`、`list()`、`findById()`、`existsById()`、`update()`、`remove()` | 写入 `batches` 集合 | 不强制“一年只能一个批次” | `/admin/batches` | `test/admin-foundation.e2e-spec.ts` | `remove()` 为停用 |
| `DictionariesService` | dictionaries | 普通字典 CRUD、同类型 code/name 唯一检查、按类型查找 | `DictionaryModel` | `create()`、`list()`、`findById()`、`findByIdAndType()`、`update()`、`remove()` | 写入 `dictionaries` 集合 | 不承载项目类型、学科、行政区划、受理处室等树形数据 | `/admin/dictionaries` | `test/admin-foundation.e2e-spec.ts` | 项目状态通过 `dictType=project_status` 校验 |
| `TreeDictionariesService` | tree-dictionaries | 多 treeType 树节点 CRUD、父子层级/path 维护、同父同名约束 | `TreeDictionaryModel` | `create()`、`list()`、`findById()`、`findByIdAndType()`、`update()`、`remove()` | 写入 `tree_dictionaries` 集合 | 不内置国家行政区划或学科完整数据 | `/admin/tree-dictionaries` | `test/admin-foundation.e2e-spec.ts` | 有子节点时 `remove()` 返回 `409` |
| `OrganizationsService` | organizations | 单位 CRUD、`name` 唯一、region 类型校验、批量存在性校验 | `OrganizationModel`、`TreeDictionariesService` | `create()`、`list()`、`findById()`、`assertAllExist()`、`update()`、`remove()` | 写入 `organizations` 集合 | 不实现专家回避规则 | `/admin/organizations` | `test/admin-foundation.e2e-spec.ts` | `regionId` 必须为 `treeType=region` |
| `ReviewSchemesService` | review-schemes | 评审方案 CRUD、items 校验后总分计算、启用方案查找 | `ReviewSchemeModel` | `create()`、`list()`、`findById()`、`findActiveById()`、`update()`、`remove()` | 写入 `review_schemes` 集合 | 不实现项目使用后方案快照逻辑 | `/admin/review-schemes` | `test/admin-foundation.e2e-spec.ts` | `totalScore` 不信任前端，由后端计算 |
| `ProjectsService` | projects | 项目 CRUD、分页查询、项目编号唯一、跨模块关联校验 | `ProjectModel`、`BatchesService`、`DictionariesService`、`TreeDictionariesService`、`OrganizationsService`、`ReviewSchemesService`、`UsersService` | `create()`、`list()`、`findById()`、`update()`、`remove()` | 写入 `projects` 集合 | 不实现导入、材料上传、专家分配、评分、AI、申诉或看板 | `/admin/projects` | `test/admin-foundation.e2e-spec.ts` | 负责人/评审负责人采用硬角色校验，不自动补角色 |

## 4. 当前 Guard

| Guard 名称 | 所属模块 | 核心职责 | 依赖 | 使用范围 | 不应承担的职责 | 关联测试 | 备注 |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `SessionAuthGuard` | auth | 从 HttpOnly Cookie 对应名称读取 session token，校验 session 和用户，挂载 `request.user` | `AuthService`、`ConfigService` | 当前用于 `GET /auth/me` | 不负责 RolesGuard、角色权限矩阵、Cookie 写入或业务权限 | `test/auth.e2e-spec.ts` | 校验失败统一 `401` |
| `RolesGuard` | common | 读取 `@Roles(...)` 元数据并校验当前登录用户 roles | `Reflector` | 当前用于 `/admin/*` 控制器 | 不负责登录态校验、菜单权限、数据范围权限或复杂权限矩阵 | `test/admin-foundation.e2e-spec.ts` | 登录但缺少角色返回 `403` |

## 5. 维护规则

- 新增核心 Service 必须同步本文档
- 修改 Service 职责边界必须同步本文档
- 新增外部服务依赖必须同步本文档
- 局部私有方法调整不一定同步，除非影响职责理解
