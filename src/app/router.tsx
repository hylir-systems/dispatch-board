import { createBrowserRouter, redirect, type RouteObject } from 'react-router-dom';
import { lazy } from 'react';
import { BoardRouteObject } from './pages/routeTypes';
import { Layout } from './components/Layout';

// 404 页面
const NotFound = () => (
  <div className="h-screen bg-slate-950 text-slate-200 p-8 flex items-center justify-center">
    <div className="text-center">
      <h1 className="text-4xl font-bold text-red-500 mb-4">404</h1>
      <p className="text-xl text-slate-500">页面不存在</p>
    </div>
  </div>
);

// 临时占位页面 - 未来扩展用
const PlaceholderPage = ({ name }: { name: string }) => (
  <div className="h-screen bg-slate-950 text-slate-200 p-8 flex items-center justify-center">
    <div className="text-center">
      <h1 className="text-4xl font-bold text-slate-400 mb-4">🚧 开发中</h1>
      <p className="text-xl text-slate-500">{name} 看板页面正在开发中...</p>
    </div>
  </div>
);

// 懒加载页面 - 命名导出需要转换
const DispatchPage = lazy(() =>
  import('./pages/DispatchPage').then((module) => ({ default: module.DispatchPage }))
);

// 路由配置
const routes: BoardRouteObject[] = [
  {
    path: '/dispatch',
    name: '发货看板',
    element: <DispatchPage />,
    icon: 'Truck',
    showInMenu: true,
  },
  {
    path: '/production',
    name: '生产看板',
    element: <PlaceholderPage name="生产现场" />,
    icon: 'Factory',
    showInMenu: true,
  },
  {
    path: '/quality',
    name: '质量看板',
    element: <PlaceholderPage name="质量监控" />,
    icon: 'Activity',
    showInMenu: true,
  },
  {
    path: '/inventory',
    name: '库存看板',
    element: <PlaceholderPage name="库存管理" />,
    icon: 'Package',
    showInMenu: true,
  },
  {
    path: '/oee',
    name: 'OEE 看板',
    element: <PlaceholderPage name="设备效率" />,
    icon: 'Gauge',
    showInMenu: true,
  },
];

// 创建路由器
export const router = createBrowserRouter(
  [
    {
      path: '/',
      element: <Layout />,
      children: [
        {
          index: true,
          loader: () => redirect('/dispatch'),
        },
        ...(routes as RouteObject[]),
        {
          path: '*',
          element: <NotFound />,
        },
      ],
      errorElement: <NotFound />,
    },
  ],
  {
    basename: '/hylir-tv-dashboard',
  }
);

// 导出路由配置供菜单使用
export { routes };
