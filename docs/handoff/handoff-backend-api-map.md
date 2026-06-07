# ReviewX 后端 API 地图

## 1. 用途

- 记录后端 API 路径、方法、用途、权限、Controller、Service、状态
- 方便 Codex 修改接口时快速判断影响范围

## 2. 当前状态

- `backend` 已初始化
- 当前已确认最小健康检查 API
- 当前无业务 API

## 3. 当前 API

| 模块 | 方法 | 路径 | Controller | Service | 权限 / Guard | 请求 DTO | 响应 DTO / 返回结构 | 状态 | 备注 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| app | `GET` | `/health` | `AppController` | `AppService` | 公共接口 | 无 | `{ status: 'ok', service: 'reviewx-backend' }` | implemented | 用于确认后端骨架已启动且可响应 |

## 4. 状态建议

- `planned`
- `implemented`
- `deprecated`
- `removed`
- `pending-review`

## 5. 维护规则

- 新增 API 必须补充本文档
- 修改路径、方法、权限、请求体、响应结构时必须同步本文档
- 删除或废弃 API 时必须标注状态
- 不得把未实现 API 写成 `implemented`
