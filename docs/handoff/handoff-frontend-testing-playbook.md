# ReviewX 前端验证手册

## 1. 本地启动

```bash
cd frontend
npm install
npm run dev
```

- 前端地址：`http://localhost:3001`
- 后端地址：`http://localhost:5001`
- 环境变量示例：`frontend/.env.local.example`

## 2. 自动验证命令

```bash
cd frontend
npm run lint
npm run typecheck
npm run build
```

当前阶段已执行并通过：

- `npm install`
- `npm run lint`
- `npm run typecheck`
- `npm run build`

本次 UI 基线升级与管理员基础页面交互修正已执行并通过：

- `npm run lint`
- `npm run typecheck`
- `npm run build`

本次行政区划 treeType 口径统一已执行并通过：

- `npm run lint`
- `npm run typecheck`
- `npm run build`

本次表单控件与行内操作按钮一致性修正已执行并通过：

- `npm run lint`
- `npm run typecheck`
- `npm run build`

本次管理员用户管理页面已执行并通过：

- `npm run lint`
- `npm run typecheck`
- `npm run build`

本次 ReviewX 前端第二阶段：管理员 Excel 导入与待确认处理已执行：

- `npm run typecheck`：通过
- `npm run lint`：通过
- `npm run build`：通过

本次 ReviewX 第二阶段补丁二：Excel 字段映射配置前端接入已执行：

- `npm run lint`：通过
- `npm run typecheck`：通过
- `npm run build`：通过

本次 ReviewX 前端第三阶段：管理员项目分配与评审组织已执行：

- `npm run typecheck`：通过
- `npm run lint`：通过
- `npm run build`：通过

本次 ReviewX 小修：批量专家设置失败明细中的专家名称展示优化已执行：

- `npm run lint`：通过
- `npm run typecheck`：通过
- `npm run build`：通过

本次 ReviewX 前端第四阶段：项目负责人工作台与材料管理前端接入已执行：

- `npm run lint`：通过
- `npm run typecheck`：通过
- `npm run build`：通过

本次 ReviewX 第四阶段补丁二：项目负责人材料上传闭环启用与名称映射优化已执行：

- `npm run lint`：通过
- `npm run typecheck`：通过
- `npm run build`：通过

注意：项目负责人材料上传已通过 `/portal/reference-data/dictionaries?dictTypes=material_type,project_status` 启用；`material_type` 为空或 reference-data 加载失败时上传入口应禁用。不得通过 admin-only 字典接口绕过权限。

本次 ReviewX 第四阶段补丁四：项目负责人材料提交与删除规则前端接入已执行并通过：

- `npm run lint`
- `npm run typecheck`
- `npm run build`

注意：项目负责人材料提交只调用 `POST /project-owner/projects/:id/materials/submit`；项目负责人删除材料只调用 `DELETE /project-owner/projects/:id/materials/:materialId`，不得调用 `/admin/*` 删除接口。

本次 ReviewX 第七阶段小修：项目负责人详情页评审负责人显示与确认后只读锁定已执行并通过：

- backend `npm run lint`
- backend `npm run build`
- backend `npm run test -- --runInBand`
- backend `npm run test:e2e`
- frontend `npm run lint`
- frontend `npm run typecheck`
- frontend `npm run build`

注意：项目负责人项目详情的评审负责人显示优先使用项目响应 `reviewManager` 摘要；评审结果确认后，project-owner 后续推进需求和材料上传 / 提交 / 删除只读锁定，后端仍以 `409 PROJECT_OWNER_CONTENT_LOCKED` 兜底。材料查看 / 下载、评审结果与申诉、submitted 申诉附件补充上传不受该锁定影响；已上传申诉附件不可删除。

本次 ReviewX 第七阶段小修：合议确认人显示修正已执行并通过：

- backend `npm run lint`
- backend `npm run build`
- backend `npm run test -- --runInBand`
- backend `npm run test:e2e`
- frontend `npm run lint`
- frontend `npm run typecheck`
- frontend `npm run build`

注意：合议响应兼容 `confirmedByUser?: { id, name, phone? } | null`；评审负责人合议页“确认人”优先显示姓名，有手机号时显示“姓名（手机号）”，确认人摘要不可用时显示“确认人信息暂不可用”，不得显示“用户（短ID）”或 ObjectId。

本次 ReviewX 第七阶段小修：确认后的合议结论不可在合议页重新覆盖已执行并通过：

- backend `npm run lint`
- backend `npm run build`
- backend `npm run test -- --runInBand`
- backend `npm run test:e2e`
- frontend `npm run lint`
- frontend `npm run typecheck`
- frontend `npm run build`

注意：confirmed 合议在评审负责人合议页只读展示最终结论，不显示“重新确认最终结论”、确认表单或“使用草稿填入”；后端 `POST /review-manager/projects/:id/consensus/confirm` 和 admin 兜底确认对已 confirmed 合议返回 `409 CONSENSUS_ALREADY_CONFIRMED`，不覆盖合议最终意见 / 分数 / 等级、项目最终等级、确认人或确认时间。后续调整走申诉处理或未来专门更正流程。

本次 ReviewX 第七阶段小修：上传文件中文名归一化已执行并通过：

- backend `npm run lint`
- backend `npm run build`
- backend `npm run test -- --runInBand`
- backend `npm run test:e2e`

注意：项目材料和申诉附件上传入口会在后端保存 `originalFilename`、生成 `safeFilename/objectKey` 和多文件失败明细前统一归一化文件名；前端继续展示后端 `originalFilename`，不做编码 hack；历史已保存乱码文件名本次不批量修复。

本次 ReviewX 第七阶段小修：申诉附件留痕锁定与等级变更历史业务化展示已执行并通过：

- backend `npm run lint`
- backend `npm run build`
- backend `npm run test -- --runInBand`
- backend `npm run test:e2e`
- frontend `npm run lint`
- frontend `npm run typecheck`
- frontend `npm run build`
- 手工重点：project-owner 已上传申诉附件不显示删除按钮，直接 DELETE 返回 `409 PROJECT_APPEAL_ATTACHMENT_DELETE_NOT_ALLOWED` 且附件仍在；submitted 状态仍可补充上传；等级历史操作人显示姓名 / 姓名（手机号），不可解析时显示“操作人信息暂不可用”；不得显示操作人短 ID 或“关联申诉 短ID”，可构造链接时显示“查看关联申诉”。

本次 ReviewX 第十阶段补丁一：未验证链路与演示数据联调已执行：

- backend `npm run build`：通过
- backend `npm run test:e2e`：通过（13 suites / 73 tests）
- frontend `npm run typecheck`：通过
- frontend `npm run lint`：通过
- frontend `npm run build`：通过
- `reviewx_dev` 真实 HTTP 写入联调：通过，覆盖申诉 submitted / accepted / rejected、申诉附件补充与不可删除、材料 draft / submitted / 锁定、专家评分 draft / submitted / returned / 重提、confirmed 后评分只读和 `/client` 刷新。
- legacy `active`：本次通过 API 扫描前 1000 个项目未发现样本，未强行造数；后续如出现历史样本仍按草稿兼容口径回归。

注意：confirmed 合议后，评审负责人退回 submitted 专家评分后端返回 `409`，评分保持 `submitted`；本次联调未接腾讯会议 API、真实 AI 或文件预览。

本次 ReviewX 第四阶段补丁五：管理员项目材料查看与删除前端接入已执行并通过：

- `npm run lint`
- `npm run typecheck`
- `npm run build`

注意：管理员项目材料查看、下载和删除只调用 `/admin/projects/:id/materials` 系列接口；删除必须填写 `reason`，不得调用 project_owner / review_manager / expert 材料接口。

本次 ReviewX 小修：管理员项目材料上传人显示与删除弹窗可视性优化已执行并通过：

- `npm run lint`
- `npm run typecheck`
- `npm run build`

注意：管理员项目材料上传人显示复用项目评审组织详情页已加载 users 映射，不新增额外用户请求；删除弹窗 reason 表单保留必填校验，内容过长时在弹窗主体内滚动。

本次 ReviewX 小修：通用 Modal 改为视口级 Portal 弹窗，修复管理员材料删除弹窗被页面内容遮挡已执行并通过：

- `npm run lint`
- `npm run typecheck`
- `npm run build`

注意：通用 `Modal` 通过 React Portal 挂载到 `document.body`，遮罩覆盖整个视口，面板 body 区滚动，footer 保持可见；管理员材料删除 reason 表单和接口语义不变。

本次 ReviewX 前端第五阶段：专家工作台与评分已执行并通过：

- `npm run lint`
- `npm run typecheck`
- `npm run build`

注意：专家材料查看和下载只调用 `/expert/projects/:id/materials` 系列接口；专家评分只调用 `/expert/review-tasks` 系列接口；不得调用 admin / project_owner / review_manager 材料接口。

本次 ReviewX 小修：专家可删除本人未提交评分草稿已执行并通过：

- backend `npm run lint`
- backend `npm run test -- --runInBand`
- backend `npm run test:e2e`
- backend `npm run build`
- frontend `npm run lint`
- frontend `npm run typecheck`
- frontend `npm run build`

