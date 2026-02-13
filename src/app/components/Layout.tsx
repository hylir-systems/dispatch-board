import { useState, useEffect, useRef } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { routes } from '../router';
import { cn } from './ui/utils';
import { LayoutDashboard, Truck, Factory, Activity, Package, Gauge } from 'lucide-react';

// 检测是否是 Android 设备
function isAndroidDevice() {
  const ua = navigator.userAgent || navigator.vendor || '';
  return /android/i.test(ua) && !/windows phone/i.test(ua);
}

// 图标映射
const iconMap: Record<string, typeof LayoutDashboard> = {
  LayoutDashboard,
  Truck,
  Factory,
  Activity,
  Package,
  Gauge,
};

export function Layout() {
  const navigate = useNavigate();
  const location = useLocation();
  const [isSidebarVisible, setIsSidebarVisible] = useState(false);

  // 检测 Android 并处理 viewport
  useEffect(() => {
    const isAndroid = isAndroidDevice();

    if (isAndroid) {
      // Android 电视：移除 viewport 缩放限制
      const viewport = document.querySelector('meta[name="viewport"]');
      if (viewport) {
        viewport.setAttribute('content', 'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no');
      }
    }
  }, []);

  // 鼠标离开侧边栏区域后延迟隐藏
  const hideTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleMouseEnter = () => {
    if (hideTimeoutRef.current) {
      clearTimeout(hideTimeoutRef.current);
      hideTimeoutRef.current = null;
    }
    setIsSidebarVisible(true);
  };

  const handleMouseLeave = () => {
    hideTimeoutRef.current = setTimeout(() => {
      setIsSidebarVisible(false);
    }, 300);
  };

  useEffect(() => {
    return () => {
      if (hideTimeoutRef.current) {
        clearTimeout(hideTimeoutRef.current);
      }
    };
  }, []);

  return (
    <div
      className="h-screen w-screen bg-slate-950 text-slate-200 flex overflow-hidden min-h-0"
      onMouseMove={(e) => {
        if (e.clientX < 60) {
          setIsSidebarVisible(true);
        }
      }}
    >
      {/* 侧边栏导航 */}
      <nav
        className={cn(
          'fixed left-0 top-0 bottom-0 z-50 bg-slate-900/95 backdrop-blur-sm border-r border-slate-800 transition-all duration-300 ease-out',
          isSidebarVisible ? 'w-20 lg:w-64 translate-x-0' : 'w-20 lg:w-64 -translate-x-full'
        )}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        {/* Logo / 标题 */}
        <div className="px-4 py-4">
          <h1 className="text-lg lg:text-xl font-bold text-teal-400 hidden lg:block">
            HYLiR 看板系统
          </h1>
          <h1 className="text-lg font-bold text-teal-400 lg:hidden text-center">📺</h1>
        </div>

        {/* 菜单列表 */}
        <ul className="flex-1 space-y-1 px-2">
          {routes
            .filter((route) => route.showInMenu !== false)
            .map((route) => {
              const Icon = route.icon ? iconMap[route.icon] || LayoutDashboard : LayoutDashboard;
              const isActive = location.pathname === route.path;

              return (
                <li key={route.path}>
                  <button
                    onClick={() => navigate(route.path!)}
                    className={cn(
                      'w-full flex items-center gap-3 px-3 py-3 rounded-lg transition-all duration-200',
                      isActive
                        ? 'bg-teal-500/20 text-teal-400 border border-teal-500/30'
                        : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
                    )}
                  >
                    <Icon className="w-5 h-5 flex-shrink-0" />
                    <span className="hidden lg:block font-medium">{route.name}</span>
                  </button>
                </li>
              );
            })}
        </ul>

        {/* 底部信息 */}
        <div className="px-4 py-4 border-t border-slate-800">
          <p className="text-xs text-slate-500 hidden lg:block text-center">
            v1.0.0 • 电视看板系统
          </p>
        </div>
      </nav>

      {/* 鼠标悬停提示区域 - 左侧细条 */}
      <div
        className={cn(
          'fixed left-0 top-0 bottom-0 w-10 z-40 lg:hidden',
          isSidebarVisible ? 'opacity-0' : 'opacity-100'
        )}
        style={{
          background: 'linear-gradient(90deg, rgba(20, 184, 166, 0.3) 0%, transparent 100%)'
        }}
      />

      {/* 主内容区域 */}
      <main className="flex-1 flex flex-col overflow-hidden w-full">
        <Outlet />
      </main>
    </div>
  );
}
