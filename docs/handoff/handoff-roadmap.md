# ReviewX / 科评星 handoff 路线图

## 1. 文档定位

- 本文档是 ReviewX / 科评星跨会话、跨阶段的 handoff 路线图。
- 本文档不是正式产品方案，也不是客户文档。
- 本文档用于 GPT / Codex 接续开发时快速理解当前工程状态、未完成能力和建议后续阶段。
- 本文档是活文档。每次阶段性 Codex 执行后，如果阶段状态、接口口径、阶段顺序或未完成清单发生变化，应同步更新本文档。
- 本文档不替代 backend / frontend handoff 细节。接口、DTO、组件、路由、验证和测试细节仍以对应 handoff 文档为准。

## 2. 当前承接状态

本路线图描述的是截至“ReviewX 第四阶段补丁五：管理员项目材料查看与删除前端接入”完成后的项目状态。
本路线图不固定记录最新 Commit；最新代码基线以用户在会话中提供的 Commit 或 GitHub main 分支最新 Commit 为准。
具体接口、DTO、组件、测试和阶段变更细节，以 backend / frontend handoff snapshot、api-map、dto-cheatsheet、component-map、testing-playbook 和 changelog 为准。

## 3. 项目目标概述

ReviewX / 科评星是“科技项目评审协同与监管平台”，核心业务闭环如下：

```text
管理员维护主数据和用户
→ Excel 导入项目并处理待确认数据
→ 分配评审负责人和评审方案
→ 评审负责人安排评审时间地点和专家
→ 项目负责人填写后续推进需求并上传材料
→ 专家查看材料并评分
→ 评审负责人查看专家评分、退回、汇总并确认合议
→ 项目负责人查看合议结果并申诉
→ 评审负责人或管理员处理申诉
→ 等级变更留痕
→ 甲方通过看板监管整体评审进展和结果
```

## 4. 已完成能力

### 4.1 后端已完成

- 认证与 Session：
  - 手机号 + 密码登录
  - HttpOnly Cookie Session
  - `/auth/me`
  - `reviewx_session`
  - 管理员权限 guard
- 用户基础与管理员用户 API：
  - `roles`
  - `isActive`
  - `organizationIds`
  - `disciplineIds`
  - `mustChangePassword`
  - `/admin/users`
  - 创建用户默认密码为手机号
  - 重置密码默认手机号
  - `passwordHash` 不返回
  - 管理员自我保护与最后启用 admin 保护
- 主数据：
  - `batches`
  - `dictionaries`
  - `tree-dictionaries`
  - `organizations`
  - `review-schemes`
  - `projects`
- 行政区划口径：
  - `treeType` 统一为 `administrative_division`
  - `Organization.regionId` 字段名保留
  - 历史 `region` 口径不再使用
- Excel 导入后端：
  - `ProjectImportJob`
  - `ProjectImportRow`
  - 上传解析
  - 上传任务保存 `originalFilename` 前会对 multipart 中文文件名 mojibake 做保守修正，正常中文和英文文件名保持原样
  - 删除未确认入库的导入任务和导入行，禁止删除 `parsing` 或已有 confirmed 行的任务，且不删除正式项目
  - 学科字段使用不包含顿号 `、` 的专用多值拆分规则，学科名内部顿号不再被当作分隔符；合作单位等通用多值字段仍保留顿号拆分
  - 自动匹配
  - 待确认
  - 行修正
  - 确认入库
  - 字段映射配置后端化：
    - `project_import_field_mappings`
    - 固定标准字段枚举
    - 管理员维护别名、启用/停用和备注
    - 标准字段清单与默认内置别名查询
    - 上传解析优先使用数据库启用配置
    - 未配置或停用时回退 `PROJECT_IMPORT_FIELD_ALIASES`
- 评审分配后端：
  - 管理员分配 `reviewManagerId` / `reviewSchemeId`
  - `reviewSchemeSnapshot`
  - 评审安排
  - 专家候选
  - 单位回避
  - 专家分配
