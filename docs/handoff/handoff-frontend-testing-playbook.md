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

## 3. 登录与会话人工验证

1. 后端运行在 `5001`
2. 浏览器访问 `http://localhost:3001`
3. 使用本地 admin 账号登录
4. 登录成功后进入 `/workspace`
5. 刷新页面，确认 `GET /auth/me` 可保持会话
6. 点击退出登录，确认回到 `/login`
7. 确认浏览器 JS 中没有 token 存储逻辑

## 4. 角色入口人工验证

1. admin 账号应显示“管理员”入口
2. 点击管理员入口进入 `/admin`
3. 其他角色卡片显示“后续建设”
4. 无 admin 角色访问 `/admin` 应显示 403 状态或回工作台

## 5. 管理员后台人工验证

1. `/admin` 可访问
2. 顶部栏显示当前用户和管理员角色
3. 侧边栏导航可用
4. 退出登录可用

## 6. 主数据人工验证

- `/admin/batches`：列表、新增、编辑、停用
- `/admin/dictionaries`：列表、dictType 过滤、新增、编辑、停用
- `/admin/tree-dictionaries`：列表、treeType 过滤、parent 选择、新增、编辑、停用
- `/admin/organizations`：分页、关键词搜索、行政区划选择、新增、编辑、停用
- `/admin/review-schemes`：列表、新增、编辑、停用、添加/删除评分项
- 后端返回 400/403/409/500 时，页面应显示错误提示

## 7. 项目列表人工验证

- `/admin/projects` 可显示分页列表
- keyword 搜索可用
- 批次、项目类型、状态、评审方案过滤可用
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
