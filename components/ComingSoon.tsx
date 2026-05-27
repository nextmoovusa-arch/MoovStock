import { PageHeader } from "./PageHeader";

export function ComingSoon({ title, sprint }: { title: string; sprint: string }) {
  return (
    <>
      <PageHeader title={title} subtitle={`Module livré au ${sprint}.`} />
      <div className="rounded-xl border border-dashed border-subtle bg-surface p-10 text-center text-sm text-muted">
        Bientôt disponible. Le squelette est en place, l&apos;implémentation arrive dans le prochain sprint.
      </div>
    </>
  );
}
