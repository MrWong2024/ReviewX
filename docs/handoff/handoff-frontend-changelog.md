# ReviewX 前端变更记录

## 2026-06-12

### 新增

- 初始化 `frontend` 工程
- 新增 Next.js App Router + TypeScript 配置
- 新增开发端口脚本：`next dev -p 3001`
- 新增 `frontend/.env.local.example`
- 新增统一 API Client，默认 `credentials: 'include'`
- 新增结构化 `ApiError`
- 新增 AuthProvider、登录、会话刷新、退出登录
- 新增 `/login`
- 新增 `/workspace` 多角色入口
- 新增 `/admin` 管理员后台 layout、顶部栏、侧边栏和前端权限守卫
- 新增批次、普通字典、树形字典、单位、评审方案基础管理页
- 新增管理员项目只读列表页
- 新增基础 UI 组件和 feedback 组件
- 新增 frontend handoff 文档

### 明确未做

- 未修改 `backend/src/**`
- 未修改 `backend/scripts/**`
- 未修改后端 package 文件
- 未修改真实 `.env` 文件
- 未引入 token 登录机制
- 未实现 Excel 导入页面
- 未实现专家分配页面
- 未实现项目负责人材料页面
- 未实现专家评分页面
- 未实现合议页面
- 未实现申诉页面
- 未实现甲方看板
- 未实现腾讯会议集成
- 未接入真实 AI

### 验证

- `npm install`：通过
- `npm run lint`：通过
- `npm run typecheck`：通过
- `npm run build`：通过
