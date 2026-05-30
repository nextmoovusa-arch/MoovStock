import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";
import { PageHeader } from "@/components/PageHeader";
import { KpiCard } from "@/components/KpiCard";
import { eur } from "@/lib/format";
import { TaxSettingsForm } from "./TaxSettingsForm";
import { Briefcase, User } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function TaxPage() {
  const admin = await requireAdmin();

  const startOfYear = new Date(new Date().getFullYear(), 0, 1);

  const [yearAgg, monthAgg, allAgg] = await Promise.all([
    prisma.sale.aggregate({
      where: { soldAt: { gte: startOfYear } },
      _sum: { soldPrice: true, netProfit: true },
      _count: true,
    }),
    prisma.sale.aggregate({
      where: { soldAt: { gte: new Date(Date.now() - 30 * 86400000) } },
      _sum: { soldPrice: true, netProfit: true },
    }),
    prisma.sale.aggregate({
      _sum: { soldPrice: true, netProfit: true },
      _count: true,
    }),
  ]);

  const caYear = yearAgg._sum.soldPrice ?? 0;
  const netYear = yearAgg._sum.netProfit ?? 0;
  const caMonth = monthAgg._sum.soldPrice ?? 0;
  const caAll = allAgg._sum.soldPrice ?? 0;

  // Calculs imposition (en mode entreprise)
  const urssafYear = admin.businessMode ? caYear * admin.urssafRate : 0;
  // Impôts : base = profit net après URSSAF
  const profitAfterUrssaf = Math.max(0, netYear - urssafYear);
  const taxYear = admin.businessMode ? profitAfterUrssaf * admin.taxRate : 0;
  const netAfterTax = netYear - urssafYear - taxYear;

  return (
    <>
      <PageHeader
        title="Imposition"
        subtitle="Bascule en mode entreprise pour estimer ce que tu dois à l'URSSAF et au fisc."
      />

      {/* Bloc paramètres */}
      <section className="rounded-xl border border-subtle bg-surface p-6 mb-6">
        <div className="flex items-center gap-3 mb-1">
          <div className={`size-9 rounded-lg flex items-center justify-center border ${
            admin.businessMode
              ? "bg-accent/10 border-accent/30 text-accent"
              : "bg-subtle border-subtle text-muted"
          }`}>
            {admin.businessMode ? <Briefcase className="size-4" /> : <User className="size-4" />}
          </div>
          <div>
            <h2 className="font-medium">
              Mode actuel : {admin.businessMode ? "Entreprise" : "Particulier"}
            </h2>
            <p className="text-xs text-muted">
              {admin.businessMode
                ? "Les calculs URSSAF + impôts sont actifs."
                : "Pas de calcul fiscal — bascule en mode entreprise pour les activer."}
            </p>
          </div>
        </div>

        <div className="mt-4">
          <TaxSettingsForm
            initial={{
              businessMode: admin.businessMode,
              taxRate: admin.taxRate,
              urssafRate: admin.urssafRate,
            }}
          />
        </div>
      </section>

      {/* KPI CA */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <KpiCard
          label="CA depuis le 1er janvier"
          animateValue={caYear}
          format="eur"
          hint={`${yearAgg._count} ventes`}
          tone="positive"
        />
        <KpiCard label="CA 30 derniers jours" animateValue={caMonth} format="eur" />
        <KpiCard label="CA cumulé total" animateValue={caAll} format="eur" hint={`${allAgg._count} ventes`} />
        <KpiCard
          label="Profit net (avant taxes)"
          animateValue={netYear}
          format="eur"
          tone="positive"
        />
      </div>

      {/* Bloc Imposition entreprise */}
      {admin.businessMode ? (
        <section className="rounded-xl border border-subtle bg-surface p-6 mb-6 animate-fade-in">
          <h2 className="font-medium mb-1">Estimation fiscale {new Date().getFullYear()}</h2>
          <p className="text-xs text-muted mb-5">
            Calculs basés sur ton CA et profit net depuis le 1er janvier.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6">
            <div className="rounded-lg border border-warning/30 bg-warning/5 p-4">
              <div className="text-xs uppercase tracking-wider text-muted mb-1">URSSAF dû</div>
              <div className="text-2xl font-semibold tabular-nums text-warning">{eur(urssafYear)}</div>
              <div className="text-xs text-muted mt-1">
                {(admin.urssafRate * 100).toFixed(1)} % × CA ({eur(caYear)})
              </div>
            </div>
            <div className="rounded-lg border border-danger/30 bg-danger/5 p-4">
              <div className="text-xs uppercase tracking-wider text-muted mb-1">Impôts dus</div>
              <div className="text-2xl font-semibold tabular-nums text-danger">{eur(taxYear)}</div>
              <div className="text-xs text-muted mt-1">
                {(admin.taxRate * 100).toFixed(1)} % × profit après URSSAF
              </div>
            </div>
            <div className="rounded-lg border border-success/30 bg-success/5 p-4">
              <div className="text-xs uppercase tracking-wider text-muted mb-1">Net après taxes</div>
              <div className="text-2xl font-semibold tabular-nums text-success">{eur(netAfterTax)}</div>
              <div className="text-xs text-muted mt-1">
                Ce que tu gardes vraiment
              </div>
            </div>
          </div>

          {/* Détail */}
          <div className="rounded-lg border border-subtle bg-surface-2 p-5 text-sm">
            <div className="font-medium mb-3">Détail du calcul</div>
            <dl className="space-y-2">
              <Row label="Chiffre d'affaires" value={eur(caYear)} tone="default" />
              <Row label="− URSSAF" value={`− ${eur(urssafYear)}`} tone="warning" />
              <Row label="Profit net annoncé" value={eur(netYear)} tone="default" hint="prix vendu − achat − frais − commissions" />
              <Row label="Profit après URSSAF" value={eur(profitAfterUrssaf)} tone="default" />
              <Row label="− Impôts" value={`− ${eur(taxYear)}`} tone="danger" />
              <div className="border-t border-subtle/60 pt-2 mt-2">
                <Row label="Reste net pour toi" value={eur(netAfterTax)} tone="success" strong />
              </div>
            </dl>
          </div>

          <div className="mt-5 text-xs text-muted">
            ⚠️ Estimation indicative. Les barèmes réels dépendent de ton statut (micro-entreprise,
            EI, SAS, SARL…), des abattements et de ta tranche d&apos;imposition personnelle.
            Consulte un expert-comptable pour le calcul exact.
          </div>
        </section>
      ) : (
        <section className="rounded-xl border border-dashed border-subtle bg-surface p-10 text-center">
          <div className="text-2xl mb-3">🏠</div>
          <h2 className="font-medium mb-1">Mode particulier actif</h2>
          <p className="text-sm text-muted max-w-md mx-auto">
            Pas de calcul fiscal pour l&apos;instant. Active le mode entreprise au-dessus pour estimer
            tes URSSAF et impôts.
          </p>
        </section>
      )}
    </>
  );
}

function Row({
  label, value, tone, hint, strong,
}: {
  label: string;
  value: string;
  tone?: "default" | "warning" | "danger" | "success";
  hint?: string;
  strong?: boolean;
}) {
  const cls =
    tone === "warning" ? "text-warning" :
    tone === "danger"  ? "text-danger"  :
    tone === "success" ? "text-success" :
                          "text-foreground";
  return (
    <div className="flex justify-between items-baseline">
      <div className="text-muted">
        <span className={strong ? "font-semibold text-foreground" : ""}>{label}</span>
        {hint && <div className="text-[10px] text-muted-strong">{hint}</div>}
      </div>
      <div className={`tabular-nums ${strong ? "text-lg font-semibold " : ""}${cls}`}>{value}</div>
    </div>
  );
}
