import { useState, useEffect, useCallback, useRef } from 'react';
import { Header } from '../components/Header';
import { MetricCard } from '../components/MetricCard';
import { AlertBanner } from '../components/dispatch/AlertBanner';
import { ShippingTable } from '../components/dispatch/ShippingTable';
import { Trends } from '../components/dispatch/Trends';
import { ReceiptWarning } from '../components/dispatch/ReceiptWarning';
import {
  faList,
  faCheckCircle,
  faFileAlt,
  faClock,
  faExclamationTriangle,
} from '@fortawesome/free-solid-svg-icons';
import {
  fetchDispatchBoard,
  getInfoByFactoryCodeApi,
  type DispatchBoardFlightVO,
  type FactoryInfo,
} from '../api';

// 订单状态类型
type OrderStatus = 'shipped' | 'pending' | 'delayed';
type OrderRisk = 'low' | 'medium' | 'high' | 'none';

// 订单接口
interface Order {
  id: string;
  type: string;
  receiver: string;
  requestTime: string;
  status: OrderStatus;
  hasReturn: boolean;
  risk: OrderRisk;
  riskFlag?: string;
}

// 预警数据接口
interface Alert {
  id: string;
  message: string;
  timestamp: string;
}

// 统计摘要
interface Summary {
  totalCount: number;
  deliveredCount: number;
  pendingCount: number;
  delayedCount: number;
  receiptCount: number;
}

