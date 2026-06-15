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
3. 已开通但未实现角色卡片显示“后续建设”
4. 未开通角色显示“未开通”
5. 无 admin 角色访问 `/admin` 应显示 403 状态或回工作台

## 5. 管理员后台人工验证

1. `/admin` 可访问
2. 顶部栏显示当前用户和管理员角色 Badge
3. 侧边栏导航可用，选中态为胶囊高亮
4. 退出登录可用
5. 首页按“主数据维护 / 项目评审组织 / 监管闭环”展示

## 6. 主数据人工验证

- `/admin/batches`：列表、新增、编辑、停用
- `/admin/dictionaries`：列表、字典类型中文过滤、新增、编辑、停用
  - project_status 显示为“项目状态”
  - material_type 显示为“材料类型”
  - review_level 显示为“评审等级”
  - `code` 显示为“编码”并有说明
  - 新增/编辑弹窗中“名称”和“编码”输入框顶部对齐、高度一致
  - 自定义类型标识输入框高度与其他输入框一致
  - 选择“自定义类型”时可输入自定义类型标识并成功保存
- `/admin/tree-dictionaries`：树形缩进列表、树类型中文过滤、parent 缩进选择、新增根节点、添加子节点、编辑、停用
  - project_type 显示为“项目类型”
  - discipline 显示为“学科”
  - department 显示为“受理处室”
  - administrative_division 显示为“行政区划”
  - 新增/编辑弹窗中“名称 / 编码 / 父节点”控件对齐，高度一致
  - 树节点“添加子节点 / 编辑 / 停用”按钮使用紧凑尺寸，不抢占节点主体视觉
- `/admin/organizations`：分页、关键词搜索、行政区划缩进树选择、新增、编辑、停用
  - 行政区划只读取 `treeType=administrative_division`
  - 无行政区划数据时显示“暂无行政区划数据，请先在树形字典中维护行政区划。”
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

专家候选与分配：

1. 在详情页查看专家候选
2. 页面显示“候选专家由后端按项目学科匹配，并自动回避承担单位和合作单位”
3. 候选专家显示姓名、手机号、单位、学科和是否已分配
4. keyword 搜索候选专家和分页可用
5. 项目缺少学科时显示“项目尚未维护学科，无法按学科筛选专家。请先修正项目学科。”
6. 候选为空时显示暂无符合学科与回避规则的专家
7. 选择候选专家后追加，页面提示成功 / 失败数量并刷新已分配专家
8. 选择候选专家后替换，二次确认后刷新已分配专家
9. 在已分配专家中点击移除，二次确认后刷新列表
10. 后端返回学科不匹配或单位冲突 failures 时，页面显示中文原因

批量设置专家：

1. 返回 `/admin/projects`
2. 勾选多个项目
3. 点击“批量设置专家”
4. 选择 active expert 用户和 append / replace 模式
5. 二次确认后提交
6. 页面展示 `successCount`、`failedCount` 和逐项目 results
7. 学科不匹配或单位冲突项目显示失败原因

## 8. 用户管理人工验证

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

## 9. 项目导入人工验证

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
12. 勾选“创建新承担单位”，填写名称、联系人、联系电话、行政区划后保存，后端通过 `createOrganization` 创建并重新匹配
13. 勾选“创建新项目负责人用户”，填写姓名、手机号、关联单位、关联学科后保存，后端通过 `createOwnerUser` 创建并重新匹配
14. 对一条 `importable` 行点击“确认入库”，二次确认文案使用“Excel 第 X 行”，确认后行变为 `confirmed`，任务统计刷新
15. 对一条 `pending_confirmation` / `failed` / `importable` 行点击“跳过”，二次确认文案使用“Excel 第 X 行”，确认后行变为 `skipped`，任务统计刷新
16. 点击“批量确认可导入行”，二次确认提示只处理 `importable` 行，完成后显示 successCount / failedCount / skippedCount 并刷新统计和行列表
17. 到 `/admin/projects` 查看导入或更新后的项目
18. 上传一个新的 Excel 且不确认入库，回到任务列表点击“删除”，二次确认应说明只删除导入任务和行级解析记录、不删除已入库项目、已有确认入库任务不能删除
19. 确认删除后应提示“已删除导入任务，并清理 X 条行记录。”，任务列表刷新且该任务不再出现，直接访问该任务详情应显示不存在或加载失败
20. 上传并至少确认一行入库后回到任务列表，删除按钮应禁用；如绕过前端调用删除接口，后端 409 应展示“该导入任务已有项目确认入库，不能删除导入记录。”
21. 删除未确认导入任务后，到 `/admin/projects` 确认正式项目没有被误删
22. 后端停止、401、403、404、409、400、500 等错误态应显示友好错误，不应白屏

## 10. Excel 字段映射配置人工验证

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

## 11. 当前不验证

- 用户自助改密
- 忘记密码
- 短信验证码
- 用户批量导入
- 权限矩阵配置
- 项目负责人材料上传
- 专家评分
- 合议
- 申诉
- 甲方看板
- 腾讯会议直播 / 推流 / 回看 / API 集成
- 真实 AI
- 前端 E2E 自动化
