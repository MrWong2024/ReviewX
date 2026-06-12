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
