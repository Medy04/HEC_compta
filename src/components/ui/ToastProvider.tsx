"use client";

import { createContext, useCallback, useContext, useMemo, useState } from "react";

export type Toast = { id: number; title?: string; description?: string; variant?: "default" | "success" | "destructive" };

const Ctx = createContext<{ notify: (t: Omit<Toast, "id">) => void } | null>(null);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const notify = useCallback((t: Omit<Toast, "id">) => {
    const id = Date.now() + Math.floor(Math.random() * 1000);
    setToasts((prev) => [...prev, { id, ...t }]);
    setTimeout(() => setToasts((prev) => prev.filter((x) => x.id !== id)), 3500);
  }, []);

  const value = useMemo(() => ({ notify }), [notify]);
  return (
    <Ctx.Provider value={value}>
      {children}
      <div className="fixed right-4 top-16 z-50 flex w-[360px] max-w-[90vw] flex-col gap-2">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={
              "rounded-md border px-3 py-2 shadow-sm " +
              (t.variant === "destructive"
                ? "bg-red-50 border-red-300 text-red-800"
                : t.variant === "success"
                ? "bg-emerald-50 border-emerald-300 text-emerald-800"
                : "bg-white border-border text-foreground")
            }
          >
            {t.title && <div className="text-sm font-semibold">{t.title}</div>}
            {t.description && <div className="text-xs opacity-80">{t.description}</div>}
          </div>
        ))}
      </div>
    </Ctx.Provider>
  );
}

export function useToast() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useToast must be used within ToastProvider");
  return ctx;
}
