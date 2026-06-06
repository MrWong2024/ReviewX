# ReviewX 后端 API 地图

## 1. 用途

- 记录后端 API 路径、方法、用途、权限、Controller、Service、状态
- 方便 Codex 修改接口时快速判断影响范围

## 2. 当前状态

- `backend` 尚未初始化
- 当前无已确认 API
- 本文档仅建立后续记录模板

## 3. API 记录模板

| 模块 | 方法 | 路径 | Controller | Service | 权限 / Guard | 请求 DTO | 响应 DTO / 返回结构 | 状态 | 备注 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 待定 | 待定 | 待定 | 待定 | 待定 | 待定 | 待定 | 待定 | planned | 后续由真实实现补充 |

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
