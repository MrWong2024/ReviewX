# ReviewX 前端变更记录

## 2026-06-24

### ReviewX 第七阶段小修：项目负责人申诉前置等级口径修正

- 项目负责人评审结果页 `/project-owner/projects/[projectId]/review-result` 新增有效最终等级口径：`effectiveFinalLevel = project.finalLevel ?? consensus.finalLevel`
- “已确认合议结果”区域最终等级展示、发起申诉按钮禁用判断和禁用提示统一使用 `effectiveFinalLevel`，避免已确认合议能展示等级但申诉区域提示“项目尚无最终等级”
- 后端 `ProjectAppealsService.createOwnerAppeal()` 同步使用 `project.finalLevel ?? confirmedConsensus.finalLevel`；当 `Project.finalLevel` 缺失但 confirmed 合议有 `finalLevel` 时允许创建申诉，并懒回填 `projects.finalLevel/originalLevel`
- 后端 `handleAppeal()` 对历史数据兜底读取项目等级、申诉关联合议等级或 `appeal.levelBeforeAppeal`；懒回填不写等级变更日志，只有申诉处理导致等级变化时继续写 `ProjectLevelChangeLog(source=appeal_handling)`
- 本小修未新增接口，未改申诉次数上限、未处理申诉互斥、附件规则、权限规则、合议确认写回、专家分配锁定、package / lock / env，也未实现第八阶段甲方看板
- 本次验证：frontend `npm run lint`、`npm run typecheck`、`npm run build` 通过；backend `npm run lint`、`npm run build`、`npm run test -- --runInBand`、`npm run test:e2e` 通过；定向 e2e `npx jest --config ./test/jest-e2e.json --runInBand --runTestsByPath test/project-appeals.e2e-spec.ts` 通过

### ReviewX 前端第七阶段：申诉闭环前端

- 新增项目负责人评审结果与申诉入口：`/project-owner/projects/[projectId]/review-result`，展示 confirmed 合议、最终等级、等级变更历史和本人申诉列表
- 新增项目负责人申诉详情：`/project-owner/projects/[projectId]/appeals/[appealId]`，支持查看处理状态、附件下载，并在 submitted 状态上传 / 删除附件
- 新增评审负责人申诉列表与详情：`/review-manager/projects/[projectId]/appeals`、`/review-manager/projects/[projectId]/appeals/[appealId]`，只调用 review-manager 命名空间，支持附件只读下载和 accepted / rejected 处理
- 新增管理员申诉列表与详情：`/admin/projects/[projectId]/appeals`、`/admin/projects/[projectId]/appeals/[appealId]`，只调用 admin 命名空间，展示等级历史并支持 accepted / rejected 处理
- 新增共享申诉类型、工具函数和组件：状态 Badge、申诉列表、申诉详情、附件面板、处理表单、等级历史面板和项目负责人提交申诉弹窗
- 项目负责人提交申诉按 confirmed 合议、finalLevel、最多 3 次、无 submitted / processing 申诉做体验层限制；最终约束以后端为准
- 申诉附件下载只打开各角色命名空间 `download-url` 返回 URL，不前端拼接 OSS objectKey；项目负责人仅 submitted 状态可上传 / 删除附件
- 申诉处理 accepted 必须选择新最终等级，rejected 不提交 `newFinalLevel`；处理成功后重新拉取后端权威数据
- 本阶段未修改 backend，未新增依赖，未新增环境变量，未修改 `package.json` 或锁文件，未实现甲方看板、腾讯会议、真实 AI 或文件预览
- 本次验证：`frontend` 下 `npm run lint`、`npm run typecheck`、`npm run build` 均通过

### ReviewX 第六阶段小修 2：评审负责人评审组织页独立、合议页拆分与专家分配时点锁定

- 后端 `ProjectExpertAssignmentsService` 对 admin 和 review_manager 专家分配 mutation 统一增加项目级锁定：`reviewTime` 已到、已有任一 `ExpertReview`、已有任一 `ConsensusReview`、已有 `finalLevel/originalLevel` 时返回 `409 EXPERT_ASSIGNMENT_LOCKED`
- `EXPERT_ASSIGNMENT_LOCKED` 响应包含 `message/code/reasons`，全局异常过滤器保留 `reasons` 字段；GET 候选专家、GET 已分配专家和材料读取不受锁定影响
- `/review-manager/projects/[projectId]` 调整为项目总览 / 工作入口页，不再混放专家分配表格和合议确认表单
- 新增 `/review-manager/projects/[projectId]/review-organization`，承载评审前组织：评审安排、submitted 材料只读下载、已分配专家、候选专家、追加、替换和移除
- 新增 `/review-manager/projects/[projectId]/consensus`，承载评审后合议：专家评分列表 / 详情、退回、评分汇总、合议草稿和最终确认
- 评审负责人评审组织页只调用 review-manager 命名空间的 schedule、materials 和 experts 接口；不提供更换评审负责人 / 评审方案、材料删除、全局项目管理或 admin 接口穿透
- 管理员评审组织页和评审负责人评审组织页共用前端专家名单锁定 helper，锁定时展示具体原因并禁用追加 / 替换 / 移除
- review-manager reference-data 增加 `material_type` 和 `review_manager` 用户摘要读取，用于材料类型和评审负责人名称映射
- 本小修未新增依赖、环境变量，未修改 `package.json` 或锁文件，未实现申诉前端、甲方看板、腾讯会议、真实 AI 或文件预览
- 本次验证：backend `npm run lint`、`npm run test -- --runInBand`、`npm run test:e2e`、`npm run build` 通过；backend `npm run test` 并行模式因既有测试库互扰失败；frontend `npm run lint`、`npm run typecheck`、`npm run build` 通过

