# ReviewX / 科评星 handoff 路线图

## 1. 文档定位

- 本文档是 ReviewX / 科评星跨会话、跨阶段的 handoff 路线图。
- 本文档不是正式产品方案，也不是客户文档。
- 本文档用于 GPT / Codex 接续开发时快速理解当前工程状态、未完成能力和建议后续阶段。
- 本文档是活文档。每次阶段性 Codex 执行后，如果阶段状态、接口口径、阶段顺序或未完成清单发生变化，应同步更新本文档。
- 本文档不替代 backend / frontend handoff 细节：后端接口见 `handoff-backend-api-map.md`，DTO 字段见 `handoff-backend-dto-cheatsheet.md`，Service 职责见 `handoff-backend-service-map.md`，前端接口调用见 `handoff-frontend-api-map.md`，路由细节见 `handoff-frontend-route-map.md`，组件职责见 `handoff-frontend-component-map.md`，测试手册见 `handoff-frontend-testing-playbook.md`。

## 2. 当前承接状态

- 当前基于 commit `43fb8bc` 做 handoff 轻量瘦身；路线图记录的是“ReviewX 前端第七阶段：申诉闭环前端”完成后的接续状态。
- 已完成主闭环：管理员主数据 / 用户 / 项目导入 / 评审组织，项目负责人项目详情 / 材料 / 评审结果 / 申诉，专家材料查看与评分，评审负责人评审组织 / 评分退回 / 合议 / 申诉处理，管理员申诉兜底处理与等级变更留痕。
- 已同步关键小修口径：`/review-manager/projects` 只返回当前评审负责人负责项目；评审负责人项目总览、评审组织、合议、申诉处理拆为独立能力；专家分配进入评审后锁定；申诉有效最终等级使用后端 `project.finalLevel ?? confirmedConsensus.finalLevel`、前端 `project.finalLevel ?? consensus.finalLevel`；项目负责人项目响应内联 `reviewManager` 摘要，评审结果确认后项目负责人端后续推进需求和项目材料写操作只读锁定。
- 当前未完成主线仍是甲方看板：甲方看板统计 API 和甲方看板前端均未实现，不得写成已完成。
- 最新代码基线以用户在会话中提供的 commit 或 GitHub main 分支最新 commit 为准；接口、DTO、Service、路由、组件和测试细节见第 4.4 节引用文档。
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

### 4.1 后端一级能力摘要

- 基础设施：NestJS + Mongoose + MongoDB，统一配置、全局异常过滤器、ValidationPipe、健康检查、受控索引同步脚本和 fake / OSS Storage 抽象层已具备。
- 认证与用户：手机号密码登录、HttpOnly Cookie Session、`/auth/me`、管理员用户 CRUD、角色 / 启用状态 / 单位 / 学科关联、默认手机号密码和最后启用 admin 保护已完成。
- 主数据：批次、普通字典、树形字典、单位、评审方案、项目基础管理已完成；行政区划统一为 `treeType=administrative_division`，`Organization.regionId` 字段名保留。
- 项目导入：Excel 上传解析、字段映射配置后端化、待确认行修正、创建单位 / 项目负责人、确认入库、跳过、未确认任务删除和文件名 / 学科拆分小修已完成。
- 评审组织：管理员分配评审负责人 / 评审方案、保存评审方案快照、评审安排、专家候选、单位回避、专家追加 / 替换 / 移除 / 批量分配已完成；专家分配 mutation 在 `reviewTime` 已到、已有专家评分、已有合议、已有最终等级 / 最终结论后统一锁定。
- 项目材料：项目负责人上传默认 `draft`，提交后为 `submitted`，legacy `active` 按草稿兼容；项目负责人 / admin 可见 `draft/submitted/legacy active`，评审负责人 / 专家只可见 `submitted`；项目负责人仅可物理删除 `draft/legacy active`，`submitted` 返回 `409`；评审结果已确认、项目已有 `finalLevel` 或 `originalLevel` 后，项目负责人更新后续推进需求、上传材料、提交草稿和删除材料统一返回 `409 PROJECT_OWNER_CONTENT_LOCKED`；admin 删除必须填写原因并保留删除审计。
- 门户参考数据：`/portal/reference-data/*` 已提供登录后只读基础数据摘要，供 project_owner / expert / review_manager / client / admin 展示名称映射；用户摘要禁止查询 admin 用户。
- 专家评分与合议：专家任务、材料查看、草稿 / 提交、删除本人 draft 草稿、评审时间提交限制、退回重提、评分汇总、`rule_based` 合议草稿、人工确认最终意见 / 分数 / 等级已完成。
- 申诉与等级留痕：项目负责人查看 confirmed 合议、提交申诉、附件上传 / 下载 / 软删除，评审负责人 / 管理员查看和处理申诉，等级变更日志已完成；创建和处理申诉的有效最终等级为 `project.finalLevel ?? confirmedConsensus.finalLevel`，历史缺失项目等级可懒回填且不写等级变更日志。

