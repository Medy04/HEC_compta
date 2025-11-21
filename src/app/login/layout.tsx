import type { Metadata } from "next";
import { ToastProvider } from "@/components/ui/ToastProvider";

export const metadata: Metadata = {
  title: "Connexion — HEC Abidjan",
};

export default function LoginLayout({ children }: { children: React.ReactNode }) {
  return (
    <ToastProvider>
      <main className="min-h-dvh">{children}</main>
    </ToastProvider>
  );
}
