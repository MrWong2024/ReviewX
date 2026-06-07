# ReviewX 后端配置矩阵

## 1. 用途

- 记录后端环境变量、配置项、默认值、运行环境差异、敏感性和来源
- 防止 Codex 或人工维护者误用配置

## 2. 当前状态

- `backend` 已初始化为公共 NestJS 骨架
- 当前已接入 `MongooseModule` 与 MongoDB 连接配置基线
- 配置值当前来自环境变量，并提供 `.env.example` / `.env.development.example` / `.env.test.example` / `.env.production.example`
- 当前仅建立数据库连接能力，尚未注册业务 Schema

## 3. 当前配置项

| 配置项 | 所属模块 | 类型 | 是否敏感 | development | test | staging | production | 默认值 | 来源 | 是否必填 | 说明 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| `NODE_ENV` | app | string | 否 | `development` | `test` | 环境变量 | 环境变量 | `development` | 环境变量 | 否 | 运行环境标识，校验范围为 `development / test / production` |
| `PORT` | app | number | 否 | `5001` 或环境变量覆盖 | 环境变量或默认值 | 环境变量 | 环境变量 | `5001` | 环境变量 | 否 | HTTP 监听端口；本地默认与其他同机服务错开 |
| `FRONTEND_URL` | app | string | 否 | `http://localhost:3001` 或环境变量覆盖 | 环境变量或默认值 | 环境变量 | 环境变量 | `http://localhost:3001` | 环境变量 | 否 | 前端地址，作为 CORS 备用来源 |
| `CORS_ORIGIN` | app | string | 否 | `http://localhost:3001` 或环境变量覆盖 | 环境变量或默认值 | 环境变量 | 环境变量 | `http://localhost:3001` | 环境变量 | 否 | CORS 来源配置，支持单值、逗号分隔多值或 `*` |
| `MONGO_URI` | mongo | string | 是 | `mongodb://localhost:27017/reviewx_dev` 或环境变量覆盖 | `mongodb://localhost:27017/reviewx_test` 或环境变量覆盖 | 环境变量 | 显式提供，数据库名应为 `reviewx` | development 默认 `reviewx_dev`；test 默认 `reviewx_test`；production 无代码默认值 | 环境变量 | production 是；development/test 否 | MongoDB 连接串；不得在仓库中写入真实连接串、账号或密码 |
| `MONGO_AUTO_INDEX` | mongo | boolean | 否 | `true` 或环境变量覆盖 | `true` 或环境变量覆盖 | 环境变量 | `false` | development/test 默认 `true`；production 默认 `false` | 环境变量 | 否 | 统一控制 Mongoose `autoIndex`；production 必须关闭 |

## 4. 配置分类建议

- 服务端口
- 数据库连接
- Session / Cookie
- 对象存储
- 邮件 / 短信
- 外部会议或直播平台
- 模型服务
- 日志与审计
- 后台任务
- 调试 / Ops 开关

## 5. 维护规则

- 新增或修改环境变量必须同步本文档
- 新增敏感配置必须标注敏感
- 不得在本文档写入真实密钥、密码、连接串或 Token
- 配置实际值以环境变量、部署平台或 `.env.example` 为准
- production 数据库名口径为 `reviewx`，development 为 `reviewx_dev`，test 为 `reviewx_test`
- 当前无 Email 配置，也未引入短信、AI、对象存储或会议平台相关配置
