"use client";

import { AnimatePresence, motion } from "motion/react";
import { createContext, useCallback, useContext, useMemo, useState } from "react";
import { CircleAlert, CircleCheck, Info } from "lucide-react";
import { cn } from "@/lib/utils";

type ToastKind = "success" | "error" | "info";
type Toast = { id: number; kind: ToastKind; message: string };

const ToastContext = createContext<{ push: (kind: ToastKind, message: string) => void }>({
  push: () => {},
});

export function useToast() {
  return useContext(ToastContext);
}

const ICONS = { success: CircleCheck, error: CircleAlert, info: Info };

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const push = useCallback((kind: ToastKind, message: string) => {
    const id = Date.now() + Math.random();
    setToasts((prev) => [...prev, { id, kind, message }]);
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 3600);
  }, []);

  const value = useMemo(() => ({ push }), [push]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div
        aria-live="polite"
        className="pointer-events-none fixed inset-x-0 bottom-4 z-100 flex flex-col items-center gap-2 px-4 sm:bottom-6"
      >
        <AnimatePresence initial={false}>
          {toasts.map((toast) => {
            const Icon = ICONS[toast.kind];
            return (
              <motion.div
                key={toast.id}
                initial={{ opacity: 0, y: 12, scale: 0.97 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 8, scale: 0.97 }}
                transition={{ type: "spring", stiffness: 420, damping: 32 }}
                className={cn(
                  "pointer-events-auto flex max-w-md items-start gap-2.5 rounded-2xl border px-4 py-3 text-sm shadow-lg shadow-black/5 backdrop-blur",
                  "bg-surface/95 border-line",
                )}
              >
                <Icon
                  size={17}
                  className={cn(
                    "mt-px shrink-0",
                    toast.kind === "success" && "text-brand",
                    toast.kind === "error" && "text-danger",
                    toast.kind === "info" && "text-muted",
                  )}
                />
                <span className="leading-snug">{toast.message}</span>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
}
