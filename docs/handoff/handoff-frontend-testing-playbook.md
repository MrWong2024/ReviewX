# Frontend Testing Playbook

## 1. 适用范围

- 本文件只记录前端长期验证口径，不记录阶段验收流水账。
- 修改 `frontend\` 代码时，用本文件判断需要覆盖哪些页面、角色、权限和业务红线。
- 只改文档时不要求执行前端构建或人工回归。
- 修改 `backend\` 代码时参考 backend handoff、backend 架构文档和 E2E 规范，本文件不展开后端验证。

## 2. 自动验证命令

改 `frontend\` 代码时至少执行：

```bash
cd frontend
npm run typecheck
npm run lint
npm run build
```

- 只改 Markdown 文档时不要求执行以上命令。
- 不引入新的测试框架作为默认前置条件。
- 当前未引入 Playwright / Puppeteer，浏览器自动化不是演示版阻断项。

## 3. 通用验证原则

- 权限以 `/auth/me` 和后端接口权限为准，不用 `localStorage.reviewx_selected_role` 作为权限依据。
- 业务错误优先展示后端 `message`，不要吞错或用前端假成功覆盖服务端结果。
- 空态、错误态、加载态必须可理解，页面不应白屏。
- 不向业务用户展示 ObjectId、短 ID、`passwordHash`、token、secret、credential、Cookie 或密钥。
- 人员信息缺失时显示“人员信息暂不可用”。
- 基础数据缺失可显示“未知项（短ID）”，但不得裸露长 ObjectId。
- 文件名展示使用后端返回的 `originalFilename`；前端不做编码猜测兜底。
- 文件下载只打开后端返回的下载 URL，不拼接 OSS objectKey。
- 当前只展示 `meetingUrl` 外链，不接腾讯会议 API、直播、推流或回看。
- 合议草稿优先由后端真实 AI 生成，失败时后端 fallback 为 `rule_based`；前端只展示中文来源，不显示 raw `ai` / `rule_based`。
- 当前不做文件预览 / 在线转换；只按后端能力提供下载 URL。

## 4. 登录与工作台

- 未登录访问受保护路由应跳转 `/login`。
- 登录后 `/auth/me` 可保持会话，退出登录后回到 `/login`。
- `/login` 支持密码登录 / 验证码登录切换，默认显示密码登录。
- 密码登录仍调用 `POST /auth/login`，原手机号 + 密码登录应保持可用。
- 验证码登录发送按钮调用 `POST /auth/sms-login/code`，手机号必填，发送中和 60 秒倒计时期间不能重复发送。
- 发送验证码成功后只展示后端通用提示和验证码有效期，不展示验证码、RequestId、token、Cookie 或账号存在性信息。
- 验证码登录调用 `POST /auth/sms-login`；正确验证码可登录并进入 `/workspace`，错误验证码应登录失败并展示后端业务 message。
- 验证码登录成功后仍以 `/auth/me` 和 HttpOnly Cookie 会话判断登录态。
- 登录页不得把验证码写入 storage、URL 或 console。
- `/login` 密码登录模式提供“忘记密码？”入口，跳转 `/forgot-password`。
- `/forgot-password` 为 Public 路由，未登录可访问；已登录用户也可访问，并提供 `/account/change-password` 入口。
- 找回密码发送验证码调用 `POST /auth/password-reset/code`；手机号必填，发送中和倒计时期间不能重复发送。
- 找回密码发送验证码成功后展示后端通用提示和验证码有效期，不展示验证码、RequestId、token、Cookie 或账号存在性信息。
- 找回密码验证码输入应限制为 6 位数字；错误验证码、过期验证码或后端拒绝时展示后端业务 message。
- 找回密码新密码至少 8 位、最多 128 位，确认新密码必须一致。
- 找回密码重置成功调用 `POST /auth/password-reset` 后不自动进入登录态；前端提示用户使用新密码重新登录并提供返回登录入口。
- 找回密码成功后旧密码应失败，新密码可登录；前端不把验证码或新密码写入 storage、URL 或 console。
- `/workspace` 根据 `/auth/me` 返回的 `roles` 展示可进入工作台。
- 单角色用户只进入对应工作台，多角色用户可切换进入多个工作台。
- admin、project-owner、expert、review-manager、client 入口均可用。
- `/workspace` 和 admin / project-owner / expert / review-manager / client Shell 顶部均可进入“修改密码”。
- 非对应角色访问对应工作台显示无权限态，不应加载业务数据。

## 4.1 自助修改密码

- `/account/change-password` 未登录访问应跳转 `/login`。
- 任意已登录角色均可访问 `/account/change-password`，不要求具体业务角色。
- 当前密码、新密码、确认新密码均必填；新密码至少 8 位；两次新密码必须一致；新密码不能与当前密码相同。
- 当前密码错误时展示后端 message，不展示堆栈、ObjectId、token、Cookie 或其它技术细节。
- 修改成功后显示“密码已修改，请使用新密码妥善保管账号。”，清空三个密码输入，并刷新当前用户状态。
- 修改成功后不自动退出登录，当前页面或 `/auth/me` 仍应保持登录态。
- 退出登录后旧密码不可登录，新密码可登录。
- `/auth/me` 和改密成功响应不包含 `passwordHash`、token、sessionToken、Cookie 或 secret。
- 密码输入必须使用 `type=password`；不得把密码写入 storage、URL 或 console。

## 5. Admin 验证口径

- 基础数据维护入口可打开：批次、普通字典、树形字典、单位、评审方案。
- 项目导入、字段映射、项目管理和项目评审组织可打开。
- 项目评审组织可设置评审负责人、评审方案、评审时间、地点和 `meetingUrl`。
- 项目材料管理可打开；管理员材料下载使用 admin 命名空间下载 URL。
- 管理员材料删除必须填写 `reason`，成功后刷新权威列表，不做乐观移除。
- 申诉处理和等级历史可打开；管理员可做兜底申诉处理。
- 管理员处理 accepted 申诉时可录入新最终等级，rejected 不应提交新等级。
- 管理员不绕过材料、评分、合议、申诉等关键业务红线。

## 6. Project Owner 验证口径

- `/project-owner`、我的项目列表和项目详情可打开，只显示当前项目负责人负责的项目。
- 项目详情展示评审安排：评审负责人、评审方案、评审时间、地点和 `meetingUrl`。
- 后续推进需求可保存；超过长度限制或后端拒绝时显示业务错误。
- 材料上传后为 `draft`，评审负责人和专家不可见。
- `draft` 可删除；legacy `active` 按历史草稿处理，但仍需样本验证。
- 草稿提交后为 `submitted`，评审负责人和专家可见。
- `submitted` 材料不可由项目负责人删除，异常请求应展示后端 409 口径。
- confirmed 合议、`finalLevel` 或 `originalLevel` 任一成立后，项目负责人内容写操作锁定。
- 内容锁定后，后续推进需求保存、材料上传、草稿提交和材料删除不可用；材料查看 / 下载、评审结果、申诉和 submitted 申诉附件补充上传仍可用。
- 评审结果页展示有效最终等级，前端口径为 `project.finalLevel ?? consensus.finalLevel`。
- 满足 confirmed 合议、有效最终等级、次数和互斥规则时可发起申诉。
- submitted 申诉可补充附件；申诉附件上传后不可删除。
- 等级变更历史展示操作人摘要；摘要缺失时显示“人员信息暂不可用”，不显示 ObjectId 或短 ID。

## 7. Expert 验证口径

- `/expert` 和 `/expert/review-tasks` 可打开，只显示分配给当前专家的项目。
- 专家不能访问未分配给自己的任务。
- 已分配但缺评审方案的项目仍显示在 `/expert/review-tasks`，不隐藏；列表不显示可点击“开始评分”，改为“暂不能评分”并说明“项目尚未分配评审方案”。
- 直接访问缺评审方案项目详情时，后端 `409 PROJECT_REVIEW_SCHEME_MISSING` 应展示“任务详情加载失败”和“项目尚未分配评审方案，暂不能评分。”，不得误显示“评分已提交，不能修改”。
- 任务详情可查看项目摘要、评审安排、后续推进需求和 `meetingUrl`。
- 专家只看 `submitted` 材料；项目负责人仅有 `draft` 材料时专家材料列表为空。
- 材料下载只调用 expert 命名空间下载 URL。
- 可保存评分 `draft`，`draft` 可重新打开并继续编辑。
- `draft` 可删除；删除后回到未开始状态。
- 评审时间未到时可保存草稿但不可提交评分。
- 可提交评分；提交后状态为 `submitted` 且表单只读。
- `submitted` 后不显示保存、提交或删除草稿入口。
- `returned` 后显示退回原因，可修改并重提。
- confirmed 合议后评分仍只读，不允许通过专家端反向破坏 confirmed 结果。

## 8. Review Manager 验证口径

- `/review-manager` 和负责项目列表可打开，只看到自己负责的项目。
- 非负责项目访问返回 403 或无权限态，不展示项目内操作入口。
- 项目总览可打开，缺少权限或摘要不可用时不要显示合议 / 专家分配等操作入口。
- 多角色用户兼任 `admin + review_manager` 且作为项目评审负责人时，评审负责人映射应显示姓名 / 手机号摘要，不应显示“未知评审负责人”。
- 可安排评审时间、地点和 `meetingUrl`。
- 可分配专家；候选专家由后端按项目学科匹配并回避相关单位。
- 进入评审时间、已有评分、已有合议或已有最终等级后，专家分配锁定。
- 专家分配锁定时前端禁用 mutation，并展示后端 `EXPERT_ASSIGNMENT_LOCKED` 原因。
- 可查看 `submitted` 材料，不能上传、删除或预览材料。
- 可查看专家评分和评分汇总；前端不自行计算后覆盖后端汇总。
- 未 confirmed 前可退回 `submitted` 评分，退回原因必填。
- confirmed 合议后不可退回评分；前端隐藏入口，后端 409 兜底。
- 可生成合议草稿；已有 `draft` 覆盖必须明确确认并按后端规则请求；生成成功或后端返回冷却错误后，“生成合议草稿”按钮显示剩余秒数并暂时禁用，默认按 60 秒恢复，后端 429 仍是兜底。
- 草稿来源展示必须中文映射：`ai` 显示“AI 辅助生成”，`rule_based` 显示“规则汇总生成”，`manual` 显示“人工确认”；不得直接暴露 raw 工程字段。
- 生成草稿后不得自动填入最终确认表单；只有点击“使用草稿填入”才把草稿意见和分数写入人工确认表单。
- 可确认合议；最终意见、分数和等级按页面校验与后端校验共同约束。
- confirmed 合议只读，不显示确认表单、不显示“使用草稿填入”、不显示“重新确认最终结论”。
- confirmed 合议的确认人展示人员摘要；摘要缺失时显示“人员信息暂不可用”。
- 可处理申诉 accepted / rejected；accepted 可录入 `newFinalLevel`，rejected 不应提交 `newFinalLevel`。
- 申诉附件只读下载，不提供上传或删除。

## 9. Client 甲方看板验证口径

- `/client` 只有 client 角色可访问；无 client 角色显示无权限态，未登录跳转 `/login`。
- `/workspace` 的 client 入口可进入 `/client`。
- overview 能加载，projects 能加载。
- keyword、finalLevel、progressStage、hasPendingAppeal、hasMeetingUrl 筛选可用。
- 筛选变化后项目列表回到第一页；分页只重新拉取 projects。
- 项目展开详情可查看阶段、合议、申诉、资金、学科、单位、原始等级和更新时间等摘要。
- `meetingUrl` 存在时显示外链入口；只展示外链，不接腾讯会议 API。
- 甲方看板只读，不提供业务写操作。
- overview / projects 不显示 NaN、Infinity、undefined、null、ObjectId。
- `effectiveFinalLevelSource` 等工程枚举必须中文映射或不直接暴露。
- reference-data 加载失败时可提示 warning，主体数据成功时继续用兜底名称展示。

## 10. 跨角色业务红线

- review-manager 不能访问非自己负责项目。
- expert 不能访问非自己分配任务。
- project-owner 不能访问非自己负责项目。
- client 看板只读，不产生业务写入。
- 不通过前端绕过后端命名空间权限：admin、project-owner、expert、review-manager、client 接口各自隔离。
- confirmed 合议后，合议只读。
- confirmed 合议后，专家评分不可退回。
- confirmed 合议、`finalLevel` 或 `originalLevel` 后，项目负责人内容写操作锁定。
- `submitted` 材料不可由项目负责人删除。
- 申诉每项目最多 3 次。
- 存在 submitted / processing 申诉时不可重复发起。
- 申诉附件上传后不可删除。
- 有效最终等级优先级为 `project.finalLevel ?? confirmedConsensus.finalLevel`，不得退回只看 `project.finalLevel` 或只看合议等级的旧口径。
- 等级调整走申诉处理；录入错误更正需未来专门流程，不在前端私自新增入口。

## 11. 已知未验证与暂缓项

- legacy active 材料因当前 dev 库无样本，仍为无样本未验证，不写成全量完成。
- pending 申诉样本可能缺失；`hasPendingAppeal=true` API 可用但演示库可能为空。
- 专家评分“退回后重提”真实写入链路已有覆盖；当前库可能无法从持久字段证明历史退回痕迹。
- 未引入 Playwright / Puppeteer；当前不是演示版阻断项。
- 腾讯会议直播 / 推流 / 回看 / 会议 API 暂缓。
- AI 辅助生成合议草稿已接入；AI 配置管理页面、调用日志、流式输出、多模型管理和材料全文入 prompt 暂缓。
- 文件预览 / 在线转换暂缓。
- 审计日志暂缓。
- 批量导入增强、权限矩阵配置仍暂缓；短信验证码登录和短信验证码找回密码前后端已完成，自助改密已完成；短信注册仍未实现。

## 12. 何时需要扩展验证

- 修改认证、权限、角色入口、Shell、路由守卫或 `/workspace` 时，扩展登录与角色入口验证。
- 修改材料上传、提交、下载、删除或文件名展示时，扩展 admin / project-owner / expert / review-manager 材料验证。
- 修改评分、退回、合议草稿、合议确认或 confirmed 只读状态时，扩展 expert 和 review-manager 验证。
- 修改申诉、等级历史、最终等级计算或附件留痕时，扩展 project-owner、review-manager 和 admin 申诉验证。
- 修改 client 看板 overview、projects、筛选、分页或枚举展示时，扩展甲方看板验证。
- 修改腾讯会议、AI 配置管理 / 调用日志 / 流式输出、文件预览 / 在线转换、审计日志、批量导入增强、权限矩阵、忘记密码 / 短信验证码找回密码或短信验证码登录前端切换时，先更新本手册再执行对应专项验证。
