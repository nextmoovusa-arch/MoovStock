import type { Metadata } from "next";
import { ClerkProvider } from "@clerk/nextjs";
import "./globals.css";

export const metadata: Metadata = {
  title: "MoovStock",
  description: "Gestion réseau de revendeurs Vinted",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <ClerkProvider
      appearance={{
        variables: {
          colorPrimary: "#3fd4b3",
          colorBackground: "#0f1514",
          colorInputBackground: "#0f1514",
          colorInputText: "#e8f2ef",
          colorText: "#e8f2ef",
          colorTextSecondary: "#8e9e9a",
          colorNeutral: "#e8f2ef",
          borderRadius: "0.5rem",
        },
        elements: {
          card: "bg-surface border border-subtle shadow-none",
          formButtonPrimary:
            "bg-accent text-on-accent hover:bg-accent-strong shadow-none",
          socialButtonsBlockButton:
            "bg-surface-2 border-subtle text-foreground hover:bg-subtle",
          footerActionLink: "text-accent hover:text-accent-strong",
          headerTitle: "text-foreground",
          headerSubtitle: "text-muted",
        },
      }}
    >
      <html lang="fr">
        <body className="relative overflow-x-hidden">
          <div className="pointer-events-none fixed inset-x-0 -top-40 h-[420px] bg-brand-glow" />
          <div className="relative">{children}</div>
        </body>
      </html>
    </ClerkProvider>
  );
}
