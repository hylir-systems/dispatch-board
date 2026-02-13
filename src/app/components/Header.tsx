import { useState, useEffect } from 'react';
import { Solar } from 'lunar-javascript';

interface HeaderProps {
  factoryName?: string;
  title?: string;
}

// 获取农历日期
function getLunarDate(date: Date): string {
  try {
    const solar = Solar.fromDate(date);
    const lunar = solar.getLunar();
    // 格式: 正月初一, 腊月廿三 等
    const month = lunar.getMonthInChinese() + '月';
    const day = lunar.getDayInChinese();
    return `农历${month}${day}`;
  } catch {
    return '';
  }
}

export function Header({ factoryName, title = 'JIT/JIS 发货看板' }: HeaderProps) {
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('zh-CN', { year: 'numeric', month: '2-digit', day: '2-digit' });
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' });
  };

  // Simple lunar date simulation or placeholder as real lunar calc is complex
  const lunarDate = getLunarDate(time);

  return (
    <div className="flex justify-between items-center py-2 px-4 mb-2">
      <div className="flex items-center gap-4">
        <div className="bg-teal-600 px-4 py-2 rounded-lg shadow-[0_0_15px_rgba(20,184,166,0.3)]">
          <h1 className="text-2xl font-bold text-white tracking-wider">{title}</h1>
        </div>
        {factoryName && (
          <div className="bg-teal-900/50 text-teal-400 border border-teal-700 px-3 py-1 rounded text-xs flex flex-col items-center">
            <span>{factoryName}</span>
          </div>
        )}
      </div>

      <div className="flex items-center gap-6 text-slate-300 font-mono text-lg">
        <div className="flex items-center gap-2">
          <span>{formatDate(time)}</span>
          <span className="text-teal-400">{formatTime(time)}</span>
        </div>
        <div>周{['日', '一', '二', '三', '四', '五', '六'][time.getDay()]}</div>
        <div className="text-slate-400 text-base">{lunarDate}</div>
      </div>
    </div>
  );
}
