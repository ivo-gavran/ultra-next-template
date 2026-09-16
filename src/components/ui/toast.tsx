"use client";

import {
  CheckCircle2Icon,
  CircleAlertIcon,
  InfoIcon,
  XIcon,
} from "lucide-react";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import { cn } from "@/lib/utils";

type ToastVariant = "error" | "info" | "success";

type ToastOptions = {
  duration?: number;
};

type ToastItem = {
  id: string;
  message: string;
  variant: ToastVariant;
};

type ToastContextValue = {
  dismiss: (id: string) => void;
  error: (message: string, options?: ToastOptions) => string;
  info: (message: string, options?: ToastOptions) => string;
  success: (message: string, options?: ToastOptions) => string;
};

const ToastContext = createContext<ToastContextValue | null>(null);

let nextToastId = 0;

const toastStyles = {
  error: "border-destructive/40 bg-background text-foreground",
  info: "border-border bg-background text-foreground",
  success: "border-emerald-500/40 bg-background text-foreground",
} satisfies Record<ToastVariant, string>;

function ToastIcon({ variant }: { variant: ToastVariant }) {
  if (variant === "error") {
    return (
      <CircleAlertIcon
        aria-hidden="true"
        className="text-destructive mt-0.5 size-5 shrink-0"
      />
    );
  }

  if (variant === "success") {
    return (
      <CheckCircle2Icon
        aria-hidden="true"
        className="mt-0.5 size-5 shrink-0 text-emerald-600 dark:text-emerald-400"
      />
    );
  }

  return (
    <InfoIcon
      aria-hidden="true"
      className="text-primary mt-0.5 size-5 shrink-0"
    />
  );
}

export function ToastProvider({
  children,
  dismissLabel,
}: {
  children: React.ReactNode;
  dismissLabel: string;
}) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const timers = useRef(new Map<string, ReturnType<typeof setTimeout>>());

  const dismiss = useCallback((id: string) => {
    const timer = timers.current.get(id);
    if (timer) clearTimeout(timer);
    timers.current.delete(id);
    setToasts((current) => current.filter((toast) => toast.id !== id));
  }, []);

  const show = useCallback(
    (variant: ToastVariant, message: string, options?: ToastOptions) => {
      nextToastId += 1;
      const id = `toast-${nextToastId}`;

      setToasts((current) => [...current, { id, message, variant }].slice(-5));

      const timer = setTimeout(() => dismiss(id), options?.duration ?? 5000);
      timers.current.set(id, timer);

      return id;
    },
    [dismiss],
  );

  useEffect(() => {
    const activeTimers = timers.current;
    return () => {
      activeTimers.forEach((timer) => clearTimeout(timer));
      activeTimers.clear();
    };
  }, []);

  const value = useMemo<ToastContextValue>(
    () => ({
      dismiss,
      error: (message, options) => show("error", message, options),
      info: (message, options) => show("info", message, options),
      success: (message, options) => show("success", message, options),
    }),
    [dismiss, show],
  );

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div
        data-slot="toast-viewport"
        className="pointer-events-none fixed top-4 right-4 z-50 flex w-[min(24rem,calc(100vw-2rem))] flex-col gap-3"
      >
        {toasts.map((toast) => (
          <div
            key={toast.id}
            data-slot="toast"
            data-variant={toast.variant}
            role={toast.variant === "error" ? "alert" : "status"}
            aria-atomic="true"
            className={cn(
              "pointer-events-auto flex items-start gap-3 rounded-xl border p-4 shadow-lg",
              toastStyles[toast.variant],
            )}
          >
            <ToastIcon variant={toast.variant} />
            <p className="min-w-0 flex-1 text-sm leading-5">{toast.message}</p>
            <button
              type="button"
              aria-label={dismissLabel}
              className="text-muted-foreground hover:text-foreground focus-visible:ring-ring -m-1 rounded-md p-1 transition-colors focus-visible:ring-2 focus-visible:outline-none"
              onClick={() => dismiss(toast.id)}
            >
              <XIcon aria-hidden="true" className="size-4" />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);

  if (!context) {
    throw new Error("useToast must be used within ToastProvider");
  }

  return context;
}