### ReviewX 第六阶段小修：评审负责人工作台权限收紧、专家分配接入与合议确认表单清理

- 后端 `/review-manager/projects` 收紧为当前登录用户作为 `reviewManagerId` 的项目；admin + review_manager 多角色用户在 review-manager 命名空间也只看自己负责项目，admin 全局项目视角继续走 `/admin/projects`
- 后端专家分配 service 增加明确 scope，review-manager 专家分配接口只允许当前负责人项目，admin 专家分配接口补齐 `/admin/projects/:id/experts*` 和 `/admin/projects/experts/batch`
- 管理员评审组织前端 API 已切换到 `/admin` 专家分配命名空间，不再依赖 `/review-manager` 专家接口
- `ReviewManagerShell` 左侧导航删除“返回工作台”，顶部右侧“返回工作台”入口保留
- 评审负责人项目详情新增 `ReviewManagerExpertAssignmentsPanel`，支持查看已分配专家、搜索候选专家、追加到当前专家名单、用选中专家替换当前名单、移除无评分记录专家；成功后重新拉取专家分配、专家评分、汇总和合议数据
- 管理员和评审负责人专家候选面板按钮文案改为“追加到当前专家名单”和“用选中专家替换当前名单”；替换确认明确提示未选中的原专家会被移除，已产生评分记录的专家不能被移除
- 专家评分详情弹窗中“重大问题”改为评分项标题行紧凑 Badge，打分说明、评价描述和改进建议保留正文展示
- 合议确认清理 `useDraftAsBase`：后端 DTO 删除字段，前端 payload 类型删除字段，`ConsensusReviewPanel` 删除“本次确认以当前草稿为基础”复选框；“使用草稿填入”仅把草稿内容填入表单
- 本小修未新增依赖、环境变量，未修改 `package.json` 或锁文件，未新增申诉前端、甲方看板、腾讯会议、真实 AI 或文件预览

### ReviewX 前端第六阶段：评审负责人合议工作台

- `/workspace` 放开 `review_manager` 角色入口，点击进入 `/review-manager`；只有 admin 角色的用户不会被默认引导到评审负责人工作台
- 新增 `ReviewManagerShell`，提供 review_manager 登录态 / 角色守卫、评审负责人首页 / 负责项目导航、返回工作台和退出登录
- 新增 `/review-manager`、`/review-manager/projects`、`/review-manager/projects/[projectId]` 三个 app route，route 文件保持薄封装
- 新增 `frontend/src/features/review-manager` 领域目录，包含 API、类型、工具函数、页面和专家评分 / 汇总 / 合议组件
- 项目列表调用 `GET /review-manager/projects`，支持 keyword、批次、项目状态、评审方案筛选和分页，并通过 portal reference-data 做名称映射
- 项目详情摘要未调用不存在的 `GET /review-manager/projects/:id`，也未调用 admin 项目详情接口；当前按 `GET /review-manager/projects?page=1&pageSize=1000` 后前端匹配 `projectId`
- 项目详情独立加载项目摘要、专家评分列表、专家评分详情、评分汇总和合议记录；项目摘要不可用时不阻塞其他区域
- 专家评分列表 / 详情调用 `/review-manager/projects/:projectId/expert-reviews*`，`not_started` 初始化记录显示“该专家尚未开始评分”
- 仅 submitted 状态显示“退回”入口；退回原因 trim 后校验 1-1000 字，提交前二次确认，成功后刷新专家列表、评分汇总和当前详情
- 评分汇总调用 `GET /review-manager/projects/:projectId/review-summary`，只读展示后端汇总；average/min/max 为空显示“暂无”，perItemAverageScores 为空显示空态
- 合议记录调用 `GET /review-manager/projects/:projectId/consensus`，404 转为“暂无合议草稿”，不作为页面级错误
- 生成合议草稿调用 `POST /review-manager/projects/:projectId/consensus/draft`，默认不传 force；已有 draft 时按后端 409 提示二次确认后 `force=true` 覆盖；confirmed 不提供覆盖草稿入口
- 人工确认合议调用 `POST /review-manager/projects/:projectId/consensus/confirm`，校验 finalOpinion、finalScore、finalLevel；`review_level` 为空时使用 A/B/C/D 兜底；confirmed 再次提交前提示会覆盖当前最终结论
- 本阶段未修改 backend，未新增后端接口，未新增依赖，未新增环境变量，未修改 `package.json` 或锁文件
- 本阶段未实现申诉、甲方看板、腾讯会议、真实 AI、文件预览、材料上传 / 删除、批量退回或批量合议
- 本次验证：`frontend` 下 `npm run lint`、`npm run typecheck`、`npm run build` 均通过

## 2026-06-23

### ReviewX 小修：专家分配移除规则收紧为无评分记录才可物理删除

