import { useEffect, useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { fetchDispatchBoard } from '../api/dispatchBoard';

// 星期几映射
const WEEKDAY_MAP = ['日', '一', '二', '三', '四', '五', '六'];

// 生成近7日日期范围 (YYYY-MM-DD)
function getLast7Days(): string[] {
  const dates: string[] = [];
  for (let i = 6; i >= 0; i--) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    dates.push(date.toISOString().split('T')[0]);
  }
  return dates;
}

// 获取某日期是星期几
function getWeekday(dateStr: string): string {
  const date = new Date(dateStr);
  return WEEKDAY_MAP[date.getDay()];
}

// 按日期格式化 API 返回的时间，转换为 yyyy-mm-dd 格式
function formatApiDateTime(dateTimeStr: string): string {
  if (!dateTimeStr) return '';
  // 支持格式: 2026-02-10 17:28:29 或 2026-02-10T08:30:00
  return dateTimeStr.split(' ')[0].split('T')[0];
}

interface TrendsProps {
  factoryCode?: string;
  refreshKey?: number;
}

interface TrendData {
  date: string;
  weekday: string;
  total: number;
  shipped: number;
}

export function Trends({ factoryCode, refreshKey }: TrendsProps) {
  const [data, setData] = useState<TrendData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchTrendData() {
      setLoading(true);
      setError(null);

      try {
        const last7Days = getLast7Days();
        const startDate = last7Days[0];
        const endDate = last7Days[last7Days.length - 1];

        // 一次请求获取近7天全部数据
        const response = await fetchDispatchBoard({
          startTime: `${startDate} 00:00:00`,
          endTime: `${endDate} 23:59:59`,
          size: 9999,
          shippingFactoryCode: factoryCode,
        });

        const allItems = response.content || [];

        // 按日期分组统计已发货订单张数
        const dateCountMap: Record<string, { total: number; shipped: number }> = {};

        // 初始化近7天所有日期
        for (const date of last7Days) {
          dateCountMap[date] = { total: 0, shipped: 0 };
        }

        // 遍历所有订单，按创建日期分组
        for (const item of allItems) {
          const itemDate = formatApiDateTime(item.gmtCreate || '');
          if (dateCountMap[itemDate]) {
            dateCountMap[itemDate].total += 1;
            if (item.isDelivered === true) {
              dateCountMap[itemDate].shipped += 1;
            }
          }
        }
        // 组装图表数据
        const allFlights: TrendData[] = last7Days.map((date) => ({
          date,
          weekday: getWeekday(date),
          total: dateCountMap[date]?.total || 0,
          shipped: dateCountMap[date]?.shipped || 0,
        }));

        setData(allFlights);
      } catch (err) {
        console.error('获取趋势数据失败:', err);
        setError('加载失败');
        // 使用模拟数据作为降级
        setData([
          { date: '2026-02-04', weekday: '三', total: 58, shipped: 55 },
          { date: '2026-02-05', weekday: '四', total: 62, shipped: 58 },
          { date: '2026-02-06', weekday: '五', total: 55, shipped: 52 },
          { date: '2026-02-07', weekday: '六', total: 45, shipped: 42 },
          { date: '2026-02-08', weekday: '日', total: 38, shipped: 35 },
          { date: '2026-02-09', weekday: '一', total: 60, shipped: 56 },
          { date: '2026-02-10', weekday: '二', total: 63, shipped: 58 },
        ]);
      } finally {
        setLoading(false);
      }
    }

    fetchTrendData();
  }, [factoryCode, refreshKey]);

  // 计算今日发货量和平均发货量
  const todayShipped = data[data.length - 1]?.shipped || 0;
  const avgShipped =
    data.length > 0
      ? Math.round(data.reduce((sum, item) => sum + item.shipped, 0) / data.length)
      : 0;

  return (
    <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-3 flex flex-col shadow-lg h-full overflow-hidden">
      {/* 标题和统计 */}
      <div className="flex-none mb-2 flex justify-between items-start">
        <div>
          <h3 className="font-semibold text-lg text-slate-200">近7日订单趋势</h3>
          <div className="flex gap-4 mt-2 text-xs">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-blue-500 rounded"></div>
              <span className="text-slate-400">订单总数</span>
            </div>
          </div>
        </div>

        {/* 今日统计 */}
        {loading ? (
          <div className="text-right">
            <div className="text-2xl font-bold text-slate-400">--</div>
            <div className="text-xs text-slate-500">加载中...</div>
          </div>
        ) : (
          <div className="text-right">
            <div className="text-2xl font-bold text-white">{todayShipped}</div>
            <div className="text-xs text-slate-500">今日发货 / 平均 {avgShipped}</div>
          </div>
        )}
      </div>

      {error && (
        <div className="mb-2 text-xs text-red-400 bg-red-950/30 px-2 py-1 rounded">
          {error} (已显示模拟数据)
        </div>
      )}

      {/* 图表 */}
      <div className="flex-1 w-full min-h-0" style={{ minHeight: '120px' }}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
            <XAxis
              dataKey="date"
              tick={{ fill: '#64748b', fontSize: 12 }}
              axisLine={false}
              tickLine={false}
              dy={10}
              tickFormatter={(value) => {
                const parts = value.split('-');
                return `${parts[1]}/${parts[2]}`;
              }}
            />
            <YAxis tick={{ fill: '#64748b', fontSize: 12 }} axisLine={false} tickLine={false} />
            <Tooltip
              contentStyle={{
                backgroundColor: '#0f172a',
                borderColor: '#1e293b',
                color: '#e2e8f0',
              }}
              itemStyle={{ color: '#e2e8f0' }}
              labelStyle={{ color: '#94a3b8', marginBottom: '4px' }}
              formatter={(value: number, name: string) => [
                value,
                name === 'total' ? '订单总数' : '已发货',
              ]}
              labelFormatter={(_, payload) => {
                if (!payload?.[0]?.payload) return '';
                const { date, weekday } = payload[0].payload as { date: string; weekday: string };
                return `${date} (周${weekday})`;
              }}
            />
            <Bar dataKey="total" fill="#3b82f6" radius={[4, 4, 0, 0]} maxBarSize={40} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
