# ReviewX 前端路由地图

## 1. 当前路由

| 路由 | 页面文件 | 权限 / 会话 | 状态 | 说明 |
| --- | --- | --- | --- | --- |
| `/` | `frontend/app/page.tsx` | 无 | implemented | 直接跳转 `/workspace` |
| `/login` | `frontend/app/login/page.tsx` | 未登录可访问；已登录跳 `/workspace` | implemented | 品牌化登录页，手机号 + 密码登录 |
| `/workspace` | `frontend/app/workspace/page.tsx` | 需要登录 | implemented | 现代化多角色入口；admin 和 project_owner 可进入真实工作台，其他角色仍显示后续建设 |
| `/admin` | `frontend/app/admin/page.tsx` | 需要登录 + admin 角色 | implemented | 管理员后台概览，按主数据维护 / 项目评审组织 / 监管闭环组织 |
| `/admin/users` | `frontend/app/admin/users/page.tsx` | 需要登录 + admin 角色 | implemented | 用户管理，支持列表、搜索、角色/状态筛选、分页、新增、编辑、启停和重置密码 |
| `/admin/batches` | `frontend/app/admin/batches/page.tsx` | 需要登录 + admin 角色 | implemented | 批次管理 |
| `/admin/dictionaries` | `frontend/app/admin/dictionaries/page.tsx` | 需要登录 + admin 角色 | implemented | 普通字典管理，中文类型映射和自定义类型保存 |
| `/admin/tree-dictionaries` | `frontend/app/admin/tree-dictionaries/page.tsx` | 需要登录 + admin 角色 | implemented | 树形字典管理，缩进树展示和子节点新增 |
| `/admin/organizations` | `frontend/app/admin/organizations/page.tsx` | 需要登录 + admin 角色 | implemented | 单位管理，树形缩进行政区划选择 |
| `/admin/review-schemes` | `frontend/app/admin/review-schemes/page.tsx` | 需要登录 + admin 角色 | implemented | 评审方案管理，评分项稳定 clientId 防失焦 |
| `/admin/project-imports` | `frontend/app/admin/project-imports/page.tsx` | 需要登录 + admin 角色 | implemented | 项目 Excel 导入任务列表、上传入口和未确认导入任务删除入口 |
| `/admin/project-imports/[jobId]` | `frontend/app/admin/project-imports/[jobId]/page.tsx` | 需要登录 + admin 角色 | implemented | 项目导入任务详情、Excel 行号展示、行列表、人工修正、确认和跳过 |
| `/admin/project-import-field-mappings` | `frontend/app/admin/project-import-field-mappings/page.tsx` | 需要登录 + admin 角色 | implemented | Excel 字段映射配置，维护标准字段自定义别名、启停、删除和 reset-defaults fallback |
| `/admin/projects` | `frontend/app/admin/projects/page.tsx` | 需要登录 + admin 角色 | implemented | 项目评审组织列表，支持筛选、单项目分配、批量分配和批量设置专家 |
| `/admin/projects/[projectId]/review-organization` | `frontend/app/admin/projects/[projectId]/review-organization/page.tsx` | 需要登录 + admin 角色 | implemented | 单项目评审组织详情，维护评审安排、查看候选专家和管理已分配专家 |
| `/project-owner` | `frontend/app/project-owner/page.tsx` | 需要登录 + project_owner 角色 | implemented | 项目负责人概览，基于第一页项目做轻量展示并提供“我的项目”入口 |
| `/project-owner/projects` | `frontend/app/project-owner/projects/page.tsx` | 需要登录 + project_owner 角色 | implemented | 我的项目列表，按后端 ownerUserId 过滤；支持分页、portal reference-data 名称映射和批次 / 项目类型 / 项目状态 / 评审负责人 / 评审方案 select 筛选 |
| `/project-owner/projects/[projectId]` | `frontend/app/project-owner/projects/[projectId]/page.tsx` | 需要登录 + project_owner 角色 | implemented | 项目详情、评审安排、后续推进需求、portal reference-data 名称映射，以及材料上传草稿、状态展示、提交评审、下载、草稿物理删除和 submitted 删除禁用闭环 |
| `/_not-found` | `frontend/app/not-found.tsx` | 无 | implemented | 404 友好页 |

## 2. 管理员 layout

- layout 文件：`frontend/app/admin/layout.tsx`
- 壳组件：`frontend/src/components/layout/AdminShell.tsx`
- 顶部栏显示平台名、当前用户、当前角色 Badge 和退出登录
- 侧边栏提供管理员功能菜单，包含用户管理、项目导入和字段映射入口，采用深海军蓝 / 靛蓝渐变、轻科技纹理、胶囊选中态
- 守卫为 client component 守卫：
  - 未登录访问 `/admin/*`：跳转 `/login`
  - 已登录但无 admin 角色：显示 403 状态并提供返回工作台入口

## 3. 项目负责人 layout

- 壳组件：`frontend/src/components/layout/ProjectOwnerShell.tsx`
- 顶部栏显示平台名、当前用户、项目负责人角色 Badge、返回工作台和退出登录
- 侧边栏提供“概览”和“我的项目”入口，视觉基线与 AdminShell 保持同一产品气质，但不复用管理员导航
- 守卫为 client component 守卫：
  - 未登录访问 `/project-owner/*`：跳转 `/login`
  - 已登录但无 project_owner 角色：显示 403 状态并提供返回工作台入口

## 4. 当前不包含的路由

- 不包含用户自助改密、忘记密码、短信验证码、用户批量导入、权限矩阵配置
- 不包含专家评分、合议、申诉、甲方看板和腾讯会议直播 / 推流 / 回看 / API 集成相关页面
- 不包含文件预览、材料恢复、admin 材料删除或删除日志查询页面；项目负责人材料上传草稿、提交评审、下载和 draft/legacy active 物理删除闭环已通过 portal `material_type` 启用
