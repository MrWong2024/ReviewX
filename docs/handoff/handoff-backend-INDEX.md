# ReviewX 后端 Handoff 入口

## 1. 项目名称

ReviewX 科评星：科技项目评审协同与监管平台

## 2. 本文档用途

- 作为后端 handoff 入口
- 后续 `backend` 初始化、模块新增、接口修改、Schema 修改、Service 职责调整、配置修改、测试补充时，优先阅读此文档
- 用于告诉 Codex 和人工维护者应先读哪些后端交接文档

## 3. 当前状态

- `backend` 目录尚未初始化或尚未形成完整后端实现
- 当前仅建立 handoff 骨架
- 后续以实际代码、基础架构文档和后续 handoff 更新为准

## 4. 必读基础文档

- `docs/backend-architecture.md`
- `docs/auth-baseline.md`
- `docs/database-conventions.md`
- `docs/e2e-testing.md`
- `docs/codex-rules.md`
- `docs/codex-instruction-spec.md`

## 5. 当前后端 handoff 文档列表

- `handoff-backend-snapshot.md`：后端当前事实快照
- `handoff-backend-api-map.md`：后端 API 地图
- `handoff-backend-dto-cheatsheet.md`：DTO 与请求响应速查
- `handoff-backend-service-map.md`：Service 职责地图
- `handoff-backend-config-matrix.md`：配置项与环境变量矩阵
- `handoff-backend-decisions.md`：后端关键决策记录

## 6. 后续同步规则

- 新增或修改接口时，同步 API map 和 DTO cheatsheet
- 新增或修改 Service 职责时，同步 service map
- 新增或修改核心 Schema、索引、集合时，同步 backend snapshot；必要时同步数据库相关文档
- 新增或修改配置项时，同步 config matrix
- 形成后端关键架构决策时，同步 backend decisions
- 普通局部实现修改不要求机械同步所有 handoff