注意：专家删除评分草稿只调用 `DELETE /expert/review-tasks/:projectId/draft`；draft 可删除，submitted/returned 不显示删除按钮且后端返回 `409`，无草稿返回 `404`；删除不受 `reviewTime` 限制。

本次 ReviewX 小修：专家分配移除规则收紧为无评分记录才可物理删除已执行并通过：

- backend `npm run lint`
- backend `npm run test -- --runInBand`
- backend `npm run test:e2e`
- backend `npm run build`
- frontend `npm run lint`
- frontend `npm run typecheck`
- frontend `npm run build`

注意：本小修当时口径为无 `expert_reviews` 记录的专家分配可物理删除；第六阶段小修 2 后已升级为项目级专家名单锁定，存在任意评分记录时追加 / 替换 / 移除均返回 `409 EXPERT_ASSIGNMENT_LOCKED`。

本次 ReviewX 前端第六阶段：评审负责人合议工作台已执行并通过：

- `npm run lint`
- `npm run typecheck`
- `npm run build`

注意：评审负责人项目详情摘要使用 `GET /review-manager/projects?page=1&pageSize=1000` 前端匹配；`GET /consensus` 404 按暂无合议记录展示；已有 draft 覆盖生成需二次确认后 `force=true`，confirmed 不提供覆盖草稿入口。

本次 ReviewX 第六阶段小修：评审负责人工作台权限收紧、专家分配接入与合议确认表单清理已执行并通过：

- backend `npm run lint`
- backend `npm run build`
- backend `npm run test`
- backend `npm run test:e2e`
- frontend `npm run lint`
- frontend `npm run typecheck`
- frontend `npm run build`

注意：`/review-manager/projects` 只返回当前评审负责人负责项目，admin 全局视角走 `/admin/projects`；管理员评审组织专家分配使用 `/admin/projects*`，评审负责人评审组织页专家分配使用 `/review-manager/projects*`；合议确认请求不得包含 `useDraftAsBase`。

本次 ReviewX 第六阶段小修 2：评审负责人评审组织页独立、合议页拆分与专家分配时点锁定已执行：

- backend `npm run lint`：通过
- backend `npm run test`：失败；既有 Jest 并行 service spec 共享测试库互扰，表现为 `portal-reference-data.service.spec.ts` 多出 `proof` material_type、`project-materials.service.spec.ts` 缺少 active material_type
- backend `npm run test -- --runInBand`：通过
- backend `npm run test:e2e`：通过
- backend `npm run build`：通过
- frontend `npm run lint`：通过
- frontend `npm run typecheck`：通过
- frontend `npm run build`：通过

注意：`/review-manager/projects/[projectId]` 是项目总览 / 工作入口；专家分配只在 `/review-manager/projects/[projectId]/review-organization`；合议处理只在 `/review-manager/projects/[projectId]/consensus`。专家名单锁定由后端最终判断，锁定条件包括评审时间已到、已有专家评分、已有合议记录、已有最终等级 / 最终结论，返回 `409 EXPERT_ASSIGNMENT_LOCKED` 和 `reasons`。

本次 ReviewX 前端第七阶段：申诉闭环前端已执行并通过：

- frontend `npm run lint`：通过
- frontend `npm run typecheck`：通过
- frontend `npm run build`：通过

注意：项目负责人申诉只调用 `/project-owner/projects/:id/appeals*`，评审负责人申诉只调用 `/review-manager/projects/:id/appeals*`，管理员申诉只调用 `/admin/projects/:id/appeals*`；评审负责人侧不调用不存在的 `level-history`，申诉附件下载只打开后端 `download-url` 返回 URL。

本次 ReviewX 前端第九阶段：甲方看板基础版已执行并通过：

- frontend `npm run typecheck`：通过
- frontend `npm run lint`：通过
- frontend `npm run build`：通过；构建路由包含 `/client`

注意：甲方看板只调用 `/client/dashboard/overview`、`/client/dashboard/projects` 和 `/portal/reference-data/*`；当前仅展示 `meetingUrl` 外链入口，不接腾讯会议 API、直播、推流或回看。

本次 ReviewX 小修：AdminShell 增加返回工作台入口已执行并通过：

- `npm run lint`
- `npm run typecheck`
- `npm run build`

注意：管理员后台正常页头右上角“返回工作台”仅做前端导航，指向 `/workspace`；不改变管理员左侧导航、退出登录或 403 无权限页。

本次 ReviewX 小修：普通字典类型筛选固定化并默认选中项目状态已执行并通过：

- `npm run lint`
- `npm run typecheck`
- `npm run build`

注意：普通字典页只维护平台内置普通字典类型，筛选项固定为项目状态、材料类型和评审等级；列表请求始终携带明确 `dictType`，不再拉取全部普通字典，不提供自定义 `dictType` 输入。

本次 ReviewX 小修：普通字典固定类型恢复评审等级已执行并通过：

- `npm run lint`
- `npm run typecheck`
- `npm run build`

注意：`review_level` 是系统内置普通字典类型，管理员后台继续提供“评审等级”维护入口；本小修不恢复“全部”或“自定义类型”。

本次 ReviewX 小修：树形字典列表行内移除重复树类型展示已执行并通过：

- `npm run lint`
- `npm run typecheck`
- `npm run build`

注意：树形字典顶部树类型筛选仍控制当前维护范围；列表行内不再重复显示“树类型”，查询、新增、编辑、删除和启停逻辑不变。

本次 ReviewX 小修：树形字典默认仅展示第一层并支持按需展开已执行并通过：

- `npm run lint`
- `npm run typecheck`
- `npm run build`

注意：树形字典默认只显示当前树类型第一层节点，有子节点时通过展开 / 收起控件逐层查看；切换树类型会清空展开状态。当前页面没有 keyword 搜索入口或查询参数，本小修未新增搜索，也未改变 `listTreeDictionaries()` 查询逻辑。

本次 ReviewX 小修：树形字典新增编辑弹窗父节点选择体验优化已执行并通过：

- `npm run lint`
- `npm run typecheck`
- `npm run build`

注意：树形字典新增 / 编辑弹窗父节点下拉默认仅显示一级节点，空父节点选项为“不选择父节点（作为一级节点）”；勾选“显示全部层级”后可选择深层父节点，深层 option 使用纯文本全角空格和树枝符号增强缩进。本小修未改变主列表展开 / 收起、树形字典 CRUD 或接口语义。

本次 ReviewX 小修：统一增强原生 Select 中树形选项缩进显示已执行并通过：

- `npm run lint`
- `npm run typecheck`
- `npm run build`

注意：原生 select/option 中树形选项统一使用 `treeOptionLabel`，通过全角空格、`└─` 和 `›` 增强缩进；本小修只改变 option 展示文本，不改变 value、payload、查询参数或接口语义。

## 3. 登录与会话人工验证

1. 后端运行在 `5001`
2. 浏览器访问 `http://localhost:3001`
3. 使用本地 admin 账号登录
4. 登录成功后进入 `/workspace`
5. 刷新页面，确认 `GET /auth/me` 可保持会话
6. 点击退出登录，确认回到 `/login`
7. 确认浏览器 JS 中没有 token 存储逻辑
8. 确认 `/login` 为品牌化登录页，主按钮不是普通纯蓝底白字

## 4. 角色入口人工验证

1. admin、client、review_manager、expert、project_owner 角色卡片均显示中文
2. 点击管理员入口进入 `/admin`
3. 点击甲方入口进入 `/client`
4. 点击项目负责人入口进入 `/project-owner`
5. 点击专家入口进入 `/expert`
6. 点击评审负责人入口进入 `/review-manager`
7. 未开通角色显示“未开通”
8. 无 admin 角色访问 `/admin` 应显示 403 状态或回工作台
9. 无 client 角色访问 `/client` 应显示 403 状态或回工作台
10. 无 project_owner 角色访问 `/project-owner` 应显示 403 状态或回工作台
11. 无 expert 角色访问 `/expert` 应显示 403 状态或回工作台
12. 无 review_manager 角色访问 `/review-manager` 应显示 403 状态或回工作台

## 5. 管理员后台人工验证

1. `/admin` 可访问
2. 顶部栏显示当前用户和管理员角色 Badge
3. 侧边栏导航可用，选中态为胶囊高亮
4. 退出登录可用
5. 顶部栏右上角显示“返回工作台”入口
6. 点击“返回工作台”跳转 `/workspace`
7. 窄屏下顶部用户信息、角色 Badge、“返回工作台”和“退出登录”不明显溢出
8. 首页按“主数据维护 / 项目评审组织 / 监管闭环”展示

## 6. 主数据人工验证

