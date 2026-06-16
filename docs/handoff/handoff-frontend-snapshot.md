# ReviewX 前端当前事实快照

## 1. 用途

- 记录前端当前事实
- 让新会话快速判断 `frontend` 当前技术栈、路由、布局、API Client、认证协作和已实现页面

## 2. 当前状态

- `frontend` 已初始化
- 技术栈：Next.js App Router + React + TypeScript
- 当前样式方案：Tailwind CSS 4 + 少量全局 CSS variables / 语义布局类
- 当前视觉方向：政务可信、科技评审、AI 协同、轻未来感
- 当前全局 CSS 已引入 `@import "tailwindcss"`，并通过 `frontend/postcss.config.mjs` 接入 `@tailwindcss/postcss`
- 当前不使用外部字体 CDN、不使用图片资源
- 当前不引入大型 UI 组件库
- 当前不引入 Redux、Zustand 等状态管理库
- 当前不引入 axios，请求统一使用 fetch 封装
- 当前开发端口：`3001`
- 当前后端本地地址：`http://localhost:5001`
- 当前 API baseUrl 环境变量：`NEXT_PUBLIC_API_BASE_URL`
- 当前示例文件：`frontend/.env.local.example`

## 3. 技术基线

- `next`: `16.2.9`
- `react`: `19.2.7`
- `react-dom`: `19.2.7`
- `typescript`: `5.9.3`
- `eslint`: `9.39.4`
- 具体事实以 `frontend/package.json` 和 `frontend/package-lock.json` 为准

## 4. 前端目录结构

```text
frontend/
├─ app/
│  ├─ admin/
│  ├─ expert/
│  ├─ login/
│  ├─ project-owner/
│  ├─ workspace/
│  ├─ layout.tsx
│  ├─ not-found.tsx
│  └─ page.tsx
├─ src/
│  ├─ components/
│  │  ├─ feedback/
│  │  ├─ layout/
│  │  └─ ui/
│  ├─ features/
│  │  ├─ admin/
│  │  ├─ auth/
│  │  ├─ expert/
│  │  └─ project-owner/
│  ├─ lib/
│  │  ├─ api/
│  │  └─ format/
│  └─ styles/
├─ .env.local.example
├─ eslint.config.mjs
├─ next.config.ts
├─ postcss.config.mjs
├─ package.json
└─ tsconfig.json
```

## 5. 认证与会话协作

- 登录接口：`POST /auth/login`
- 会话探针：`GET /auth/me`
- 退出接口：`POST /auth/logout`
- 会话机制：服务端 Session + HttpOnly Cookie
- 前端不保存 access token
- 前端不读取 HttpOnly Cookie
- 前端不把 Cookie、密码或敏感信息写入 localStorage/sessionStorage
- fetch 默认 `credentials: 'include'`
- `401` 视为未登录，前端跳转 `/login`
- `403` 视为无权限，管理员守卫和项目负责人守卫显示无权限状态
- 角色选择可写入 `localStorage.reviewx_selected_role`，仅用于体验，不作为权限依据

## 6. 已实现能力

