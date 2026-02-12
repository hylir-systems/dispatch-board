# JIT/JIS 发货看板

基于 hylir-dispatch-board 设计稿实现的电视看板应用。

## 启动项目

```bash
npm run dev
```

项目将在 `http://localhost:3000` 启动。

## API 代理配置

项目已配置 API 代理，开发环境下会自动将请求转发到后端服务器。

### 代理配置

在 `vite.config.ts` 中已配置以下代理：

| 路径                       | 目标服务器                 | 说明         |
| -------------------------- | -------------------------- | ------------ |
| `/hylir-mes-center`        | `http://192.168.0.85:3680` | MES 看板接口 |
| `/hylir-masterdata-center` | `http://192.168.0.85:3680` | 主数据接口   |
| `/image_store`             | `http://127.0.0.1:9000`    | 图片存储服务 |

### 修改代理目标

编辑 `vite.config.ts` 修改代理目标地址：

```typescript
server: {
  proxy: {
    '/hylir-mes-center': {
      target: 'http://your-server-ip:port', // 修改这里
      changeOrigin: true,
      ws: true,
      // ...
    },
  }
}
```

### 生产环境部署

生产环境需要配置完整的 API 地址：

1. 在代码中直接指定：

```typescript
// src/app/api/dispatchBoard.ts
const API_BASE_URL = 'https://api.your-domain.com';
```

2. 或使用环境变量（创建 `.env` 文件）：

```env
VITE_API_BASE_URL=https://api.your-domain.com
```

## 工厂编码配置

在 `src/app/App.tsx` 中可以修改默认工厂编码：

```typescript
const DEFAULT_FACTORY_CODE = 'XNG'; // 根据实际需求修改
```

## 功能特性

- 实时数据展示
- 自动刷新（每60秒）
- 延误预警提示
- 回单异常检测
- 完整的发货状态追踪

## 构建部署

```bash
npm run build
```

构建产物在 `dist` 目录，可直接部署到静态服务器。
