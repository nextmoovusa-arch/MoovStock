import Link from "next/link";

export const dynamic = "force-dynamic";

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <div className="text-center">
        <div className="text-6xl font-semibold text-accent mb-2">404</div>
        <p className="text-muted mb-4">Page introuvable.</p>
        <Link
          href="/"
          className="inline-flex items-center rounded-md bg-accent text-on-accent px-4 py-2 text-sm font-medium hover:bg-accent-strong"
        >
          Retour
        </Link>
      </div>
    </div>
  );
}
