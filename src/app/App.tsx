import { useState, useEffect, useCallback, useRef } from 'react';
import { Header } from './components/Header';
import { MetricCard } from './components/MetricCard';
import { AlertBanner } from './components/AlertBanner';
import { ShippingTable } from './components/ShippingTable';
import { Trends } from './components/Trends';
import { ReceiptWarning } from './components/ReceiptWarning';
import { List, CheckCircle2, FileText, Clock, AlertTriangle } from 'lucide-react';
import {
  fetchDispatchBoard,
  getInfoByFactoryCodeApi,
  type DispatchBoardFlightVO,
  type FactoryInfo,
} from './api';

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

export default function App() {
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

  // 状态管理
  const [_loading, setLoading] = useState(true);
  const [lastUpdateTime, setLastUpdateTime] = useState('');
  const [refreshCountdown, setRefreshCountdown] = useState(60);
  const [factoryName, setFactoryName] = useState('');
  const [factoryCode, setFactoryCode] = useState('');
  const [tableRefreshKey, setTableRefreshKey] = useState(0);
  const [trendsRefreshKey, setTrendsRefreshKey] = useState(0);

  // 刷新定时器
  const refreshTimerRef = useRef<number | null>(null);
  const countdownTimerRef = useRef<number | null>(null);

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
      const lastRecRequireTimeStart = new Date(now - 8 * 60 * 60 * 1000).toISOString();
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

    // 初始加载数据
    loadData();

    // 启动刷新定时器（每60秒刷新一次）
    refreshTimerRef.current = window.setInterval(() => {
      loadData();
      setRefreshCountdown(60);
    }, 60000);

    // 倒计时显示更新
    countdownTimerRef.current = window.setInterval(() => {
      setRefreshCountdown((prev) => {
        if (prev <= 1) {
          return 60;
        }
        return prev - 1;
      });
    }, 1000);

    // 清理
    return () => {
      if (refreshTimerRef.current) {
        clearInterval(refreshTimerRef.current);
      }
      if (countdownTimerRef.current) {
        clearInterval(countdownTimerRef.current);
      }
    };
  }, [loadFactoryInfo, loadData]);

  // 计算完成率
  const completionRate =
    summary.totalCount > 0 ? Math.round((summary.deliveredCount / summary.totalCount) * 100) : 0;

  // 计算完成率进度
  const completionProgress =
    summary.totalCount > 0 ? 251.2 * (1 - summary.deliveredCount / summary.totalCount) : 251.2;

  // 触底刷新处理
  const handleTableRefresh = useCallback(() => {
    setTableRefreshKey((k) => k + 1);
    setTrendsRefreshKey((k) => k + 1);
    loadData();
  }, [loadData]);

  return (
    <div className="h-screen bg-slate-950 text-slate-200 p-4 xl:p-6 font-sans selection:bg-teal-500/30 overflow-hidden">
      <div className="w-full h-full flex flex-col">
        <Header factoryName={factoryName} />

        {/* Top Metrics Row */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-2 md:gap-3 mb-2">
          <MetricCard title="今日总单" value={summary.totalCount} icon={List} color="blue" />
          <MetricCard
            title="已发货"
            value={summary.deliveredCount}
            icon={CheckCircle2}
            color="green"
            subtext={`${summary.totalCount > 0 ? Math.round((summary.deliveredCount / summary.totalCount) * 100) : 0}%`}
          />
          <MetricCard
            title="回单总数"
            value={summary.receiptCount}
            icon={FileText}
            color="teal"
            subtext={`${summary.deliveredCount > 0 ? Math.round((summary.receiptCount / summary.deliveredCount) * 100) : 0}%`}
          />
          <MetricCard title="待发货" value={summary.pendingCount} icon={Clock} color="gray" />
          <MetricCard title="延误" value={summary.delayedCount} icon={AlertTriangle} color="red" />
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

        {/* Main Content Area */}
        <div className="flex-1 grid grid-cols-1 lg:grid-cols-3 gap-1 min-h-0">
          {/* Left: Table (Span 2) */}
          <div className="lg:col-span-2 h-full min-h-[400px]">
            <ShippingTable
              orders={orders}
              onRefresh={handleTableRefresh}
              refreshKey={tableRefreshKey}
            />
          </div>

          {/* Right: Trends & Insights (Span 1) */}
          <div className="flex flex-col gap-3 h-full">
            <div className="h-56 lg:h-1/2">
              <Trends factoryCode={factoryCode} refreshKey={trendsRefreshKey} />
            </div>

            {/* Additional Widget: Completion Rate */}
            <div className="flex-1 bg-slate-900/50 border border-slate-800 rounded-xl p-4 shadow-lg flex flex-col justify-center items-center">
              <h3 className="text-base font-semibold text-slate-400 mb-3 self-start w-full border-b border-slate-800 pb-2">
                今日完成率
              </h3>
              <div className="relative w-36 h-36 flex items-center justify-center">
                <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
                  <circle cx="50" cy="50" r="40" fill="none" stroke="#1e293b" strokeWidth="10" />
                  <circle
                    cx="50"
                    cy="50"
                    r="40"
                    fill="none"
                    stroke="#14b8a6"
                    strokeWidth="10"
                    strokeDasharray="251.2"
                    strokeDashoffset={completionProgress}
                    className="transition-all duration-1000 ease-out"
                    strokeLinecap="round"
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-3xl font-bold text-white">{completionRate}%</span>
                  <span className="text-xs text-slate-400">目标 98%</span>
                </div>
              </div>
              <div className="mt-2 text-center text-xs text-slate-500">
                <div>距离班次结束还有 4 小时</div>
                <div className="mt-1 text-slate-600 font-mono">
                  {lastUpdateTime || '--:--:--'} / {refreshCountdown}s
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
