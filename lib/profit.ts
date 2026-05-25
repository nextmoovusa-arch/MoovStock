import type { Item } from "@prisma/client";

export interface SaleCostInputs {
  soldPrice: number;
  vintedFee?: number;
  pouchCost?: number;
  labelCost?: number;
  otherCost?: number;
  shippingFee?: number;
}

export interface ProfitBreakdown {
  grossProfit: number;     // après coût achat + frais
  resellerPayout: number;  // part du revendeur
  netProfit: number;       // part admin
  marginPct: number;       // grossProfit / soldPrice
}

/**
 * Calcule la décomposition de profit d'une vente.
 * - commissionRate ∈ [0,1] : part du grossProfit reversée au revendeur.
 */
export function computeProfit(
  item: Pick<Item, "purchasePrice">,
  inputs: SaleCostInputs,
  commissionRate: number,
): ProfitBreakdown {
  const {
    soldPrice,
    vintedFee = 0,
    pouchCost = 0,
    labelCost = 0,
    otherCost = 0,
  } = inputs;

  const purchase = item.purchasePrice ?? 0;
  const fees = vintedFee + pouchCost + labelCost + otherCost;

  const grossProfit = soldPrice - purchase - fees;

  const rate = Math.min(1, Math.max(0, commissionRate));
  const resellerPayout = grossProfit > 0 ? grossProfit * rate : 0;
  const netProfit = grossProfit - resellerPayout;

  const marginPct = soldPrice > 0 ? grossProfit / soldPrice : 0;

  return {
    grossProfit: round2(grossProfit),
    resellerPayout: round2(resellerPayout),
    netProfit: round2(netProfit),
    marginPct,
  };
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}
