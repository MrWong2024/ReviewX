# ReviewX 前端 Handoff 入口

## 1. 项目名称

ReviewX 科评星：科技项目评审协同与监管平台

## 2. 本文档用途

- 作为前端 handoff 入口
- 后续 `frontend` 初始化、路由新增、页面修改、BFF 代理、认证协作和 UI 验收时，优先阅读此文档

## 3. 当前状态

- `frontend` 目录尚未初始化或尚未形成完整前端实现
- 当前仅建立 handoff 骨架
- 后续以实际代码、基础架构文档和后续 handoff 更新为准

## 4. 必读基础文档

- `docs/frontend-architecture.md`
- `docs/auth-baseline.md`
- `docs/codex-rules.md`
- `docs/codex-instruction-spec.md`

## 5. 当前前端 handoff 文档列表

- `handoff-frontend-snapshot.md`：前端当前事实快照
- `handoff-frontend-route-map.md`：前端路由地图

## 6. 后续可能补充但本次不创建的文档

- `handoff-frontend-component-map.md`
- `handoff-frontend-changelog.md`
- `handoff-frontend-manual-checklist.md`

## 7. 后续同步规则

- 新增或修改页面时，同步 route map
- 修改认证跳转、默认入口、BFF 代理、全局 layout 或导航时，同步 frontend snapshot
- 出现稳定可复用组件体系后，再创建 component map
- 出现多轮前端 UI 迭代后，再创建 changelog
- 出现客户演示或验收流程后，再创建 manual checklist