- 材料后端：
  - Storage 抽象层
  - fake / oss
  - `ProjectMaterial`
  - 项目负责人上传
  - 新上传材料默认 `draft`
  - 项目负责人提交材料后进入 `submitted`
  - legacy `active` 按草稿兼容，可删除或提交
  - 评审负责人 / 专家只可见和下载 `submitted` 材料
  - 项目负责人仅可物理删除 `draft/legacy active`，`submitted` 返回 `409`
  - admin 删除材料必须填写原因，并物理删除 storage object 和 `project_materials` 主记录
  - `project_material_deletion_logs` 保留删除审计快照
  - 项目材料上传保存前复用通用上传文件名规范化工具，新上传中文材料名不再因 multipart 文件名 mojibake 入库；历史乱码材料不自动迁移
  - 专家 / 评审负责人 / admin 查看与下载 URL
- 门户端只读基础数据后端：
  - `/portal/reference-data/dictionaries`
  - `/portal/reference-data/tree-dictionaries`
  - `/portal/reference-data/batches`
  - `/portal/reference-data/organizations`
  - `/portal/reference-data/review-schemes`
  - `/portal/reference-data/users`
  - 允许 `project_owner`、`expert`、`review_manager`、`client`、`admin` 登录读取展示型最小摘要
  - 用户摘要必须按 `review_manager`、`expert` 或 `project_owner` 过滤，禁止查询 admin 用户
- 评分与合议后端：
  - `ExpertReview`
  - `ConsensusReview`
  - 专家草稿 / 提交
  - 条件必填建议
  - 退回重提
  - 汇总
  - `rule_based` 合议草稿
  - 人工确认最终等级
- 申诉后端：
  - `ProjectAppeal`
  - `ProjectAppealAttachment`
  - `ProjectLevelChangeLog`
  - 最多 3 次申诉
  - 未处理互斥
  - 申诉附件
  - 处理申诉
  - 等级变更留痕
- OSS 配置：
  - `STORAGE_DRIVER=fake|oss`
  - development / test 默认 fake
  - production 默认 oss
  - internal endpoint / public endpoint 分工
- 索引同步：
  - `sync-indexes`
  - production confirm 保护

### 4.2 前端已完成

- Next.js App Router + TypeScript
- Tailwind CSS 4
- 登录页
- workspace
- `AdminShell`
- UI 基线：
  - 政务可信
  - 科技评审
  - AI 协同
  - 轻未来感
- 基础 UI 组件：
  - `Button` size `sm/md/lg`
  - `Input`
  - `Select`
  - `Textarea`
  - `Modal`
  - `ConfirmDialog`
  - `DataTable`
  - `Pagination`
  - `Badge`
  - `EmptyState`
  - `ErrorAlert`
  - `LoadingState`
  - `MultiSelect`
  - `TreeMultiSelect`
- 管理员基础页面：
  - `batches`
  - `dictionaries`
  - `tree-dictionaries`
  - `organizations`
  - `review-schemes`
  - `projects` 评审组织列表
  - `users`
- 已修复：
  - 字典 `dictType` 中文化和自定义类型保存
  - `code` 显示为“编码”
  - 树形字典缩进展示
  - 单位行政区划 `administrative_division` 选择
  - 评审方案评分项输入失焦
  - 表单控件高度 / 对齐
  - 行内按钮尺寸
- 用户管理页面：
  - `/admin/users`
  - 列表、搜索、角色筛选、状态筛选、分页
  - 新增 / 编辑用户
  - 启用 / 停用
  - 重置密码
  - 角色多选
  - 单位多选
  - 学科树形多选
- 管理员 Excel 项目导入页面：
  - `/admin/project-imports`
  - `/admin/project-imports/[jobId]`
  - 批次选择和 Excel 上传
  - 导入任务列表、筛选和分页
  - 删除未确认导入任务，删除前二次确认，已确认入库任务删除按钮禁用
  - 导入任务详情、统计和字段映射
  - 导入行列表、Excel 行号展示、状态筛选和分页
  - raw / normalized / resolved / issues 展示
  - 待确认行人工修正
  - 选择已有主数据、单位和项目负责人
  - 行修正时创建新承担单位和新项目负责人用户
  - 单行确认入库、单行跳过、批量确认可导入行
