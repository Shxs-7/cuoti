import { create } from 'zustand';

interface AppState {
  ready: boolean;
  setReady: (v: boolean) => void;
  title: string;
  setTitle: (v: string) => void;
  showBack: boolean;
  setShowBack: (v: boolean) => void;
}

export const useAppStore = create<AppState>((set) => ({
  ready: false,
  setReady: (v) => set({ ready: v }),
  title: '公考错题本',
  setTitle: (v) => set({ title: v }),
  showBack: false,
  setShowBack: (v) => set({ showBack: v }),
}));