### 4.2 前端角色级能力摘要

- 公共工作台 / 登录态：Next.js App Router + TypeScript + Tailwind CSS 4，统一 fetch API Client、HttpOnly Cookie 会话协作、`/workspace` 多角色入口和四类业务 Shell 已完成。
- 管理员端：用户、批次、普通字典、树形字典、单位、评审方案、项目导入、字段映射、项目评审组织、专家分配、项目材料查看 / 删除、项目申诉处理已接入；逐路由细节见 `handoff-frontend-route-map.md`。
- 项目负责人端：我的项目、项目详情、后续推进需求、材料上传草稿 / 提交 / 下载 / 草稿物理删除、评审结果、本人申诉和附件管理已接入；项目详情评审负责人显示优先使用项目响应 `reviewManager.name`，不向普通项目负责人展示负责人 ObjectId 短 ID；评审结果确认后后续推进需求和项目材料管理只读，仍保留已上传材料下载、评审结果与申诉入口及申诉附件管理；发起申诉前端按 `project.finalLevel ?? consensus.finalLevel` 判断有效最终等级。
- 专家端：评审任务列表 / 详情、submitted 材料查看与下载、评分草稿保存、提交、draft 删除、submitted 只读和 returned 重提已接入；评分提交受评审时间窗口限制。
- 评审负责人端：负责项目列表、项目总览、评审组织、专家分配、材料只读、专家评分查看 / 退回、评分汇总、合议草稿 / 确认、项目申诉查看 / 处理已接入；review-manager 命名空间只看自己负责项目，不混用 admin 全局能力。

### 4.3 工程治理已完成

- `docs/handoff` backend / frontend 文档体系、Codex 指令规范、backend / frontend 架构规范和 handoff 持续更新机制已建立。
- 前端测试手册、后端 API map、DTO cheatsheet、Service map、配置矩阵、决策记录、前端 API / route / component map 已作为细节承载文档。

### 4.4 细节承载文档

- 后端接口细节见 `handoff-backend-api-map.md`。
- 后端 DTO 字段、枚举、响应结构见 `handoff-backend-dto-cheatsheet.md`。
- 后端 Service 职责边界见 `handoff-backend-service-map.md`。
- 前端接口调用、错误处理和展示映射见 `handoff-frontend-api-map.md`。
- 前端逐路由页面能力见 `handoff-frontend-route-map.md`。
- 前端组件职责见 `handoff-frontend-component-map.md`。
- 前端验证口径见 `handoff-frontend-testing-playbook.md`。

## 5. 未完成能力

### 5.1 前端未完成

- 甲方看板前端尚未实现。
- 腾讯会议监管前端、文件预览、真实 AI 汇总交互、用户自助改密、忘记密码 / 短信验证码、用户批量导入、专家库批量导入、权限矩阵配置仍未实现。

### 5.2 后端未完成

- 甲方看板统计 API 尚未实现，甲方看板权限与数据口径仍待设计确认。
- 腾讯会议直播 / 推流 / 回看 / 会议 API 集成、真实 AI 汇总接口、文件预览 / 在线转换、用户自助改密、忘记密码 / 短信验证码、用户批量导入、专家库批量导入、操作审计日志和更细粒度权限矩阵仍未实现。

## 6. 建议后续阶段顺序