- 管理员 Excel 字段映射配置页面：
  - `/admin/project-import-field-mappings`
  - 查询标准字段、默认内置别名、自定义别名和最终生效别名
  - 支持 keyword / isActive 筛选
  - 支持创建或覆盖配置、编辑、启用 / 停用、删除配置和重置默认别名
  - 页面明确未配置、停用和删除配置均回退系统默认别名
- 管理员项目评审组织页面：
  - `/admin/projects`
  - 项目核心信息、评审负责人、评审方案、评审时间、地点、会议链接和组织状态展示
  - keyword、批次、项目类型、项目状态、评审负责人、评审方案、是否已分配负责人、是否已分配方案筛选
  - 单项目分配评审负责人 / 评审方案
  - 批量分配评审负责人 / 评审方案
  - 批量设置专家
- 管理员项目评审组织详情页：
  - `/admin/projects/[projectId]/review-organization`
  - 展示项目基础信息、评审分配和组织状态
  - 设置评审时间、地点、会议链接
  - 查看已分配专家
  - 查看后端专家候选
  - 从候选专家追加 / 替换专家
  - 移除已分配专家
  - 新增“项目材料”区域，管理员可查看项目负责人上传材料
  - 管理员可查看 `draft/submitted/legacy active` 材料状态，下载材料，并填写原因后物理删除材料
  - 管理员删除材料只调用 `/admin/projects/:id/materials/:materialId`，不调用 project_owner / review_manager / expert 材料接口
  - 页面明确候选专家由后端按项目学科匹配，并自动回避承担单位和合作单位
  - 页面明确当前仅保存会议链接，不接腾讯会议 API、直播、推流或回看
- 项目负责人工作台前端接入：
  - `/workspace` 放开 project_owner 入口
  - `/project-owner`
  - `/project-owner/projects`
  - `/project-owner/projects/[projectId]`
  - 独立 `ProjectOwnerShell`
  - 我的项目列表、select 筛选、分页和门户参考数据名称映射
  - 项目详情和评审安排名称展示
  - 后续推进需求填写 / 保存
  - 材料列表、按 `material_type` 筛选、下载 URL 和删除入口
  - 材料列表显示 `draft/submitted/legacy active` 状态
  - 新上传材料提示草稿语义，提交前评审负责人和专家不可见
  - 项目负责人详情页支持提交全部草稿材料，调用 `POST /project-owner/projects/:id/materials/submit`
  - `draft/legacy active` 材料可物理删除，`submitted` 材料删除按钮禁用并对后端 `409` 做友好提示
  - 文件数量、大小和扩展名校验逻辑已实现
  - 已接入 `/portal/reference-data/*`，材料上传入口使用 active `material_type` 字典启用真实提交闭环
  - 未调用 admin-only 字典接口，未写死材料类型 ID

### 4.3 工程治理已完成

- `docs/handoff` backend / frontend 文档体系
- Codex 指令规范
- backend / frontend 架构规范
- `e2e-testing` 文档
- handoff 持续更新机制

## 5. 未完成能力

### 5.1 前端未完成

- 专家工作台：
  - 评审任务列表
  - 项目详情
  - 材料查看
  - 评分草稿
  - 提交评分
  - 退回后重提
- 评审负责人工作台：
  - 负责项目列表
  - 专家评分查看
  - 退回专家评分
  - 汇总查看
  - 生成 `rule_based` 合议草稿
  - 人工确认合议和最终等级
- 申诉前端：
  - 项目负责人查看合议
  - 提交申诉
  - 申诉附件
  - 查看申诉状态
  - 评审负责人 / admin 处理申诉
  - 等级变更记录
