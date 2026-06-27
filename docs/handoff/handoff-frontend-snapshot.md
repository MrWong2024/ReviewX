# ReviewX 前端当前事实快照

## 1. 用途

- 记录前端当前全局事实。
- 让新会话快速判断 `frontend` 当前技术栈、运行方式、API Client、认证协作、目录边界、角色级能力和风险。
- 本文件不逐路由展开页面能力，不重复组件职责；逐路由细节见 `handoff-frontend-route-map.md`，组件职责见 `handoff-frontend-component-map.md`，接口调用见 `handoff-frontend-api-map.md`。

## 2. 当前状态

- `frontend` 已初始化并接入 ReviewX 当前主要业务闭环。
- 技术栈：Next.js App Router + React + TypeScript。
- 当前样式方案：Tailwind CSS 4 + 少量全局 CSS variables / 语义布局类。
- 当前视觉方向：政务可信、科技评审、AI 协同、轻未来感。
- 当前全局 CSS 已引入 `@import "tailwindcss"`，并通过 `frontend/postcss.config.mjs` 接入 `@tailwindcss/postcss`。
- 当前不使用外部字体 CDN、不使用图片资源、不引入大型 UI 组件库。
- 当前不引入 Redux、Zustand 等状态管理库。
- 当前不引入 axios，请求统一使用 fetch 封装。
- 当前开发端口：`3001`。
- 当前后端本地地址：`http://localhost:5001`。
- 当前 API baseUrl 环境变量：`NEXT_PUBLIC_API_BASE_URL`，默认值见 `frontend/src/lib/api/client.ts`。
- 当前示例文件：`frontend/.env.local.example`。

## 3. 技术基线

- `next`: `16.2.9`
- `react`: `19.2.7`
- `react-dom`: `19.2.7`
- `typescript`: `5.9.3`
- `eslint`: `9.39.4`
- 具体事实以 `frontend/package.json` 和 `frontend/package-lock.json` 为准。

## 4. 前端目录结构

```text
frontend/
├─ app/
│  ├─ admin/
│  ├─ expert/
│  ├─ login/
│  ├─ project-owner/
│  ├─ review-manager/
│  ├─ workspace/
│  ├─ layout.tsx
│  ├─ not-found.tsx
│  └─ page.tsx
├─ src/
│  ├─ components/        # layout、ui、feedback、project-appeals 等共享组件
│  ├─ features/          # admin、auth、expert、project-owner、review-manager 领域实现
│  ├─ lib/               # api client、format、labels、tree、project-review、project-appeals 等工具
│  └─ styles/
├─ .env.local.example
├─ next.config.ts
├─ postcss.config.mjs
├─ package.json
└─ tsconfig.json
```

- `app/*` route 文件保持薄封装，业务页面主要沉淀在 `src/features/*`。
- admin、project-owner、expert、review-manager 使用独立 Shell 和独立路由命名空间，不混写导航或权限。
- 逐路由页面文件、权限和说明见 `handoff-frontend-route-map.md`。

## 5. 认证与会话协作

- 登录接口：`POST /auth/login`。
- 会话探针：`GET /auth/me`。
- 退出接口：`POST /auth/logout`。
- 会话机制：服务端 Session + HttpOnly Cookie。
- 前端不保存 access token，不读取 HttpOnly Cookie，不把 Cookie、密码或敏感信息写入 localStorage/sessionStorage。
- fetch 默认 `credentials: 'include'`；`FormData` 请求不手动设置 `Content-Type`。
- `401` 视为未登录，前端跳转 `/login`。
- `403` 视为无权限，各角色 Shell / 守卫显示无权限状态。
- `localStorage.reviewx_selected_role` 仅保存用户体验层角色选择，不作为权限依据。

## 6. 已实现能力摘要

### 6.1 公共工作台 / 登录态

