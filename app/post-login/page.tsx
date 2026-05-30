import { redirect } from "next/navigation";
import { getOrCreateDbUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

/**
 * Cible de Clerk après sign-in / sign-up. Route vers le bon dashboard.
 */
export default async function PostLogin() {
  const user = await getOrCreateDbUser();
  if (!user) redirect("/sign-in");
  redirect(user.role === "ADMIN" ? "/dashboard" : "/my/items");
}
