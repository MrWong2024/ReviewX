# ReviewX 前端变更记录

## 2026-06-15

### ReviewX 小修：项目导入行号展示优化与导入任务删除能力

- `/admin/project-imports` 任务列表新增删除按钮和二次确认，确认文案说明只删除导入任务与行级解析记录、不删除已入库项目、已有确认入库任务不能删除
- 删除成功后提示“已删除导入任务，并清理 X 条行记录。”并刷新任务列表；当前页删除后为空且存在上一页时回退上一页
- `confirmedRows > 0` 的导入任务删除按钮置灰并提示“已有确认入库项目，不能删除导入任务”；后端 409 / 404 / 400 / 500 均映射为友好错误
- `/admin/project-imports/[jobId]` 行列表列名由“行号”调整为“Excel 行号”，确认/跳过弹窗、成功提示和行修正弹窗标题统一使用“Excel 第 X 行”
- 新增 `deleteProjectImportJob` 前端 API 和 `DeleteProjectImportJobResponse` 类型；统一出口继续通过 wildcard export 暴露
- 本次未修改字段映射配置页面，未新增依赖，未新增环境变量，未修改 `frontend/package.json` 或锁文件

## 2026-06-14

### ReviewX 第二阶段补丁二：Excel 字段映射配置前端接入

- 新增 `/admin/project-import-field-mappings` 页面，支持管理员维护项目 Excel 标准字段的自定义表头别名
- 新增 AdminShell “字段映射”入口，并在 `/admin` 概览页新增“Excel 字段映射”卡片
- 新增 `frontend/src/features/admin/api/project-import-field-mappings.ts`，封装 `listProjectImportStandardFields`、`listProjectImportFieldMappings`、`getProjectImportFieldMapping`、`upsertProjectImportFieldMapping`、`updateProjectImportFieldMapping`、`deleteProjectImportFieldMapping`、`resetProjectImportFieldMappingDefaults`
- 新增 `frontend/src/features/admin/types/project-import-field-mappings.ts`，显式定义标准字段、标准字段响应、配置视图、查询参数、upsert/update 输入和删除响应类型；标准字段保持 `disciplineName`
- 新增 `frontend/src/lib/labels/project-import-field-mapping-labels.ts`，中文化必填、配置状态、启用状态、标准字段 fallback 和别名展示
- 新增 `ProjectImportFieldMappingsPage`、`FieldMappingEditorModal`、`AliasChips`，展示标准字段、字段中文名、是否必填、默认别名、自定义别名、最终生效别名、启用状态、配置状态、备注和更新时间
- 支持 keyword / isActive 筛选；keyword 和空 isActive 不提交无效 query
- 支持创建或覆盖配置、编辑已有配置、启用 / 停用配置、删除自定义配置和 reset-defaults 重置默认
- 停用、删除和重置默认均有二次确认；页面明确停用和删除不是禁用标准字段，而是回退内置默认别名
- 编辑弹窗使用 textarea 一行一个别名，保存前 trim、过滤空行、校验空别名和重复别名；409 冲突显示“字段别名已被其他标准字段使用，请更换别名”
- 本阶段未修改 backend，未新增后端接口，未新增依赖，未新增环境变量，未修改 `package.json` 或锁文件
- 本阶段未实现项目分配、专家分配、材料、评分、合议、申诉、甲方看板或腾讯会议
- 本次验证：`frontend` 下 `npm run lint`、`npm run typecheck`、`npm run build` 均通过

### ReviewX 前端第二阶段：管理员 Excel 导入与待确认处理

- 新增 `/admin/project-imports` 页面，支持批次选择、Excel 文件选择、上传前校验、FormData 上传、上传成功提示和任务列表刷新
- 新增 `/admin/project-imports/[jobId]` 页面，支持任务基础信息、统计、字段映射、行列表、状态筛选、keyword 搜索和分页
- 新增 `frontend/src/features/admin/api/project-imports.ts`，封装 `uploadProjectImport`、`listProjectImportJobs`、`getProjectImportJob`、`listProjectImportRows`、`updateProjectImportRow`、`confirmProjectImportRow`、`confirmProjectImportJob`、`skipProjectImportRow`
- 新增 `frontend/src/features/admin/types/project-imports.ts`，显式定义 Job/Row/Issue/Normalized/Resolved/Update DTO/BulkConfirm 等前端类型，不使用 `any` 逃避建模
- 新增 `frontend/src/lib/labels/project-import-labels.ts`，中文化任务状态、行状态、issue code 和导入字段名；`existing_project_matched` 明确提示确认后将更新已有项目
- 新增 `ProjectImportJobStats`、`ProjectImportIssueList`、`ProjectImportRowModal` 局部组件，用于统计展示、issue 候选项采用和行修正弹窗
- 行修正弹窗展示 raw / normalized / resolved / issues，并支持选择已有项目类型、项目状态、项目负责人、承担单位、合作单位、学科、受理处室
- 行修正弹窗支持通过 `createOrganization` 创建新承担单位，通过 `createOwnerUser` 创建新项目负责人用户
- 单行确认仅对 `importable` 行开放；单行跳过仅对 `importable/pending_confirmation/failed` 行开放；`confirmed` 行不允许修正或跳过
- 批量确认按钮仅在任务存在可导入行时可用，并二次确认“仅确认当前任务中所有可导入行，待确认、已跳过、已确认行会跳过”
- 操作成功后刷新当前任务统计、当前行列表，并在创建单位/用户后刷新主数据选项
- AdminShell 新增“项目导入”入口，`/admin` 概览页新增项目导入卡片
- 本阶段未修改 backend，未新增后端接口，未新增依赖，未新增环境变量，未修改 `package.json` 或锁文件
- 本阶段未实现项目分配、专家分配、材料、评分、合议、申诉、甲方看板、腾讯会议、Excel 模板下载、Excel 导出、导入任务删除/取消或 skipped 行恢复
- 本次验证：`frontend` 下 `npm run lint`、`npm run typecheck`、`npm run build` 均通过