- `/admin/batches`：列表、新增、编辑、停用
- `/admin/dictionaries`：列表、固定字典类型筛选、新增、编辑、停用
  - 进入页面后字典类型筛选默认显示“项目状态”
  - 初次加载应调用 project_status 字典项，不应先拉取全部普通字典
  - project_status 显示为“项目状态”
  - material_type 显示为“材料类型”
  - review_level 显示为“评审等级”
  - 字典类型筛选中不显示“全部”
  - 字典类型筛选中不显示“自定义类型”
  - 字典类型筛选只显示“项目状态”“材料类型”和“评审等级”
  - 切换到“材料类型”后列表加载 material_type 字典项
  - 切换到“评审等级”后列表加载 review_level 字典项
  - 新增项目状态时，提交的 `dictType` 为 `project_status`
  - 新增材料类型时，提交的 `dictType` 为 `material_type`
  - 新增评审等级时，提交的 `dictType` 为 `review_level`
  - 编辑评审等级时，弹窗只读展示“评审等级”，不能修改 `dictType`
  - 新增 / 编辑弹窗只读展示字典类型，不允许自由输入或修改 `dictType`
  - `code` 显示为“编码”并有说明
  - 新增/编辑弹窗中“名称”和“编码”输入框顶部对齐、高度一致
  - 当前类型暂无数据时，空状态显示“暂无项目状态字典项。”、“暂无材料类型字典项。”或“暂无评审等级字典项。”
- `/admin/tree-dictionaries`：树形缩进列表、树类型中文过滤、parent 缩进选择、新增根节点、添加子节点、编辑、停用
  - project_type 显示为“项目类型”
  - discipline 显示为“学科”
  - department 显示为“受理处室”
  - administrative_division 显示为“行政区划”
  - 顶部树类型筛选仍存在，可切换项目类型、学科、受理处室和行政区划
  - 初次进入默认只显示当前树类型第一层节点，子节点默认不显示
  - 有子节点的节点显示展开 / 收起按钮，叶子节点显示对齐占位
  - 点击展开后显示直接子节点，可继续逐层展开
  - 点击收起后隐藏该节点所有后代，再次展开时深层节点不自动展开
  - 切换树类型后展开状态重置，只显示新树类型第一层
  - 当前页面没有 keyword 搜索入口或请求参数；后续如接入 keyword，应保证命中节点不会被折叠隐藏
  - 列表每行中间信息列不显示“树类型：xxx”
  - 列表每行仍显示编码、排序和全称 / 完整路径信息
  - 新增/编辑弹窗中“名称 / 编码 / 父节点”控件对齐，高度一致
  - 新增根节点弹窗中父节点第一项显示“不选择父节点（作为一级节点）”
  - 新增/编辑弹窗父节点选项中不显示“根节点”作为空父节点文案
  - 新增根节点弹窗默认不勾选“显示全部层级”，父节点下拉默认只显示当前树类型一级节点
  - 勾选“显示全部层级”后父节点下拉显示全部层级，二级、三级节点缩进明显，不应几乎与一级节点左对齐
  - 父节点下拉中的空名称节点如存在，应显示“未命名节点”兜底，不应出现空白 option 文案
  - 取消勾选“显示全部层级”后，在未选中深层父节点时父节点下拉恢复只显示一级节点
  - 在深层节点点击“添加子节点”时，弹窗父节点应选中该节点并自动勾选“显示全部层级”，确保已选父节点在下拉中可见
  - 编辑有父节点的节点时，弹窗应自动勾选“显示全部层级”，原父节点在下拉中可见
  - 编辑节点时仍不能选择自己或自己的后代作为父节点
  - 树节点“添加子节点 / 编辑 / 停用”按钮使用紧凑尺寸，不抢占节点主体视觉
- `/admin/organizations`：分页、关键词搜索、行政区划缩进树选择、新增、编辑、停用
  - 行政区划只读取 `treeType=administrative_division`
  - 无行政区划数据时显示“暂无行政区划数据，请先在树形字典中维护行政区划。”
  - 主页面行政区划筛选下拉中，二级和三级行政区划应使用统一树形 option 缩进，层级差异明显
  - 新增 / 编辑单位弹窗行政区划下拉中，二级和三级行政区划应使用统一树形 option 缩进，选择值和保存 payload 不变
  - 不再需要或兼容 `treeType=region` 测试数据
  - 行内编辑 / 停用按钮保持紧凑协调
- `/admin/review-schemes`：列表、新增、编辑、停用、添加/删除评分项
  - 新增和编辑方案时评分项名称输入不失焦
  - 保存前 `clientId` 不提交给后端
- 后端返回 400/403/409/500 时，页面应显示错误提示

## 7. 项目评审组织人工验证

前提：

1. 后端运行在 `http://localhost:5001`
2. 前端运行在 `http://localhost:3001`
3. 使用 admin 用户登录
4. 系统中至少存在已导入项目、active review_manager 用户、active expert 用户、active review scheme，以及可用于验证学科匹配和单位回避的项目 / 专家数据

项目列表：

1. 进入 `/admin/projects`
2. 页面标题显示“项目评审组织”，不再显示只读阶段文案
3. 表格展示项目编号、名称、批次、项目类型、项目状态、学科、承担单位、评审负责人、评审方案、评审时间、评审地点、会议链接和组织状态
4. keyword 搜索项目编号或名称可用
5. 批次、项目类型、项目状态、评审负责人、评审方案筛选可用
6. 是否已分配负责人、是否已分配方案筛选可用
7. 分页可用
8. 当前页全选、单行选择、清空选择可用；切换筛选或分页后选择清空

单项目分配：

1. 在项目列表点击“分配”
2. 选择评审负责人和 / 或评审方案
3. 保存后提示成功，列表刷新并展示负责人和方案名称
4. 后端返回无效负责人、无效角色或无效方案时，页面显示友好错误

批量分配：

1. 勾选多个项目
2. 点击“批量分配负责人/方案”
3. 选择负责人和 / 或方案
4. 二次确认后提交
5. 页面展示 `successCount`、`failedCount` 和 failures 明细
6. failures 中的项目优先显示项目编号 / 名称

评审组织详情：

1. 点击“评审组织”进入 `/admin/projects/[projectId]/review-organization`
2. 页面展示项目基础信息、评审负责人、评审方案和组织状态
3. 修改分配可复用单项目分配弹窗
4. 设置评审时间、地点和会议链接后保存成功
5. meetingUrl 有值时可点击打开
6. 页面明确当前仅保存会议链接，不做腾讯会议 API、直播、推流或回看

项目材料：

1. 使用 project_owner 上传并提交至少一个材料后，admin 进入 `/admin/projects/[projectId]/review-organization`
2. 页面出现“项目材料”卡片
3. 材料列表展示文件名、材料类型、状态、上传人、上传时间、文件大小和备注
4. 上传人优先显示材料响应内联 `uploadedByUser` 的姓名和手机号；未内联时应复用页面已加载 users 映射显示“姓名（手机号）”
5. 当上传人确实不在 users 映射且材料响应也没有 inline 用户信息时，才允许显示“上传人（短ID）”；`uploadedByUserId` 缺失时显示“未知上传人”
6. `submitted` 材料显示“已提交评审”，`draft` 材料显示“草稿”，legacy `active` 材料显示“历史草稿”
7. 点击“下载”应调用 `GET /admin/projects/:id/materials/:materialId/download-url` 并打开后端返回 URL
8. 下载失败时卡片内显示错误，不白屏，不拼接 OSS objectKey
9. 点击“删除”打开删除项目材料弹窗，不得直接删除
10. 弹窗说明物理删除文件和材料记录、删除后不可恢复，且系统会保留删除审计日志
11. 遮罩应覆盖整个浏览器视口，顶部“评审安排”等卡片不应压在弹窗上方
12. 删除弹窗在最上层显示；标题、关闭按钮、风险说明、待删除材料、textarea、字数统计、错误提示区域、取消按钮和删除按钮均可见
13. 小屏或浏览器缩放 125% 时，弹窗 body 可滚动，footer 按钮保持可见并可点击
14. 长文件名不应撑破弹窗，删除原因 textarea 应有足够高度
15. 删除原因为空或 trim 后为空时不能提交，并显示“请填写删除原因。”
16. 删除原因超过 1000 字时不能提交
17. 填写删除原因后提交，调用 `DELETE /admin/projects/:id/materials/:materialId` 且 body 包含 `{ reason }`
18. 删除成功后提示“材料已删除，系统已保留删除审计。”并刷新材料列表
19. 删除失败时弹窗保留并显示错误，不在成功前从列表乐观移除
20. 404 显示“材料不存在或已被删除。”，403 显示“当前账号无权管理该材料。”，500 / storage 删除失败提示材料未删除并建议稍后重试或联系管理员
21. Network 中不得出现 project_owner / review_manager / expert 材料接口
22. 不调用 `/admin/users` 只为补上传人名称；只复用项目评审组织详情页已经加载的 users 映射
23. 不提供删除日志查询页面、材料恢复或文件预览

通用 Modal 回归：

1. 抽查“修改评审分配”弹窗，确认遮罩覆盖全屏、弹窗不被页面卡片遮挡、footer 可见、关闭按钮可用
2. 抽查项目导入行修正弹窗，确认内容过长时 body 区可滚动且 footer 可操作
3. 抽查 Excel 字段映射编辑弹窗，确认无 hydration 或 `document is not defined` 控制台错误
4. 抽查用户、批次、字典、树形字典、单位或评审方案页面的新增 / 编辑弹窗，确认默认尺寸和操作行为保持可用

专家候选与分配：

