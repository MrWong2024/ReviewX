# ReviewX 前端组件地图

## 1. Layout 组件

| 组件 | 文件 | 用途 |
| --- | --- | --- |
| `AdminShell` | `frontend/src/components/layout/AdminShell.tsx` | 管理员后台壳、顶部栏、侧边栏、前端守卫、修改密码、返回工作台和退出登录 |
| `ProjectOwnerShell` | `frontend/src/components/layout/ProjectOwnerShell.tsx` | 项目负责人工作台壳、顶部栏、侧边栏、project_owner 前端守卫、修改密码、返回工作台和退出登录 |
| `ExpertShell` | `frontend/src/components/layout/ExpertShell.tsx` | 专家工作台壳、顶部栏、侧边栏、expert 前端守卫、修改密码、返回工作台和退出登录 |
| `ReviewManagerShell` | `frontend/src/components/layout/ReviewManagerShell.tsx` | 评审负责人工作台壳、顶部栏、侧边栏、review_manager 前端守卫、修改密码、返回工作台和退出登录；侧边栏只保留评审负责人首页/负责项目，返回工作台仅保留在顶部右侧 |
| `ClientShell` | `frontend/src/components/layout/ClientShell.tsx` | 甲方监管看板壳、顶部栏、侧边栏、client 前端守卫、修改密码、返回工作台和退出登录；侧边栏只保留 `/client` 监管看板 |

## 2. UI 组件