### 管理员用户管理页面

- 新增 `/admin/users` 页面和 AdminShell “用户管理”菜单入口
- 新增 `frontend/src/features/admin/api/users.ts`，封装 `listUsers`、`getUser`、`createUser`、`updateUser`、`updateUserStatus`、`resetUserPassword`
- 新增 `frontend/src/features/admin/types/users.ts`，定义管理员用户、用户角色、列表参数、创建/更新/状态更新/重置密码输入类型；类型不包含 `passwordHash`
- 新增 `frontend/src/lib/labels/role-labels.ts`，统一角色中文显示：管理员、甲方、评审负责人、评审专家、项目负责人；请求仍提交英文角色值
- 新增轻量 `MultiSelect` 和 `TreeMultiSelect`，不引入第三方依赖，用于角色多选、单位多选和学科树形/缩进多选
- 用户列表支持分页、姓名/手机号搜索、角色筛选、启用状态筛选、角色 Badge、单位名称映射、学科名称映射、状态显示和 `mustChangePassword` 显示
- 新增用户支持姓名、手机号、初始密码可空、角色多选、单位多选、学科树形/缩进多选、启用状态、首次登录要求改密；密码留空时不提交 `password`，由后端默认手机号
- 编辑用户支持姓名、角色、单位、学科、启用状态、首次登录要求改密；手机号只读，不提交 `phone/password/passwordHash`
- 启用/停用调用 `PATCH /admin/users/:id/status`；停用前二次确认；当前登录管理员自己的停用快捷操作禁用，后端 409 仍显示错误
- 重置密码支持新密码可空和 `mustChangePassword`；密码留空时不提交 `password`，成功后提示已重置为用户手机号
- 本阶段未修改 backend，未新增依赖，未新增环境变量，未修改真实 `.env`，未修改 `frontend/package.json` 或 `package-lock.json`
- 本阶段未实现用户自助改密、忘记密码、短信验证码、用户批量导入、权限矩阵配置、Excel 导入、专家分配、项目负责人材料、专家评分、合议、申诉、甲方看板、腾讯会议或真实 AI
- 本次验证：`frontend` 下 `npm run lint`、`npm run typecheck`、`npm run build` 均通过

## 2026-06-12

### 表单控件与行内操作按钮一致性修正

- Button size 体系统一为 `sm/md/lg`
- 表格行内操作、树节点行内操作、分页和顶部退出使用 `sm` 紧凑尺寸
- `Input` / `Select` 默认高度统一为 `h-10`
- `Textarea` 复用统一 label、description、error 字段布局和控件视觉
- 新增轻量 `FormField`，用于统一表单字段 label、说明、错误提示和说明区预留
- `/admin/dictionaries` 新增/编辑表单中“名称 / 编码”输入框顶部和高度对齐，自定义类型标识高度不回退
- `/admin/tree-dictionaries` 新增/编辑表单中“名称 / 编码 / 父节点”等控件对齐
- `/admin/tree-dictionaries` 树节点“添加子节点 / 编辑 / 停用”改为紧凑按钮，避免抢占节点主体视觉
- `/admin/organizations` 行内按钮保持紧凑协调，行政区划 `administrative_division` 口径不变
- 本阶段未新增业务页面，未修改后端，未新增依赖或环境变量

### 行政区划 treeType 口径统一

- 统一行政区划树形字典口径为 `treeType=administrative_division`
- `OrganizationsPage` 行政区划选择只读取 `administrative_division`，不再备用读取历史 `region`
- `TreeDictionariesPage` 树类型预设保持项目类型、学科、受理处室、行政区划四类；历史 `region` 不再作为行政区划推荐或兼容类型显示
- `dictionary-labels` 移除历史 `region` 行政区划映射
- 无行政区划数据时提示“暂无行政区划数据，请先在树形字典中维护行政区划。”
- `Organization.regionId` 字段名不变，仍提交行政区划节点 ObjectId
- 当前不做历史 `region` 数据迁移；本地如有历史测试数据，可人工删除或重建为 `administrative_division`
- 本次未新增接口、未新增环境变量、未新增第三方依赖
- 本次验证：`frontend` 下 `npm run lint`、`npm run typecheck`、`npm run build` 均通过

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
  - 读取 `treeType=administrative_division`
  - 不再兼容历史 `treeType=region`
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
