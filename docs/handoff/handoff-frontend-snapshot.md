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
│  ├─ login/
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
│  │  └─ auth/
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
- `403` 视为无权限，管理员守卫显示无权限状态
- 角色选择可写入 `localStorage.reviewx_selected_role`，仅用于体验，不作为权限依据

## 6. 已实现能力

- `/login`：品牌化登录页，手机号 + 密码登录，已登录访问自动回 `/workspace`
- `/workspace`：现代化角色入口，展示 admin、client、review_manager、expert、project_owner 中文角色状态
- `/admin`：管理员后台概览，按主数据维护 / 项目评审组织 / 监管闭环组织信息
- `/admin/batches`：批次列表、新增、编辑、停用
- `/admin/dictionaries`：普通字典列表、字典类型中文过滤、新增、编辑、停用；支持自定义 dictType 保存
- `/admin/tree-dictionaries`：树形字典缩进树列表、树类型中文过滤、新增根节点、新增子节点、编辑、停用
- `/admin/organizations`：单位分页、搜索、树形缩进行政区划选择、新增、编辑、停用
- `/admin/review-schemes`：评审方案列表、新增、编辑、停用、动态评分项；评分项使用稳定 `clientId` 防止输入失焦
- `/admin/projects`：管理员项目只读分页列表、关键词和低成本过滤、基础名称映射，视觉风格已同步
- `/admin/users`：管理员用户管理页，支持分页、姓名/手机号搜索、角色筛选、启用状态筛选、新增、编辑、启用/停用、重置密码；角色中文多选、单位多选、学科树形/缩进多选；不显示、不提交、不处理 `passwordHash`

## 7. 当前未实现

- Excel 导入页面
- 项目导入待确认页面
- 项目评审负责人/方案批量分配页面
- 专家候选/专家分配页面
- 项目负责人材料上传页面
- 专家评分页面
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
- Input / Select 默认固定 `h-10`，Textarea 复用同一 label / description / error 布局；普通字典和树形字典表单已修正“名称 / 编码 / 父节点”等控件对齐
- 管理员用户管理页面已对接 `/admin/users` 系列接口；创建和重置密码时密码留空不提交，由后端默认手机号；编辑用户时手机号只读且不提交 `phone/password`
- `/admin/projects` 本阶段仍未接入用户名称映射，项目负责人、评审负责人仍展示 ID
- 后端返回 400/403/409/500 等错误时，前端显示结构化错误中的 message 或默认友好文案
- 本阶段未实现用户自助改密、忘记密码、短信验证码、用户批量导入、权限矩阵配置、Excel 导入、专家分配、材料、评分、合议、申诉、甲方看板、腾讯会议或真实 AI
