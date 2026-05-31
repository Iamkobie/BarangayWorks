import { useToastStore } from '../store/toastStore';
import type { ToastType } from '../store/toastStore';

const typeStyles: Record<ToastType, { bg: string; border: string; text: string; icon: string }> = {
  success: { bg: 'bg-green-50', border: 'border-green-200', text: 'text-green-800', icon: '✅' },
  info: { bg: 'bg-blue-50', border: 'border-blue-200', text: 'text-blue-800', icon: 'ℹ️' },
  warning: { bg: 'bg-amber-50', border: 'border-amber-200', text: 'text-amber-800', icon: '⚠️' },
  error: { bg: 'bg-red-50', border: 'border-red-200', text: 'text-red-800', icon: '❌' },
};

export default function ToastContainer() {
  const { toasts, removeToast } = useToastStore();

  if (toasts.length === 0) return null;

  return (
    <div className="fixed top-4 right-4 z-[9999] flex flex-col gap-2 max-w-sm w-full pointer-events-none">
      {toasts.map((toast) => {
        const style = typeStyles[toast.type];
        return (
          <div
            key={toast.id}
            className={`pointer-events-auto animate-slide-down ${style.bg} ${style.border} border rounded-xl px-4 py-3 shadow-lg flex items-center gap-3`}
          >
            <span className="text-lg shrink-0">{style.icon}</span>
            <p className={`text-sm font-medium flex-1 ${style.text}`}>{toast.message}</p>
            <button
              onClick={() => removeToast(toast.id)}
              className="min-w-[28px] min-h-[28px] flex items-center justify-center text-gray-400 hover:text-gray-600 rounded-lg"
              aria-label="Dismiss"
            >
              ✕
            </button>
          </div>
        );
      })}
    </div>
  );
}
