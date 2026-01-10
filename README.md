# AIGC Cloud Frontend

基于 Next.js 16 的 AI 创作平台前端。

## 技术栈

- **框架**: Next.js 16 (App Router)
- **UI**: Tailwind CSS + Radix UI + Shadcn/ui
- **状态管理**: Zustand
- **表单**: React Hook Form + Zod
- **Web3**: ethers.js
- **国际化**: next-intl

## 开发

```bash
# 安装依赖
pnpm install

# 启动开发服务
pnpm dev

# 构建
pnpm build

# 代码检查
pnpm lint
```

## 测试

```bash
# 单元测试
pnpm test

# E2E 测试
pnpm test:e2e

# E2E 测试 (UI 模式)
pnpm test:e2e:ui
```

## 目录结构

```
src/
├── app/           # 页面路由
├── components/    # 组件
├── hooks/         # 自定义 Hooks
├── lib/           # 工具函数
├── store/         # 状态管理
├── types/         # 类型定义
└── i18n/          # 国际化
```
