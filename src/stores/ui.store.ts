import { create } from 'zustand';
import { uid } from '@/lib/uid';

interface ToastMessage {
  id: string;
  text: string;
  type: 'success' | 'error' | 'info';
}

interface UIState {
  toasts: ToastMessage[];
  toast: (text: string, type?: ToastMessage['type']) => void;
  removeToast: (id: string) => void;
}

export const useUIStore = create<UIState>((set) => ({
  toasts: [],
  toast: (text, type = 'info') => {
    const id = uid();
    set(s => ({ toasts: [...s.toasts, { id, text, type }] }));
    setTimeout(() => {
      set(s => ({ toasts: s.toasts.filter(t => t.id !== id) }));
    }, 2500);
  },
  removeToast: (id) => set(s => ({ toasts: s.toasts.filter(t => t.id !== id) })),
}));
