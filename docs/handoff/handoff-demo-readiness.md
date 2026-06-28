# ReviewX 演示版收口与生产预检 handoff

## 1. 用途

- 记录第十一阶段“演示版收口与生产预检”的当前事实。
- 只供 GPT / Codex 接续项目使用，不作为客户宣传材料。
- 不记录账号密码、Cookie、token、真实密钥、签名 URL 或真实 objectKey。

## 2. 基线与自动化验证

- 预检基线 commit：`87e2b3d7beea864a30aaae42c4d820fa894fcb80`。
- 本阶段开始时工作区无未提交改动。
- 本阶段未新增业务接口、正式页面、第三方依赖或数据库 schema。
- backend `npm run build`：通过。
- backend `npm run test:e2e`：通过，13 suites / 73 tests。
- frontend `npm run typecheck`：通过。
- frontend `npm run lint`：通过。
- frontend `npm run build`：通过；构建路由包含 `/workspace`、`/admin`、`/project-owner`、`/expert`、`/review-manager`、`/client` 和各角色动态详情页。

## 3. 启动与配置口径

- 后端端口：默认 `PORT=5001`。
- 前端端口：`npm run dev` 与 `npm run start` 使用 `3001`。
- MongoDB：应用运行使用 `MONGO_URI`；`MONGO_ADMIN_URI` 仅用于 `sync-indexes` 等受控脚本。development 默认 `reviewx_dev`，test 默认 `reviewx_test`，production 口径为 `reviewx`。
- Storage：`STORAGE_DRIVER` 支持 `fake / oss`；development / test 默认 fake，production 默认 oss。
- OSS 环境变量名称：`OSS_REGION`、`OSS_BUCKET`、`OSS_INTERNAL_ENDPOINT`、`OSS_PUBLIC_ENDPOINT`、`OSS_ACCESS_KEY_ID`、`OSS_ACCESS_KEY_SECRET`、`OSS_OBJECT_PREFIX`。
- production 对象存储口径：应显式使用 `STORAGE_DRIVER=oss`，Bucket 私有读写，后端生成短期下载 URL；不得提交真实 AccessKey。
- Session / Cookie 口径：`SESSION_COOKIE_NAME`、`SESSION_TTL_MS`、`MAX_ACTIVE_SESSIONS_PER_USER`、`SESSION_COOKIE_SECURE`、`SESSION_COOKIE_SAME_SITE`。
- CORS / 前端来源口径：`FRONTEND_URL` 与 `CORS_ORIGIN`；默认本地来源为 `http://localhost:3001`。
- 前端 API 地址：`NEXT_PUBLIC_API_BASE_URL`，当前默认 `http://localhost:5001`；部署时必须改为可访问的后端地址，不能保留本机 localhost。
- 本阶段未发现新增但未文档化的环境变量。
- `docs/` 下未发现独立 deployment / deploy / oss / environment 命名文档；配置事实仍以 config matrix、snapshot 和 env example 为准。
- 本阶段预检时 5001 和 3001 已有本地 Node 服务监听；5001 `/health` 返回 `reviewx-backend`，3001 页面可打开。直接执行 backend `npm run start` 因标准端口已占用在 listen 阶段返回 `EADDRINUSE`，不是模块装配失败。
- `npm run sync-indexes` 是 production / 运维索引同步入口，不属于应用启动必跑脚本；`npm run create-local-user` 仅是本地 development/test 辅助脚本。

## 4. 演示账号与权限预检

- `reviewx_dev` 中已存在可登录的 admin、client、review_manager、expert、project_owner 账号，以及多角色用户。
- 本阶段通过现有账号验证 `/auth/login` 与 `/auth/me`，未输出任何账号、密码或 Cookie。
- `/client/dashboard/overview`：client 角色返回 200；非 client 用户返回 403。
- `/review-manager/projects`：返回项目总数与数据库中当前评审负责人负责项目数一致；访问非负责项目材料返回 403。
- `/expert/review-tasks`：返回任务总数与当前专家 assigned 项目数一致。
- `/project-owner/projects`：返回项目总数与当前项目负责人负责项目数一致。
- `/admin/users` 响应不包含 `passwordHash`。
- `/workspace` 的角色入口由 `/auth/me` 的 `user.roles` 驱动；单角色只启用对应角色入口，多角色可进入多个工作台。

