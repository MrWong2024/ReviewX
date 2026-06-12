# ReviewX 前端路由地图

## 1. 当前路由

| 路由 | 页面文件 | 权限 / 会话 | 状态 | 说明 |
| --- | --- | --- | --- | --- |
| `/` | `frontend/app/page.tsx` | 无 | implemented | 直接跳转 `/workspace` |
| `/login` | `frontend/app/login/page.tsx` | 未登录可访问；已登录跳 `/workspace` | implemented | 手机号 + 密码登录 |
| `/workspace` | `frontend/app/workspace/page.tsx` | 需要登录 | implemented | 多角色入口；仅 admin 当前可进入真实后台 |
| `/admin` | `frontend/app/admin/page.tsx` | 需要登录 + admin 角色 | implemented | 管理员后台概览 |
| `/admin/batches` | `frontend/app/admin/batches/page.tsx` | 需要登录 + admin 角色 | implemented | 批次管理 |
| `/admin/dictionaries` | `frontend/app/admin/dictionaries/page.tsx` | 需要登录 + admin 角色 | implemented | 普通字典管理 |
| `/admin/tree-dictionaries` | `frontend/app/admin/tree-dictionaries/page.tsx` | 需要登录 + admin 角色 | implemented | 树形字典管理 |
| `/admin/organizations` | `frontend/app/admin/organizations/page.tsx` | 需要登录 + admin 角色 | implemented | 单位管理 |
| `/admin/review-schemes` | `frontend/app/admin/review-schemes/page.tsx` | 需要登录 + admin 角色 | implemented | 评审方案管理 |
| `/admin/projects` | `frontend/app/admin/projects/page.tsx` | 需要登录 + admin 角色 | implemented | 项目只读列表 |
| `/_not-found` | `frontend/app/not-found.tsx` | 无 | implemented | 404 友好页 |

## 2. 管理员 layout

- layout 文件：`frontend/app/admin/layout.tsx`
- 壳组件：`frontend/src/components/layout/AdminShell.tsx`
- 顶部栏显示平台名、当前用户、当前角色和退出登录
- 侧边栏提供管理员功能菜单
- 守卫为 client component 守卫：
  - 未登录访问 `/admin/*`：跳转 `/login`
  - 已登录但无 admin 角色：显示 403 状态并提供返回工作台入口

## 3. 当前不包含的路由

- 不包含 `/admin/project-imports`
- 不包含专家分配、材料上传、专家评分、合议、申诉、甲方看板和腾讯会议相关页面
