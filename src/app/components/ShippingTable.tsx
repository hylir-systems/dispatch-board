import { useRef, useEffect, useState } from 'react';
import { CheckCircle2, Clock, AlertCircle, FileText } from 'lucide-react';

interface Order {
  id: string;
  type: string;
  receiver: string;
  requestTime: string;
  status: 'shipped' | 'pending' | 'delayed';
  hasReturn: boolean;
  risk: 'low' | 'medium' | 'high' | 'none';
}

interface ShippingTableProps {
  orders: Order[];
  onRefresh?: () => void;
  autoScroll?: boolean;
  refreshKey?: number;
}

const statusConfig = {
  shipped: {
    color: 'text-emerald-400',
    bg: 'bg-emerald-500/10 border-emerald-500/20',
    icon: CheckCircle2,
    label: '已发货',
  },
  pending: {
    color: 'text-amber-400',
    bg: 'bg-amber-500/10 border-amber-500/20',
    icon: Clock,
    label: '待发货',
  },
  delayed: {
    color: 'text-red-400',
    bg: 'bg-red-500/10 border-red-500/20',
    icon: AlertCircle,
    label: '延误',
  },
};

const riskConfig = {
  none: { color: 'text-emerald-400', label: '正常' },
  low: { color: 'text-yellow-400', label: '低风险' },
  medium: { color: 'text-orange-400', label: '中风险' },
  high: { color: 'text-red-400', label: '高风险' },
};

// 滚动速度
const SCROLL_SPEED = 1;
// 触底阈值
const BOTTOM_THRESHOLD = 50;

export function ShippingTable({
  orders,
  onRefresh,
  autoScroll = true,
  refreshKey,
}: ShippingTableProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const scrollRef = useRef<number | null>(null);
  const shouldScrollRef = useRef(true);
  const isAtBottomRef = useRef(false);
  const [isAtBottom, setIsAtBottom] = useState(false);

  // 滚动到底部时触发刷新
  const handleScroll = () => {
    if (!containerRef.current || !shouldScrollRef.current) return;

    const el = containerRef.current;
    const maxScroll = el.scrollHeight - el.clientHeight;

    if (el.scrollTop >= maxScroll - BOTTOM_THRESHOLD) {
      shouldScrollRef.current = false;
      isAtBottomRef.current = true;
      setIsAtBottom(true);
      onRefresh?.();
    }
  };

  // refreshKey 或 orders 变化时重启滚动
  useEffect(() => {
    if (!autoScroll || orders.length === 0) return;

    // 取消之前的动画
    if (scrollRef.current) {
      cancelAnimationFrame(scrollRef.current);
    }

    // 重置状态
    shouldScrollRef.current = true;
    isAtBottomRef.current = false;
    setIsAtBottom(false);

    if (containerRef.current) {
      containerRef.current.scrollTop = 0;
    }

    // 滚动动画函数
    const animate = () => {
      if (!containerRef.current || !shouldScrollRef.current) return;

      const el = containerRef.current;
      const maxScroll = el.scrollHeight - el.clientHeight;

      if (el.scrollTop >= maxScroll - BOTTOM_THRESHOLD) {
        // 触底
        shouldScrollRef.current = false;
        isAtBottomRef.current = true;
        setIsAtBottom(true);
        onRefresh?.();
        return;
      }

      el.scrollTop += SCROLL_SPEED;
      scrollRef.current = requestAnimationFrame(animate);
    };

    // 延迟启动
    scrollRef.current = requestAnimationFrame(animate);

    return () => {
      if (scrollRef.current) {
        cancelAnimationFrame(scrollRef.current);
      }
    };
  }, [orders, autoScroll, onRefresh, refreshKey]);

  // 如果没有数据
  if (orders.length === 0) {
    return (
      <div className="bg-slate-900/50 border border-slate-800 rounded-xl overflow-hidden flex flex-col h-full shadow-2xl">
        <div className="flex justify-between items-center p-4 border-b border-slate-800 bg-slate-800/30">
          <h3 className="font-semibold text-lg text-slate-200">发货明细</h3>
          <span className="text-xs text-slate-500 bg-slate-800 px-2 py-1 rounded">共 0 单</span>
        </div>
        <div className="flex-1 flex items-center justify-center text-slate-500">暂无数据</div>
      </div>
    );
  }

  return (
    <div className="bg-slate-900/50 border border-slate-800 rounded-xl overflow-hidden flex flex-col h-full shadow-2xl">
      <div className="flex justify-between items-center p-4 border-b border-slate-800 bg-slate-800/30">
        <h3 className="font-semibold text-lg text-slate-200">发货明细</h3>
        <span className="text-xs text-slate-500 bg-slate-800 px-2 py-1 rounded">
          共 {orders.length} 单
        </span>
      </div>

      <div
        ref={containerRef}
        onScroll={handleScroll}
        className="overflow-auto hide-scrollbar flex-1"
      >
        <table className="w-full text-left border-collapse">
          <thead className="bg-slate-800/50 sticky top-0 z-10 backdrop-blur-md">
            <tr>
              <th className="p-4 text-xs font-medium text-slate-400 uppercase tracking-wider">
                单据号
              </th>
              <th className="p-4 text-xs font-medium text-slate-400 uppercase tracking-wider">
                类型
              </th>
              <th className="p-4 text-xs font-medium text-slate-400 uppercase tracking-wider">
                接收方
              </th>
              <th className="p-4 text-xs font-medium text-slate-400 uppercase tracking-wider">
                要求时间
              </th>
              <th className="p-4 text-xs font-medium text-slate-400 uppercase tracking-wider">
                发货状态
              </th>
              <th className="p-4 text-xs font-medium text-slate-400 uppercase tracking-wider text-center">
                回单
              </th>
              <th className="p-4 text-xs font-medium text-slate-400 uppercase tracking-wider">
                风险评估
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/50">
            {orders.map((order) => {
              const status = statusConfig[order.status];
              const risk = riskConfig[order.risk];
              return (
                <tr key={order.id} className="hover:bg-slate-800/30 transition-colors group">
                  <td className="p-4 font-mono text-slate-300 font-medium group-hover:text-white">
                    {order.id}
                  </td>
                  <td className="p-4">
                    <span className="px-2 py-1 rounded text-xs font-semibold bg-slate-800 text-slate-400 border border-slate-700">
                      {order.type}
                    </span>
                  </td>
                  <td className="p-4 text-slate-400 text-sm">{order.receiver}</td>
                  <td className="p-4 font-mono text-slate-300">{order.requestTime}</td>
                  <td className="p-4">
                    <div
                      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-xs font-medium ${status.bg} ${status.color}`}
                    >
                      <status.icon size={14} />
                      {status.label}
                    </div>
                  </td>
                  <td className="p-4 text-center">
                    {order.hasReturn ? (
                      <span className="inline-flex items-center justify-center w-8 h-8 rounded bg-teal-500/10 text-teal-400 border border-teal-500/20">
                        <FileText size={16} />
                      </span>
                    ) : (
                      <span className="text-slate-600">-</span>
                    )}
                  </td>
                  <td className="p-4">
                    <div className={`flex items-center gap-2 ${risk.color}`}>
                      {order.risk === 'none' ? (
                        <CheckCircle2 size={16} />
                      ) : (
                        <AlertCircle size={16} />
                      )}
                      <span className="text-sm">{risk.label}</span>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {isAtBottom && (
        <div className="p-2 text-center text-xs text-teal-400 bg-teal-500/10 border-t border-teal-500/20">
          已到底部，正在刷新...
        </div>
      )}
    </div>
  );
}