## 5. 演示数据健康度

- 本阶段使用 `reviewx_dev` 做只读健康检查；未清空、未删除、未批量改写演示数据。
- 当前已有启用项目、评审负责人和评审方案、评审时间地点和 `meetingUrl`、专家分配、submitted 材料、submitted 专家评分、confirmed 合议、项目负责人申诉、accepted 且等级变更的申诉、rejected 申诉，以及可在 `/client` 展示的历史处理结果。
- `/client/dashboard/projects` 的 `keyword`、`finalLevel`、`progressStage`、`hasPendingAppeal`、`hasMeetingUrl` 筛选均返回 200；当前库没有 pending 申诉样本，`hasPendingAppeal=true` 可能为空结果。
- 当前库没有可证明“专家评分退回后重提”的持久样本：专家重提交时后端会清空 `returnedAt/returnedByUserId/returnReason`，因此无法从当前记录反推历史退回。第十阶段补丁一曾用真实 HTTP 写入验证 returned / 重提链路；第十一阶段未重新造数。
- 当前库没有 legacy `ProjectMaterial.status=active` 样本，仍记录为“无样本未验证”；不得强行制造 legacy active 材料。

## 6. 核心页面和 API 路径预检

- 前端 HTTP 打开检查：`/login`、`/workspace`、`/admin`、`/admin/users`、`/admin/project-imports`、`/admin/projects`、`/project-owner`、`/project-owner/projects`、`/expert`、`/expert/review-tasks`、`/review-manager`、`/review-manager/projects`、`/client` 均返回 200。
- 动态页面 HTTP 打开检查：管理员项目评审组织、管理员申诉列表 / 详情、项目负责人项目详情 / 评审结果 / 申诉详情、专家任务详情、评审负责人项目总览 / 评审组织 / 合议 / 申诉列表 / 详情均返回 200。
- admin 核心 API：基础数据、用户、项目导入、项目列表、项目详情、项目材料、申诉、等级历史均返回 200。
- project_owner 核心 API：项目列表、项目详情、材料、等级历史、申诉列表均返回 200；无 confirmed 合议项目返回 404 属于页面约定空态；已有申诉项目的 confirmed 合议和申诉详情返回 200。
- expert 核心 API：评审任务列表、任务详情、项目材料返回 200。
- review_manager 核心 API：负责项目、材料、专家、专家评分、评分汇总、申诉返回 200；无合议项目返回 404 属于页面约定空态；已有 confirmed 合议项目的合议和专家评分返回 200。
- client 核心 API：overview、projects 和关键筛选返回 200；当前仅展示 `meetingUrl` 外链入口，不接腾讯会议 API。

## 7. 暂缓能力

- 腾讯会议直播 / 推流 / 回看 / 会议 API 集成未实现。
- 当前仅保存和展示 `meetingUrl` 外链。
- 真实 AI 汇总未实现；当前合议草稿为 `rule_based`。
- 文件预览 / 在线转换未实现；当前只提供短期下载 URL。
- 操作审计日志未实现。
- 用户自助改密、忘记密码、短信验证码未实现。
- 用户批量导入、专家库批量导入未实现。
- 权限矩阵配置未实现。
- `reviewx_test` 只用于自动化测试，不作为人工演示数据源；人工联调建议使用 `reviewx_dev`。

## 8. 安全预检

- 本阶段未读取或写入真实密钥到仓库文档。
- 跟踪文件高熵密钥形态扫描未发现命中。
- 前端源码未发现 `passwordHash`、token、secret、credential 展示；仅保留 HttpOnly Cookie 会话协作和 `credentials: include`。
- 后端 `passwordHash` 仅在认证内部受控查询和测试中出现；管理员用户响应预检未返回 `passwordHash`。
- 本阶段未输出账号密码、Cookie、token、密钥、签名 URL 或真实 objectKey。

## 9. 本阶段写入范围

- 未新增演示用户。
- 未新增演示项目。
- 未上传测试附件。
- 使用了一次性 Node stdin 脚本做只读 DB / HTTP 预检，脚本未落盘。
- 未修改 `reviewx_dev` 数据。
