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

## 7. 项目列表人工验证

- `/admin/projects` 可显示分页列表
- keyword 搜索可用
- 批次、项目类型、状态、评审方案过滤可用
- 项目类型过滤下拉具有树形缩进层级感
- 评审负责人 ID 过滤可用
- 批次、字典、单位、方案等低成本主数据可映射名称
- 没有数据时显示空状态

## 8. 当前不验证

- Excel 导入
- 专家分配
- 项目负责人材料上传
- 专家评分
- 合议
- 申诉
- 甲方看板
- 腾讯会议
- 真实 AI
- 前端 E2E 自动化
