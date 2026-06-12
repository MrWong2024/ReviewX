# ReviewX 前端变更记录

## 2026-06-12

### UI 基线升级与管理员基础页面交互修正

- 启用 Tailwind CSS 4：
  - 新增 `frontend/postcss.config.mjs`
  - `frontend/src/styles/globals.css` 引入 `@import "tailwindcss"`
  - 保留少量全局 CSS variables、背景、滚动条和语义布局类
- 建立 ReviewX 视觉方向：政务可信、科技评审、AI 协同、轻未来感
- 升级登录页：
  - 品牌化展示“科评星 ReviewX”
  - 强化科技项目评审协同与监管平台定位
  - 登录卡片使用半透明玻璃质感和深靛蓝 / 青蓝渐变主按钮
- 升级 `/workspace`：
  - admin、client、review_manager、expert、project_owner 均以中文角色卡片展示
  - admin 标识为可进入，其余已开通但未实现角色显示“后续建设”
  - 未开通角色显示“未开通”
- 升级 `AdminShell`：
  - 深海军蓝 / 墨蓝 / 靛蓝渐变侧边栏
  - 轻科技纹理、胶囊选中态、顶部用户信息和角色 Badge
  - 内容区改为浅灰蓝渐变背景
- 升级基础组件：
  - `Button`、`Input`、`Select`、`Textarea`
  - `Modal`、`ConfirmDialog`
  - `DataTable`、`Pagination`
  - `EmptyState`、`ErrorAlert`、`LoadingState`、`Badge`
- 优化 `/admin` 首页：
  - 按主数据维护 / 项目评审组织 / 监管闭环组织信息架构
  - 功能卡片增加轻量标识、状态和统一视觉
- 修复 `/admin/dictionaries`：
  - `dictType` 预设类型中文化：项目状态、材料类型、评审等级
  - “自定义 dictType”改为“字典类型 + 自定义类型标识”
  - 自定义类型保存时提交真实标识，不提交 `"custom"` 或空值
  - `code` UI 统一改为“编码”，并补充用途说明
  - 过滤区中文化并支持全部、预设类型、自定义类型
- 修复 `/admin/tree-dictionaries`：
  - `treeType` 预设类型中文化：项目类型、学科、受理处室、行政区划
  - 页面说明改为树形层级维护口径
  - 平铺表格改为缩进树形列表
  - 支持新增根节点、添加子节点、编辑、停用
  - 父节点选择改为缩进树形选项
  - `code` UI 统一改为“编码”，并补充用途说明
- 修复 `/admin/organizations`：
  - 行政区划选择改为树形缩进下拉
  - 优先读取 `treeType=administrative_division`
  - 兼容当前后端历史 `treeType=region`
  - 无行政区划数据时显示友好提示并允许为空
- 修复 `/admin/review-schemes`：
  - 动态评分项新增稳定 `clientId`
  - 新增和编辑已有评分项时均补充 `clientId`
  - 渲染 key 改为 `clientId`
  - 提交前移除 `clientId`，仍按后端 DTO 提交
  - 保持 `totalScore` 由后端计算，前端仅显示录入预估
- 同步 `/admin/projects` 视觉风格：
  - 项目类型下拉改为树形缩进选项
  - 状态列区分项目状态与启用状态
- 新增轻量工具：
  - `frontend/src/lib/labels/dictionary-labels.ts`
  - `frontend/src/lib/tree/build-tree.ts`
  - `frontend/src/components/ui/TreeList.tsx`
  - `frontend/src/lib/styles.ts`

### 本次明确未做

- 未修改 `backend/src/**`
- 未修改 `backend/scripts/**`
- 未修改后端 package 文件
- 未新增第三方依赖
- 未修改真实 `.env` 文件
- 未引入大型 UI 组件库
- 未引入状态管理库
- 未引入 axios
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

### 本次验证

- `npm run lint`：通过
- `npm run typecheck`：通过
- `npm run build`：通过

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