- 后端 `ProjectExpertAssignmentsService` 注入 `ExpertReviewModel`，单个移除和 replace 隐含移除前批量检查 `expert_reviews(projectId, expertUserId)`
- 无评分记录专家移除时物理删除 `project_expert_assignments`；存在任意 `draft/submitted/returned` 评分记录时返回 `409 EXPERT_ASSIGNMENT_HAS_REVIEW_RECORD`，不删除 assignment，不删除 `expert_reviews`，不新写 `status=removed`
- `replaceExperts` 在任一待移除专家已有评分记录时整体拒绝，避免先删后增的部分更新；batch replace 按项目继承该规则，其他项目不受影响
- `GET /review-manager/projects/:id/experts` 为已分配专家返回 `hasReviewRecord/reviewStatus`，不返回评分内容、分数或提交/退回留痕
- 前端 `AssignedExpertsPanel` 展示评分状态；有评分记录专家禁用“移除”并提示不能移除；确认文案说明仅未产生评分记录的专家可移除且移除会删除专家分配记录
- 前端 `ExpertCandidatesPanel` 对替换时的 `409 EXPERT_ASSIGNMENT_HAS_REVIEW_RECORD` 展示“部分已分配专家已产生评分记录，不能被替换移除。”；追加逻辑不变
- 本小修未新增依赖、环境变量，未修改 `package.json` 或锁文件，未删除 `expert_reviews`，未新增 deleted 状态，未实现作废/替换/纠错流程、合议、AI 合议、申诉、甲方看板或腾讯会议 API
- 本次验证：backend `npm run lint`、`npm run test -- --runInBand`、`npm run test:e2e`、`npm run build` 通过；frontend `npm run lint`、`npm run typecheck`、`npm run build` 通过

### ReviewX 小修：专家可删除本人未提交评分草稿

- 后端新增 `DELETE /expert/review-tasks/:projectId/draft`，要求 Session 登录、`expert` 角色，且当前专家仍是该项目 `assigned` 专家
- 删除接口仅允许物理删除当前专家本人 `status=draft` 的 `expert_reviews` 记录；无记录返回 `404` 和“未找到可删除的评分草稿。”，`submitted/returned` 返回 `409 EXPERT_REVIEW_DRAFT_NOT_DELETABLE` 和“只有未提交的评分草稿可以删除。”
- 删除草稿不受 `Project.reviewTime` 限制，不删除项目、材料、专家分配，不新增 `deleted` 状态，不改变保存草稿、提交评分、submitted 只读或 returned 重提逻辑
- 前端新增 `deleteExpertReviewDraft(projectId)`，只调用 `/expert/review-tasks/:projectId/draft`，不调用 `/admin/*`、project_owner 或 review_manager 接口
- `ExpertReviewForm` 仅在 `review.status === 'draft'` 时显示危险样式“删除草稿”按钮，点击后通过确认弹窗二次确认；submitted、returned、not_started 不显示删除按钮
- 删除成功后专家详情页显示“评分草稿已删除。”并重新拉取详情和材料，使表单回到未开始评分状态；删除失败显示 404/409 友好文案，不清空当前表单、不跳转
- 本小修未新增依赖、环境变量，未修改 `package.json` 或锁文件，未实现第六阶段合议、AI 合议、申诉、甲方看板或腾讯会议 API
- 本次验证：backend `npm run lint`、`npm run test -- --runInBand`、`npm run test:e2e`、`npm run build` 通过；frontend `npm run lint`、`npm run typecheck`、`npm run build` 通过

## 2026-06-16

### ReviewX 小修：专家评分提交增加评审时间窗口校验

- 后端 `ExpertReviewsService.submitReview()` 新增 `Project.reviewTime` 校验：评审时间存在且服务器当前时间早于评审时间时，`POST /expert/review-tasks/:projectId/submit` 返回 `409 REVIEW_NOT_STARTED` 和“评审尚未开始，暂不能提交评分。”，不写 `submitted/submittedAt`
- 保存草稿 `PUT /expert/review-tasks/:projectId` 不受评审时间限制；`reviewTime` 缺失或为空的历史项目兼容允许提交
- 前端专家评分详情页根据 `project.reviewTime` 显示“评审尚未开始，暂不能提交评分；可先保存草稿。”，禁用提交评分按钮但保留保存草稿按钮
- 前端对后端 `409 REVIEW_NOT_STARTED` 或“评审尚未开始”错误映射为友好提示“评审尚未开始，暂不能提交评分。”，不清空表单、不跳转、不误标 submitted
- 本小修未改变专家任务权限、材料可见性、评分项校验、submitted 只读、returned 重提逻辑，未新增依赖、环境变量，未修改 `package.json` 或锁文件，未实现第六阶段合议、AI 合议、申诉、甲方看板或腾讯会议 API
- 本次验证：backend `npm run lint`、`npm run test -- --runInBand`、`npm run test:e2e`、`npm run build` 通过；frontend `npm run lint`、`npm run typecheck`、`npm run build` 通过

### ReviewX 小修：专家任务评审负责人多角色用户名称解析修复