1. 在详情页查看专家候选
2. Network 使用 `GET /admin/projects/:id/expert-candidates`，已分配、追加、替换、移除和批量设置均使用 `/admin/projects*` 专家分配接口，不再调用 `/review-manager/projects*`
3. 页面显示“候选专家由后端按项目学科匹配，并自动回避承担单位和合作单位”
4. 候选专家显示姓名、手机号、单位、学科和是否已分配
5. keyword 搜索候选专家和分页可用
6. 项目缺少学科时显示“项目尚未维护学科，无法按学科筛选专家。请先修正项目学科。”
7. 候选为空时显示暂无符合学科与回避规则的专家
8. 选择候选专家后点击“追加到当前专家名单”，页面提示成功 / 失败数量并刷新已分配专家
9. 已分配专家表格展示评分状态：未开始、草稿、已提交或已退回
10. 无 `expert_reviews` 评分记录的已分配专家，“移除”按钮可用；二次确认文案说明仅未产生评分记录的专家可移除，确认后刷新列表且专家分配记录应物理删除
11. 有 `draft/submitted/returned` 评分记录的已分配专家，“移除”按钮禁用并提示“该专家已产生评分记录，不能移除”
12. 绕过前端直接调用 `DELETE /admin/projects/:id/experts/:expertUserId` 移除已有评分记录专家时，后端应返回 `409`，assignment 和 `expert_reviews` 均保留
13. 专家本人删除误保存的 draft 后，管理员刷新详情页，该专家移除按钮应恢复可用，移除后物理删除 assignment
14. 选择候选专家后点击“用选中专家替换当前名单”，二次确认文案应说明未被选中的原专家会被移除且已产生评分记录的专家不能被移除；确认后刷新已分配专家
15. 如果替换会移除已有评分记录专家，页面显示“部分已分配专家已产生评分记录，不能被替换移除。”，原已分配专家不应被乐观移除
16. 后端返回学科不匹配或单位冲突 failures 时，页面显示中文原因

批量设置专家：

1. 返回 `/admin/projects`
2. 勾选多个项目
3. 点击“批量设置专家”
4. 选择 active expert 用户和 append / replace 模式
5. 二次确认后提交
6. Network 调用 `PUT /admin/projects/experts/batch`
7. 页面展示 `successCount`、`failedCount` 和逐项目 results
8. 逐项目 result 标题优先显示项目编号和项目名称
9. 学科不匹配或单位冲突项目显示失败原因
10. 失败明细优先显示专家姓名和手机号，不应只显示专家 ObjectId
11. 专家映射缺失时显示“未知专家（短ID）”，不应显示一长串裸 ObjectId

## 8. 项目负责人工作台人工验证

前提：

1. 后端运行在 `http://localhost:5001`
2. 前端运行在 `http://localhost:3001`
3. 使用具有 `project_owner` 角色的用户登录
4. 当前用户至少是一个项目的 `ownerUserId`
5. 数据库中存在 active `material_type`、`project_status`、`project_type`、`discipline`、`department`、批次、单位、评审负责人和评审方案

角色守卫：

1. 未登录访问 `/project-owner` 应跳转 `/login`
2. 无 project_owner 角色访问 `/project-owner` 应显示 403
3. project_owner 用户可访问 `/project-owner`
4. 项目负责人页面不显示 AdminShell 侧边栏

Workspace 入口：

1. 登录 project_owner 用户，进入 `/workspace`
2. 项目负责人卡片显示“可进入”
3. 项目负责人卡片动作显示“进入项目负责人工作台”
4. 点击进入 `/project-owner`
5. admin 入口仍只对 admin 可进入
6. expert 入口单独显示“进入专家工作台”
7. client 入口显示“进入甲方监管看板”，review_manager 入口按评审负责人工作台既有逻辑可进入

项目列表：

1. 进入 `/project-owner/projects`
2. 能看到当前用户负责的项目
3. 不显示其他项目负责人的项目
4. 间接成功加载 `/portal/reference-data/dictionaries?dictTypes=material_type,project_status`
5. 间接成功加载 `/portal/reference-data/tree-dictionaries?treeTypes=project_type,discipline,department,administrative_division`
6. 间接成功加载 `/portal/reference-data/batches`、`/portal/reference-data/organizations`、`/portal/reference-data/review-schemes`、`/portal/reference-data/users?role=review_manager`
7. 批次、项目类型、项目状态、评审负责人、评审方案筛选均为 select，第一项为“全部”
8. 项目类型筛选下拉应使用统一树形 option 缩进，二级和三级项目类型层级明显
9. 筛选提交后端支持的对应 ID，不提交 keyword
10. 表格中批次、项目类型、项目状态、学科、承担单位、评审负责人、评审方案显示名称
11. 名称映射缺失时显示“未知项（短ID）”类兜底，不直接展示长 ObjectId
12. 分页可用
13. 空态提示联系管理员确认项目负责人绑定关系
14. reference-data 加载失败时显示错误和重试入口，不白屏
15. 点击“查看详情”进入项目详情页

项目详情与后续推进需求：

1. 进入 `/project-owner/projects/[projectId]`
2. 并发加载项目详情、材料列表和 portal reference-data
3. 显示项目编号、名称、批次名称、项目类型名称、项目状态名称、承担单位名称、合作单位名称、学科名称、受理处室名称、拨款总额、已拨款和材料数量
4. 显示评审负责人名称、评审方案名称、评审时间、评审地点和会议链接
5. 评审负责人名称优先来自项目详情响应 `reviewManager.name`；不得显示“未知评审负责人（短ID）”
6. 项目未设置评审负责人时显示“暂未设置评审负责人”
7. 项目设置了 `reviewManagerId` 但用户无法解析时显示“评审负责人信息暂不可用”，不显示短 ID
8. meetingUrl 有值时可打开
9. 页面说明当前仅展示会议链接，不接腾讯会议 API
10. 显示当前 followUpNeeds
11. 输入后续推进需求，字数计数正确
12. 超过 5000 字前端提示或禁止提交
13. 点击保存后调用 `PATCH /project-owner/projects/:id/follow-up-needs`
14. 保存成功后提示“后续推进需求已保存”
15. 清空内容并保存，如后端允许应成功
16. reference-data 加载失败时通用基础信息可用短 ID 兜底展示，上传区禁用并显示错误；评审负责人不得回退显示短 ID

材料管理：

1. 材料管理区能加载 active `material_type`
2. 上传区域材料类型 select 显示数据库实际维护的材料类型名称
3. 上传按钮在选择材料类型和合法文件后可用
4. 上传调用 `POST /project-owner/projects/:id/materials`，FormData 字段名为 `files/materialTypeId/remark`
5. 上传请求不手动设置 multipart `Content-Type`
6. 上传成功后显示 successCount / failedCount，并提示“新上传材料已保存为草稿，提交前评审负责人和专家不可见”
7. 上传成功后材料列表刷新，项目详情 materialCount 刷新，材料状态显示“草稿”
8. material_type 字典为空时提示尚未维护材料类型，上传按钮禁用
9. reference-data 加载失败时上传按钮禁用并显示具体错误
10. 不调用 `/admin/dictionaries`
11. 不写死“汇报 PPT、评价报告、证明材料、财务资料、其他”等材料类型 ID
12. 已上传材料列表展示材料类型名称、文件名、状态、大小、扩展名、上传时间和备注
13. 上传中文文件名材料，例如“评价报告-测试.docx”，材料列表应显示正常中文 `originalFilename`，不出现 mojibake；review-manager / admin / expert 可见的 submitted 材料列表也应显示同一文件名
14. 材料类型筛选项来自 portal `material_type`，显示名称
15. 材料响应内联 `materialType.name` 存在时优先展示；否则使用 portal material_type 映射；仍未命中时显示“未知材料类型（短ID）”
16. 草稿 `draft` 状态显示“草稿”，说明评审负责人和专家不可见，可删除
17. legacy `active` 状态显示“历史草稿”，可提交或删除
18. `submitted` 状态显示“已提交评审”，删除按钮禁用并提示“已提交评审，不能删除”
19. 点击“提交全部草稿材料”前出现二次确认，确认文案说明提交后评审负责人和专家可见，项目负责人不能再删除
20. 提交全部草稿材料调用 `POST /project-owner/projects/:id/materials/submit`
21. 提交成功后显示 submittedCount / alreadySubmittedCount / skippedCount，并刷新材料列表和项目详情 materialCount
22. skipped 非空时展示“部分材料未提交”明细，优先显示文件名，reason 中文化或原样兜底
23. 无草稿时“提交全部草稿材料”按钮禁用
24. 对草稿材料点击删除出现二次确认，文案说明会物理删除文件和材料记录且不可恢复
25. 对 legacy active 材料点击删除，确认文案提示历史草稿状态且物理删除不可恢复
26. 确认删除草稿后调用 project_owner DELETE，成功后刷新项目详情和材料列表
27. submitted 材料如通过异常方式触发 DELETE 并返回 409，页面显示“该材料已提交评审，项目负责人不能删除。如确需删除，请联系管理员。”
28. DELETE 返回 404 时显示“材料不存在或已被删除。”
29. storage 删除相关 500 应提示文件存储删除失败、材料未删除，并保留错误信息
30. 点击下载应调用 download-url 接口，并打开后端返回的签名 URL
31. 后端未返回 `url/downloadUrl/string` 时显示错误，不拼接 objectKey
32. 不提供材料恢复、admin 删除材料页面、删除日志查询、文件预览或自动提交上传后的材料
33. 后端停止、401、403、404、409、400、500 等错误态应显示友好错误，不应白屏

