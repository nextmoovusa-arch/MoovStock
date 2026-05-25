import type { Account, TransactionCategory, TransactionType } from "@prisma/client";

export const ACCOUNT_LABEL: Record<Account, string> = {
  CASH: "Espèces",
  BANK: "Banque",
  PAYPAL: "PayPal",
  REVOLUT: "Revolut",
  OTHER: "Autre",
};

export const CATEGORY_LABEL: Record<TransactionCategory, string> = {
  STOCK_BUY: "Achat stock",
  SUPPLIES: "Consommables",
  SHIPPING: "Transport / port",
  AD: "Publicité",
  PAYOUT: "Reversement revendeur",
  REFUND: "Remboursement acheteur",
  EQUIPMENT: "Équipement",
  TRANSPORT: "Déplacements",
  OTHER: "Autre",
};

export const TYPE_LABEL: Record<TransactionType, string> = {
  INCOME: "Recette",
  EXPENSE: "Dépense",
  RESELLER_PAYOUT: "Paiement revendeur",
  REFUND: "Remboursement",
};