- 后端 `/expert/review-tasks` 列表响应和 `/expert/review-tasks/:projectId` 详情响应的 `project` 摘要新增 `reviewManager` 最小摘要，结构为 `{ id, name, phone? }` 或 `null`
- 专家任务列表批量查询当前页项目 `reviewManagerId` 对应用户，详情按当前项目 `reviewManagerId` 查询，不放宽 `/portal/reference-data/users` 对含 `admin` 角色用户的排除规则
- 专家端 `ExpertReviewProjectSummary` 增加可选 `reviewManager`，列表和详情统一通过 `formatReviewManagerName` 优先显示 inline 负责人姓名，再 fallback 到 portal reference-data 用户映射，最后显示未知短 ID 或未指定
- 本小修未新增专家任意用户查询接口，未调用 `/admin/*`、project_owner 或 review_manager 接口补名称，未改变专家任务可见性、评分草稿保存、评分提交、submitted 只读或 returned 重提逻辑
- 本小修未新增依赖、环境变量，未修改 `package.json` 或锁文件，未实现第六阶段合议、AI 合议、申诉、甲方看板或腾讯会议 API
- 本次验证：backend `npm run lint`、`npm run test:e2e`、`npm run build` 通过；backend 原始 `npm run test` 因 Jest 并发共享测试库清理导致既有 service spec 数据被清空而失败，`npm run test -- --runInBand` 通过；frontend `npm run lint`、`npm run typecheck`、`npm run build` 通过

### ReviewX 小修：统一增强原生 Select 中树形选项缩进显示

- `treeOptionLabel` 增加空名称兜底，继续使用全角空格、`└─` 和 `›` 作为原生 select/option 树形层级的统一纯文本格式
- `/admin/tree-dictionaries` 新增 / 编辑弹窗父节点下拉继续使用 `treeOptionLabel`，未改动默认仅一级、显示全部层级、空父节点文案和防止选择自己或后代的逻辑
- `/admin/organizations` 主页面行政区划筛选和新增 / 编辑单位弹窗行政区划下拉改用 `treeOptionLabel`
- `/admin/project-imports/[jobId]` 查看 / 修正弹窗中的项目类型、受理处室和创建新承担单位行政区划下拉改用 `treeOptionLabel`
- 搜索补漏后，`/admin/projects` 和 `/project-owner/projects` 的项目类型原生树形筛选也改用 `treeOptionLabel`
- `indentedTreeLabel` 保留导出兼容；自定义 `TreeMultiSelect`、`TreeList` 和仅构造选项数据的代码未改
- 本小修只改变 option 展示文本，未改变 option value、key、disabled、selected value、表单 state、payload、查询参数或接口路径
- 本小修未修改普通字典、backend、依赖或环境变量，未修改 `package.json` 或锁文件
- 本小修未实现第六阶段合议、AI 合议、申诉、甲方看板或腾讯会议 API
- 本次验证：`frontend` 下 `npm run lint`、`npm run typecheck`、`npm run build` 均通过

### ReviewX 小修：树形字典新增编辑弹窗父节点选择体验优化

- `/admin/tree-dictionaries` 新增 / 编辑树节点弹窗新增“显示全部层级”开关，默认关闭时父节点下拉仅展示当前树类型一级节点
- 空父节点选项从“根节点”改为“不选择父节点（作为一级节点）”，`value=""` 与提交时转 `null` 的后端语义保持不变，不新增真实根节点
- 点击“添加子节点”打开弹窗时自动启用“显示全部层级”，确保被预设的父节点即使是深层节点也在下拉中可见
- 编辑已有子节点时按原 `parentId` 自动启用“显示全部层级”；编辑根节点时仍默认只显示一级父节点候选
- 父节点候选继续排除编辑中的节点自身及其后代，保留防止选择自己或后代作为父节点的前端逻辑
- `frontend/src/lib/tree/build-tree.ts` 新增 `treeOptionLabel`，专供 select option 使用全角空格和 `└─` 增强深层节点纯文本缩进；原 `indentedTreeLabel` 不变，避免影响其他页面
- 本小修未修改主列表 `flattenVisibleTree` 展开 / 收起逻辑，未改变树形字典查询、新增、编辑、删除或启停接口
- 本小修未修改普通字典、backend、接口、依赖或环境变量，未修改 `package.json` 或锁文件
- 本小修未实现第六阶段合议、AI 合议、申诉、甲方看板或腾讯会议 API
- 本次验证：`frontend` 下 `npm run lint`、`npm run typecheck`、`npm run build` 均通过

### ReviewX 小修：树形字典默认仅展示第一层并支持按需展开

- `/admin/tree-dictionaries` 初次进入默认仅展示当前树类型第一层节点
- 有子节点的节点显示展开 / 收起控件，点击展开后显示直接子节点，可继续逐层展开
- 收起节点会隐藏其所有后代，再次展开该节点时深层节点不会自动展开
- 切换顶部树类型筛选后会清空展开状态，只显示新树类型第一层
- 新增子节点成功后会保持父节点展开；编辑、停用和刷新保留当前展开状态，停用成功后会移除目标节点及其后代的展开状态
- 当前页面没有 keyword 搜索入口或查询参数，本小修未新增搜索，未改变 `listTreeDictionaries()` 查询逻辑
- 本小修未修改普通字典、backend、接口、依赖或环境变量，未修改 `package.json` 或锁文件
- 本小修未实现第六阶段合议、AI 合议、申诉、甲方看板或腾讯会议 API
- 本次验证：`frontend` 下 `npm run lint`、`npm run typecheck`、`npm run build` 均通过

