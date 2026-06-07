# ReviewX 后端 Service 职责地图

## 1. 用途

- 记录 Service 职责边界、依赖关系、外部副作用和不应承担的职责
- 防止 Service 职责膨胀或跨模块串台

## 2. 当前状态

- `backend` 已初始化
- 当前已确认最小根服务
- 当前无业务 Service

## 3. 当前 Service

| Service 名称 | 所属模块 | 核心职责 | 依赖 Model / Service / 外部服务 | 主要方法 | 副作用 | 不应承担的职责 | 关联 API | 关联测试 | 备注 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| `AppService` | app | 提供最小健康检查响应 | 无 | `getHealth()` | 无 | 不承载业务规则、认证、数据库访问或外部集成 | `GET /health` | `src/app.controller.spec.ts`、`test/app.e2e-spec.ts` | 仅用于证明后端骨架可运行 |

## 4. 维护规则

- 新增核心 Service 必须同步本文档
- 修改 Service 职责边界必须同步本文档
- 新增外部服务依赖必须同步本文档
- 局部私有方法调整不一定同步，除非影响职责理解
