import { PageHeader } from "@/components/PageHeader";
import { NewItemForm } from "./NewItemForm";

export const dynamic = "force-dynamic";

export default function NewItemPage() {
  return (
    <>
      <PageHeader title="Nouvel article" subtitle="Saisis les infos d'achat et de mise en vente." />
      <div className="max-w-2xl rounded-lg border border-subtle bg-surface p-6">
        <NewItemForm />
      </div>
    </>
  );
}