### ReviewX 小修：树形字典列表行内移除重复树类型展示

- `/admin/tree-dictionaries` 列表行内中间信息列移除“树类型：xxx”重复展示
- 顶部树类型筛选继续保留，仍用于控制当前维护的树类型范围
- 行内继续展示编码、排序和全称 / 完整路径信息，缩进层级和操作按钮保持不变
- 本小修未改变树形字典查询、新增、编辑、删除或启停逻辑
- 本小修未修改普通字典、backend、接口、依赖或环境变量，未修改 `package.json` 或锁文件
- 本小修未实现第六阶段合议、AI 合议、申诉、甲方看板或腾讯会议 API
- 本次验证：`frontend` 下 `npm run lint`、`npm run typecheck`、`npm run build` 均通过

### ReviewX 小修：普通字典固定类型恢复评审等级

- `/admin/dictionaries` 固定普通字典类型恢复“评审等级 / review_level”
- 字典类型筛选当前固定为“项目状态 / project_status”“材料类型 / material_type”“评审等级 / review_level”
- 默认选中仍为“项目状态”，初次进入仍只加载 `project_status`
- 切换到评审等级时调用 `GET /admin/dictionaries?dictType=review_level`，新增评审等级时提交 `dictType=review_level`
- 编辑评审等级时继续只读展示字典类型，不允许修改 `dictType`
- 本小修未恢复“全部”或“自定义类型”，未允许自由输入 `dictType`
- 本小修未修改 backend，未新增接口、依赖或环境变量，未修改 `package.json` 或锁文件
- 本小修未修改树形字典、合议、申诉、专家评分或其他业务页面
- 本次验证：`frontend` 下 `npm run lint`、`npm run typecheck`、`npm run build` 均通过

### ReviewX 小修：普通字典类型筛选固定化并默认选中项目状态

- `/admin/dictionaries` 字典类型筛选固定为平台内置普通字典类型
- 页面默认选中“项目状态”，初次进入直接调用 `GET /admin/dictionaries?dictType=project_status`，不再先拉取全部普通字典
- 移除筛选中的“全部”和“自定义类型”，不再提供跨类型全部浏览或自定义 `dictType` 入口
- 新增字典项时 `dictType` 跟随当前选中的固定类型；编辑字典项时只读展示类型，不允许修改为其他或自定义类型
- 空状态按当前固定类型显示对应字典项为空
- 本小修未修改 backend，未新增接口、依赖或环境变量，未修改 `package.json` 或锁文件
- 本小修未修改树形字典、项目导入、字段映射、项目评审组织、专家工作台或第六阶段合议能力
- 本次验证：`frontend` 下 `npm run lint`、`npm run typecheck`、`npm run build` 均通过

### ReviewX 小修：AdminShell 增加返回工作台入口

- `AdminShell` 正常管理员后台页头右上角新增“返回工作台”入口，指向 `/workspace`
- 新入口复用 ExpertShell 顶部操作区的轻量链接样式，并放在管理员角色 Badge 与“退出登录”之间
- 顶部用户操作区保持 `flex-wrap` 和 `gap`，窄屏下避免挤爆布局；左侧管理员导航不变
- 保留原有“退出登录”按钮和 `handleLogout` 逻辑，不修改无管理员权限 403 页面中的返回工作台入口
- 本小修未修改 backend，未新增接口、依赖或环境变量，未修改 `package.json` 或锁文件
- 本小修未修改 ExpertShell、ProjectOwnerShell、专家评分页面、项目负责人材料页面或管理员业务页面逻辑
- 本次验证：`frontend` 下 `npm run lint`、`npm run typecheck`、`npm run build` 均通过

### ReviewX 前端第五阶段：专家工作台与评分

- `/workspace` 放开 `expert` 角色入口，点击进入 `/expert`；admin 和 project_owner 入口保持原有能力，多角色用户可见多个入口
- 新增 `ExpertShell`，提供 expert 登录态 / 角色守卫、工作台首页 / 我的评审任务导航、返回工作台和退出登录，不显示管理员或项目负责人菜单
- 新增 `/expert` 专家工作台首页，展示专家评审流程提示和“进入我的评审任务”入口
- 新增 `/expert/review-tasks` 专家任务列表，调用 `GET /expert/review-tasks`，支持状态、批次、评审负责人、评审方案筛选、分页、刷新和状态中文 Badge
- 新增 `/expert/review-tasks/[projectId]` 详情页，并发加载专家任务详情、专家 submitted 材料和 portal reference-data
- 新增专家 API 封装：`listExpertReviewTasks`、`getExpertReviewTask`、`saveExpertReviewDraft`、`submitExpertReview`、`listExpertProjectMaterials`、`getExpertProjectMaterialDownloadUrl` 和下载 URL 解析辅助
- 专家材料查看和下载只调用 `/expert/projects/:id/materials` 与 `/expert/projects/:id/materials/:materialId/download-url`，不调用 admin / project_owner / review_manager 材料接口，不拼接 OSS objectKey
- 专家详情页材料展示以 `/expert/projects/:id/materials` 返回的 submitted 材料为准，不使用评分详情响应内联 materials 作为页面材料主数据源
- 新增 expert 类型和工具函数，覆盖任务、详情、评分方案快照、评分项、材料、保存 / 提交输入、portal reference-data、状态文案、score 校验、低分 / 重大问题改进建议必填和实时总分
- 新增 `ExpertProjectInfoPanel`、`ExpertMaterialsPanel`、`ExpertReviewForm`、`ExpertReviewItemEditor` 和 `ExpertTaskStatusBadge`
- 评分表单支持保存草稿、提交评分、提交前二次确认、前端基础校验、submitted 只读和 returned 修改重提
- 草稿保存允许空 score / 评价描述 / 改进建议，但已填写 score 必须在 `0..maxScore`；提交要求所有 score 和评价描述必填，低分或重大问题项改进建议必填
- 本阶段未修改 backend，未新增后端接口，未新增依赖，未新增环境变量，未修改 `package.json` 或锁文件
- 本阶段未实现评审负责人合议、评审负责人退回评分前端、admin 查看专家评分、AI 合议、申诉、甲方看板、腾讯会议 API、文件预览、材料删除或专家分配
- 本次验证：`frontend` 下 `npm run lint`、`npm run typecheck`、`npm run build` 均通过

