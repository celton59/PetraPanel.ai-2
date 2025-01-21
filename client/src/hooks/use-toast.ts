import * as React from "react";

type ToastProps = {
  id: string;
  title?: string;
  description?: React.ReactNode;
  variant?: "default" | "destructive";
  duration?: number;
};

type State = {
  toasts: ToastProps[];
};

const toastState = {
  toasts: [] as ToastProps[],
  listeners: new Set<(state: State) => void>(),

  emit() {
    this.listeners.forEach(listener => {
      listener({ toasts: this.toasts });
    });
  },

  subscribe(listener: (state: State) => void) {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  },

  addToast(toast: Omit<ToastProps, "id">) {
    // Prevenir toasts duplicados
    const existingToast = this.toasts.find(t => 
      t.title === toast.title && 
      t.description === toast.description
    );
    
    if (existingToast) {
      return existingToast;
    }

    const id = Math.random().toString(36).slice(2);
    const newToast = { ...toast, id };

    this.toasts = [newToast, ...this.toasts];
    this.emit();

    setTimeout(() => {
      this.dismissToast(id);
    }, toast.duration || 3000);

    return newToast;
  },

  dismissToast(id: string) {
    this.toasts = this.toasts.filter(t => t.id !== id);
    this.emit();
  }
};

export function useToast() {
  const [state, setState] = React.useState<State>({ toasts: [] });

  React.useEffect(() => {
    const unsubscribe = toastState.subscribe(setState);
    return () => {
      unsubscribe();
    };
  }, []);

  return {
    toast: toastState.addToast.bind(toastState),
    dismiss: toastState.dismissToast.bind(toastState),
    toasts: state.toasts
  };
}

export type { ToastProps };