评审结果确认后项目负责人内容锁定：

1. 准备存在 confirmed 合议、或项目已有 `finalLevel` / `originalLevel` 的项目
2. 进入 `/project-owner/projects/[projectId]`
3. 页面显示统一提示：“评审结果已确认，项目材料和后续推进需求已锁定。如需补充说明，请通过申诉提交补充材料。”
4. 后续推进需求 textarea 禁用或只读，保存按钮隐藏或不可用
5. 材料上传区域不允许选择文件、材料类型或填写备注，上传按钮不可用或表单不渲染
6. “提交全部草稿材料”按钮禁用，点击不应打开提交确认弹窗
7. 材料列表筛选仍可用
8. 材料下载仍调用 project-owner download-url 并打开后端返回 URL
9. 草稿 / 历史草稿材料删除按钮禁用或隐藏，页面展示锁定原因
10. “查看评审结果与申诉”入口仍可用
11. `/project-owner/projects/[projectId]/review-result` 仍可查看 confirmed 合议、等级历史和本人申诉
12. submitted 状态申诉的申诉附件补充上传仍可用；已上传附件作为申诉材料留痕，不显示删除按钮且不能删除
13. 直接调用 `PATCH /project-owner/projects/:id/follow-up-needs`、`POST /materials`、`POST /materials/submit`、`DELETE /materials/:materialId` 应返回 `409 PROJECT_OWNER_CONTENT_LOCKED`
14. 直接调用 `GET /materials` 和 `GET /materials/:materialId/download-url` 应成功
15. 未锁定项目仍可编辑后续推进需求、上传材料、提交草稿材料和删除草稿材料

文件校验实现口径：

1. 上传面板已实现 20 个文件数量限制
2. 已实现单文件 500MB 限制
3. 已实现允许扩展名校验：pdf、ppt、pptx、doc、docx、xls、xlsx、jpg、jpeg、png、zip、rar、7z、txt、csv
4. 已实现禁止扩展名提示：exe、bat、cmd、sh、js、mjs、cjs、php、jsp、asp、aspx、dll、so、ps1
5. 不选择材料类型时提示
6. 不选择文件时提示
7. 超过 20 个文件时提示
8. 单文件超过 500MB 时提示
9. exe/js/bat 等禁止扩展名被前端拦截
10. pdf/pptx/docx/xlsx/jpg/zip 等允许扩展名可提交后端

## 9. 专家工作台人工验证

前提：

1. 后端运行在 `http://localhost:5001`
2. 前端运行在 `http://localhost:3001`
3. 使用具有 `expert` 角色的用户登录
4. 管理员已为某项目分配该专家
5. 项目已设置评审负责人、评审方案和 `reviewSchemeSnapshot`；建议至少准备一个 `admin + review_manager` 多角色用户作为项目评审负责人
6. 项目负责人已提交至少一个 submitted 材料用于下载验证
7. 数据库中存在 active 批次、`material_type`、`project_status`、评审负责人和评审方案基础数据
8. 如需验证提交时间窗口，准备一个 `reviewTime` 在未来的项目、一个 `reviewTime` 在过去的项目，以及一个 `reviewTime` 为空的历史兼容项目

Workspace 和守卫：

1. expert 登录后进入 `/workspace`
2. 专家卡片显示“可进入”和“进入专家工作台”
3. 点击进入 `/expert`
4. `/expert` 显示专家工作台标题、说明和“进入我的评审任务”入口
5. 无 expert 角色访问 `/expert` 或 `/expert/review-tasks` 应显示 403，不白屏
6. 专家页面不显示 AdminShell 或 ProjectOwnerShell 菜单

任务列表：

1. 进入 `/expert/review-tasks`
2. 能看到分配给当前专家的评审任务
3. Network 使用 `GET /expert/review-tasks`
4. 状态显示为未开始、草稿、已提交、已退回
5. 状态筛选支持 `not_started/draft/submitted/returned`
6. 批次、评审负责人、评审方案筛选可用，提交的是对应 ID
7. 批次、项目状态、评审负责人、评审方案尽量显示名称；评审负责人优先使用 `/expert/review-tasks` 响应内联 `project.reviewManager.name`，多角色 `admin + review_manager` 负责人不应显示为“未知评审负责人（短ID）”；映射缺失时显示“未知项（短ID）”
8. 分页可用
9. 点击“开始评分 / 继续评分 / 查看评分 / 修改重提”进入详情
10. 任务列表加载失败时显示“评审任务加载失败。”，不白屏
11. reference-data 加载失败时主列表仍可用，并提示部分名称将使用短 ID 兜底
12. Network 中专家任务列表不调用 `/admin/*`，不调用 project_owner / review_manager 接口补评审负责人名称

详情和材料：

1. 进入 `/expert/review-tasks/[projectId]`
2. Network 使用 `GET /expert/review-tasks/:projectId`
3. 页面展示项目编号、项目名称、批次、项目状态、评审负责人、评审方案、评审时间、地点、会议链接和后续推进需求；评审负责人优先使用详情响应内联 `project.reviewManager.name`
4. meetingUrl 有值时点击“打开会议链接”新窗口打开，不调用腾讯会议 API
5. 材料区域 Network 使用 `GET /expert/projects/:id/materials`
6. 材料列表只显示项目负责人已 submitted 材料
7. 如果项目负责人只有 draft 材料，专家材料列表为空，并显示“项目负责人提交评审后，专家才能看到材料。”
8. 点击材料下载只调用 `GET /expert/projects/:id/materials/:materialId/download-url`
9. 下载只打开后端返回的 `string/url/downloadUrl`，不拼接 objectKey
10. Network 中不得出现 admin / project_owner / review_manager 材料接口；不得出现 `/admin/*` 用户接口用于补评审负责人名称
11. 材料加载失败只影响材料卡片，不阻断评分表单

保存草稿：

1. not_started 任务进入详情时，评分项按评审方案快照初始化为空
2. 填写部分分数、评价描述、改进建议和重大问题标记
3. 点击“保存草稿”
4. 调用 `PUT /expert/review-tasks/:projectId`
5. 保存草稿允许 score、评价描述、改进建议为空
6. 已填写 score 小于 0 或大于 maxScore 时前端阻止保存并提示
7. 保存成功提示“评分草稿已保存”
8. 保存成功后刷新详情，任务状态可从未开始变为草稿
9. 保存失败显示后端错误，不清空表单
10. 即使项目 `reviewTime` 在未来，保存草稿按钮仍可用，保存成功仍调用 `PUT /expert/review-tasks/:projectId`

删除草稿：

1. not_started 任务进入详情时不显示“删除草稿”
2. 保存草稿成功后显示“删除草稿”危险按钮
3. 点击“删除草稿”出现二次确认，标题为“删除评分草稿”
4. 确认正文说明删除后已填写的评分、评价描述和改进建议会被清空，需要重新填写
5. 确认后调用 `DELETE /expert/review-tasks/:projectId/draft`
6. 删除中按钮禁用，避免重复点击
7. 删除成功显示“评分草稿已删除。”，并重新拉取任务详情和材料
8. 删除成功后详情状态回到 `not_started`，表单按评审方案快照初始化为空
9. 删除失败时显示友好错误，不清空当前表单，不跳转
10. 后端返回 `404` 时显示“未找到可删除的评分草稿。”
11. 后端返回 `409` 时显示“只有未提交的评分草稿可以删除。”
12. 项目 `reviewTime` 在未来时，保存草稿可用，删除草稿可用，提交评分仍禁用
13. Network 中不得出现 `/admin/*`、project_owner 或 review_manager 接口

提交评分：

1. 当项目 `reviewTime` 在未来时，页面显示“评审尚未开始，暂不能提交评分；可先保存草稿。”，提交按钮禁用，保存草稿按钮仍可用
2. 绕过前端直接调用 `POST /expert/review-tasks/:projectId/submit`，后端返回 `409 REVIEW_NOT_STARTED` 时页面错误映射为“评审尚未开始，暂不能提交评分。”，不清空表单、不跳转、不误标 submitted
3. 当项目 `reviewTime` 在过去或为空时，填写所有评分项 score
4. 填写所有评价描述
5. 对低于 `maxScore * suggestionRequiredThresholdRatio` 的评分项填写改进建议
6. 勾选“存在重大问题”的评分项必须填写改进建议
7. 点击“提交评分”
8. 出现二次确认，文案为“提交后评分将进入评审流程，除非评审负责人退回，否则不能再修改。确认提交评分吗？”
9. 确认后调用 `POST /expert/review-tasks/:projectId/submit`
10. 提交成功提示“评分已提交”，刷新详情，表单变为只读
11. 返回列表后任务状态显示已提交，总分显示
12. 后端返回 400 时显示后端具体 message，不清空表单
13. 后端返回普通 409 时显示“评分已提交，不能修改。”

提交校验：

