import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";
import { analyzeSupply } from "@/lib/supplies";
import { PageHeader } from "@/components/PageHeader";
import { SupplyCard } from "./SupplyCard";
import { NewSupplyButton } from "./NewSupplyButton";
import type { Supply } from "@prisma/client";

export const dynamic = "force-dynamic";

export default async function MySuppliesPage() {
  const user = await requireUser();
  const supplies = await prisma.supply.findMany({
    where: { userId: user.id },
    orderBy: [{ active: "desc" }, { type: "asc" }, { createdAt: "asc" }],
    include: {
      movements: { orderBy: { createdAt: "desc" }, take: 5 },
    },
  });

  const analyses = await Promise.all(supplies.map((s) => analyzeSupply(s as Supply)));

  return (
    <>
      <PageHeader
        title="Mes consommables"
        subtitle="Pochettes, étiquettes, encre — décrémenté automatiquement par tes saisies quotidiennes."
        action={<NewSupplyButton />}
      />

      {supplies.length === 0 ? (
        <div className="rounded-lg border border-dashed border-slate-300 bg-white p-10 text-center text-sm text-slate-500">
          Aucun consommable suivi. Ajoute-en pour activer les alertes de rachat.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {supplies.map((s, i) => (
            <SupplyCard key={s.id} supply={s} analysis={analyses[i]} movements={s.movements} />
          ))}
        </div>
      )}
    </>
  );
}
