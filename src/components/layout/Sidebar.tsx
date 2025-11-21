"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { Home, ListFilter, FileText, Layers, Users, FolderTree } from "lucide-react";
import { useEffect, useState } from "react";
import { getCurrentRole } from "@/lib/supabase/queries";

const baseNav = [
  { href: "/transactions", label: "Transactions", icon: ListFilter },
  { href: "/categories", label: "Catégories", icon: FolderTree },
  { href: "/cost-centers", label: "Centres de coûts", icon: Layers },
];

export function Sidebar() {
  const pathname = usePathname();
  const [role, setRole] = useState<"admin" | "user" | "viewer" | "accountant">("viewer");

  useEffect(() => {
    getCurrentRole().then(setRole).catch(() => setRole("viewer"));
  }, []);

  const nav = [
    ...(role === "admin" ? [{ href: "/", label: "Tableau de bord", icon: Home }] : []),
    ...baseNav,
    ...(role === "admin" ? [{ href: "/reports", label: "Rapports", icon: FileText }] : []),
    ...(role === "admin" ? [{ href: "/users", label: "Utilisateurs", icon: Users }] : []),
  ];

  return (
    <aside className="hidden md:flex md:flex-col w-64 shrink-0 border-r bg-white text-gray-900 sticky top-0 h-dvh overflow-y-auto">
      <div className="flex items-center gap-3 p-4 border-b">
        <Image
          src="/branding/logo-hec-abidjan.png"
          alt="HEC Abidjan"
          width={36}
          height={36}
        />
        <span className="font-semibold tracking-wide">HEC Abidjan</span>
      </div>
      <nav className="p-2 space-y-1">
        {nav.map((item) => {
          const Icon = item.icon;
          const active = pathname === item.href || (item.href !== "/" && pathname.startsWith(item.href));
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors border-l-4",
                active
                  ? "border-[var(--primary)] bg-[var(--primary)] text-[var(--primary-foreground)]"
                  : "border-transparent hover:bg-[var(--primary)]/10"
              )}
            >
              <Icon size={18} />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
