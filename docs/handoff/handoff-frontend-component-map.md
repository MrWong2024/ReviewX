# ReviewX 前端组件地图

## 1. Layout 组件

| 组件 | 文件 | 用途 |
| --- | --- | --- |
| `AdminShell` | `frontend/src/components/layout/AdminShell.tsx` | 管理员后台壳、顶部栏、侧边栏、前端守卫、退出登录 |

## 2. UI 组件

| 组件 | 文件 | 用途 |
| --- | --- | --- |
| `Button` | `frontend/src/components/ui/Button.tsx` | 基础按钮，支持 primary/secondary/danger/ghost 与 `sm/md/lg` size |
| `FormField` | `frontend/src/components/ui/FormField.tsx` | 轻量字段外壳，统一 label、description、error 和说明区预留 |
| `Input` | `frontend/src/components/ui/Input.tsx` | 带 label 的输入框，默认固定 `h-10` |
| `Select` | `frontend/src/components/ui/Select.tsx` | 带 label 的下拉框，默认固定 `h-10` |
| `Textarea` | `frontend/src/components/ui/Textarea.tsx` | 带 label 的多行输入，复用统一字段布局 |
| `Modal` | `frontend/src/components/ui/Modal.tsx` | 基础弹窗 |
| `ConfirmDialog` | `frontend/src/components/ui/ConfirmDialog.tsx` | 确认弹窗 |
| `DataTable` | `frontend/src/components/ui/DataTable.tsx` | 简单数据表格 |
| `Pagination` | `frontend/src/components/ui/Pagination.tsx` | 简单分页控件 |
| `TreeList` | `frontend/src/components/ui/TreeList.tsx` | 树形缩进列表，用于树形字典展示 |
| `MultiSelect` | `frontend/src/components/ui/MultiSelect.tsx` | 轻量 checkbox 多选，用于用户角色和单位多选 |
| `TreeMultiSelect` | `frontend/src/components/ui/TreeMultiSelect.tsx` | 轻量树形/缩进 checkbox 多选，用于用户学科关联 |

## 3. Feedback 组件

| 组件 | 文件 | 用途 |
| --- | --- | --- |
| `Badge` | `frontend/src/components/feedback/Badge.tsx` | 状态标签 |
| `EmptyState` | `frontend/src/components/feedback/EmptyState.tsx` | 空状态 |
| `ErrorAlert` | `frontend/src/components/feedback/ErrorAlert.tsx` | 错误提示 |
| `LoadingState` | `frontend/src/components/feedback/LoadingState.tsx` | 加载状态 |

## 4. Feature 组件

| 组件 | 文件 | 用途 |
| --- | --- | --- |
| `AuthProvider` | `frontend/src/features/auth/AuthProvider.tsx` | 当前用户状态、登录、登出、刷新会话 |
| `LoginPage` | `frontend/src/features/auth/LoginPage.tsx` | 登录页 |
| `WorkspacePage` | `frontend/src/features/auth/WorkspacePage.tsx` | 角色入口页 |
| `BatchesPage` | `frontend/src/features/admin/pages/BatchesPage.tsx` | 批次管理 |
| `DictionariesPage` | `frontend/src/features/admin/pages/DictionariesPage.tsx` | 普通字典管理 |
| `TreeDictionariesPage` | `frontend/src/features/admin/pages/TreeDictionariesPage.tsx` | 树形字典管理 |
| `OrganizationsPage` | `frontend/src/features/admin/pages/OrganizationsPage.tsx` | 单位管理 |
| `ReviewSchemesPage` | `frontend/src/features/admin/pages/ReviewSchemesPage.tsx` | 评审方案管理 |
| `ProjectsPage` | `frontend/src/features/admin/pages/ProjectsPage.tsx` | 项目只读列表 |
| `UsersPage` | `frontend/src/features/admin/pages/UsersPage.tsx` | 管理员用户管理，支持列表、筛选、分页、新增、编辑、启停和重置密码 |
| `ProjectImportsPage` | `frontend/src/features/admin/pages/ProjectImportsPage.tsx` | 管理员 Excel 项目导入上传、任务筛选、任务列表和分页 |
| `ProjectImportDetailPage` | `frontend/src/features/admin/pages/ProjectImportDetailPage.tsx` | 项目导入任务详情、行筛选、行列表、人工修正、单行确认/跳过和批量确认 |
| `ProjectImportJobStats` | `frontend/src/features/admin/components/project-imports/ProjectImportJobStats.tsx` | 导入任务统计卡片 |
| `ProjectImportIssueList` | `frontend/src/features/admin/components/project-imports/ProjectImportIssueList.tsx` | 导入行 issue 中文展示和候选项采用按钮 |
| `ProjectImportRowModal` | `frontend/src/features/admin/components/project-imports/ProjectImportRowModal.tsx` | 导入行 raw / normalized / resolved / issues 展示与人工修正表单 |
| `ProjectImportFieldMappingsPage` | `frontend/src/features/admin/pages/ProjectImportFieldMappingsPage.tsx` | 管理员 Excel 字段映射配置页，支持标准字段配置视图、keyword / isActive 筛选、编辑、启停、删除配置和重置默认 |
| `FieldMappingEditorModal` | `frontend/src/features/admin/components/project-import-field-mappings/FieldMappingEditorModal.tsx` | 字段映射编辑弹窗，展示标准字段、默认别名，编辑自定义别名、启用状态和备注 |
| `AliasChips` | `frontend/src/features/admin/components/project-import-field-mappings/AliasChips.tsx` | 字段映射别名 chips 展示，限制表格宽度并显示剩余数量 |

