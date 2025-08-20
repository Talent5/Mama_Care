import { create } from 'zustand';
import { useCallback } from 'react';

type ToastType = 'success' | 'error' | 'info' | 'warning';

interface Toast {
  id: string;
  message: string;
  type: ToastType;
}

interface ToastStore {
  toasts: Toast[];
  addToast: (message: string, type: ToastType) => void;
  removeToast: (id: string) => void;
}

const useToastStore = create<ToastStore>((set) => ({
  toasts: [],
  addToast: (message: string, type: ToastType) => {
    const id = Math.random().toString(36).substring(7);
    set((state) => ({
      toasts: [...state.toasts, { id, message, type }],
    }));
    setTimeout(() => {
      set((state) => ({
        toasts: state.toasts.filter((toast) => toast.id !== id),
      }));
    }, 3000);
  },
  removeToast: (id: string) =>
    set((state) => ({
      toasts: state.toasts.filter((toast) => toast.id !== id),
    })),
}));

export const useToast = () => {
  const { addToast, removeToast, toasts } = useToastStore();

  const showToast = useCallback((message: string, type: ToastType = 'info') => {
    addToast(message, type);
  }, [addToast]);

  return { showToast, removeToast, toasts };
}; 