import { ref } from 'vue';

export type ToastVariant = 'success' | 'error' | 'warning' | 'info';

export interface Toast {
  id: string;
  variant: ToastVariant;
  title?: string;
  message: string;
  duration?: number;
}

class ToastStore {
  toasts = ref<Toast[]>([]);
  private defaultDuration = 5000; // 5 seconds

  show(toast: Omit<Toast, 'id'>) {
    const id = `toast-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const newToast: Toast = {
      id,
      duration: toast.duration ?? this.defaultDuration,
      ...toast,
    };

    this.toasts.value.push(newToast);

    // Auto-remove after duration
    if (newToast.duration && newToast.duration > 0) {
      setTimeout(() => {
        this.remove(id);
      }, newToast.duration);
    }

    return id;
  }

  success(message: string, title?: string, duration?: number) {
    return this.show({ variant: 'success', message, title, duration });
  }

  error(message: string, title?: string, duration?: number) {
    return this.show({ variant: 'error', message, title, duration });
  }

  warning(message: string, title?: string, duration?: number) {
    return this.show({ variant: 'warning', message, title, duration });
  }

  info(message: string, title?: string, duration?: number) {
    return this.show({ variant: 'info', message, title, duration });
  }

  remove(id: string) {
    const index = this.toasts.value.findIndex((toast) => toast.id === id);
    if (index > -1) {
      this.toasts.value.splice(index, 1);
    }
  }

  clear() {
    this.toasts.value = [];
  }
}

// Singleton instance
let toastStoreInstance: ToastStore | null = null;

export function useToastStore(): ToastStore {
  if (!toastStoreInstance) {
    toastStoreInstance = new ToastStore();
  }
  return toastStoreInstance;
}

// Convenience composable
export function useToast() {
  const store = useToastStore();

  return {
    show: (toast: Omit<Toast, 'id'>) => store.show(toast),
    success: (message: string, title?: string, duration?: number) =>
      store.success(message, title, duration),
    error: (message: string, title?: string, duration?: number) =>
      store.error(message, title, duration),
    warning: (message: string, title?: string, duration?: number) =>
      store.warning(message, title, duration),
    info: (message: string, title?: string, duration?: number) =>
      store.info(message, title, duration),
    remove: (id: string) => store.remove(id),
    clear: () => store.clear(),
  };
}

