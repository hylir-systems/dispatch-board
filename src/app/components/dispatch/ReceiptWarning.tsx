import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faExclamationTriangle } from '@fortawesome/free-solid-svg-icons';
import { motion } from 'motion/react';

interface ReceiptWarningProps {
  receiptCount: number;
  deliveredCount: number;
  pendingWithReceiptCount: number;
}

export function ReceiptWarning({
  receiptCount,
  deliveredCount,
  pendingWithReceiptCount,
}: ReceiptWarningProps) {
  // 有以下情况时显示警告：
  // 1. 有回单但是未走系统发货
  // 2. 回单数大于已发货数（疑似有回单没走系统）
  const showWarning = pendingWithReceiptCount > 0 || receiptCount > deliveredCount;
  if (!showWarning) {
    return null;
  }

  const offSystemCount = receiptCount - deliveredCount;

  return (
    <div className="mb-2 rounded-lg overflow-hidden border border-red-900/50 bg-red-950/20">
      <div className="flex items-center px-3 py-2 bg-red-900/20 text-red-200">
        <div className="flex items-center gap-2 font-bold text-red-400 mr-4 z-10 bg-red-950/20 pr-3">
          <FontAwesomeIcon icon={faExclamationTriangle} className="animate-pulse" />
          <span>回单异常</span>
        </div>

        <div className="flex-1 overflow-hidden relative">
          {pendingWithReceiptCount > 0 && (
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="flex items-center gap-2 text-xs bg-red-900/40 px-2 py-0.5 rounded border border-red-900/60 mb-1"
            >
              <span className="font-semibold text-red-200">
                有回单，但是未走系统发货 {pendingWithReceiptCount} 单
              </span>
            </motion.div>
          )}

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.1 }}
            className="flex items-center gap-2 text-xs"
          >
            <span className="text-red-300/80">
              回单 {receiptCount} 单 {'>'} 已发货 {deliveredCount} 单，疑似{' '}
              {Math.max(0, offSystemCount)} 单未走系统直接发走
            </span>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
