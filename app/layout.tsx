import type { Metadata } from "next";
import { Toaster } from "@/components/Toaster";
import "./globals.css";

export const metadata: Metadata = {
  title: "MoovStock",
  description: "Gestion réseau de revendeurs Vinted",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr">
      <body className="relative overflow-x-hidden">
        <div className="pointer-events-none fixed inset-x-0 -top-40 h-[420px] bg-brand-glow" />
        <div className="relative">{children}</div>
        <Toaster />
      </body>
    </html>
  );
}