- `/login`：品牌化登录页，手机号 + 密码登录，已登录访问自动回 `/workspace`
- `/workspace`：现代化角色入口，展示 admin、client、review_manager、expert、project_owner 中文角色状态
- `/workspace` 当前放开 admin、project_owner 和 expert；client、review_manager 仍显示“后续建设”
- `/admin`：管理员后台概览，按主数据维护 / 项目评审组织 / 监管闭环组织信息；AdminShell 正常顶部栏显示当前用户、手机号、管理员 Badge、“返回工作台”和“退出登录”
- `/admin/batches`：批次列表、新增、编辑、停用
- `/admin/dictionaries`：普通字典列表、字典类型中文过滤、新增、编辑、停用；支持自定义 dictType 保存
- `/admin/tree-dictionaries`：树形字典缩进树列表、树类型中文过滤、新增根节点、新增子节点、编辑、停用
- `/admin/organizations`：单位分页、搜索、树形缩进行政区划选择、新增、编辑、停用
- `/admin/review-schemes`：评审方案列表、新增、编辑、停用、动态评分项；评分项使用稳定 `clientId` 防止输入失焦
- `/admin/project-imports`：管理员 Excel 项目导入页，支持批次选择、上传前校验、FormData 上传、任务列表、批次/状态/keyword 筛选、分页和未确认导入任务删除
- `/admin/project-imports/[jobId]`：项目导入任务详情页，支持任务统计、fieldMapping、Excel 行号行列表、行状态筛选、raw / normalized / resolved / issues 查看、待确认行修正、创建新单位、创建新项目负责人、单行确认、单行跳过和批量确认
- `/admin/project-import-field-mappings`：管理员 Excel 字段映射配置页，支持标准字段配置视图、默认别名、自定义别名、最终生效别名、keyword / isActive 筛选、保存配置、编辑配置、启用 / 停用、删除配置和重置默认
- `/admin/projects`：管理员项目评审组织列表，支持项目核心信息和组织状态展示，支持 keyword、批次、项目类型、项目状态、评审负责人、评审方案、是否已分配负责人、是否已分配方案筛选，支持单项目分配负责人 / 方案、批量分配负责人 / 方案、批量设置专家和进入评审组织详情
- `/admin/projects/[projectId]/review-organization`：管理员单项目评审组织详情页，支持展示项目基础信息、修改评审分配、设置评审时间 / 地点 / 会议链接、查看项目材料、下载项目材料、填写原因删除项目材料、查看已分配专家、查看后端候选专家、追加 / 替换 / 移除专家
- `/admin/users`：管理员用户管理页，支持分页、姓名/手机号搜索、角色筛选、启用状态筛选、新增、编辑、启用/停用、重置密码；角色中文多选、单位多选、学科树形/缩进多选；不显示、不提交、不处理 `passwordHash`
- `/project-owner`：项目负责人概览页，读取本人第一页项目，展示轻量统计、最近项目和我的项目入口
- `/project-owner/projects`：项目负责人我的项目列表，调用 project_owner 项目列表接口并接入 portal reference-data，支持分页、名称映射和 `batchId/statusId/projectTypeId/reviewManagerId/reviewSchemeId` select 筛选，不提交 `ownerUserId` 或 `keyword`
- `/project-owner/projects/[projectId]`：项目负责人项目详情页，并发加载项目、材料和 portal reference-data，展示名称映射后的基础信息、评审安排、会议链接、后续推进需求和材料管理
- 项目负责人后续推进需求：调用 `PATCH /project-owner/projects/:id/follow-up-needs`，只提交 `{ followUpNeeds }`，前端限制 5000 字
- 项目负责人材料列表 / 下载 / 提交 / 删除：调用 project_owner 材料接口，材料类型显示名称，显示 `draft/submitted/legacy active` 状态，下载使用后端签名 URL，支持提交全部草稿材料，`draft/active` 可物理删除，`submitted` 禁用删除
- 项目负责人材料上传闭环：使用 portal active `material_type` 启用上传；FormData 字段为 `files/materialTypeId/remark`，不手动设置 `Content-Type`；新上传材料提示草稿语义，提交前评审负责人和专家不可见；保留文件数量 / 大小 / 扩展名校验和 failures 明细展示
- `/expert`：专家工作台首页，展示专家评审流程提示和“我的评审任务”入口
- `/expert/review-tasks`：专家评审任务列表，调用 `/expert/review-tasks`，支持状态、批次、评审负责人、评审方案筛选、分页、刷新、portal reference-data 名称映射和评分状态 Badge
- `/expert/review-tasks/[projectId]`：专家评审任务详情，并发加载任务详情、submitted 材料和 portal reference-data，展示项目基础信息、评审安排、会议链接、后续推进需求、材料下载、评审方案快照和评分表单
- 专家评分：调用 `/expert/review-tasks/:projectId` 保存草稿，调用 `/expert/review-tasks/:projectId/submit` 提交评分；前端做 score 范围、评价描述、低分 / 重大问题改进建议必填和提交二次确认
- 专家材料查看 / 下载：只调用 `/expert/projects/:id/materials` 和 `/expert/projects/:id/materials/:materialId/download-url`；仅展示 submitted 材料，不拼接 OSS objectKey，不提供删除、上传或预览
- 专家评分状态：`not_started` 初始化空表单，`draft` 可继续编辑，`submitted` 只读，`returned` 显示退回原因并可修改重提

## 7. 当前未实现

- 合议确认页面
- 申诉页面
- 甲方看板
- 腾讯会议直播、回看、推流或 API 集成
- 真实 AI 接入
- 文件预览
- 复杂图表
- E2E 自动化测试
- Storybook
- Docker/Nginx 部署配置
- 移动端专项适配

## 8. 已知口径