### ReviewX 小修：通用 Modal 改为视口级 Portal 弹窗

- `Modal` 改为通过 React Portal 挂载到 `document.body`，避免被调用位置的父级布局、overflow、transform 或层叠上下文限制
- Modal overlay 使用视口级 `fixed inset-0 z-[1000]`，遮罩覆盖整个浏览器视口，面板在最高层居中显示
- Modal 面板改为 flex 列布局，`max-h-[90vh]`，header/footer 固定在面板内，body 区负责滚动；新增可选 `size/bodyClassName/panelClassName` 且保持原调用兼容
- `AdminProjectMaterialDeleteModal` 改为使用通用 Portal Modal 的 body 滚动能力，保留删除原因表单、1000 字限制、长文件名换行和提交中禁用
- 本小修未修改 backend，未新增接口或依赖，未修改 admin 删除材料 API 语义，未修改项目负责人材料流程
- 本次验证：`frontend` 下 `npm run lint`、`npm run typecheck`、`npm run build` 均通过

### ReviewX 小修：管理员项目材料上传人显示与删除弹窗可视性优化

- `/admin/projects/[projectId]/review-organization` 将已加载的 `userNameById` 传入 `AdminProjectMaterialsCard`，项目材料上传人列在材料响应未内联 `uploadedByUser` 时复用页面 users 映射显示姓名和手机号
- `AdminProjectMaterialsCard` 上传人显示顺序调整为：材料响应内联 `uploadedByUser`、页面已加载 users 映射、短 ID 兜底；`uploadedByUserId` 缺失时显示“未知上传人”
- `AdminProjectMaterialDeleteModal` 增加局部内容滚动边界、长文件名换行和稳定 textarea 高度，保证删除原因输入区与底部按钮在小屏 / 缩放场景下可操作
- 本小修未修改 backend，未新增后端接口，未新增额外用户请求，未修改 admin 删除材料接口和 reason 必填规则，未修改项目负责人材料页面语义
- 本次验证：`frontend` 下 `npm run lint`、`npm run typecheck`、`npm run build` 均通过

### ReviewX 第四阶段补丁五：管理员项目材料查看与删除前端接入

- `/admin/projects/[projectId]/review-organization` 新增“项目材料”卡片，管理员可查看项目负责人上传材料的文件名、材料类型、状态、上传人、上传时间、大小和备注
- 新增 admin 材料 API 封装：`listAdminProjectMaterials`、`getAdminProjectMaterialDownloadUrl`、`deleteAdminProjectMaterial`，均调用 `/admin/projects/:id/materials` 系列接口
- 新增 admin 项目材料类型，覆盖 `draft/submitted/active/deleted` 状态、下载 URL 响应和带原因删除结果；不从 project-owner feature 反向导入类型
- 新增 `AdminProjectMaterialStatusBadge`，统一显示草稿、已提交评审、历史草稿、已删除和未知状态
- 新增 `AdminProjectMaterialDeleteModal`，删除前必须填写 1-1000 字原因，说明物理删除文件和材料记录、不可恢复，且后端保留删除审计
- 新增 `AdminProjectMaterialsCard`，独立加载材料列表，支持刷新、下载、删除弹窗、删除成功刷新列表、删除失败不乐观移除，并处理 400/403/404/500 等错误提示
- 材料下载只打开后端返回的签名 URL 或 fake storage URL，不前端拼接 OSS objectKey
- 本补丁未修改 backend，未新增后端接口，未新增依赖，未新增环境变量，未修改 `package.json` 或锁文件
- 本补丁未调用 project_owner / review_manager / expert 材料接口冒充 admin，未调用 `/admin/users` 补上传人，未使用 mock 数据，未实现删除日志查询、材料恢复、文件预览、专家评分、合议、申诉、甲方看板或腾讯会议 API
- 本次验证：`frontend` 下 `npm run lint`、`npm run typecheck`、`npm run build` 均通过

