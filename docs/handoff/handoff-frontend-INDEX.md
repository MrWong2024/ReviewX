# ReviewX 前端 Handoff 入口

## 1. 项目名称

ReviewX 科评星：科技项目评审协同与监管平台

## 2. 本文档用途

- 作为前端 handoff 入口
- 后续 `frontend` 路由新增、页面修改、认证协作、API 封装、组件维护和 UI 验收时，优先阅读此文档

## 3. 当前状态

- `frontend` 已初始化为 Next.js App Router + TypeScript 前端工程
- 本地开发端口：`3001`
- 后端 API baseUrl：`NEXT_PUBLIC_API_BASE_URL`，本地示例为 `http://localhost:5001`
- 当前阶段使用 HttpOnly Cookie Session，不使用 token
- 前端 fetch 默认 `credentials: 'include'`
- 已实现登录、`GET /auth/me` 会话保持、退出登录
- 已实现多角色工作台入口，当前仅 admin 进入真实后台，其余角色显示“后续建设”
- 已实现管理员后台布局、顶部栏、侧边栏和前端体验型权限守卫
- 已实现批次、普通字典、树形字典、单位、评审方案基础管理
- 已实现管理员项目只读列表
- 已实现管理员用户管理页面 `/admin/users`，支持用户列表、搜索、角色/状态筛选、分页、新增、编辑、启停和重置密码
- 已启用 Tailwind CSS 4，并完成第一阶段 UI 基线升级
- 视觉方向为政务可信、科技评审、AI 协同、轻未来感
- 已修复普通字典自定义 dictType 保存、树形字典缩进展示、单位行政区划树形选择、评审方案评分项输入失焦
- 行政区划 treeType 已统一为 `administrative_division`；单位页只读取该类型，历史 `region` 不再作为前端兼容口径
- 已统一表单控件基础尺寸和 Button `sm/md/lg` size 体系；表格/树节点行内操作使用紧凑按钮
- 当前未实现用户自助改密、忘记密码、短信验证码、用户批量导入、权限矩阵配置、Excel 导入、专家分配、项目负责人材料、专家评分、合议、申诉、甲方看板、腾讯会议或真实 AI

## 4. 必读基础文档

- `docs/frontend-architecture.md`
- `docs/auth-baseline.md`
- `docs/codex-rules.md`
- `docs/handoff/handoff-backend-api-map.md`
- `docs/handoff/handoff-backend-dto-cheatsheet.md`

## 5. 当前前端 handoff 文档列表

- `handoff-roadmap.md`：全局路线图，用于跨前后端阶段承接，建议新会话先读
- `handoff-frontend-snapshot.md`：前端当前事实快照
- `handoff-frontend-route-map.md`：前端路由地图
- `handoff-frontend-api-map.md`：前端 API 对接地图
- `handoff-frontend-component-map.md`：前端组件地图
- `handoff-frontend-changelog.md`：前端变更记录
- `handoff-frontend-testing-playbook.md`：前端验证手册

## 6. 后续同步规则

- 新增或修改页面时，同步 route map
- 修改认证跳转、默认入口、API Client、全局 layout 或导航时，同步 frontend snapshot
- 新增或调整后端接口对接时，同步 frontend API map
- 新增稳定复用组件时，同步 component map
- 完成阶段性前端任务时，同步 changelog 和 testing playbook