- 甲方看板前端尚未实现
- 腾讯会议监管前端
- 文件预览
- 真实 AI 汇总交互
- 用户自助改密
- 忘记密码 / 短信验证码
- 用户批量导入
- 专家库批量导入
- 权限矩阵配置

### 5.2 后端未完成

- 甲方看板统计 API
- 甲方看板权限与数据口径
- 腾讯会议直播 / 推流 / 回看 / 会议 API 集成
- 真实 AI 汇总接口
- 文件预览 / 在线转换
- 用户自助改密
- 忘记密码 / 短信验证码
- 用户批量导入
- 专家库批量导入
- 操作审计日志，如后续需要
- 更细粒度权限矩阵，如后续需要

## 6. 建议后续阶段顺序

以下是建议顺序，不是固定不可调整的计划。后续应随执行结果、演示优先级、甲方监管需求和接口变化滚动调整。

1. ReviewX 前端第二阶段：管理员 Excel 导入与待确认处理（已完成）
   - 对接后端 `project-imports`
   - 上传 Excel
   - 任务列表
   - 行列表
   - 待确认修正
   - 创建 / 选择单位和项目负责人
   - 跳过 / 确认单行
   - 批量确认导入

2. ReviewX 第二阶段补丁一：Excel 字段映射配置后端化（已完成）
   - 新增 `project_import_field_mappings` 独立集合
   - 新增 `/admin/project-import-field-mappings*` 管理接口
   - 标准字段由后端固定枚举控制，管理员不能新增标准字段
   - 数据库启用配置优先，未配置或停用回退内置默认别名
   - 项目导入上传解析消费 effective alias map，保持既有导入接口和 `fieldMapping` 响应结构兼容

3. ReviewX 第二阶段补丁二：Excel 字段映射配置前端接入（已完成）
   - 在管理端提供 Excel 字段映射配置页面
   - 展示标准字段、默认别名、配置别名和 effective aliases
   - 支持 PUT/PATCH/DELETE/reset-defaults
   - 配置页补齐项目导入字段映射配置闭环

4. ReviewX 前端第三阶段：管理员项目分配与评审组织（已完成）
   - 项目列表增强
   - 设置评审负责人
   - 设置评审方案
   - 评审安排
   - 专家候选
   - 专家分配
   - 批量分配

5. ReviewX 前端第四阶段：项目负责人工作台与材料管理（已完成）
   - 项目负责人项目列表 / 详情
   - 后续推进需求
   - 材料上传入口和前端校验
   - 材料列表
   - 下载 URL
   - 草稿材料物理删除和 submitted 删除禁用
   - 门户参考数据名称映射和材料上传真实提交闭环

6. ReviewX 第四阶段补丁一：门户端只读基础数据接口（已完成）
   - 新增 `/portal/reference-data/*` 只读接口
   - project_owner 可读取 `material_type`、`project_status`、树形字典、批次、单位、评审方案和评审负责人摘要
   - 不开放主数据写能力，不修改 `/admin/*` 权限

7. ReviewX 第四阶段补丁二：项目负责人材料上传闭环启用与名称映射优化（已完成）
   - 前端接入 `/portal/reference-data/*`
   - 启用项目负责人材料上传真实提交入口
   - 用门户参考数据替换批次、项目类型、项目状态、学科、单位、评审负责人、评审方案等 ID 兜底展示

阶段外小修：ReviewX 小修：项目材料中文文件名乱码修复（已完成）
   - 抽出通用上传文件名规范化工具，项目导入继续复用
   - 项目材料上传保存前规范化 `originalFilename`，`safeFilename` 和 objectKey 使用规范化后的文件名生成
   - 只影响新上传材料，历史乱码材料不迁移；建议删除旧材料后重新上传

8. ReviewX 第四阶段补丁三：项目材料草稿提交状态与物理删除规则后端化（已完成）
   - 新上传项目材料默认 `draft`
   - 新增 `submitted` 状态和项目负责人提交接口
   - legacy `active` 按草稿兼容，不做历史迁移
   - 评审负责人 / 专家只可见 `submitted`
   - 项目负责人删除 `draft/active` 改为 storage object + 主记录物理删除
   - admin 删除材料要求 reason，写 `project_material_deletion_logs`
   - 不修改 frontend，不新增依赖、环境变量或 storage 配置