1. score 为空提交，提示“分数为必填项。”
2. score 非数字、负数或超过 maxScore，前端提示并阻止提交
3. evaluationDescription 为空提交，提示“评价描述为必填项。”
4. score 低于阈值且 improvementSuggestion 为空，提示“该项得分低于阈值，请填写改进建议。”
5. hasMajorIssue 勾选且 improvementSuggestion 为空，提示“已标记重大问题，请填写改进建议。”
6. 满分且未勾选重大问题时 improvementSuggestion 可为空
7. 非满分但未低于阈值时可提示建议填写，但不强制

submitted 和 returned：

1. submitted 详情页表单只读
2. submitted 不显示“保存草稿”“提交评分”和“删除草稿”按钮
3. submitted 显示提交时间和最终提交分
4. returned 详情页显示退回时间和退回原因
5. returned 表单可编辑但不显示“删除草稿”
6. returned 可保存草稿
7. returned 在 `reviewTime` 未到时仍可保存草稿，但“重新提交评分”禁用并显示评审未开始提示
8. 重新提交成功后状态变为 submitted
9. 直接调用 submitted 或 returned 记录的 DELETE 草稿接口应返回 `409`，评分记录仍存在且状态不变

回归边界：

1. 评审负责人合议已在 `/review-manager` 接入，专家端仍不调用 review_manager 接口
2. 不实现 admin 查看专家评分前端
3. 专家端不实现 AI 合议，不混入甲方看板、腾讯会议 API 或文件预览
4. admin 项目材料查看 / 删除仍正常
5. project_owner 材料上传 / 提交 / 删除草稿仍正常

## 10. 评审负责人合议工作台人工验证

前提：

1. 后端运行在 `http://localhost:5001`
2. 前端运行在 `http://localhost:3001`
3. 使用具有 `review_manager` 角色的用户登录
4. 管理员已为至少一个项目分配该评审负责人和评审方案
5. 项目已分配专家；至少准备 submitted、draft、returned、not_started 中的若干评分状态用于验证
6. 系统中存在 active 批次、`project_status`、`review_level`、评审方案、单位、项目负责人等 portal reference-data

Workspace 和守卫：

1. review_manager 登录后进入 `/workspace`
2. 评审负责人卡片显示“可进入”和“进入评审负责人工作台”
3. 点击进入 `/review-manager`
4. `/review-manager` 显示评审负责人工作台标题、说明和“进入负责项目”入口
5. 只有 admin 角色且没有 review_manager 角色的用户不应在 workspace 看到可进入的评审负责人入口
6. 无 review_manager 角色访问 `/review-manager`、`/review-manager/projects` 或详情页应显示 403，不白屏
7. `/review-manager` 左侧导航不显示“返回工作台”，顶部右侧仍显示“返回工作台”

负责项目列表：

1. 进入 `/review-manager/projects`
2. Network 使用 `GET /review-manager/projects`
3. 列表只展示当前评审负责人负责的项目
4. 表格展示项目编号、项目名称、项目类型、承担单位、项目负责人、项目状态、评审方案、评审时间和评审地点
5. keyword 筛选项目编号或名称可用
6. 批次、项目状态、评审方案筛选可用
7. 分页可用
8. 名称映射优先使用 portal reference-data，映射缺失时显示“未知项（短ID）”
9. reference-data 加载失败时主列表仍可用，并提示部分名称将使用短 ID 兜底
10. 点击“进入合议”进入 `/review-manager/projects/[projectId]`
11. admin + review_manager 多角色用户进入该列表时，也只展示自己作为 `reviewManagerId` 的项目
12. 只有 admin 角色直接请求 `/review-manager/projects` 不应返回全量项目

项目详情：

1. 进入 `/review-manager/projects/[projectId]`
2. 项目摘要 Network 不应出现 `GET /review-manager/projects/:id`
3. 项目摘要不应调用 `/admin/projects/:id`
4. 项目摘要通过 `GET /review-manager/projects?page=1&pageSize=1000` 后按 `projectId` 匹配
5. 摘要匹配成功时展示项目编号、名称、批次、类型、状态、承担单位、合作单位、项目负责人、评审方案、评审时间地点和评分方案总分
6. 摘要未匹配时显示“项目摘要不可用或无权限”，不展示评审组织 / 合议 / 申诉处理入口，也不展示专家评分、汇总和合议操作区域
7. 各区域加载失败时只显示该区域错误，不拖死整页
8. admin + review_manager 多角色用户手动输入非自己负责项目详情时，review-manager 专家分配、评分、汇总和合议接口应显示 403 或无权限错误；页面不得展示项目内操作入口、确认表单、退回按钮或内部 ObjectId

专家分配：

1. 页面显示“评审组织 / 专家分配”区块
2. Network 使用 `GET /review-manager/projects/:projectId/experts` 加载已分配专家
3. Network 使用 `GET /review-manager/projects/:projectId/expert-candidates` 加载候选专家
4. 候选专家说明文案为“候选专家由后端按项目学科匹配，并自动回避承担单位和合作单位。”
5. 候选专家 keyword 搜索和分页可用
6. 未选择候选专家时“追加到当前专家名单”和“用选中专家替换当前名单”应禁用，异常触发时提示“请先选择候选专家。”
7. 选择候选专家后点击“追加到当前专家名单”，确认文案说明会保留当前已分配专家并新增本次选中候选专家
8. 追加成功后重新拉取已分配专家、候选专家、专家评分列表、评分汇总和合议记录
9. 选择候选专家后点击“用选中专家替换当前名单”，确认文案说明未被选中的原专家会被移除，已产生评分记录的专家不能被移除
10. 替换成功后重新拉取已分配专家、候选专家、专家评分列表、评分汇总和合议记录
11. 无评分记录的已分配专家“移除”可用，移除前必须二次确认，成功后重新拉取权威数据
12. 已产生 `draft/submitted/returned` 评分记录的专家“移除”禁用；绕过前端直接 DELETE 时后端应返回 `409`

专家评分：

1. 专家评分列表 Network 使用 `GET /review-manager/projects/:projectId/expert-reviews`
2. 列表展示专家姓名、手机号、单位、状态、总分、提交时间和退回时间
3. 状态显示为未开始、草稿、已提交、已退回
4. 只有 submitted 状态显示“退回”按钮；若当前合议已 confirmed，即使专家评分为 submitted，也只显示“查看详情”，不显示“退回”
5. 点击“查看详情”调用 `GET /review-manager/projects/:projectId/expert-reviews/:expertUserId`
6. 详情展示专家基本信息、评分方案、每个评分项的满分、得分、打分说明、评价描述、改进建议和重大问题 Badge
7. “重大问题”不得作为三等分大列占据宽度；应在评分项标题行或得分旁以“重大问题 / 无重大问题”紧凑 Badge 展示
8. 后端返回 not_started 初始化记录时显示“该专家尚未开始评分”，不作为错误
9. 详情中的退回原因、提交时间和退回时间按后端返回展示

退回评分：

1. 在合议未 confirmed 的项目中，点击 submitted 专家的“退回”打开退回弹窗
2. 退回原因为空或 trim 后为空时不能提交
3. 退回原因超过 1000 字时不能提交
4. 提交前出现二次确认
5. 确认后调用 `POST /review-manager/projects/:projectId/expert-reviews/:expertUserId/return`
6. 成功后关闭弹窗并重新加载专家评分列表、评分汇总和当前专家评分详情
7. 后端返回 403、404、409 或 400 时显示后端错误消息，不吞错，不乐观修改列表

评分汇总：

1. Network 使用 `GET /review-manager/projects/:projectId/review-summary`
2. 展示 assignedExpertCount、submittedExpertCount、draftExpertCount、returnedExpertCount、notStartedExpertCount
3. averageScore、minScore、maxScore 为空时显示“暂无”
4. perItemAverageScores 为空时显示空态
5. 前端不自行计算后覆盖后端汇总结果

合议草稿：

1. 首次进入调用 `GET /review-manager/projects/:projectId/consensus`
2. 返回 404 时页面显示“暂无合议草稿”，不作为页面级错误
3. 点击“生成合议草稿”调用 `POST /review-manager/projects/:projectId/consensus/draft`，默认不带 `force`
4. 生成成功后显示 draftOpinion、draftScore、draftGeneratedAt、draftSource 和 expertReviewStats，并刷新合议与评分汇总
5. 已有 draft 时再次生成，先由后端返回 409，再提示用户确认覆盖
6. 用户确认覆盖后重新调用 draft 接口并携带 `force=true`
7. 已 confirmed 状态不显示覆盖草稿入口
8. confirmed 状态若后端返回不可覆盖错误，页面展示错误，不继续 force

确认合议：

