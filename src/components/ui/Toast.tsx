import { useUIStore } from '@/stores/ui.store';

const typeStyles: Record<string, string> = {
  success: 'bg-green-600',
  error: 'bg-red-500',
  info: 'bg-gray-800',
};

export function Toast() {
  const { toasts, removeToast } = useUIStore();
  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-20 left-4 right-4 z-[100] flex flex-col items-center gap-2 pointer-events-none">
      {toasts.map(t => (
        <div
          key={t.id}
          className={`pointer-events-auto px-4 py-2.5 rounded-xl text-white text-sm font-medium shadow-lg animate-fade-in ${typeStyles[t.type] || typeStyles.info}`}
          onClick={() => removeToast(t.id)}
        >
          {t.text}
        </div>
      ))}
    </div>
  );
}