9. ReviewX 第四阶段补丁四：项目负责人材料提交与删除规则前端接入（已完成）
   - 项目负责人详情页增加“提交评审材料”入口
   - 展示 `draft/submitted/legacy active` 状态
   - 对 submitted 材料禁用/隐藏项目负责人删除入口
   - 对后端 `409` 做清晰错误提示
   - 上传成功提示草稿语义，提交前评审负责人和专家不可见
   - 提交成功后刷新材料列表和项目详情 `materialCount`

10. ReviewX 第四阶段补丁五：管理员项目材料查看与删除前端接入（已完成）
   - 管理员项目评审组织详情页增加“项目材料”区域
   - 管理员可查看材料文件名、类型、状态、上传人、上传时间、大小和备注
   - 管理员材料列表调用 `GET /admin/projects/:id/materials`
   - 管理员材料下载调用 `GET /admin/projects/:id/materials/:materialId/download-url`
   - 管理员材料删除调用 `DELETE /admin/projects/:id/materials/:materialId`，请求体必须携带 `reason`
   - 删除前通过 reason 表单二次确认，说明物理删除文件和材料记录且后端保留删除审计
   - 删除成功后刷新材料列表，失败时不乐观移除
   - 不实现删除日志查询、材料恢复或文件预览

11. ReviewX 前端第五阶段：专家工作台与评分
   - 专家任务列表
   - 项目和材料查看
   - 评分草稿
   - 条件必填建议
   - 提交评分
   - 退回后修改重提

12. ReviewX 前端第六阶段：评审负责人合议工作台
   - 负责项目列表
   - 专家评分列表
   - 专家评分详情
   - 退回
   - 汇总
   - 生成合议草稿
   - 确认合议和最终等级

13. ReviewX 前端第七阶段：申诉闭环
   - 项目负责人查看合议
   - 提交申诉和附件
   - 查看申诉状态
   - 评审负责人 / admin 查看和处理申诉
   - 等级变更历史

14. ReviewX 后端第八阶段：甲方看板统计 API
   - 甲方可见数据范围
   - 批次 / 类型 / 区域 / 状态 / 等级 / 进度统计
   - 评审进度
   - 申诉统计
   - 专家评分完成率
   - 材料上传完成情况
   - `meetingUrl` / 监管入口数据

15. ReviewX 前端第九阶段：甲方看板
   - 看板首页
   - 统计卡片
   - 图表
   - 项目列表钻取
   - 评审现场 `meetingUrl` 入口
   - 导出能力如需要

16. 后续增强：
   - 腾讯会议直播 / 推流 / 回看集成
   - 真实 AI 汇总
   - 文件预览
   - 审计日志
   - 用户自助改密 / 短信 / 批量导入
   - 权限矩阵

## 7. 当前建议下一步

