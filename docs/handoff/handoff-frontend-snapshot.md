# ReviewX 前端当前事实快照

## 1. 用途

- 记录前端当前事实
- 让新会话快速判断 `frontend` 当前技术栈、路由、布局、API Client、认证协作和已实现页面

## 2. 当前状态

- `frontend` 已初始化
- 技术栈：Next.js App Router + React + TypeScript
- 当前样式方案：普通全局 CSS，不使用 Tailwind、不使用外部字体 CDN、不使用图片资源
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

- `/login`：手机号 + 密码登录，已登录访问自动回 `/workspace`
- `/workspace`：读取当前用户角色并展示入口
- `/admin`：管理员后台概览
- `/admin/batches`：批次列表、新增、编辑、停用
- `/admin/dictionaries`：普通字典列表、dictType 过滤、新增、编辑、停用
- `/admin/tree-dictionaries`：树形字典平铺列表、treeType 过滤、parent 下拉、新增、编辑、停用
- `/admin/organizations`：单位分页、搜索、行政区划选择、新增、编辑、停用
- `/admin/review-schemes`：评审方案列表、新增、编辑、停用、动态评分项
- `/admin/projects`：管理员项目只读分页列表、关键词和低成本过滤、基础名称映射

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
- 用户管理页面
- E2E 自动化测试
- Storybook
- Docker/Nginx 部署配置
- 移动端专项适配

## 8. 已知口径

- 本阶段直接按 `NEXT_PUBLIC_API_BASE_URL` 调后端；未实现 BFF 代理
- 单位 `regionId` 按后端当前契约关联 `treeType=region`
- 任务中提到的 `administrative_division` 可在树形字典页维护，但不能直接作为单位 `regionId` 提交给当前后端
- 管理员项目列表暂无用户列表接口，因此项目负责人、评审负责人先展示 ID
- 后端返回 400/403/409/500 等错误时，前端显示结构化错误中的 message 或默认友好文案