- 本阶段直接按 `NEXT_PUBLIC_API_BASE_URL` 调后端；未实现 BFF 代理
- 普通字典预设 `dictType` 前端显示中文：`project_status=项目状态`、`material_type=材料类型`、`review_level=评审等级`
- 树形字典预设 `treeType` 前端显示中文：`project_type=项目类型`、`discipline=学科`、`department=受理处室`、`administrative_division=行政区划`
- 单位行政区划选择只读取 `treeType=administrative_division`；不再兼容历史 `treeType=region`；底层仍提交 `regionId` ObjectId
- `region` 为历史临时 treeType 口径，本阶段后前端不再作为行政区划显示或备用读取；当前不做历史数据迁移
- 普通字典和树形字典的 `code` UI 文案统一显示为“编码”，并提示用于系统识别
- Button 当前支持 `sm/md/lg` size 体系；表格行内操作、树节点行内操作和分页使用 `sm`
- AdminShell 正常布局顶部右上角已提供“返回工作台”入口，使用 `Link href="/workspace"`，视觉样式与 ExpertShell / ProjectOwnerShell 顶部入口一致；退出登录按钮和左侧管理员导航保持不变
- Input / Select 默认固定 `h-10`，Textarea 复用同一 label / description / error 布局；普通字典和树形字典表单已修正“名称 / 编码 / 父节点”等控件对齐
- 通用 `Modal` 通过 React Portal 挂载到 `document.body`，使用视口级 fixed overlay 和 `z-[1000]`，面板 `max-h-[90vh]`，header/footer 在面板内保留，body 区滚动；默认调用保持兼容，并支持可选 `size/bodyClassName/panelClassName`
- 管理员用户管理页面已对接 `/admin/users` 系列接口；创建和重置密码时密码留空不提交，由后端默认手机号；编辑用户时手机号只读且不提交 `phone/password`
- 项目导入页面已对接 `/admin/project-imports*` 系列接口；上传使用 `FormData`，字段名为 `file` 和 `batchId`，不手动设置 `Content-Type`
- 项目导入任务状态、行状态和 issue code 均中文化展示，请求仍使用英文枚举值
- 项目导入任务列表支持删除未确认导入任务；删除只调用 `DELETE /admin/project-imports/:id` 清理导入任务和行级解析记录，不删除正式项目，`confirmedRows > 0` 的任务在前端禁用删除
- 项目导入详情页将后端 `rowNumber` 展示为“Excel 行号”；该值是 Excel 原始行号，第一条数据通常从 2 开始
- 项目导入修正页读取批次、项目类型、学科、受理处室、行政区划、项目状态、单位和 `project_owner` 用户作为选择项；行政区划只读取 `treeType=administrative_division`
- 项目导入行修正支持选择已有主数据、已有单位、已有项目负责人；只允许通过 `createOrganization` 创建新单位，通过 `createOwnerUser` 创建新项目负责人用户
- 项目导入页面不创建项目类型、学科、受理处室或项目状态；缺失时提示先到对应主数据页面维护
- 字段映射配置页已对接 `/admin/project-import-field-mappings*` 系列接口；请求均为 JSON，不使用 FormData
- 字段映射标准字段由后端标准字段清单 / 配置视图返回，前端不允许管理员新增、删除或重命名标准字段
- 字段映射标准字段类型使用 `disciplineName`，不使用导入 normalized 结构中的 `disciplineNames`
- 字段映射未配置、停用和删除自定义配置均回退默认内置别名；reset-defaults 会创建或覆盖配置，使自定义别名等于默认别名并启用
- `/admin/projects` 已接入评审负责人 active 用户、评审方案、批次、项目类型、项目状态、学科和单位映射；项目负责人优先使用用户列表映射，无法映射时保留 id 兜底
- 项目评审组织 API 封装位于 `frontend/src/features/admin/api/project-review-organization.ts`，统一复用 `apiRequest`，不绕过 HttpOnly Cookie 会话口径
- 专家候选使用 `GET /admin/projects/:id/expert-candidates`；已分配、追加、替换、移除和批量设置专家使用 `/review-manager/projects*` 系列接口，admin 角色可访问
- 管理员项目材料查看、下载和删除位于 `/admin/projects/[projectId]/review-organization` 的“项目材料”卡片；只调用 `GET /admin/projects/:id/materials`、`GET /admin/projects/:id/materials/:materialId/download-url`、`DELETE /admin/projects/:id/materials/:materialId`
- 管理员删除材料必须填写 1-1000 字 `reason`，前端在弹窗中校验；删除成功后刷新材料列表，失败时不乐观移除；后端保留删除审计，前端不实现删除日志查询
- 管理员材料下载只打开后端返回的签名 URL 或 fake storage URL，不拼接 OSS objectKey；材料状态显示 `draft=草稿`、`submitted=已提交评审`、`active=历史草稿`、`deleted=已删除/legacy 兜底`
- 管理员项目材料卡片不调用 project_owner / review_manager / expert 材料接口，不调用 `/admin/users` 只为补上传人名称；上传人优先使用材料响应内联用户，其次复用项目评审组织详情页已加载 users 映射，最后才使用短 ID 兜底
- 管理员删除项目材料弹窗保留 reason 必填、1000 字限制和物理删除风险提示；使用通用 Portal Modal 避免被“评审安排”等页面卡片遮挡，长文件名换行，小屏 / 缩放时删除原因 textarea 和底部按钮应保持可操作
- `/admin/projects` 批量设置专家完成后的逐项目结果标题优先显示项目编号和项目名称；失败明细优先显示专家姓名和手机号，专家或项目映射缺失时显示“未知专家 / 未知项目 + 短ID”兜底，避免把裸 ObjectId 作为主展示文案
- 前端不自行实现专家学科匹配或承担单位 / 合作单位回避，只展示后端候选、assigned 标记和失败原因
- 评审安排仅保存 `reviewTime/reviewLocation/meetingUrl`；当前不接腾讯会议 API、直播、推流或回看
- 项目负责人前端 API 封装位于 `frontend/src/features/project-owner/api.ts`，统一复用 `apiRequest`，不绕过 HttpOnly Cookie 会话口径
- 项目负责人项目列表 / 详情 / follow-up-needs / 材料列表 / 上传 / 提交 / 下载 URL / 删除接口已封装；上传封装使用 FormData 且不手动设置 `Content-Type`
- 项目负责人页面已封装 `/portal/reference-data/*` 只读接口：普通字典、树形字典、批次、单位、评审方案和 `role=review_manager` 用户摘要；不调用 `/admin/*` 绕过权限
- 项目负责人列表和详情通过 portal reference-data 构造批次、项目状态、项目类型、学科、受理处室、单位、评审负责人、评审方案和材料类型名称映射；未命中时使用“未知项（短ID）”类兜底
- 材料上传选择使用 active `material_type`，`material_type` 为空或 reference-data 加载失败时上传禁用；前端不写死材料类型 ID，不使用 mock 类型作为真实数据源
- 已上传材料列表的材料类型展示优先使用后端材料响应内联的 `materialType.name`，其次使用 portal `material_type` 映射；筛选项来自 portal `material_type`
- 已上传材料列表显示状态 Badge：`draft=草稿`、`submitted=已提交评审`、`active=历史草稿`、`deleted=已删除/legacy 兜底`；未知状态显示“未知状态”并禁用操作
- 项目负责人详情页支持提交全部草稿材料，调用 `POST /project-owner/projects/:id/materials/submit`；提交前二次确认，成功后展示 `submittedCount/alreadySubmittedCount/skippedCount` 和 skipped 明细，并刷新材料列表与项目详情 `materialCount`
- 项目负责人详情页 meetingUrl 仅打开管理员录入链接，不接腾讯会议 API
- 项目负责人材料下载使用后端返回的 `string`、`url` 或 `downloadUrl`，无法解析时展示错误；不在前端拼接 OSS objectKey
- 项目负责人材料删除只调用 `DELETE /project-owner/projects/:id/materials/:materialId`；`draft/legacy active` 为物理删除并提示不可恢复，`submitted` 删除按钮禁用，异常触发后端 `409` 时显示“该材料已提交评审，项目负责人不能删除。如确需删除，请联系管理员。”
- 项目负责人材料删除不调用 `/admin/*` 接口，不展示 `deletionLogId`，不前端拼接 OSS objectKey
- 专家前端 API 封装位于 `frontend/src/features/expert/api.ts`，统一复用 `apiRequest`，不绕过 HttpOnly Cookie 会话口径
- 专家任务列表和详情只调用 `/expert/review-tasks*` 系列接口，保存草稿 / 提交评分不新增后端接口
- 专家详情页材料展示以 `/expert/projects/:id/materials` 返回的 submitted 材料为准；即使 `/expert/review-tasks/:projectId` 返回 `materials/materialCount`，页面材料区域也不把它作为主数据源
- 专家材料下载只使用 `/expert/projects/:id/materials/:materialId/download-url` 返回的 `string/url/downloadUrl`，无法解析时展示错误；不调用 admin / project_owner / review_manager 材料接口，不前端拼接 OSS objectKey
- 专家页面通过 `/portal/reference-data/*` 构造批次、项目状态、评审负责人、评审方案和材料类型名称映射；未命中时使用“未知项（短ID）”类兜底，不调用 `/admin/*` 主数据接口
- 专家评分保存草稿允许空 score、评价描述和改进建议，但已填写 score 必须在 `0..maxScore`；提交要求所有 score 和评价描述必填，低分或重大问题项改进建议必填
- 专家评分 `submitted` 状态前端只读且不显示保存 / 提交按钮；`returned` 状态显示退回时间和原因，并允许保存草稿与重新提交
- 后端返回 400/403/409/500 等错误时，前端显示结构化错误中的 message 或默认友好文案
- 本阶段未实现用户自助改密、忘记密码、短信验证码、用户批量导入、权限矩阵配置、评审负责人合议、申诉、甲方看板、腾讯会议 API、文件预览、材料恢复、删除日志查询或真实 AI
