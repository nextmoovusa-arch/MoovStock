import { PageHeader } from "./PageHeader";

export function ComingSoon({ title, sprint }: { title: string; sprint: string }) {
  return (
    <>
      <PageHeader title={title} subtitle={`Module livré au ${sprint}.`} />
      <div className="rounded-lg border border-dashed border-slate-300 bg-white p-10 text-center text-sm text-slate-500">
        Bientôt disponible. Le squelette est en place, l&apos;implémentation arrive dans le prochain sprint.
      </div>
    </>
  );
}