## 5. 工具

| 工具 | 文件 | 用途 |
| --- | --- | --- |
| `apiRequest` | `frontend/src/lib/api/client.ts` | 统一 fetch 封装 |
| `ApiError` | `frontend/src/lib/api/errors.ts` | 结构化 API 错误 |
| `formatDateTime` | `frontend/src/lib/format/date.ts` | 日期时间展示 |
| `displayValue` / `statusText` | `frontend/src/lib/format/value.ts` | 空值和状态展示 |
| form utils | `frontend/src/features/admin/form-utils.ts` | trim、空值、数值转换 |
| `cx` | `frontend/src/lib/styles.ts` | 轻量 className 拼接 |
| dictionary/tree labels | `frontend/src/lib/labels/dictionary-labels.ts` | 普通字典和树形字典中文显示映射；行政区划只映射 `administrative_division`，不再映射历史 `region` |
| role labels | `frontend/src/lib/labels/role-labels.ts` | 用户角色中文显示映射、角色选项和格式化工具；请求仍使用英文角色值 |
| project import labels | `frontend/src/lib/labels/project-import-labels.ts` | 项目导入任务状态、行状态、issue code 和字段名中文显示映射 |
| project import field mapping labels | `frontend/src/lib/labels/project-import-field-mapping-labels.ts` | Excel 字段映射配置页必填、配置状态、启用状态、标准字段 fallback 和别名展示辅助 |
| tree utils | `frontend/src/lib/tree/build-tree.ts` | 平铺树数据构建、展平和缩进标签 |

## 6. 当前 UI 基线

- 已启用 Tailwind CSS 4
- 基础组件已统一为深靛蓝到青蓝渐变主按钮、浅底 secondary、轻量 ghost、低饱和 danger
- Button size 体系为 `sm/md/lg`；表格行内操作、树节点行内操作和分页按钮使用 `sm`
- Input / Select 基础高度统一为 `h-10`，Textarea 统一字号、圆角、边框和 focus ring
- 表格、分页、空状态、错误提示、加载态、Modal、ConfirmDialog 已同步现代化样式
- `AdminShell` 已升级为深海军蓝 / 墨蓝 / 靛蓝渐变侧栏、胶囊选中态、顶部用户与角色 Badge、浅灰蓝内容背景
- 页面仍保留少量语义 class（如 `page-title`、`toolbar`、`panel`、`form-stack`），由全局 CSS 通过 Tailwind `@apply` 统一承载
- `.grid-2` / `.grid-3` 使用 `items-start` 保持同行字段顶部对齐；字典和树形字典表单通过说明区预留避免“名称 / 编码”高度错位
- 单位行政区划选择只使用 `treeType=administrative_division` 的缩进树选项；无数据时提示先在树形字典中维护行政区划
