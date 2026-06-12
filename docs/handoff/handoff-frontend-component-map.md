# ReviewX 前端组件地图

## 1. Layout 组件

| 组件 | 文件 | 用途 |
| --- | --- | --- |
| `AdminShell` | `frontend/src/components/layout/AdminShell.tsx` | 管理员后台壳、顶部栏、侧边栏、前端守卫、退出登录 |

## 2. UI 组件

| 组件 | 文件 | 用途 |
| --- | --- | --- |
| `Button` | `frontend/src/components/ui/Button.tsx` | 基础按钮，支持 primary/secondary/danger/ghost |
| `Input` | `frontend/src/components/ui/Input.tsx` | 带 label 的输入框 |
| `Select` | `frontend/src/components/ui/Select.tsx` | 带 label 的下拉框 |
| `Textarea` | `frontend/src/components/ui/Textarea.tsx` | 带 label 的多行输入 |
| `Modal` | `frontend/src/components/ui/Modal.tsx` | 基础弹窗 |
| `ConfirmDialog` | `frontend/src/components/ui/ConfirmDialog.tsx` | 确认弹窗 |
| `DataTable` | `frontend/src/components/ui/DataTable.tsx` | 简单数据表格 |
| `Pagination` | `frontend/src/components/ui/Pagination.tsx` | 简单分页控件 |

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
