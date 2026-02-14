import { IconProp } from '@fortawesome/fontawesome-svg-core';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

interface MetricCardProps {
  title: string;
  value: number | string;
  icon: IconProp;
  color: 'blue' | 'green' | 'teal' | 'gray' | 'red';
  subtext?: string;
}

const colorMap = {
  blue: 'bg-blue-500/10 border-blue-500/30 text-blue-400',
  green: 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400',
  teal: 'bg-teal-500/10 border-teal-500/30 text-teal-400',
  gray: 'bg-slate-500/10 border-slate-500/30 text-slate-400',
  red: 'bg-red-500/10 border-red-500/30 text-red-400',
};

const iconBgMap = {
  blue: 'bg-blue-500/20',
  green: 'bg-emerald-500/20',
  teal: 'bg-teal-500/20',
  gray: 'bg-slate-500/20',
  red: 'bg-red-500/20',
};

export function MetricCard({ title, value, icon, color, subtext }: MetricCardProps) {
  return (
    <div
      className={`flex items-center p-4 rounded-xl border ${colorMap[color]} backdrop-blur-sm shadow-lg transition-transform hover:scale-105 duration-200`}
    >
      <div className={`p-3 rounded-lg ${iconBgMap[color]} mr-4`}>
        <FontAwesomeIcon icon={icon} size="lg" />
      </div>
      <div>
        <div className="text-sm font-medium opacity-80 mb-1">{title}</div>
        <div className="text-3xl font-bold tracking-tight text-white flex items-baseline gap-2">
          {value}
          {subtext && <span className="text-xs font-normal opacity-60">{subtext}</span>}
        </div>
      </div>
    </div>
  );
}
