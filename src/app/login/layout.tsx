import type { Metadata } from "next";
import { ToastProvider } from "@/components/ui/ToastProvider";
import { Footer } from "@/components/layout/Footer";

export const metadata: Metadata = {
  title: "Connexion — HEC Abidjan",
};

export default function LoginLayout({ children }: { children: React.ReactNode }) {
  return (
    <ToastProvider>
      <div className="min-h-dvh flex flex-col">
        <main className="flex-1">{children}</main>
        <Footer />
      </div>
    </ToastProvider>
  );
}
