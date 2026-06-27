# ReviewX 前端路由地图

## 1. 当前路由

| 路由 | 页面文件 | 权限 / 会话 | 状态 | 说明 |
| --- | --- | --- | --- | --- |
| `/` | `frontend/app/page.tsx` | 无 | implemented | 直接跳转 `/workspace` |
| `/login` | `frontend/app/login/page.tsx` | 未登录可访问；已登录跳 `/workspace` | implemented | 品牌化登录页，手机号 + 密码登录 |
| `/workspace` | `frontend/app/workspace/page.tsx` | 需要登录 | implemented | 现代化多角色入口；admin、project_owner、expert 和 review_manager 可进入真实工作台，client 仍显示后续建设 |
| `/admin` | `frontend/app/admin/page.tsx` | 需要登录 + admin 角色 | implemented | 管理员后台概览，按主数据维护 / 项目评审组织 / 监管闭环组织 |
| `/admin/users` | `frontend/app/admin/users/page.tsx` | 需要登录 + admin 角色 | implemented | 用户管理，支持列表、搜索、角色/状态筛选、分页、新增、编辑、启停和重置密码 |
| `/admin/batches` | `frontend/app/admin/batches/page.tsx` | 需要登录 + admin 角色 | implemented | 批次管理 |
| `/admin/dictionaries` | `frontend/app/admin/dictionaries/page.tsx` | 需要登录 + admin 角色 | implemented | 普通字典管理，类型筛选固定为项目状态、材料类型和评审等级，默认项目状态，不支持全部浏览或自定义 dictType |
| `/admin/tree-dictionaries` | `frontend/app/admin/tree-dictionaries/page.tsx` | 需要登录 + admin 角色 | implemented | 树形字典管理，顶部树类型筛选、默认仅展示第一层、按需展开 / 收起、缩进树展示和子节点新增；新增 / 编辑弹窗父节点默认仅列一级节点，可切换显示全部层级，空父节点表示作为一级节点；父节点原生下拉使用统一树形 option 缩进；列表行内不重复显示树类型 |
| `/admin/organizations` | `frontend/app/admin/organizations/page.tsx` | 需要登录 + admin 角色 | implemented | 单位管理，行政区划筛选和新增 / 编辑单位弹窗均使用统一树形 option 缩进 |
| `/admin/review-schemes` | `frontend/app/admin/review-schemes/page.tsx` | 需要登录 + admin 角色 | implemented | 评审方案管理，评分项稳定 clientId 防失焦 |
| `/admin/project-imports` | `frontend/app/admin/project-imports/page.tsx` | 需要登录 + admin 角色 | implemented | 项目 Excel 导入任务列表、上传入口和未确认导入任务删除入口 |
| `/admin/project-imports/[jobId]` | `frontend/app/admin/project-imports/[jobId]/page.tsx` | 需要登录 + admin 角色 | implemented | 项目导入任务详情、Excel 行号展示、行列表、人工修正、确认和跳过；查看 / 修正弹窗中的项目类型、受理处室和行政区划原生下拉使用统一树形 option 缩进 |
| `/admin/project-import-field-mappings` | `frontend/app/admin/project-import-field-mappings/page.tsx` | 需要登录 + admin 角色 | implemented | Excel 字段映射配置，维护标准字段自定义别名、启停、删除和 reset-defaults fallback |
| `/admin/projects` | `frontend/app/admin/projects/page.tsx` | 需要登录 + admin 角色 | implemented | 项目评审组织列表，支持筛选、单项目分配、批量分配和批量设置专家；项目类型筛选使用统一树形 option 缩进 |
| `/admin/projects/[projectId]/review-organization` | `frontend/app/admin/projects/[projectId]/review-organization/page.tsx` | 需要登录 + admin 角色 | implemented | 单项目评审组织详情，维护评审安排、查看候选专家、管理已分配专家，并查看、下载、带原因删除项目材料 |
| `/admin/projects/[projectId]/appeals` | `frontend/app/admin/projects/[projectId]/appeals/page.tsx` | 需要登录 + admin 角色 | implemented | 管理员项目申诉列表，展示申诉记录和等级变更历史，进入申诉详情 / 处理 |
| `/admin/projects/[projectId]/appeals/[appealId]` | `frontend/app/admin/projects/[projectId]/appeals/[appealId]/page.tsx` | 需要登录 + admin 角色 | implemented | 管理员申诉详情 / 处理页，查看申诉详情、附件和等级变更历史，submitted / processing 状态可处理 |
| `/project-owner` | `frontend/app/project-owner/page.tsx` | 需要登录 + project_owner 角色 | implemented | 项目负责人概览，基于第一页项目做轻量展示并提供“我的项目”入口 |
| `/project-owner/projects` | `frontend/app/project-owner/projects/page.tsx` | 需要登录 + project_owner 角色 | implemented | 我的项目列表，按后端 ownerUserId 过滤；支持分页、portal reference-data 名称映射和批次 / 项目类型 / 项目状态 / 评审负责人 / 评审方案 select 筛选；项目类型筛选使用统一树形 option 缩进 |
| `/project-owner/projects/[projectId]` | `frontend/app/project-owner/projects/[projectId]/page.tsx` | 需要登录 + project_owner 角色 | implemented | 项目详情、评审安排、后续推进需求、portal reference-data 名称映射，以及材料上传草稿、状态展示、提交评审、下载、草稿物理删除和 submitted 删除禁用闭环；评审负责人显示优先使用项目响应 `reviewManager` 摘要，评审结果确认后后续推进需求和项目材料写操作只读锁定 |
| `/project-owner/projects/[projectId]/review-result` | `frontend/app/project-owner/projects/[projectId]/review-result/page.tsx` | 需要登录 + project_owner 角色 | implemented | 项目负责人查看已确认合议结果、最终等级、等级变更历史和本人申诉列表，并发起申诉 |
| `/project-owner/projects/[projectId]/appeals/[appealId]` | `frontend/app/project-owner/projects/[projectId]/appeals/[appealId]/page.tsx` | 需要登录 + project_owner 角色 | implemented | 项目负责人查看本人申诉详情、处理意见和附件；submitted 状态可继续补充上传申诉附件，已上传附件不可删除 |
| `/expert` | `frontend/app/expert/page.tsx` | 需要登录 + expert 角色 | implemented | 专家工作台首页，说明任务 / 材料 / 评分流程，并提供“我的评审任务”入口 |
| `/expert/review-tasks` | `frontend/app/expert/review-tasks/page.tsx` | 需要登录 + expert 角色 | implemented | 专家评审任务列表，调用 `/expert/review-tasks`；支持状态、批次、评审负责人、评审方案筛选和分页 |
| `/expert/review-tasks/[projectId]` | `frontend/app/expert/review-tasks/[projectId]/page.tsx` | 需要登录 + expert 角色 | implemented | 专家评审任务详情，展示项目、评审安排、submitted 材料、评审方案快照和评分表单；支持草稿、提交、submitted 只读和 returned 重提 |
| `/review-manager` | `frontend/app/review-manager/page.tsx` | 需要登录 + review_manager 角色 | implemented | 评审负责人工作台首页，提供负责项目、专家评分、汇总和合议确认入口说明 |
| `/review-manager/projects` | `frontend/app/review-manager/projects/page.tsx` | 需要登录 + review_manager 角色 | implemented | 评审负责人负责项目列表，调用 `/review-manager/projects`；支持 keyword、批次、项目状态、评审方案筛选和分页 |
| `/review-manager/projects/[projectId]` | `frontend/app/review-manager/projects/[projectId]/page.tsx` | 需要登录 + review_manager 角色 | implemented | 评审负责人项目总览 / 工作入口页；项目摘要用项目列表 `pageSize=1000` 前端匹配，不调用不存在的详情接口；只展示项目摘要、评审安排摘要、专家数量 / 合议状态摘要，并提供评审组织和合议处理入口 |
| `/review-manager/projects/[projectId]/review-organization` | `frontend/app/review-manager/projects/[projectId]/review-organization/page.tsx` | 需要登录 + review_manager 角色 | implemented | 评审负责人评审前组织页，维护评审时间 / 地点 / 会议链接，查看 submitted 材料，查看候选专家和已分配专家，并执行追加 / 替换 / 移除；无管理员治理能力 |
| `/review-manager/projects/[projectId]/consensus` | `frontend/app/review-manager/projects/[projectId]/consensus/page.tsx` | 需要登录 + review_manager 角色 | implemented | 评审负责人评审后合议页，展示专家评分列表 / 详情、退回评分、评分汇总、合议草稿和最终确认；不包含专家分配和评审安排表单 |
| `/review-manager/projects/[projectId]/appeals` | `frontend/app/review-manager/projects/[projectId]/appeals/page.tsx` | 需要登录 + review_manager 角色 | implemented | 评审负责人查看自己负责项目的申诉列表，并进入详情处理 submitted / processing 状态申诉 |
| `/review-manager/projects/[projectId]/appeals/[appealId]` | `frontend/app/review-manager/projects/[projectId]/appeals/[appealId]/page.tsx` | 需要登录 + review_manager 角色 | implemented | 评审负责人申诉详情 / 处理页，查看关联合议摘要、附件并接受或驳回申诉 |
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

