"use client";

import { usePathname } from "next/navigation";
import { Sidebar } from "@/components/layout/Sidebar";
import { AuthButton } from "@/components/auth/AuthButton";

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isLogin = pathname?.startsWith("/login");

  if (isLogin) {
    return <>{children}</>;
  }

  return (
    <div className="min-h-dvh flex">
      <Sidebar />
      <main className="flex-1 bg-[--background] text-[--foreground]">
        <div className="sticky top-0 z-10 border-b bg-background/70 backdrop-blur supports-[backdrop-filter]:bg-background/60">
          <div className="h-12 px-4 flex items-center">
            <AuthButton />
          </div>
        </div>
        <div>{children}</div>
      </main>
    </div>
  );
}