- `/login`、`/workspace`、AuthProvider、统一 API Client、结构化 `ApiError`、退出登录和多角色入口已完成。
- `/workspace` 当前放开 admin、project_owner、expert 和 review_manager；client 仍显示“后续建设”，甲方看板前端未实现。

### 6.2 管理员端

- 已接入管理员 Shell、后台概览、用户管理、批次、普通字典、树形字典、单位、评审方案、项目导入、字段映射和项目评审组织。
- 项目评审组织支持评审负责人 / 评审方案分配、评审安排、候选专家、专家追加 / 替换 / 移除 / 批量设置、项目材料查看 / 下载 / 带原因删除。
- 管理员申诉页支持查看项目申诉、附件、等级变更历史，并处理 accepted / rejected；只调用 admin 命名空间接口。

### 6.3 项目负责人端

- 已接入项目负责人 Shell、概览、我的项目列表、项目详情、后续推进需求、材料上传、材料列表、材料下载、提交全部草稿材料和草稿物理删除。
- 项目详情评审负责人显示优先使用项目响应 `reviewManager.name`，其次使用 portal `review_manager` 映射；有负责人 ID 但无法解析时显示“评审负责人信息暂不可用”，未设置时显示“暂未设置评审负责人”，不向普通项目负责人展示负责人短 ObjectId。
- 材料状态展示保持 `draft/submitted/legacy active` 口径：新上传材料为草稿，提交后评审负责人 / 专家才可见；`draft/legacy active` 可删除，`submitted` 删除禁用并映射后端 `409`。
- 项目详情在 `ownerContentLocked/reviewFinalized/finalLevel/originalLevel/confirmed consensus` 任一成立时进入项目负责人内容只读态：后续推进需求不可保存，材料上传表单隐藏，提交全部草稿材料和材料删除禁用；材料列表、筛选、下载、评审结果与申诉入口和 submitted 申诉附件补充上传仍可用；已上传申诉附件不可删除；后端 `PROJECT_OWNER_CONTENT_LOCKED` 是最终兜底。
- 评审结果与申诉页已接入 confirmed 合议、等级历史、本人申诉列表、申诉详情和附件补充上传；发起申诉要求 confirmed 合议、有效最终等级 `project.finalLevel ?? consensus.finalLevel`、最多 3 次且无 submitted / processing 申诉；等级历史操作人使用 `changedByUser` 摘要展示，关联申诉显示“查看关联申诉”链接而不是短 ID。

### 6.4 专家端

- 已接入专家 Shell、评审任务列表、任务详情、portal reference-data 名称映射、submitted 材料查看 / 下载和评分表单。
- 专家评分支持草稿保存、提交、本人 draft 草稿删除、submitted 只读和 returned 修改重提；评审时间未到时可保存草稿和删除草稿，但不可提交。
- 专家材料接口只调用 expert 命名空间，不拼接 OSS objectKey，不提供上传、删除或预览。

### 6.5 评审负责人端

- 已接入评审负责人 Shell、负责项目列表、项目总览、评审组织、合议处理和项目申诉处理。
- `/review-manager/projects` 只看当前评审负责人负责项目；admin 全局项目视角保留在 `/admin`。
- 项目总览、评审组织、合议、申诉处理是独立能力：评审组织页处理评审安排、submitted 材料只读和专家分配；合议页处理专家评分、退回、汇总、`rule_based` 草稿和最终确认；申诉页只调用 review-manager 命名空间。
- 专家分配在评审时间已到、已有专家评分、已有合议或已有最终等级 / 最终结论后由后端锁定，前端展示 `EXPERT_ASSIGNMENT_LOCKED` 原因并禁用 mutation。
- 合议页 confirmed 状态只读展示最终结论，不显示确认表单、“使用草稿填入”或“重新确认最终结论”；旧状态或并发导致 confirm 返回 `CONSENSUS_ALREADY_CONFIRMED` 时展示后端业务 message 并重新拉取 consensus。
- 合议页“确认人”显示优先使用后端 `confirmedByUser.name` 摘要，有手机号时显示“姓名（手机号）”；若只有 `confirmedByUserId` 但摘要不可用，显示“确认人信息暂不可用”；无 `confirmedByUserId` 显示“-”；业务页面不再显示确认人短 ObjectId。