以下是建议顺序，不是固定不可调整的计划。后续应随执行结果、演示优先级、甲方监管需求和接口变化滚动调整。

1. 已完成阶段摘要：管理端基础、用户管理、Excel 导入与字段映射、项目评审组织、项目负责人材料、专家工作台、评审负责人合议、申诉闭环及相关小修已经完成。
2. 当前建议下一阶段：ReviewX 后端第八阶段：甲方看板统计 API。
3. 随后建议阶段：ReviewX 前端第九阶段：甲方看板。
4. 可穿插小范围回归：申诉有效最终等级、材料状态机、专家分配锁定、评分 / 合议 / confirmed / finalLevel 链路、review-manager 权限收紧。
5. 后续增强：腾讯会议直播 / 推流 / 回看集成、真实 AI 汇总、文件预览、审计日志、用户自助改密 / 短信 / 批量导入、权限矩阵。

## 7. 当前建议下一步与业务红线

### 7.1 下一步建议

- 优先做“甲方看板统计 API”，明确 client 可见范围、批次 / 类型 / 区域 / 状态 / 等级 / 进度统计、申诉统计、专家评分完成率、材料上传完成情况和 `meetingUrl` 监管入口数据。
- 再做“甲方看板前端”，接入统计卡片、图表、项目列表钻取、评审现场 `meetingUrl` 入口和必要导出能力。
- 如果演示优先级更高，可先做申诉、材料、专家分配锁定和合议链路的小范围联调回归；不得把甲方看板 API 或前端误标为已完成。

### 7.2 关键业务红线

- 申诉有效最终等级不得退回旧口径：后端使用 `project.finalLevel ?? confirmedConsensus.finalLevel`，前端使用 `project.finalLevel ?? consensus.finalLevel`。
- 评审结果确认后项目负责人内容写操作必须锁定：存在 confirmed 合议、项目 `finalLevel` 或 `originalLevel` 任一有效值时，project-owner 后续推进需求和项目材料上传 / 提交 / 删除返回 `409 PROJECT_OWNER_CONTENT_LOCKED`；查看项目、查看 / 下载材料、查看评审结果与申诉、发起申诉和管理 submitted 申诉附件不受影响。
- 申诉提交必须已有 confirmed 合议、存在有效最终等级；`submitted/processing` 状态下不能重复提交；每项目最多 3 次申诉。
- 材料状态机不得简化失真：新上传为 `draft`，提交后为 `submitted`，legacy `active` 按草稿兼容；项目负责人 / admin 可见 `draft/submitted/legacy active`，评审负责人 / 专家只可见 `submitted`；项目负责人只能删除 `draft/legacy active`。
- 专家分配锁定后才进入专家评审主流程：评审时间已到、已有专家评分、已有合议或已有最终等级 / 最终结论后，admin 与 review-manager 的专家名单 mutation 均应返回锁定错误。
- 评分、合议、confirmed 结果、`finalLevel` 和申诉处理构成关键链路；合议确认写项目最终等级，申诉处理只改 `Project.finalLevel` 并按规则写等级变更日志，不改 `ConsensusReview.finalLevel`。
- 前端角色命名空间不得混写：admin、project-owner、expert、review-manager 路由和接口各自隔离；review-manager 的项目总览、评审组织、合议、申诉处理是独立能力，逐路由细节见 `handoff-frontend-route-map.md`。
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
- 当前门户参考数据接口已接入项目负责人页面；如基础数据缺失，通用基础数据仍以“未知项（短ID）”兜底展示，但项目详情评审负责人使用项目响应 `reviewManager` 摘要优先，无法解析时显示“评审负责人信息暂不可用”，不得显示负责人短 ID；材料上传依赖 active `material_type` 字典。
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
- 路线图不替代 backend / frontend handoff 细节；接口、DTO、Service、路由、组件和测试细节仍以对应 handoff 为准。
- 新会话应先读本路线图，再读 backend / frontend snapshot；接口细节读 backend / frontend API map，DTO 字段读 backend dto-cheatsheet，Service 职责读 backend service-map，前端路由读 frontend route-map，组件职责读 frontend component-map，验证口径读 frontend testing-playbook；涉及配置或架构决策时再读 config-matrix 和 decisions。
