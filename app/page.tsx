import { redirect } from "next/navigation";
import { auth } from "@clerk/nextjs/server";
import { getOrCreateDbUser } from "@/lib/auth";

export default async function Home() {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  const user = await getOrCreateDbUser();
  if (!user) redirect("/sign-in");

  redirect(user.role === "ADMIN" ? "/dashboard" : "/my/items");
}