## 7. 当前未实现

- 甲方看板前端尚未实现；对应后端统计 API 也仍未实现。
- 腾讯会议直播、回看、推流或 API 集成未实现。
- 真实 AI 接入、文件预览、复杂图表、E2E 自动化测试、Storybook、Docker/Nginx 部署配置和移动端专项适配未实现。
- 用户自助改密、忘记密码 / 短信验证码、用户批量导入、专家库批量导入和权限矩阵配置未实现。

## 8. 已知口径与风险

- 本阶段直接按 `NEXT_PUBLIC_API_BASE_URL` 调后端，未实现 BFF 代理。
- 前端接口调用、错误处理、展示映射和各角色命名空间详见 `handoff-frontend-api-map.md`。
- 前端逐路由页面能力、页面文件和权限详见 `handoff-frontend-route-map.md`；snapshot 不再逐路由重复展开。
- 前端组件职责、共享工具和 UI 基线详见 `handoff-frontend-component-map.md`；snapshot 不再重复组件职责。
- 普通字典页只维护平台内置普通字典类型：`project_status`、`material_type`、`review_level`；树形字典预设为 `project_type`、`discipline`、`department`、`administrative_division`。
- 单位行政区划只读取 `treeType=administrative_division`，不再兼容历史 `region`；底层仍提交 `regionId` ObjectId。
- 门户页面通过 `/portal/reference-data/*` 做名称映射，不调用 admin-only 主数据接口补展示。
- 合议最终等级优先使用 active `review_level.code`，字典为空时 fallback A/B/C/D。
- 申诉有效最终等级前端口径必须保持 `project.finalLevel ?? consensus.finalLevel`，不得退回只看 `project.finalLevel`。
- 项目负责人项目详情评审负责人不得回退到“未知评审负责人（短ID）”；负责人姓名应优先来自项目详情响应 `reviewManager` 摘要，reference-data 只作 fallback。
- 评审结果确认后项目负责人端后续推进需求和项目材料管理必须保持只读锁定；锁定不影响项目详情读取、材料下载、评审结果与申诉、submitted 申诉附件补充上传；已上传申诉附件不可删除。
- 评审负责人当前无 `GET /review-manager/projects/:projectId/level-history`，前端不得伪造或调用该接口；等级历史在 project-owner 和 admin 侧读取。
- 合议响应类型兼容 `confirmedByUser?: { id, name, phone? } | null`；等级历史响应兼容 `changedByUser?: { id, name, phone? } | null`；项目负责人评审结果页不得显示 `confirmedByUserId`、`changedByUserId`、操作人短 ID 或关联申诉短 ID。
- confirmed 合议不可在评审负责人合议页重新覆盖；后续最终等级调整走申诉处理或未来专门更正流程，不在前端新增更正入口。
- 评审安排仅保存 `reviewTime/reviewLocation/meetingUrl`，当前不接腾讯会议 API、直播、推流或回看。
- 项目材料和申诉附件文件名展示继续使用后端返回的 `originalFilename`；中文文件名 mojibake 修复由后端上传入口统一归一化，前端不使用 `Buffer`、`decodeURIComponent`、`escape/unescape` 或其他编码猜测兜底。
- 文件下载只打开后端 `download-url` 返回 URL，不前端拼接 OSS objectKey。

## 9. 维护规则

- 新增或调整前端全局技术事实、角色级能力、运行配置、认证协作和关键风险时更新本文档。
- 新增或调整具体路由时更新 `handoff-frontend-route-map.md`。
- 新增或调整组件职责时更新 `handoff-frontend-component-map.md`。
- 新增或调整接口调用、错误处理或展示映射时更新 `handoff-frontend-api-map.md`。