export function DispatchPage() {
  // 数据状态
  const [orders, setOrders] = useState<Order[]>([]);
  const [summary, setSummary] = useState<Summary>({
    totalCount: 0,
    deliveredCount: 0,
    pendingCount: 0,
    delayedCount: 0,
    receiptCount: 0,
  });

  // 预警记录
  const [alerts, setAlerts] = useState<Alert[]>([]);

  // 有回单但未发货的单据数量
  const [pendingWithReceiptCount, setPendingWithReceiptCount] = useState(0);

  // 常量定义
  const NO_DATA_REFRESH_INTERVAL = 5 * 60 * 1000; // 无数据时5分钟刷新

  // 状态管理
  const [_loading, setLoading] = useState(true);
  const [lastUpdateTime, setLastUpdateTime] = useState('');
  const [factoryName, setFactoryName] = useState('');
  const [factoryCode, setFactoryCode] = useState('');
  const [tableRefreshKey, setTableRefreshKey] = useState(0);
  const [trendsRefreshKey, setTrendsRefreshKey] = useState(0);

  // 刷新定时器（仅无数据时使用）
  const refreshTimerRef = useRef<number | null>(null);

  // 格式化时间显示
  const formatTime = (timeStr?: string): string => {
    if (!timeStr) return '-';
    try {
      const date = new Date(timeStr);
      const hours = date.getHours().toString().padStart(2, '0');
      const minutes = date.getMinutes().toString().padStart(2, '0');
      return `${hours}:${minutes}`;
    } catch {
      return '-';
    }
  };

  // 风险等级转换
  const getRiskLevel = (riskFlag?: string): OrderRisk => {
    switch (riskFlag) {
      case 'DELAYED':
        return 'high';
      case 'AT_RISK':
        return 'medium';
      case 'DELIVERED':
      case 'ON_TIME':
        return 'none';
      default:
        return 'none';
    }
  };

  // 发货状态转换
  const getOrderStatus = (isDelivered?: boolean | number | string): OrderStatus => {
    // 处理布尔、数字和字符串
    if (typeof isDelivered === 'boolean') {
      return isDelivered ? 'shipped' : 'pending';
    }
    const value = typeof isDelivered === 'string' ? parseInt(isDelivered, 10) : isDelivered;
    return value ? 'shipped' : 'pending';
  };

  // 数据转换：将 API 数据转换为组件所需格式
  const transformOrders = (records: DispatchBoardFlightVO[]): Order[] => {
    return records.map((record) => ({
      id: record.sheetNo || '',
      type: record.supplyType || '-',
      receiver: record.deliveryRecName || '-',
      requestTime: formatTime(record.lastRecRequireTime),
      status: getOrderStatus(record.isDelivered),
      hasReturn: record.hasReceipt || false,
      risk: getRiskLevel(record.riskFlag),
      riskFlag: record.riskFlag,
    }));
  };

  // 数据转换：预警记录
  const transformAlerts = (records: DispatchBoardFlightVO[]): Alert[] => {
    return records
      .filter((r) => r.riskFlag === 'DELAYED' && !r.hasReceipt)
      .slice(0, 8)
      .map((record) => ({
        id: record.sheetNo || '',
        message: '超时未发货',
        timestamp: formatTime(record.lastRecRequireTime),
      }));
  };

  // 获取工厂信息
  const loadFactoryInfo = useCallback(async () => {
    try {
      const urlParams =
        typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : null;
      // 支持两种参数名：factoryCode（驼峰）和 factorycode（全小写）
      const factoryCodeFromUrl = urlParams
        ? urlParams.get('factoryCode') || urlParams.get('factorycode') || null
        : null;
      const factoryCode =
        (factoryCodeFromUrl && factoryCodeFromUrl.trim()) ||
        (import.meta as any).env?.VITE_FACTORY_CODE ||
        'DEFAULT_FACTORY_CODE';
      const res = await getInfoByFactoryCodeApi(factoryCode);
      // 后端返回 factoryVO 对象（可能为 { factoryCode, factoryName, ... }）
      const info: FactoryInfo = (res as any)?.data ? (res as any).data : (res as any);
      setFactoryName(info.factoryName || '—');
      setFactoryCode(factoryCode);
    } catch (err) {
      console.error('获取工厂信息失败:', err);
      setFactoryName('—');
    }
  }, []);

  // 加载数据
  const loadData = useCallback(async () => {
    try {
      setLoading(true);

      const now = Date.now();
      // 查询时间范围：当前时间前后8小时
      const lastRecRequireTimeStart = new Date(now - 72 * 60 * 60 * 1000).toISOString();
      const lastRecRequireTimeEnd = new Date(now + 8 * 60 * 60 * 1000).toISOString();

      const params = {
        page: 1,
        size: 500, // 不翻页，一次最多取500条
        lastRecRequireTimeStart,
        lastRecRequireTimeEnd,
      };

      const result = await fetchDispatchBoard(params);
      const records = result.content || [];

      // 转换数据
      const transformedOrders = transformOrders(records);
      setOrders(transformedOrders);
      setAlerts(transformAlerts(records));

      // 计算统计摘要
      const deliveredCount = records.filter((r) => r.isDelivered).length;
      const receiptCount = records.filter((r) => r.hasReceipt).length;
      const delayedCount = records.filter((r) => r.riskFlag === 'DELAYED' && !r.hasReceipt).length;
      const pendingWithReceipt = records.filter(
        (r) => r.hasReceipt && r.isDelivered === false
      ).length;

      setSummary({
        totalCount: records.length,
        deliveredCount,
        pendingCount: records.length - deliveredCount,
        delayedCount,
        receiptCount,
      });

      setPendingWithReceiptCount(pendingWithReceipt);

      // 根据是否有数据调整刷新策略
      const hasData = transformedOrders.length > 0;
      if (!hasData) {
        // 无数据时，5分钟刷新
        if (refreshTimerRef.current) {
          clearInterval(refreshTimerRef.current);
        }
        refreshTimerRef.current = window.setInterval(() => {
          loadData();
        }, NO_DATA_REFRESH_INTERVAL);
      } else {
        // 有数据时，不启动自动刷新，由表格触底控制
        if (refreshTimerRef.current) {
          clearInterval(refreshTimerRef.current);
          refreshTimerRef.current = null;
        }
      }

      // 更新时间
      const nowTime = new Date();
      setLastUpdateTime(
        nowTime.toLocaleTimeString('zh-CN', {
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
        })
      );
    } catch (err) {
      console.error('加载数据失败:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  // 初始化
  useEffect(() => {
    // 加载工厂信息
    loadFactoryInfo();

    // 初始加载数据（根据是否有数据决定刷新策略）
    loadData();

    // 清理
    return () => {
      if (refreshTimerRef.current) {
        clearInterval(refreshTimerRef.current);
      }
    };
  }, [loadFactoryInfo, loadData]);

  // 计算完成率
  const completionRate =
    summary.totalCount > 0 ? Math.round((summary.deliveredCount / summary.totalCount) * 100) : 0;

  // 触底刷新处理
  const handleTableRefresh = useCallback(() => {
    setTableRefreshKey((k) => k + 1);
    setTrendsRefreshKey((k) => k + 1);
    loadData();
  }, [loadData]);

  return (
    <div className="flex flex-col h-full min-h-0 p-4 xl:p-6 overflow-hidden">
      {/* 顶部区域: Header + Metrics + Alert + ReceiptWarning */}
      <div className="flex-none">
        <Header factoryName={factoryName} />

        {/* Top Metrics Row */}
        <div className="grid grid-cols-5 gap-3 mb-2">
          <MetricCard title="今日总单" value={summary.totalCount} icon={faList} color="blue" />
          <MetricCard
            title="已发货"
            value={summary.deliveredCount}
            icon={faCheckCircle}
            color="green"
            subtext={`${summary.totalCount > 0 ? Math.round((summary.deliveredCount / summary.totalCount) * 100) : 0}%`}
          />
          <MetricCard
            title="回单总数"
            value={summary.receiptCount}
            icon={faFileAlt}
            color="teal"
            subtext={`${summary.deliveredCount > 0 ? Math.round((summary.receiptCount / summary.deliveredCount) * 100) : 0}%`}
          />
          <MetricCard title="待发货" value={summary.pendingCount} icon={faClock} color="gray" />
          <MetricCard
            title="延误"
            value={summary.delayedCount}
            icon={faExclamationTriangle}
            color="red"
          />
        </div>

        {/* Alert Banner */}
        <AlertBanner alerts={alerts} />

        {/* Receipt Warning */}
        <div className="mb-1">
          <ReceiptWarning
            receiptCount={summary.receiptCount}
            deliveredCount={summary.deliveredCount}
            pendingWithReceiptCount={pendingWithReceiptCount}
          />
        </div>
      </div>

      {/* Main Content Area: 动态计算高度，填满剩余空间 */}
      <div className="flex-1 grid grid-cols-3 gap-1 min-h-0">
        {/* Left: Table (Span 2) */}
        <div className="col-span-2 flex flex-col min-h-0">
          <ShippingTable
            orders={orders}
            onRefresh={handleTableRefresh}
            refreshKey={tableRefreshKey}
          />
        </div>

        {/* Right: Trends & Completion Rate (Span 1) */}
        <div className="flex flex-col gap-2 min-h-0">
          {/* Trends Chart */}
          <div className="flex-1 min-h-0">
            <Trends factoryCode={factoryCode} refreshKey={trendsRefreshKey} />
          </div>

          {/* Completion Rate */}
          <div className="flex-1 min-h-0 bg-slate-900/50 border border-slate-800 rounded-xl p-4 shadow-lg flex flex-col">
            <h3 className="text-sm font-semibold text-slate-400 mb-2 self-start border-b border-slate-800 pb-1">
              今日完成率
            </h3>
            <div className="flex-1 flex items-center justify-center gap-6 min-h-0">
              {/* 巨大的环形图 */}
              <div className="relative w-48 h-48 flex items-center justify-center">
                <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
                  <circle cx="50" cy="50" r="45" fill="none" stroke="#1e293b" strokeWidth="6" />
                  <circle
                    cx="50"
                    cy="50"
                    r="45"
                    fill="none"
                    stroke="#14b8a6"
                    strokeWidth="6"
                    strokeDasharray="282.7"
                    strokeDashoffset={282.7 * (1 - completionRate / 100)}
                    className="transition-all duration-1000 ease-out"
                    strokeLinecap="round"
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-5xl font-bold text-white leading-none">
                    {completionRate}%
                  </span>
                  <span className="text-sm text-slate-500 mt-1">目标 98%</span>
                </div>
              </div>
              {/* 次要信息 - 右侧小字 */}
              <div className="flex flex-col gap-6 text-sm">
                <div className="text-slate-500">
                  <div className="text-xs text-slate-600">距班次结束</div>
                  <div className="text-lg font-medium text-slate-400">4 小时</div>
                </div>
                <div className="text-xs text-slate-600 font-mono">{lastUpdateTime || '--:--'}</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
