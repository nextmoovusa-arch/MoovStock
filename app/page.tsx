import Link from "next/link";
import { auth } from "@clerk/nextjs/server";
import { ArrowRight, Boxes, Users, Wallet, BarChart3, Bell, ShoppingBag } from "lucide-react";

export const dynamic = "force-dynamic";

const FEATURES = [
  {
    icon: ShoppingBag,
    title: "Vos articles, partout",
    desc: "Saisis le stock en lot, suis ce qui est posté, marque vendu en un clic.",
  },
  {
    icon: Users,
    title: "Réseau de revendeurs",
    desc: "Invite tes revendeurs, fixe leur commission, vois leur activité en direct.",
  },
  {
    icon: Wallet,
    title: "Trésorerie limpide",
    desc: "Compte bancaire, dettes, paiements groupés des commissions en 2 clics.",
  },
  {
    icon: BarChart3,
    title: "Analyses poussées",
    desc: "CA, profit net, coûts, multiplicateur moyen, top catégories.",
  },
  {
    icon: Boxes,
    title: "Stock consommables",
    desc: "Pochettes, étiquettes : décrémentation auto, alerte rachat intelligente.",
  },
  {
    icon: Bell,
    title: "Alertes intelligentes",
    desc: "Inactivité, objectifs manqués, articles à republier après 10 jours.",
  },
];

export default async function LandingPage() {
  const { userId } = await auth();
  const cta = userId
    ? { href: "/dashboard", label: "Aller au tableau de bord" }
    : { href: "/sign-in", label: "Se connecter" };

  return (
    <div className="min-h-screen flex flex-col">
      {/* Nav */}
      <header className="sticky top-0 z-30 backdrop-blur bg-bg/60 border-b border-subtle">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="size-8 rounded-lg bg-accent/10 border border-accent/30 flex items-center justify-center text-accent font-bold">
              M
            </div>
            <span className="font-semibold tracking-tight">MoovStock</span>
          </div>
          <div className="flex items-center gap-2">
            {!userId && (
              <Link
                href="/sign-up"
                className="hidden sm:inline-flex items-center text-sm text-muted hover:text-foreground transition-colors px-3 py-1.5"
              >
                Créer un compte
              </Link>
            )}
            <Link
              href={cta.href}
              className="inline-flex items-center gap-1 rounded-md bg-accent text-on-accent px-3 py-1.5 text-sm font-medium hover:bg-accent-strong hover:shadow-glow transition-all active:scale-[0.98]"
            >
              {cta.label}
              <ArrowRight className="size-3.5" />
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="relative flex-1 flex items-center">
        <div className="max-w-6xl mx-auto px-6 py-20 lg:py-28 w-full">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-accent/30 bg-accent/10 px-3 py-1 text-xs font-medium text-accent mb-6 animate-fade-in">
              <span className="size-1.5 rounded-full bg-accent animate-pulse-glow" />
              Beta · v1.0
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-semibold tracking-tight leading-[1.05] mb-6 animate-fade-in" style={{ animationDelay: "60ms" }}>
              Gère ton réseau de revendeurs{" "}
              <span className="text-accent">Vinted</span> sans te perdre.
            </h1>

            <p className="text-lg text-muted max-w-xl mb-8 animate-fade-in" style={{ animationDelay: "120ms" }}>
              Stock, ventes, paiements, alertes, analyses : un seul outil pour
              piloter ton activité et celle de tes revendeurs au quotidien.
            </p>

            <div className="flex flex-wrap items-center gap-3 animate-fade-in" style={{ animationDelay: "180ms" }}>
              <Link
                href={cta.href}
                className="inline-flex items-center gap-2 rounded-md bg-accent text-on-accent px-5 py-3 text-sm font-medium hover:bg-accent-strong hover:shadow-glow transition-all active:scale-[0.98]"
              >
                {cta.label}
                <ArrowRight className="size-4" />
              </Link>
              {!userId && (
                <Link
                  href="/sign-up"
                  className="inline-flex items-center text-sm text-muted hover:text-foreground transition-colors px-3 py-3"
                >
                  Créer un compte →
                </Link>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="border-t border-subtle bg-surface/30">
        <div className="max-w-6xl mx-auto px-6 py-16 lg:py-20">
          <h2 className="text-xs uppercase tracking-wider text-muted mb-3">Ce qu&apos;il y a dedans</h2>
          <p className="text-2xl sm:text-3xl font-semibold tracking-tight mb-12 max-w-2xl">
            Tout ce dont t&apos;as besoin, rien que tu n&apos;utilises pas.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {FEATURES.map((f, i) => {
              const Icon = f.icon;
              return (
                <div
                  key={f.title}
                  className="rounded-xl border border-subtle bg-surface p-6 card-hover animate-fade-in"
                  style={{ animationDelay: `${i * 60}ms` }}
                >
                  <div className="size-9 rounded-lg bg-accent/10 border border-accent/30 flex items-center justify-center text-accent mb-4">
                    <Icon className="size-4" />
                  </div>
                  <div className="font-medium mb-1">{f.title}</div>
                  <p className="text-sm text-muted">{f.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* CTA bottom */}
      <section className="border-t border-subtle">
        <div className="max-w-3xl mx-auto px-6 py-20 text-center">
          <h2 className="text-3xl font-semibold tracking-tight mb-3">Prêt à reprendre le contrôle ?</h2>
          <p className="text-muted mb-6">
            {userId ? "Tu es déjà connecté." : "Ça prend 30 secondes pour démarrer."}
          </p>
          <Link
            href={cta.href}
            className="inline-flex items-center gap-2 rounded-md bg-accent text-on-accent px-6 py-3 text-sm font-medium hover:bg-accent-strong hover:shadow-glow transition-all active:scale-[0.98]"
          >
            {cta.label}
            <ArrowRight className="size-4" />
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-subtle">
        <div className="max-w-6xl mx-auto px-6 py-6 text-xs text-muted flex items-center justify-between">
          <span>© {new Date().getFullYear()} MoovStock</span>
          <div className="flex items-center gap-4">
            <Link href="/sign-in" className="hover:text-foreground transition-colors">Connexion</Link>
            {!userId && (
              <Link href="/sign-up" className="hover:text-foreground transition-colors">Inscription</Link>
            )}
          </div>
        </div>
      </footer>
    </div>
  );
}