### ReviewX 第四阶段补丁四：项目负责人材料提交与删除规则前端接入

- 项目负责人材料类型扩展为 `draft/submitted/active/deleted`，新增提交材料请求与响应类型，并保留删除结果兼容字段 `alreadyDeleted?`、`deletionLogId?`
- 新增 `submitProjectOwnerMaterials`，调用 `POST /project-owner/projects/:id/materials/submit`，当前页面用于提交全部草稿材料
- `/project-owner/projects/[projectId]` 材料管理区新增草稿、已提交、历史草稿和总数统计；新增“提交全部草稿材料”入口、二次确认、提交结果统计和 skipped 明细展示
- `MaterialUploadPanel` 上传成功提示明确新材料为草稿，提交前评审负责人和专家不可见；上传后不自动提交
- `MaterialListPanel` 新增材料状态 Badge；`draft/legacy active` 可删除，`submitted` 删除按钮禁用并提示不可删除
- 草稿删除二次确认文案调整为物理删除文件和材料记录且不可恢复；legacy active 删除提示历史草稿物理删除语义
- 项目负责人删除材料仍调用 `DELETE /project-owner/projects/:id/materials/:materialId`，成功后刷新材料列表和项目详情；`409` 映射为“该材料已提交评审，项目负责人不能删除。如确需删除，请联系管理员。”
- 下载仍只使用后端 download-url 返回的签名 URL，不前端拼接 OSS objectKey；材料类型展示继续使用响应内联名称和 portal `material_type` 映射
- 本补丁未修改 backend，未新增后端接口，未调用 `/admin/*` 删除接口，未新增依赖，未新增环境变量，未修改 `package.json` 或锁文件
- 本补丁未实现 admin 删除材料页面、删除日志查询、专家评分、合议、申诉、甲方看板、腾讯会议 API、文件预览、材料恢复或自动提交上传材料
- 本次验证：`frontend` 下 `npm run lint`、`npm run typecheck`、`npm run build` 均通过

### ReviewX 第四阶段补丁二：项目负责人材料上传闭环启用与名称映射优化

- `/project-owner/projects` 接入 `/portal/reference-data/*`，批次、项目类型、项目状态、评审负责人、评审方案筛选从手填 ID 改为 select，筛选提交仍传后端 ID，不新增 keyword
- 项目负责人项目列表使用门户参考数据展示批次、项目类型、项目状态、学科、承担单位、评审负责人和评审方案名称；未命中时显示“未知项（短ID）”类兜底
- `/project-owner/projects/[projectId]` 并发加载项目详情、材料列表和门户参考数据，基础信息卡和评审安排卡改为名称展示
- 新增 project-owner portal reference-data API 封装：`listPortalDictionaries`、`listPortalTreeDictionaries`、`listPortalBatches`、`listPortalOrganizations`、`listPortalReviewSchemes`、`listPortalUsers`、`loadProjectOwnerReferenceData`
- `MaterialUploadPanel` 使用 active `material_type` 字典启用真实材料上传；`material_type` 为空或 reference-data 加载失败时禁用上传并显示明确错误
- 材料上传继续使用 `POST /project-owner/projects/:id/materials` 和 FormData 字段 `files/materialTypeId/remark`，不手动设置 multipart `Content-Type`
- 上传结果继续展示 successCount / failedCount，并补充 failures 明细中的 originalFilename 和 message
- `MaterialListPanel` 材料类型名称优先使用材料响应内联 `materialType.name`，其次使用 portal `material_type` 映射，仍未命中时显示“未知材料类型（短ID）”；筛选项来自 portal `material_type`
- 下载仍调用后端 download-url 并使用返回的签名 URL，不前端拼接 OSS objectKey；删除仍为软删除并保留二次确认
- 本补丁未修改 backend，未新增后端接口，未新增依赖，未新增环境变量，未修改 `package.json` 或锁文件
- 本补丁未实现专家评分、合议、申诉、甲方看板、腾讯会议 API、文件预览、材料恢复或硬删除

## 2026-06-15

### ReviewX 前端第四阶段：项目负责人工作台与材料管理前端接入