1. finalOpinion 必填，trim 后为空不能提交
2. finalOpinion 超过 10000 字不能提交
3. finalScore 必填且必须是数字
4. 能获取评分方案总分时，finalScore 必须在 `0..totalScore`
5. finalLevel 必填
6. finalLevel 优先使用 active `review_level` 字典项，提交值为 code，显示 name；字典为空时使用 A/B/C/D
7. 有 draft 时可点击“使用草稿填入”
8. 页面不再显示“本次确认以当前草稿为基础”复选框
9. 点击“使用草稿填入”只填入最终意见和最终分数
10. 提交调用 `POST /review-manager/projects/:projectId/consensus/confirm`
11. Network 请求 body 只包含 `finalOpinion/finalScore/finalLevel`，不得包含 `useDraftAsBase`
12. 提交成功后重新加载 consensus 和项目摘要，显示 confirmed 结果
13. 首次提交成功后重新加载 consensus 和项目摘要，页面进入 confirmed 只读状态
14. 已 confirmed 后页面不显示“重新确认最终结论”按钮，不显示 finalOpinion textarea、finalScore input、finalLevel select，不显示“使用草稿填入”，专家评分列表不显示“退回”按钮
15. 已 confirmed 页面显示只读说明：“最终合议结论已确认。如项目负责人提出异议，请通过申诉流程处理；如需更正录入错误，应走后续专门更正流程。”
16. 旧页面状态、并发或手工请求导致 `POST /consensus/confirm` 返回 `409 CONSENSUS_ALREADY_CONFIRMED` 时，页面展示后端业务 message 并重新拉取 consensus
17. 已 confirmed 记录中的“确认人”应显示确认人姓名；后端返回手机号时显示“姓名（手机号）”
18. 如可模拟 `confirmedByUserId` 对应用户不存在，页面应正常打开并显示“确认人信息暂不可用”
19. “确认人”不得显示“用户（短ID）”、原始 ObjectId、unknown user 或 `confirmedByUserId` 原始值

回归边界：

1. project_owner 页面仍可访问
2. expert 页面仍可访问
3. admin 页面仍可访问
4. Network 中不得出现 `/admin/projects/:id` 用于评审负责人项目摘要
5. 合议页不出现甲方看板、腾讯会议、真实 AI、文件预览、材料上传 / 删除或批量操作入口；申诉处理入口应位于项目总览或申诉页，不混入合议表单

## 10.1 申诉闭环人工验证

前提：

1. 后端运行在 `http://localhost:5001`
2. 前端运行在 `http://localhost:3001`
3. 存在一个已 confirmed 合议且包含 `finalLevel` 的项目；另准备或模拟一个 `project.finalLevel` 为空但 `consensus.finalLevel` 有值的历史数据项目
4. 系统中存在 active `review_level` 字典项；为空时前端使用 A/B/C/D 兜底
5. 准备 project_owner、review_manager 和 admin 三类账号；review_manager 必须是该项目负责人

项目负责人查看结果与提交申诉：

1. project_owner 登录后进入 `/project-owner/projects/[projectId]`
2. 点击“查看评审结果与申诉”，进入 `/project-owner/projects/[projectId]/review-result`
3. Network 使用 `GET /project-owner/projects/:id/consensus`、`GET /project-owner/projects/:id/level-history`、`GET /project-owner/projects/:id/appeals`
4. `GET /consensus` 返回 404 时页面显示暂无已确认合议，不应白屏
5. 已 confirmed 且有效最终等级 `project.finalLevel ?? consensus.finalLevel` 存在时展示最终意见、最终分数、最终等级和专家统计
6. 当 `project.finalLevel` 为空但 `consensus.finalLevel` 有值时，“已确认合议结果”区域显示最终等级，“发起申诉”区域不应提示“项目尚无最终等级”，发起申诉按钮可打开弹窗
7. 当 `project.finalLevel` 和 `consensus.finalLevel` 都为空时，提交申诉入口仍禁用并显示“项目尚无最终等级，暂不能发起申诉。”
8. 无 confirmed 合议、无有效最终等级、已有 3 次申诉或存在 submitted / processing 申诉时，提交申诉入口禁用并显示原因
9. 填写 1-2000 字申诉理由，可选择附件，点击提交前出现确认
10. 提交 Network 使用 `POST /project-owner/projects/:id/appeals`，FormData 字段为 `reason` 和可选 `files`
11. 历史数据项目提交成功后，申诉详情中的 `levelBeforeAppeal` 应等于 `consensus.finalLevel`，重新请求项目详情后 `project.finalLevel` 应已被后端懒回填
12. 成功后关闭弹窗，重新拉取申诉列表、等级历史和项目详情，不只在前端追加假数据
13. 等级变更历史操作人显示姓名；有手机号时显示“姓名（手机号）”
14. 操作人用户不可解析时显示“操作人信息暂不可用”，无操作人时显示“-”
15. 等级变更历史不显示操作人短 ID、ObjectId 或“用户（短ID）”
16. 等级变更历史不显示“关联申诉 6a3f...eb3e”这类短 ID；存在关联申诉且页面可构造链接时显示“查看关联申诉”，点击进入项目负责人申诉详情
17. 原因区域只显示业务原因 / 处理意见，不拼接内部申诉 ID

项目负责人申诉附件：

1. 从申诉列表进入 `/project-owner/projects/[projectId]/appeals/[appealId]`
2. Network 使用 `GET /project-owner/projects/:id/appeals/:appealId`、`GET /attachments`
3. submitted 状态显示上传附件入口，不显示删除附件按钮
4. submitted 状态显示提示：“申诉提交后，已上传附件将作为申诉材料留痕，不能删除；处理前可继续补充上传材料。”
5. 上传附件调用 `POST /project-owner/projects/:id/appeals/:appealId/attachments`，FormData 字段为 `files` 和可选 `remark`
6. 上传成功后重新拉取申诉详情和附件列表，新上传附件同样不显示删除按钮
7. 上传中文文件名附件，例如“申诉补充材料-测试.pdf”，项目负责人附件列表应显示正常中文 `originalFilename`，不出现 mojibake
8. review_manager 和 admin 打开同一申诉详情时，附件列表也应显示正常中文文件名
9. 直接请求 `DELETE /project-owner/projects/:id/appeals/:appealId/attachments/:attachmentId` 返回 `409 PROJECT_APPEAL_ATTACHMENT_DELETE_NOT_ALLOWED`
10. DELETE 返回 409 后附件仍在列表中，下载仍可用，`deletedAt/deletedByUserId` 不应被写入
11. accepted / rejected 状态附件只读，不显示上传或删除
12. 下载附件只调用 project-owner 命名空间 `download-url`，只打开后端返回 URL，不拼接 OSS objectKey

评审负责人处理申诉：

1. review_manager 登录后进入 `/review-manager/projects/[projectId]`
2. 点击“申诉处理”进入 `/review-manager/projects/[projectId]/appeals`
3. Network 使用 `GET /review-manager/projects/:id/appeals`，不得调用 `/admin/projects/:id/appeals`
4. 进入详情 `/review-manager/projects/[projectId]/appeals/[appealId]`
5. 附件列表和下载只调用 review-manager 命名空间，页面不提供上传或删除
6. submitted / processing 状态显示处理表单；accepted / rejected 状态只读
7. 选择 rejected 时必须填写 1-2000 字处理意见，不提交 `newFinalLevel`
8. 选择 accepted 时必须填写处理意见并选择新最终等级，提交值优先为 active `review_level.code`
9. 提交调用 `POST /review-manager/projects/:id/appeals/:appealId/handle`
10. 成功后重新拉取申诉详情、附件和项目摘要，不调用不存在的 `/review-manager/projects/:id/level-history`

管理员处理申诉：

1. admin 登录后进入 `/admin/projects/[projectId]/review-organization`
2. 点击“查看申诉”进入 `/admin/projects/[projectId]/appeals`
3. Network 使用 `GET /admin/projects/:id/appeals` 和 `GET /admin/projects/:id/level-history`
4. 进入详情 `/admin/projects/[projectId]/appeals/[appealId]`
5. 附件只读下载，下载只调用 admin 命名空间 `download-url`
6. submitted / processing 状态可 accepted / rejected；accepted 必须选择新最终等级，rejected 不提交新等级
7. 提交调用 `POST /admin/projects/:id/appeals/:appealId/handle`
8. 成功后重新拉取申诉详情、附件、等级历史和项目详情
9. 等级变更历史只展示后端 `level-history` 返回数据，前端不得自行生成等级变更记录
10. 等级变更历史操作人不显示短 ID；可构造关联申诉链接时显示“查看关联申诉”，点击进入 admin 申诉详情

回归边界：

1. 三类角色申诉接口命名空间不得混用
2. 申诉附件下载不得拼接 OSS objectKey
3. project_owner 只能看到本人项目和本人申诉
4. review_manager 只能处理自己负责项目的申诉
5. admin 仍通过 admin 命名空间处理项目申诉

## 10.2 甲方看板人工验证

前提：

1. 后端运行在 `http://localhost:5001`
2. 前端运行在 `http://localhost:3001`
3. 准备具备 `client` 角色的账号，以及不具备 `client` 角色的普通账号
4. 系统中存在项目、批次、项目类型、项目状态、受理处室、学科、单位、评审负责人、评审方案、专家分配、专家评分、合议和申诉测试数据

最小闭环：

