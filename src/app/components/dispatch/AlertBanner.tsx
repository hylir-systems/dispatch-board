// React default import not required with the new JSX runtime
import { AlertTriangle, Clock } from 'lucide-react';
import { motion } from 'motion/react';

interface AlertBannerProps {
  alerts: Array<{
    id: string;
    message: string;
    timestamp: string;
  }>;
}

export function AlertBanner({ alerts }: AlertBannerProps) {
  if (alerts.length === 0) return null;

  return (
    <div className="mb-2 rounded-lg overflow-hidden border border-red-900/50 bg-red-950/20">
      <div className="flex items-center px-3 py-2 bg-red-900/20 text-red-200">
        <div className="flex items-center gap-2 font-bold text-red-400 mr-4 z-10 bg-red-950/20 pr-3">
          <AlertTriangle size={18} className="animate-pulse" />
          <span>延误预警</span>
        </div>

        <div className="flex-1 overflow-hidden relative h-6 mask-image-linear-gradient inset-0">
          <motion.div
            className="flex items-center gap-6 whitespace-nowrap inline-flex h-full"
            initial={{ x: '100%' }}
            animate={{ x: '-100%' }}
            transition={{ repeat: Infinity, duration: 40, ease: 'linear' }}
          >
            {alerts.map((alert) => (
              <div
                key={alert.id}
                className="flex items-center gap-3 text-sm bg-red-900/40 px-3 py-1 rounded border border-red-900/60"
              >
                <span className="font-mono text-red-300 font-bold">{alert.id}</span>
                <span className="font-semibold text-red-200">{alert.message}</span>
                <span className="flex items-center gap-1 text-xs opacity-70">
                  <Clock size={12} /> {alert.timestamp}
                </span>
              </div>
            ))}
          </motion.div>
        </div>
      </div>
    </div>
  );
}
