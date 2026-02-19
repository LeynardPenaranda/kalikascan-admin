"use client";

import React, {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
} from "react";

export type ToastType = "success" | "danger" | "info" | "warning";

export type ToastOptions = {
  message: string;
  type?: ToastType; // default: info
  description?: string;
  duration?: number; // ms, default 5000
};

type ToastItem = {
  id: string;
  message: string;
  description: string;
  type: ToastType;
  duration: number;
  exiting: boolean; // ✅ for slide-out
};

const DEFAULT_DURATION = 5000;
const EXIT_ANIM_MS = 250;

const TOAST_STYLES: Record<
  ToastType,
  { wrap: string; title: string; desc: string }
> = {
  success: {
    wrap: "bg-green-600 border-green-700",
    title: "text-white",
    desc: "text-white/90",
  },
  danger: {
    wrap: "bg-red-600 border-red-700",
    title: "text-white",
    desc: "text-white/90",
  },
  info: {
    wrap: "bg-blue-600 border-blue-700",
    title: "text-white",
    desc: "text-white/90",
  },
  warning: {
    wrap: "bg-yellow-300 border-yellow-400",
    title: "text-black",
    desc: "text-black/80",
  },
};

type ToastContextValue = {
  showToast: (opts: ToastOptions) => void;
};

const ToastContext = createContext<ToastContextValue | null>(null);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const timersRef = useRef<Record<string, number>>({});

  const beginRemove = useCallback((id: string) => {
    // mark as exiting (slide out)
    setToasts((prev) =>
      prev.map((t) => (t.id === id ? { ...t, exiting: true } : t)),
    );

    // remove after animation
    window.setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
      if (timersRef.current[id]) {
        window.clearTimeout(timersRef.current[id]);
        delete timersRef.current[id];
      }
    }, EXIT_ANIM_MS);
  }, []);

  const showToast = useCallback(
    (opts: ToastOptions) => {
      const id = `${Date.now()}_${Math.random().toString(16).slice(2)}`;
      const duration = opts.duration ?? DEFAULT_DURATION;

      const item: ToastItem = {
        id,
        message: opts.message,
        description: opts.description ?? "",
        type: opts.type ?? "info",
        duration,
        exiting: false,
      };

      setToasts((prev) => [item, ...prev].slice(0, 3));

      // auto-dismiss after duration
      timersRef.current[id] = window.setTimeout(
        () => beginRemove(id),
        duration,
      );
    },
    [beginRemove],
  );

  const value = useMemo(() => ({ showToast }), [showToast]);

  return (
    <ToastContext.Provider value={value}>
      {children}

      {/* Viewport (centered) */}
      <div className="fixed left-1/2 top-6 z-[9999] -translate-x-1/2 w-[92vw] max-w-sm space-y-3">
        {toasts.map((t) => {
          const s = TOAST_STYLES[t.type];

          return (
            <div
              key={t.id}
              role="status"
              className={[
                "border shadow-lg rounded-2xl px-4 py-3",
                s.wrap,
                // ✅ slide in/out
                "transition-all duration-200 ease-out",
                t.exiting
                  ? "opacity-0 -translate-y-3"
                  : "opacity-100 translate-y-0",
              ].join(" ")}
            >
              <div className="flex items-start gap-3">
                <div className="mt-0.5">
                  <ToastIcon type={t.type} />
                </div>

                <div className="flex-1">
                  <div className={`text-sm font-semibold ${s.title}`}>
                    {t.message}
                  </div>
                  {t.description ? (
                    <div className={`text-xs mt-1 leading-snug ${s.desc}`}>
                      {t.description}
                    </div>
                  ) : null}
                </div>

                <button
                  onClick={() => beginRemove(t.id)}
                  className={`text-xs ${
                    t.type === "warning" ? "text-black/70" : "text-white/70"
                  } hover:opacity-90`}
                  aria-label="Close"
                >
                  ✕
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}

function ToastIcon({ type }: { type: ToastType }) {
  const cls = type === "warning" ? "text-black" : "text-white";
  if (type === "success") return <span className={cls}>✅</span>;
  if (type === "danger") return <span className={cls}>⛔</span>;
  if (type === "warning") return <span className={cls}>⚠️</span>;
  return <span className={cls}>ℹ️</span>;
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used inside <ToastProvider />");
  return ctx;
}