## 4. 专家 layout

- 壳组件：`frontend/src/components/layout/ExpertShell.tsx`
- 顶部栏显示平台名、当前用户、专家角色 Badge、返回工作台和退出登录
- 侧边栏提供“工作台首页”和“我的评审任务”入口，视觉基线与 AdminShell / ProjectOwnerShell 保持同一产品气质，但不复用管理员或项目负责人导航
- 守卫为 client component 守卫：
  - 未登录访问 `/expert/*`：跳转 `/login`
  - 已登录但无 expert 角色：显示 403 状态并提供返回工作台入口

## 5. 评审负责人 layout

- 壳组件：`frontend/src/components/layout/ReviewManagerShell.tsx`
- 顶部栏显示平台名、当前用户、评审负责人角色 Badge、返回工作台和退出登录
- 侧边栏提供“评审负责人首页”“负责项目”入口；“返回工作台”仅保留在顶部右侧，视觉基线与 AdminShell / ProjectOwnerShell / ExpertShell 保持同一产品气质，但不复用其他角色导航
- 守卫为 client component 守卫：
  - 未登录访问 `/review-manager/*`：跳转 `/login`
  - 已登录但无 review_manager 角色：显示 403 状态并提供返回工作台入口

## 6. 当前不包含的路由

- 不包含用户自助改密、忘记密码、短信验证码、用户批量导入、权限矩阵配置
- 不包含跨项目申诉总看板、甲方看板和腾讯会议直播 / 推流 / 回看 / API 集成相关页面
- 不包含文件预览、材料恢复或删除日志查询页面；管理员项目材料查看 / 下载 / 带原因删除已接入项目评审组织详情页，项目负责人材料上传草稿、提交评审、下载和 draft/legacy active 物理删除闭环已通过 portal `material_type` 启用