- 当前建议下一步是“ReviewX 前端第五阶段：专家工作台与评分”。
- 项目负责人详情页已接入门户参考数据，材料类型选择和材料上传真实提交闭环已启用；批次、项目状态、项目类型、学科、单位、评审负责人和评审方案已改为名称映射展示。
- 字段映射配置前端已补齐项目导入字段映射配置闭环。
- 管理员项目评审组织前端已接入评审负责人/方案分配、评审安排、专家候选、专家追加/替换/移除和批量设置专家；专家候选和分配规则仍以后端校验为准。
- 项目负责人工作台已接入项目列表、详情、后续推进需求、门户参考数据名称映射、材料列表、上传、下载、草稿提交和草稿物理删除入口；`material_type` 为空或 reference-data 加载失败时上传入口禁用。
- 新上传项目材料默认设为 `draft`，项目负责人详情页已接入 `POST /project-owner/projects/:id/materials/submit` 提交全部草稿材料；提交前评审负责人 / 专家看不到新上传 draft 材料。
- 项目负责人 DELETE 材料语义已按物理删除 `draft/legacy active` 接入前端，`submitted` 材料删除按钮禁用；若异常触发后端 `409`，页面展示“该材料已提交评审，项目负责人不能删除。如确需删除，请联系管理员。”。
- 管理员项目评审组织详情页已接入项目材料查看、下载和带原因删除；删除只使用 `/admin/projects/:id/materials*` 系列接口，成功后刷新列表，失败时不乐观移除。
- 管理员项目材料卡片已完成小修：上传人缺少材料响应内联用户时复用页面已加载 users 映射显示姓名和手机号；删除原因弹窗支持主体滚动和长文件名换行，小屏 / 缩放时仍可填写 reason 并操作按钮。
- 项目导入 Excel 文件名中文乱码修复只影响后续新上传任务；历史乱码任务不自动迁移。
- 项目材料上传文件名中文乱码修复只影响后续新上传材料；历史乱码材料不自动迁移，建议删除后重新上传验证。
- 项目导入任务删除只用于清理误上传 / 测试上传导入记录；已有 confirmed 行时禁止删除，且不会删除正式项目。
- 项目导入学科字段已避免按顿号拆分；历史已解析导入行不自动迁移，建议删除未确认导入任务后重新上传验证。
- 如果用户要求先做演示或甲方监管，也可以调整为“甲方看板后端 API + 前端看板雏形”。
- 若进入较大任务，建议新会话先阅读本路线图和相关 handoff，再拆分阶段执行。

## 8. 暂缓事项

- 腾讯会议直播 / 推流 / 回看 / 会议 API 集成暂缓；当前仅保存 `meetingUrl`。
- 真实 AI 汇总暂缓；当前后端合议草稿是 `rule_based`。
- 文件预览 / 在线转换暂缓；当前只提供短期下载 URL。
- 操作审计日志暂缓，除非后续监管或合规需求明确。
- 用户自助改密、忘记密码、短信验证码、用户批量导入、专家库批量导入和权限矩阵配置暂缓。

## 9. 风险与待确认事项

- `reviewx_test` 不应作为长期人工联调数据源；自动化测试可能清理 test 库。
- 人工联调建议使用 `reviewx_dev`。
- 甲方看板后端统计 API 尚未实现，不能直接做完整前端看板。
- 甲方看板前端尚未实现。
- 腾讯会议目前只保存 `meetingUrl`，未接腾讯会议 API、直播、推流或回看。
- 真实 AI 汇总尚未实现，目前合议草稿是 `rule_based`。
- 文件存储生产依赖 OSS 配置，development / test 默认 fake。
- 用户数据、项目数据、评审数据目前还未做细粒度操作审计。
- 后续前端阶段较大，建议继续分阶段，不要一次做完整业务闭环。
- 当前门户参考数据接口已接入项目负责人页面；如基础数据缺失，页面以“未知项（短ID）”兜底展示，材料上传依赖 active `material_type` 字典。
- 当前项目材料状态机已前后端接通；进入专家工作台前仍需确认演示数据中已提交材料可被评审负责人 / 专家接口读取。

## 10. 路线图维护规则

- 每次 Codex 阶段任务完成后，如当前承接状态发生变化，应更新本路线图；如果以下内容变化，也应更新本路线图：
  - 当前承接状态
  - 已完成能力
  - 未完成能力
  - 后续阶段顺序
  - 新增重要接口 / 页面 / 模型
  - 新增重要风险或待确认事项
- 小 UI 修正不一定必须更新路线图，除非影响阶段状态或通用约束。
- 路线图不替代 backend / frontend handoff 细节；接口、DTO、组件、测试细节仍以对应 handoff 为准。
- 新会话应先读本路线图，再读 backend / frontend snapshot、api-map、dto-cheatsheet、component-map、testing-playbook；涉及路由、变更记录或后端服务职责时，再读 route-map、changelog、service-map、config-matrix 和 decisions。
