// 路由类型定义
import type { ReactNode } from 'react';

// 扩展 RouteObject 以支持菜单配置
export interface BoardRouteObject {
  // RouteObject 的字段
  path?: string;
  index?: boolean;
  element?: ReactNode;
  loader?: () => Promise<unknown> | unknown;
  action?: () => Promise<unknown> | unknown;
  errorElement?: ReactNode;
  handle?: unknown;
  id?: string;
  children?: BoardRouteObject[];

  // 自定义字段
  name: string;
  icon?: string;
  description?: string;
  showInMenu?: boolean;
}