1. 使用 client 角色账号登录，进入 `/workspace`
2. client 卡片显示“可进入”，动作文案为“进入甲方监管看板”
3. 点击进入 `/client`
4. Network 使用 `GET /client/dashboard/overview` 加载总览统计
5. Network 使用 `GET /client/dashboard/projects` 加载项目钻取列表
6. Network 使用 `/portal/reference-data/*` 读取名称映射，且不查询 admin 用户
7. 页面显示项目总数、已安排评审、已分配专家、专家评分完成、合议已确认、已定等级、处理中申诉项目等总览卡片
8. 页面显示拨款总额、已拨款、拨付率和专家提交率
9. 页面显示申诉总数、待处理申诉、已通过申诉和等级调整申诉
10. 页面使用轻量条形图展示最终等级、进度阶段、项目类型、项目状态、受理处室和批次分布，不引入 chart 库
11. 项目钻取列表展示项目编号 / 名称、批次、类型、状态、承担单位、项目负责人、受理处室、评审负责人、评审方案、主阶段、有效最终等级、专家评分提交数、材料数、申诉数、评审时间、地点和会议入口
12. 展开项目行内详情，能看到 stages、consensus、latestAppeal、资金、学科、合作单位、原始等级和更新时间等摘要；不应额外调用项目详情 API
13. keyword 能筛选项目编号 / 项目名称
14. batchId / projectTypeId / statusId / departmentId / disciplineId / reviewManagerId / reviewSchemeId / finalLevel / progressStage / hasMeetingUrl / hasPendingAppeal 筛选能触发 overview 和 projects 请求，并在筛选变化后回到第 1 页
15. progressStage 筛选文案应体现“命中进度阶段”，不得误导为只等于 `primaryStage`
16. 分页上一页 / 下一页只重新拉取 projects，不要求 overview 重算
17. `meetingUrl` 存在时显示“进入会议 / 直播”外链，`target="_blank"` 且 `rel="noreferrer"`；不存在时显示“未配置”
18. reference-data 加载失败时显示“基础数据名称加载失败，部分名称将以兜底形式展示”类 warning；overview/projects 成功时主体仍可展示 raw / fallback 名称
19. 无符合条件项目时显示“暂无符合条件的项目”
20. 后端停止、401、403、400、500 等错误态应显示友好错误，不应白屏
21. 无 client 角色账号访问 `/client` 显示 403
22. 未登录访问 `/client` 跳转 `/login`
23. admin / review-manager / expert / project-owner 原有入口仍可进入，不受 client 入口影响

边界：

1. 甲方看板只读，不提供写操作
2. 不调用 admin / review-manager / expert / project-owner 业务接口作为甲方能力
3. 不接腾讯会议 API、直播、推流、回看或会议状态同步
4. 不做文件预览、材料下载、申诉处理、专家评分详情查看、Excel / PDF 导出或真实 AI 汇总

## 11. 用户管理人工验证

- `/admin/users` 可访问，侧边栏“用户管理”入口正常显示并可选中
- 用户列表加载成功，不显示 `passwordHash`
- keyword 搜索姓名或手机号可用
- 角色筛选和启用状态筛选可用
- 分页可用
- 新增评审负责人、专家、项目负责人用户成功
- 新增专家时可选择单位和学科；单位为多选，学科为树形/缩进多选
- 新增用户初始密码留空时前端不提交 `password`，由后端默认手机号
- 编辑用户姓名、角色、单位、学科、启用状态、`mustChangePassword` 成功
- 编辑用户时手机号只读，前端不提交 `phone/password/passwordHash`
- 停用用户前有二次确认；当前登录 admin 自己的停用快捷操作禁用或后端返回 409 并清楚显示
- 重置密码成功；新密码留空时前端不提交 `password`，由后端默认手机号
- 使用重置后的密码登录成功
- 原有 `/admin/dictionaries`、`/admin/tree-dictionaries`、`/admin/organizations`、`/admin/review-schemes`、`/admin/projects` 仍正常

## 12. 项目导入人工验证

前提：

1. 后端运行在 `http://localhost:5001`
2. 前端运行在 `http://localhost:3001`
3. 使用 admin 用户登录
4. 人工联调建议使用 `reviewx_dev`
5. 系统中至少存在启用批次、项目类型、项目状态、学科、受理处室、行政区划、单位和 `project_owner` 用户

最小闭环：

1. 登录 admin，进入 `/admin/project-imports`
2. 不选择批次或文件上传，应显示前端校验提示
3. 选择非 `.xlsx/.xls` 或超过 10MB 文件，应显示前端校验提示
4. 选择批次并上传合法 Excel，上传成功后任务列表刷新
5. 任务列表可按批次、任务状态和 keyword 筛选，可分页
6. 点击任务进入 `/admin/project-imports/[jobId]`
7. 查看任务基础信息、统计卡片、fieldMapping 和行列表，行列表列名应显示“Excel 行号”，第一条数据通常为 Excel 行号 2
8. 行列表可按状态和 keyword 筛选，可分页
9. 打开一条 `pending_confirmation` 行，确认 raw / normalized / resolved / issues 可读
10. issues 中文提示可读；如有 candidates，可点击“采用此候选”填入对应 resolved 字段
11. 选择已有项目类型、项目状态、项目负责人、单位、学科、受理处室后保存，行重新评估
12. 查看 / 修正弹窗中“选择已有项目类型”“选择已有受理处室”和“创建新承担单位”里的行政区划下拉应使用统一树形 option 缩进，二级和三级节点层级明显
13. 勾选“创建新承担单位”，填写名称、联系人、联系电话、行政区划后保存，后端通过 `createOrganization` 创建并重新匹配
14. 勾选“创建新项目负责人用户”，填写姓名、手机号、关联单位、关联学科后保存，后端通过 `createOwnerUser` 创建并重新匹配
15. 对一条 `importable` 行点击“确认入库”，二次确认文案使用“Excel 第 X 行”，确认后行变为 `confirmed`，任务统计刷新
16. 对一条 `pending_confirmation` / `failed` / `importable` 行点击“跳过”，二次确认文案使用“Excel 第 X 行”，确认后行变为 `skipped`，任务统计刷新
17. 点击“批量确认可导入行”，二次确认提示只处理 `importable` 行，完成后显示 successCount / failedCount / skippedCount 并刷新统计和行列表
18. 到 `/admin/projects` 查看导入或更新后的项目；项目类型筛选下拉应使用统一树形 option 缩进
19. 上传一个新的 Excel 且不确认入库，回到任务列表点击“删除”，二次确认应说明只删除导入任务和行级解析记录、不删除已入库项目、已有确认入库任务不能删除
20. 确认删除后应提示“已删除导入任务，并清理 X 条行记录。”，任务列表刷新且该任务不再出现，直接访问该任务详情应显示不存在或加载失败
21. 上传并至少确认一行入库后回到任务列表，删除按钮应禁用；如绕过前端调用删除接口，后端 409 应展示“该导入任务已有项目确认入库，不能删除导入记录。”
22. 删除未确认导入任务后，到 `/admin/projects` 确认正式项目没有被误删
23. 后端停止、401、403、404、409、400、500 等错误态应显示友好错误，不应白屏

## 13. Excel 字段映射配置人工验证

前提：

1. 后端运行在 `http://localhost:5001`
2. 前端运行在 `http://localhost:3001`
3. 使用 admin 用户登录
4. 后端已包含 `/admin/project-import-field-mappings*` 管理接口

最小闭环：

1. 登录 admin，进入 `/admin/project-import-field-mappings`
2. 确认页面显示全部标准字段、字段名称、必填状态、配置状态、启用状态、默认别名、自定义别名和最终生效别名
3. 确认未配置字段显示“使用默认”，最终生效别名等于默认别名
4. 使用 keyword 搜索字段名称、standardField 或别名
5. 使用 isActive 筛选启用和停用状态，点击重置恢复全部
6. 找到 `projectNo` 或其他标准字段，点击编辑，输入新别名并保存
7. 保存成功后列表刷新，显示已配置、启用、自定义别名和最终生效别名
8. 再次编辑该字段，修改别名和备注并保存，确认列表刷新
9. 别名全为空时保存，应显示“请至少填写一个字段别名”
10. 别名存在重复行时保存，应显示重复别名提示；空行应被过滤，不提交纯空白别名
11. 配置一个已被其他字段使用的别名，后端返回 409 时应显示“字段别名已被其他标准字段使用，请更换别名”
12. 对已配置启用字段点击停用，二次确认文案应说明停用后回退默认别名、不会禁用标准字段；确认后列表刷新
13. 对已停用字段点击启用，确认后列表刷新，最终生效别名使用自定义别名
14. 对任意标准字段点击重置默认，二次确认文案应说明这是创建或覆盖配置，不是删除配置；确认后 `aliases=defaultAliases` 且 `isActive=true`
15. 对已配置字段点击删除配置，二次确认文案应说明删除自定义配置后回退默认别名；确认后该字段仍在列表中且 `isConfigured=false`
16. 与项目导入页面联动验证：给 `projectNo` 配置新别名后上传对应表头 Excel，导入任务详情 `fieldMapping` 应映射到 `projectNo`；删除配置后默认表头仍能识别
17. 后端停止、401、403、400、404、409、500 等错误态应显示友好错误，不应白屏

## 14. 当前不验证

- 用户自助改密
- 忘记密码
- 短信验证码
- 用户批量导入
- 权限矩阵配置
- 腾讯会议直播 / 推流 / 回看 / API 集成
- 真实 AI
- 前端 E2E 自动化