- `/workspace` 放开 `project_owner` 角色入口，点击进入 `/project-owner`；admin 入口保持原样，其他角色仍显示“后续建设”
- 新增 `ProjectOwnerShell`，提供 project_owner 登录态 / 角色守卫、概览 / 我的项目导航、返回工作台和退出登录
- 新增 `/project-owner` 概览页，读取本人第一页项目，展示我的项目数量、基于第一页的轻量统计和最近项目入口
- 新增 `/project-owner/projects` 我的项目列表，调用 `GET /project-owner/projects`，支持后端分页和 `batchId/statusId/projectTypeId/reviewManagerId/reviewSchemeId` ID 筛选，不提交 `ownerUserId` 或 `keyword`
- 新增 `/project-owner/projects/[projectId]` 详情页，调用 `GET /project-owner/projects/:id`，展示项目基础信息、评审负责人、评审方案、评审时间、地点和会议链接，并明确不接腾讯会议 API
- 新增后续推进需求面板，调用 `PATCH /project-owner/projects/:id/follow-up-needs`，只提交 `{ followUpNeeds }`，前端限制 5000 字，允许清空后保存
- 新增材料 API 封装：`listProjectOwnerMaterials`、`uploadProjectOwnerMaterials`、`getProjectOwnerMaterialDownloadUrl`、`deleteProjectOwnerMaterial` 和下载 URL 解析辅助
- 材料上传封装使用 FormData，字段名固定为 `files/materialTypeId/remark`，不手动设置 `Content-Type`
- 新增材料列表面板，调用 project_owner 材料列表 / 下载 URL / 软删除接口，按已上传材料响应中的 `materialType` 摘要生成 tabs，删除前二次确认
- 新增材料文件校验工具，覆盖一次最多 20 个文件、单文件最大 500MB、允许扩展名和禁止扩展名提示
- 已核对后端契约：项目负责人项目列表、详情、follow-up-needs、材料列表、上传、下载 URL、删除接口存在；但 project_owner 可用的 `material_type` 读取接口缺失
- 因后端普通字典 controller 当前仅为 `/admin/dictionaries` 且 `@Roles('admin')`，本次未新增 `listMaterialTypes`，未调用 admin-only 字典接口，未写死材料类型 ID；上传入口显示“材料类型接口暂不可用”并禁用
- 项目负责人项目基础信息名称映射当前无 project_owner 可用主数据只读接口，批次、状态、项目类型、单位、用户、评审方案等字段以 ID 兜底展示
- 本阶段未修改 backend，未新增后端接口，未新增依赖，未新增环境变量，未修改 `package.json` 或锁文件
- 本阶段未实现专家评分、合议、申诉、甲方看板、腾讯会议 API、文件预览、材料恢复或硬删除
- 本次验证：`frontend` 下 `npm run lint`、`npm run typecheck`、`npm run build` 均通过

### ReviewX 小修：批量专家设置失败明细中的专家名称展示优化

- `/admin/projects` 批量设置专家结果区不再把 `failure.expertUserId` 作为专家失败明细主文案
- 批量专家失败明细优先显示 `专家姓名（手机号）`，映射缺失时显示 `未知专家（短ID）`，并在 `title` 中保留完整专家 ID 便于排查
- 批量专家逐项目结果标题继续优先显示项目编号和项目名称，映射缺失时显示 `未知项目（短ID）`，避免直接裸露项目 ObjectId
- 失败结果同时展示后端项目级 `message` 和专家级 `failures`；二者都不存在时显示“设置失败，后端未返回具体原因。”
- 本次未修改 backend，未修改后端接口、专家匹配规则或单位回避规则，未新增依赖，未新增环境变量，未修改 `package.json` 或锁文件
- 本次验证：`frontend` 下 `npm run lint`、`npm run typecheck`、`npm run build` 均通过

### ReviewX 前端第三阶段：管理员项目分配与评审组织

- `/admin/projects` 从项目只读列表升级为管理员项目评审组织列表，支持 keyword、批次、项目类型、项目状态、评审负责人、评审方案、是否已分配负责人、是否已分配方案筛选
- 项目列表新增选择列、当前页全选、组织状态、评审时间、评审地点、会议链接、单项目“分配”和“评审组织”入口
- 新增单项目分配弹窗，调用 `PATCH /admin/projects/:id/review-assignment` 设置评审负责人和 / 或评审方案，并提示后端会生成评审方案快照
- 新增批量分配弹窗，调用 `PATCH /admin/projects/review-assignment/batch`，二次确认后展示 `successCount`、`failedCount` 和 failures 明细
- 新增批量设置专家弹窗，使用 active expert 用户作为通用选择源，调用 `PUT /review-manager/projects/experts/batch`，并说明后端仍会逐项目校验学科匹配和单位回避
- 新增 `/admin/projects/[projectId]/review-organization` 单项目评审组织详情页，展示基础信息、评审分配、评审安排、已分配专家和专家候选
- 新增评审安排面板，调用 `PATCH /admin/projects/:id/schedule` 保存 `reviewTime/reviewLocation/meetingUrl`，并明确不接腾讯会议 API、直播、推流或回看
- 新增专家候选面板，调用 `GET /admin/projects/:id/expert-candidates`，候选专家完全使用后端返回结果，支持 keyword 搜索、分页、追加和替换
- 新增已分配专家面板，调用 `GET /review-manager/projects/:id/experts` 和 `DELETE /review-manager/projects/:id/experts/:expertUserId`，支持二次确认移除
- 新增 `frontend/src/features/admin/api/project-review-organization.ts` 和 `frontend/src/features/admin/types/project-review-organization.ts`，显式定义项目评审组织、专家候选、专家分配和批量结果类型
- 新增 `frontend/src/lib/labels/project-review-organization-labels.ts`，统一组织状态和专家失败原因中文展示
- AdminShell 和 `/admin` 概览页入口文案由项目列表 / 只读改为项目评审组织
- 本阶段未修改 backend，未新增后端接口，未新增依赖，未新增环境变量，未修改 `package.json` 或锁文件
- 本阶段未使用 mock 数据作为真实页面数据源，未在前端自行实现专家学科匹配或单位回避
- 本阶段未实现项目负责人材料上传、专家评分、AI 合议、申诉、甲方看板或腾讯会议 API
- 本次验证：`frontend` 下 `npm run lint`、`npm run typecheck`、`npm run build` 均通过

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
