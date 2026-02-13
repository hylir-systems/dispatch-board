// 路由类型定义
import { type ComponentProps } from 'react';
import { type RouteObject } from 'react-router-dom';

// 扩展 RouteObject 以支持菜单配置
export interface BoardRouteObject extends RouteObject {
  name: string;
  icon?: ComponentProps<typeof import('lucide-react').LucideIcon>['icon'];
  description?: string;
  showInMenu?: boolean;
}

