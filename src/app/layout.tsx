import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Sidebar } from "@/components/layout/Sidebar";
import { AuthButton } from "@/components/auth/AuthButton";
import { ToastProvider } from "@/components/ui/ToastProvider";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "HEC Abidjan — Comptabilité",
  description: "Tableau de bord et gestion comptable",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr" className="h-full">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased h-full`}>
        <ToastProvider>
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
        </ToastProvider>
      </body>
    </html>
  );
}