| 组件 | 文件 | 用途 |
| --- | --- | --- |
| `Button` | `frontend/src/components/ui/Button.tsx` | 基础按钮，支持 primary/secondary/danger/ghost 与 `sm/md/lg` size |
| `FormField` | `frontend/src/components/ui/FormField.tsx` | 轻量字段外壳，统一 label、description、error 和说明区预留 |
| `Input` | `frontend/src/components/ui/Input.tsx` | 带 label 的输入框，默认固定 `h-10` |
| `Select` | `frontend/src/components/ui/Select.tsx` | 带 label 的下拉框，默认固定 `h-10` |
| `Textarea` | `frontend/src/components/ui/Textarea.tsx` | 带 label 的多行输入，复用统一字段布局 |
| `Modal` | `frontend/src/components/ui/Modal.tsx` | 基础弹窗；通过 React Portal 挂载到 `document.body`，使用视口级 fixed overlay、高 z-index、面板 `max-h-[90vh]`、body 滚动和可选 `size/bodyClassName/panelClassName` |
| `ConfirmDialog` | `frontend/src/components/ui/ConfirmDialog.tsx` | 确认弹窗 |
| `DataTable` | `frontend/src/components/ui/DataTable.tsx` | 简单数据表格 |
| `Pagination` | `frontend/src/components/ui/Pagination.tsx` | 简单分页控件 |
| `TreeList` | `frontend/src/components/ui/TreeList.tsx` | 树形缩进列表，用于树形字典展示；支持可选展开 / 收起控件 |
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
| `AuthProvider` | `frontend/src/features/auth/AuthProvider.tsx` | 当前用户状态、密码登录、短信验证码登录、登出、刷新会话和改密成功后更新当前用户 |
| `LoginPage` | `frontend/src/features/auth/LoginPage.tsx` | 登录页，支持密码登录 / 短信验证码登录切换、验证码发送提示和 60 秒倒计时；密码登录模式提供“忘记密码？”入口 |
| `ForgotPasswordPage` | `frontend/src/features/auth/ForgotPasswordPage.tsx` | 忘记密码 / 短信验证码找回密码页；手机号发送验证码、60 秒倒计时、新密码确认、重置成功提示返回登录；不自动登录 |
| `ChangePasswordPage` | `frontend/src/features/auth/ChangePasswordPage.tsx` | 当前用户自助修改本人密码页；要求登录，不要求具体角色；提交 `currentPassword/newPassword/confirmPassword`，成功后清空表单并刷新当前用户状态 |
| `WorkspacePage` | `frontend/src/features/auth/WorkspacePage.tsx` | 角色入口页；admin、client、project_owner、expert、review_manager 已开通角色可进入对应工作台，client 指向 `/client`；顶部提供“修改密码”入口 |
| `ClientDashboardPage` | `frontend/src/features/client/pages/ClientDashboardPage.tsx` | 甲方监管看板主页面，并发加载 overview、projects 和 portal reference-data；筛选提交重算 overview/projects，分页只重拉 projects，reference-data 失败降级 warning |
| `ClientDashboardFilters` | `frontend/src/features/client/components/ClientDashboardFilters.tsx` | 甲方看板筛选区，支持 keyword、批次、项目类型、状态、受理处室、学科、评审负责人、评审方案、最终等级、命中进度阶段、会议入口和 pending 申诉 |
| `ClientDashboardMetricCards` | `frontend/src/features/client/components/ClientDashboardMetricCards.tsx` | 甲方看板统计卡片，展示项目总览、资金拨付、专家提交率和申诉统计 |
| `ClientDashboardBreakdowns` | `frontend/src/features/client/components/ClientDashboardBreakdowns.tsx` | 甲方看板轻量 CSS 条形图分布，展示最终等级、进度阶段、项目类型、状态、受理处室和批次 |
| `ClientDashboardProjectTable` | `frontend/src/features/client/components/ClientDashboardProjectTable.tsx` | 甲方项目钻取列表，展示项目基础信息、主阶段、有效最终等级、专家/材料/申诉统计、评审现场 `meetingUrl` 外链和 details 行内摘要 |
| `BatchesPage` | `frontend/src/features/admin/pages/BatchesPage.tsx` | 批次管理 |
| `DictionariesPage` | `frontend/src/features/admin/pages/DictionariesPage.tsx` | 普通字典管理，字典类型固定为项目状态 / 材料类型 / 评审等级，默认加载项目状态，新增跟随当前类型，编辑不可修改 dictType |
| `TreeDictionariesPage` | `frontend/src/features/admin/pages/TreeDictionariesPage.tsx` | 树形字典管理，顶部树类型筛选控制维护范围，默认仅展示第一层，维护展开状态并支持逐层展开 / 收起；新增 / 编辑弹窗父节点下拉默认仅列一级节点，可勾选显示全部层级，空父节点文案明确为作为一级节点，父节点 option 使用统一 `treeOptionLabel` 缩进；列表行内展示编码、排序和全称，不重复显示树类型 |
| `OrganizationsPage` | `frontend/src/features/admin/pages/OrganizationsPage.tsx` | 单位管理，行政区划筛选和新增 / 编辑弹窗行政区划 select 使用统一 `treeOptionLabel` 缩进 |
| `ReviewSchemesPage` | `frontend/src/features/admin/pages/ReviewSchemesPage.tsx` | 评审方案管理 |
| `ProjectsPage` | `frontend/src/features/admin/pages/ProjectsPage.tsx` | 管理员项目评审组织列表，支持筛选、选择、单项目分配、批量分配、批量设置专家和详情入口；项目类型 select 使用统一 `treeOptionLabel` 缩进 |
| `UsersPage` | `frontend/src/features/admin/pages/UsersPage.tsx` | 管理员用户管理，支持列表、筛选、分页、新增、编辑、启停和重置密码 |
| `ProjectReviewOrganizationPage` | `frontend/src/features/admin/pages/ProjectReviewOrganizationPage.tsx` | 单项目评审组织详情，展示基础信息、评审分配、评审安排、项目材料、已分配专家和专家候选 |
| `ReviewAssignmentModal` | `frontend/src/features/admin/components/project-review-organization/ReviewAssignmentModal.tsx` | 单项目设置评审负责人和评审方案 |
| `BatchReviewAssignmentModal` | `frontend/src/features/admin/components/project-review-organization/BatchReviewAssignmentModal.tsx` | 多项目批量设置评审负责人和评审方案，并展示成功 / 失败明细 |
| `ProjectSchedulePanel` | `frontend/src/features/admin/components/project-review-organization/ProjectSchedulePanel.tsx` | 设置单项目评审时间、地点和会议链接；明确仅保存会议链接字段 |
| `AdminProjectMaterialsCard` | `frontend/src/features/admin/components/project-review-organization/AdminProjectMaterialsCard.tsx` | 管理员项目材料卡片，独立加载材料列表，展示状态 / 类型 / 上传人 / 时间 / 大小 / 备注，上传人优先使用材料响应内联用户，其次复用页面已加载 users 映射，支持下载、刷新和打开删除原因弹窗 |
| `AdminProjectMaterialDeleteModal` | `frontend/src/features/admin/components/project-review-organization/AdminProjectMaterialDeleteModal.tsx` | 管理员删除项目材料弹窗，要求填写 1-1000 字删除原因，说明物理删除且后端保留删除审计；使用通用 Portal Modal 避免父级层叠上下文遮挡，长文件名换行，提交中禁用重复操作 |
| `AdminProjectMaterialStatusBadge` | `frontend/src/features/admin/components/project-review-organization/AdminProjectMaterialStatusBadge.tsx` | 管理员材料状态标签，显示草稿 / 已提交评审 / 历史草稿 / 已删除 / 未知状态及说明 |
| `AssignedExpertsPanel` | `frontend/src/features/admin/components/project-review-organization/AssignedExpertsPanel.tsx` | 查看已分配专家，展示评分状态；专家名单锁定时显示锁定原因并禁用移除 |
| `ExpertCandidatesPanel` | `frontend/src/features/admin/components/project-review-organization/ExpertCandidatesPanel.tsx` | 查看后端候选专家，按 keyword 搜索分页，从候选追加或替换专家；专家名单锁定时显示锁定原因并禁用追加 / 替换 |
| `BatchExpertsModal` | `frontend/src/features/admin/components/project-review-organization/BatchExpertsModal.tsx` | 多项目批量追加或替换专家，提交后展示逐项目结果 |
| `ProjectImportsPage` | `frontend/src/features/admin/pages/ProjectImportsPage.tsx` | 管理员 Excel 项目导入上传、任务筛选、任务列表、分页和未确认导入任务删除 |
| `ProjectImportDetailPage` | `frontend/src/features/admin/pages/ProjectImportDetailPage.tsx` | 项目导入任务详情、行筛选、Excel 行号列表、人工修正、单行确认/跳过和批量确认 |
| `ProjectImportJobStats` | `frontend/src/features/admin/components/project-imports/ProjectImportJobStats.tsx` | 导入任务统计卡片 |
| `ProjectImportIssueList` | `frontend/src/features/admin/components/project-imports/ProjectImportIssueList.tsx` | 导入行 issue 中文展示和候选项采用按钮 |
| `ProjectImportRowModal` | `frontend/src/features/admin/components/project-imports/ProjectImportRowModal.tsx` | 导入行 raw / normalized / resolved / issues 展示与人工修正表单；项目类型、受理处室和创建新单位行政区划 select 使用统一 `treeOptionLabel` 缩进；标题使用 Excel 原始行号 |
| `ProjectImportFieldMappingsPage` | `frontend/src/features/admin/pages/ProjectImportFieldMappingsPage.tsx` | 管理员 Excel 字段映射配置页，支持标准字段配置视图、keyword / isActive 筛选、编辑、启停、删除配置和重置默认 |
| `FieldMappingEditorModal` | `frontend/src/features/admin/components/project-import-field-mappings/FieldMappingEditorModal.tsx` | 字段映射编辑弹窗，展示标准字段、默认别名，编辑自定义别名、启用状态和备注 |
| `AliasChips` | `frontend/src/features/admin/components/project-import-field-mappings/AliasChips.tsx` | 字段映射别名 chips 展示，限制表格宽度并显示剩余数量 |
| `ProjectOwnerDashboardPage` | `frontend/src/features/project-owner/pages/ProjectOwnerDashboardPage.tsx` | 项目负责人概览，读取本人第一页项目，展示轻量统计、最近项目和我的项目入口 |
| `ProjectOwnerProjectsPage` | `frontend/src/features/project-owner/pages/ProjectOwnerProjectsPage.tsx` | 项目负责人我的项目列表，加载 portal reference-data，支持后端分页、名称映射和 `batchId/statusId/projectTypeId/reviewManagerId/reviewSchemeId` select 筛选；项目类型 select 使用统一 `treeOptionLabel` 缩进 |
| `ProjectOwnerProjectDetailPage` | `frontend/src/features/project-owner/pages/ProjectOwnerProjectDetailPage.tsx` | 项目负责人项目详情，并发加载项目、材料、confirmed 合议状态和 portal reference-data，串联基础信息、评审安排、后续推进需求、材料上传、草稿统计、提交全部草稿材料和提交后刷新；根据 `ownerContentLocked/reviewFinalized/finalLevel/originalLevel/confirmed consensus` 计算项目负责人内容只读锁定态 |
| `ProjectOwnerProjectInfoPanel` | `frontend/src/features/project-owner/components/ProjectOwnerProjectInfoPanel.tsx` | 使用 lookup maps 展示批次、项目类型、项目状态、单位、学科、受理处室、评审负责人、评审方案、评审时间、地点和会议链接；评审负责人优先展示项目响应 `reviewManager.name`，无法解析时显示业务文案，不显示负责人短 ID |
| `FollowUpNeedsPanel` | `frontend/src/features/project-owner/components/FollowUpNeedsPanel.tsx` | 填写和保存项目后续推进需求，前端限制 5000 字，调用 project_owner follow-up-needs 接口；支持 `locked/lockedMessage`，锁定时 textarea 禁用、保存按钮隐藏并显示统一锁定提示 |
| `MaterialUploadPanel` | `frontend/src/features/project-owner/components/MaterialUploadPanel.tsx` | 使用 portal active `material_type` 选项启用材料上传，保留文件数量 / 大小 / 扩展名校验、FormData 上传和 successCount / failedCount / failures 展示；上传成功提示新材料为草稿，提交前评审负责人和专家不可见；支持锁定态，锁定时不渲染上传表单并显示统一提示 |
| `MaterialListPanel` | `frontend/src/features/project-owner/components/MaterialListPanel.tsx` | 展示项目材料列表，按 portal `material_type` 生成筛选项，材料类型名称优先使用响应摘要，其次使用 lookup map；显示材料状态 Badge，支持签名 URL 下载，`draft/legacy active` 可物理删除，`submitted` 删除禁用并映射 409 友好提示；支持锁定态，锁定时禁用删除但保留筛选和下载 |
| `ExpertHomePage` | `frontend/src/features/expert/pages/ExpertHomePage.tsx` | 专家工作台首页，展示专家评审流程提示和“我的评审任务”入口 |
| `ExpertReviewTasksPage` | `frontend/src/features/expert/pages/ExpertReviewTasksPage.tsx` | 专家评审任务列表，并发加载任务和 portal reference-data，支持状态 / 批次 / 评审负责人 / 评审方案筛选、分页、刷新；评审负责人显示优先使用任务响应内联 `project.reviewManager`，再 fallback 到 reference-data 映射和短 ID |
| `ExpertReviewTaskDetailPage` | `frontend/src/features/expert/pages/ExpertReviewTaskDetailPage.tsx` | 专家评审任务详情，并发加载任务详情、submitted 材料和 portal reference-data，串联项目资料、材料下载和评分表单；根据 `project.reviewTime` 计算评审未开始提交禁用提示 |
| `ExpertTaskStatusBadge` | `frontend/src/features/expert/components/ExpertTaskStatusBadge.tsx` | 专家评分状态标签，显示未开始、草稿、已提交和已退回及说明 |
| `ExpertProjectInfoPanel` | `frontend/src/features/expert/components/ExpertProjectInfoPanel.tsx` | 使用 lookup maps 展示项目编号、项目名称、批次、项目状态、评审负责人、评审方案、评审时间、地点、会议链接和后续推进需求；评审负责人优先展示详情响应内联 `project.reviewManager` |
| `ExpertMaterialsPanel` | `frontend/src/features/expert/components/ExpertMaterialsPanel.tsx` | 展示专家可见 submitted 材料列表，支持调用专家材料 download-url 获取签名 URL 下载；不提供删除、上传或预览 |
| `ExpertReviewForm` | `frontend/src/features/expert/components/ExpertReviewForm.tsx` | 管理专家评分表单状态、实时总分、草稿保存校验、draft 删除草稿按钮与二次确认、提交校验、提交二次确认、评审未开始时禁用提交但保留保存草稿和删除草稿、submitted 只读和 returned 重提提示 |
| `ExpertReviewItemEditor` | `frontend/src/features/expert/components/ExpertReviewItemEditor.tsx` | 单个评分项编辑器，提供 score、评价描述、改进建议、重大问题 checkbox、评分说明和低分 / 重大问题提示 |
| `ReviewManagerHomePage` | `frontend/src/features/review-manager/pages/ReviewManagerHomePage.tsx` | 评审负责人工作台首页，提供负责项目、专家评分、评分汇总和合议确认入口 |
| `ReviewManagerProjectsPage` | `frontend/src/features/review-manager/pages/ReviewManagerProjectsPage.tsx` | 评审负责人负责项目列表，加载 `/review-manager/projects` 和 portal reference-data，支持 keyword、批次、项目状态、评审方案筛选、分页，并提供项目总览 / 评审组织 / 合议处理入口 |
| `ReviewManagerProjectOverviewPage` | `frontend/src/features/review-manager/pages/ReviewManagerProjectOverviewPage.tsx` | 评审负责人项目总览 / 工作入口页，加载项目摘要、专家数量、评分汇总和合议状态，项目摘要可访问时提供进入评审组织 / 合议处理 / 申诉处理的入口；摘要不可用或无权限时只显示错误态，不展示项目内入口 |
| `ReviewManagerProjectReviewOrganizationPage` | `frontend/src/features/review-manager/pages/ReviewManagerProjectReviewOrganizationPage.tsx` | 评审负责人评审前组织页，加载项目摘要、portal reference-data 和合议锁定状态，串联评审安排、submitted 材料只读下载、已分配专家、候选专家和专家名单锁定态 |
| `ReviewManagerProjectConsensusPage` | `frontend/src/features/review-manager/pages/ReviewManagerProjectConsensusPage.tsx` | 评审负责人合议页 route wrapper，复用 `ReviewManagerProjectDetailPage` 承载专家评分、退回、汇总和合议确认 |
| `ReviewManagerProjectDetailPage` | `frontend/src/features/review-manager/pages/ReviewManagerProjectDetailPage.tsx` | 评审负责人项目合议详情页，独立加载项目摘要、专家评分列表 / 详情、评分汇总和合议记录，串联退回、生成草稿和确认合议；项目摘要不可用或无权限时只显示摘要错误和返回列表，不展示专家评分 / 汇总 / 合议操作；confirmed 合议状态下专家评分仅可查看，不显示退回入口；不包含专家分配和评审安排表单 |
| `ReviewManagerProjectStatusBadge` | `frontend/src/features/review-manager/components/ReviewManagerProjectStatusBadge.tsx` | 评审负责人专家评分状态标签，显示未开始、草稿、已提交和已退回 |
| `ReviewManagerScheduleForm` | `frontend/src/features/review-manager/components/ReviewManagerScheduleForm.tsx` | 评审负责人维护自己负责项目的评审时间、地点和会议链接，调用 `/review-manager/projects/:id/schedule`，不接腾讯会议 API |
| `ReviewManagerProjectMaterialsPanel` | `frontend/src/features/review-manager/components/ReviewManagerProjectMaterialsPanel.tsx` | 评审负责人只读查看 submitted 项目材料并通过 review-manager download-url 下载；不提供上传、删除或预览 |
| `ReviewManagerExpertAssignmentsPanel` | `frontend/src/features/review-manager/components/ReviewManagerExpertAssignmentsPanel.tsx` | 评审负责人评审组织页专家分配面板，调用 review-manager 命名空间查看已分配专家和候选专家，支持 keyword 搜索、分页、多选、追加、替换和移除；专家名单锁定时显示原因并禁用 mutation |
| `ReviewManagerExpertReviewsPanel` | `frontend/src/features/review-manager/components/ReviewManagerExpertReviewsPanel.tsx` | 专家评分列表面板，展示专家、单位、状态、总分、提交 / 退回时间；submitted 状态默认提供退回入口；支持 `returnDisabled` 只读态，confirmed 合议页用它隐藏退回入口并显示“专家评分仅可查看”说明 |
| `ReviewManagerExpertReviewDetailModal` | `frontend/src/features/review-manager/components/ReviewManagerExpertReviewDetailModal.tsx` | 专家评分详情弹窗，展示专家信息、评分方案快照、评分项明细、退回原因和 not_started 空态；评分项“重大问题”在标题行以紧凑 Badge 展示，评价描述和改进建议保留大宽度正文 |
| `ReturnExpertReviewModal` | `frontend/src/features/review-manager/components/ReturnExpertReviewModal.tsx` | 退回专家评分弹窗，校验 1-1000 字退回原因，提交前二次确认，提交中禁用重复操作 |
| `ReviewSummaryPanel` | `frontend/src/features/review-manager/components/ReviewSummaryPanel.tsx` | 专家评分汇总面板，只读展示专家数量统计、平均分 / 最高分 / 最低分和各评分项平均分 |
| `ConsensusReviewPanel` | `frontend/src/features/review-manager/components/ConsensusReviewPanel.tsx` | 合议草稿与最终确认面板，处理 404 空态、规则汇总草稿生成、draft force 覆盖确认和未确认状态最终确认表单；confirmed 状态只读展示最终意见、最终分数、最终等级、确认人和确认时间，不显示“使用草稿填入”、确认表单或“重新确认最终结论”按钮，状态正文使用中文“草稿 / 已确认”而不显示原始状态码；确认提交只发送 `finalOpinion/finalScore/finalLevel`，“使用草稿填入”仅填充表单，不再显示 `useDraftAsBase` 复选框；确认人显示优先使用 `confirmedByUser.name`，有手机号显示“姓名（手机号）”，摘要缺失但有 `confirmedByUserId` 时显示“确认人信息暂不可用”，不显示短 ID |
| `AppealStatusBadge` | `frontend/src/components/project-appeals/AppealStatusBadge.tsx` | 申诉状态标签，按后端 `submitted/processing/accepted/rejected/canceled` 状态展示 |
| `AppealListPanel` | `frontend/src/components/project-appeals/AppealListPanel.tsx` | 通用项目申诉列表组件，展示申诉状态、等级变化、附件数、处理意见和详情入口；详情链接由调用方传入 |
| `AppealDetailPanel` | `frontend/src/components/project-appeals/AppealDetailPanel.tsx` | 通用申诉详情组件，展示申诉说明、处理结果、等级变化和关联合议摘要；project-owner 可传入独立 confirmed 合议摘要 |
| `AppealAttachmentsPanel` | `frontend/src/components/project-appeals/AppealAttachmentsPanel.tsx` | 通用申诉附件组件，下载通过调用方 action 获取 download-url；支持 `canUpload/onUpload` 与 `canDelete/onDelete` 分离，project-owner 申诉详情页 submitted 状态只启用补充上传，不传删除回调 |
| `AppealHandleForm` | `frontend/src/components/project-appeals/AppealHandleForm.tsx` | 通用申诉处理表单，提交 `decision/handlingOpinion/newFinalLevel`；accepted 且调整等级时二次确认明确提示等级调整 |
| `LevelHistoryPanel` | `frontend/src/components/project-appeals/LevelHistoryPanel.tsx` | 等级变更历史展示组件，展示 from/to 等级、来源、原因、操作人和时间；操作人优先显示 `changedByUser` 姓名 / 姓名（手机号），摘要缺失显示“操作人信息暂不可用”，不显示用户短 ID；可选 `getAppealHref` 显示“查看关联申诉”，不显示申诉短 ID |
| `ProjectOwnerCreateAppealDialog` | `frontend/src/components/project-appeals/ProjectOwnerCreateAppealDialog.tsx` | 项目负责人发起申诉弹窗，展示申诉规则、校验 reason、可选附件并在提交前二次确认 |
| `ProjectOwnerReviewResultPage` | `frontend/src/features/project-owner/pages/ProjectOwnerReviewResultPage.tsx` | 项目负责人评审结果与申诉页，加载项目详情、confirmed 合议、等级历史、本人申诉列表和 reference-data，可发起申诉；最终等级展示和发起申诉禁用判断统一使用 `effectiveFinalLevel = project.finalLevel ?? consensus.finalLevel` |
| `ProjectOwnerAppealDetailPage` | `frontend/src/features/project-owner/pages/ProjectOwnerAppealDetailPage.tsx` | 项目负责人申诉详情页，查看处理结果和附件，submitted 状态可继续补充上传申诉附件；已上传附件作为留痕不可删除，不显示删除按钮，不调用删除接口 |
| `ReviewManagerProjectAppealsPage` | `frontend/src/features/review-manager/pages/ReviewManagerProjectAppealsPage.tsx` | 评审负责人项目申诉列表页，只调用 review-manager 命名空间申诉接口 |
| `ReviewManagerProjectAppealDetailPage` | `frontend/src/features/review-manager/pages/ReviewManagerProjectAppealDetailPage.tsx` | 评审负责人申诉详情 / 处理页，查看附件并处理 submitted / processing 申诉 |
| `ProjectAdminAppealsPage` | `frontend/src/features/admin/pages/ProjectAdminAppealsPage.tsx` | 管理员项目申诉列表页，展示项目申诉和等级变更历史 |
| `ProjectAdminAppealDetailPage` | `frontend/src/features/admin/pages/ProjectAdminAppealDetailPage.tsx` | 管理员申诉详情 / 处理页，使用 admin 命名空间查看附件、处理申诉并刷新等级历史 |

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
| project review organization labels | `frontend/src/lib/labels/project-review-organization-labels.ts` | 项目组织状态和专家失败原因中文展示辅助 |
| tree utils | `frontend/src/lib/tree/build-tree.ts` | 平铺树数据构建、展平、列表缩进标签和 select option 专用 `treeOptionLabel`；原生 select/option 树形层级统一用全角空格、层级符号和空名称兜底 |
| project review organization API | `frontend/src/features/admin/api/project-review-organization.ts` | 管理员项目评审组织详情、专家候选 / 分配，以及项目材料列表 / 下载 URL / 带原因删除 API 封装；材料删除只调用 admin 材料接口 |
| project review organization types | `frontend/src/features/admin/types/project-review-organization.ts` | 管理员项目评审组织、专家候选 / 分配、已分配专家评分状态标记，以及 admin 项目材料状态、材料、下载 URL 和删除结果类型 |
| project-owner API | `frontend/src/features/project-owner/api.ts` | 项目负责人项目、后续推进需求、材料列表 / 上传 / 提交 / 下载 URL / 删除，以及 `/portal/reference-data/*` 只读数据 API 封装；不调用 admin-only 字典接口或 admin 材料删除接口 |
| project-owner types | `frontend/src/features/project-owner/types.ts` | 项目负责人项目、`reviewManager` 摘要、`ownerContentLocked`、材料、`draft/submitted/active/deleted` 状态、提交结果、上传结果、删除结果、下载 URL、查询参数、portal reference-data 摘要和 lookup map 类型 |
| project-owner utils | `frontend/src/features/project-owner/utils.ts` | 材料文件大小、扩展名、数量校验、文件大小格式化、材料状态展示 / 可提交 / 可删除判断、项目负责人内容锁定判断、`PROJECT_OWNER_CONTENT_LOCKED` 错误文案、评审负责人显示优先级、skipped reason 中文化、reference-data lookup map 构造和“未知项（短ID）”名称兜底展示辅助 |
| expert API | `frontend/src/features/expert/api.ts` | 专家评分任务、专家材料列表 / 下载 URL、删除本人 draft 草稿，以及 `/portal/reference-data/*` 只读数据 API 封装；不调用 admin / project_owner / review_manager 材料接口 |
| expert types | `frontend/src/features/expert/types.ts` | 专家任务、任务详情、评分方案快照、评分项、专家材料、保存 / 提交输入、portal reference-data 摘要、lookup map 类型和 `ExpertReviewManagerSummary` |
| expert utils | `frontend/src/features/expert/utils.ts` | 专家评分状态文案、操作文案、draft 草稿可删除判断、`reviewTime` 未开始判断、score 范围校验、低分 / 重大问题改进建议必填判断、实时总分、文件大小格式化、lookup map 构造、评审负责人显示优先级和专家错误文案映射 |
| review-manager API | `frontend/src/features/review-manager/api.ts` | 评审负责人项目列表、项目摘要适配、评审安排、submitted 材料列表 / 下载 URL、专家分配、专家评分列表 / 详情 / 退回、评分汇总、合议草稿 / 确认，以及 `/portal/reference-data/*` 只读数据 API 封装；`GET /consensus` 404 转 `null` |
| review-manager types | `frontend/src/features/review-manager/types.ts` | 评审负责人项目、评审安排 payload、材料、专家分配、专家评分、评分方案快照、评分汇总、合议记录、确认 payload、portal reference-data 摘要和 lookup map 类型；确认 payload 不含 `useDraftAsBase` |
| review-manager utils | `frontend/src/features/review-manager/utils.ts` | 专家评分状态文案、退回 / 确认长度限制、score 格式化和解析、review_level 兜底、lookup map 构造、合议冲突识别和错误文案映射；识别 `CONSENSUS_ALREADY_CONFIRMED` 用于 confirmed 合议只读回退 |
| client API | `frontend/src/features/client/api.ts` | 甲方看板 overview / projects 只读 API 封装，以及本角色局部 `/portal/reference-data/*` 名称映射聚合；不查询 admin 用户 |
| client types | `frontend/src/features/client/types.ts` | 甲方看板过滤、overview、项目钻取、进度阶段、有效最终等级来源、portal reference-data 和 lookup map 类型；日期字段按 string/null 建模 |
| client utils | `frontend/src/features/client/utils.ts` | 甲方看板日期、万元、百分比、短 ID、名称映射、人员兜底、进度阶段、等级来源、合议和申诉状态展示辅助 |
| expert assignment lock helper | `frontend/src/lib/project-review/expert-assignment-lock.ts` | admin 与 review-manager 共用的专家名单锁定原因计算、文案格式化和 `EXPERT_ASSIGNMENT_LOCKED` 错误识别工具 |
| project appeals types | `frontend/src/lib/project-appeals/types.ts` | 三端申诉前端共享类型，覆盖申诉、申诉详情、附件、等级变更历史、创建 / 上传 / 处理输入和下载 URL 响应；`ProjectLevelChangeLog` 支持 `changedByUser?: UserSummary | null` |
| project appeals utils | `frontend/src/lib/project-appeals/utils.ts` | 申诉状态、处理权限、附件变更权限、等级展示、下载 URL 解析、错误文案、附件文件校验和 review_level 兜底工具 |
| admin project appeals API | `frontend/src/features/admin/api/project-appeals.ts` | 管理员项目申诉列表 / 详情 / 附件 / 下载 URL / 处理 / 等级历史 API 封装，只使用 `/admin/projects/:id` 命名空间 |

## 6. 当前 UI 基线

- 已启用 Tailwind CSS 4
- 基础组件已统一为深靛蓝到青蓝渐变主按钮、浅底 secondary、轻量 ghost、低饱和 danger
- Button size 体系为 `sm/md/lg`；表格行内操作、树节点行内操作和分页按钮使用 `sm`
- Input / Select 基础高度统一为 `h-10`，Textarea 统一字号、圆角、边框和 focus ring
- 表格、分页、空状态、错误提示、加载态、Modal、ConfirmDialog 已同步现代化样式
- `AdminShell` 已升级为深海军蓝 / 墨蓝 / 靛蓝渐变侧栏、胶囊选中态、顶部用户与角色 Badge、返回工作台入口、退出登录和浅灰蓝内容背景
- 页面仍保留少量语义 class（如 `page-title`、`toolbar`、`panel`、`form-stack`），由全局 CSS 通过 Tailwind `@apply` 统一承载
- `.grid-2` / `.grid-3` 使用 `items-start` 保持同行字段顶部对齐；字典和树形字典表单通过说明区预留避免“名称 / 编码”高度错位
- 单位行政区划选择只使用 `treeType=administrative_division` 的缩进树选项；无数据时提示先在树形字典中维护行政区划
