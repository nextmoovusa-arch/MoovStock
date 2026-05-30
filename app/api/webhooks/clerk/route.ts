import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { Webhook } from "svix";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

type ClerkEmail = { id: string; email_address: string };
type ClerkUserPayload = {
  id: string;
  email_addresses: ClerkEmail[];
  primary_email_address_id: string | null;
  first_name: string | null;
  last_name: string | null;
  image_url: string | null;
};

export async function POST(req: Request) {
  const secret = process.env.CLERK_WEBHOOK_SECRET;
  if (!secret) {
    return NextResponse.json({ error: "Missing CLERK_WEBHOOK_SECRET" }, { status: 500 });
  }

  const h = await headers();
  const svixId = h.get("svix-id");
  const svixTimestamp = h.get("svix-timestamp");
  const svixSignature = h.get("svix-signature");
  if (!svixId || !svixTimestamp || !svixSignature) {
    return NextResponse.json({ error: "Missing svix headers" }, { status: 400 });
  }

  const body = await req.text();
  let evt: { type: string; data: ClerkUserPayload };
  try {
    evt = new Webhook(secret).verify(body, {
      "svix-id": svixId,
      "svix-timestamp": svixTimestamp,
      "svix-signature": svixSignature,
    }) as { type: string; data: ClerkUserPayload };
  } catch {
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  const data = evt.data;
  const email =
    data.email_addresses?.find((e) => e.id === data.primary_email_address_id)?.email_address ??
    data.email_addresses?.[0]?.email_address;

  switch (evt.type) {
    case "user.created":
    case "user.updated": {
      if (!email) return NextResponse.json({ ok: true });
      const name = [data.first_name, data.last_name].filter(Boolean).join(" ") || null;

      const existing = await prisma.user.findUnique({ where: { clerkId: data.id } });
      if (existing) {
        await prisma.user.update({
          where: { clerkId: data.id },
          data: { email, name, imageUrl: data.image_url },
        });
        break;
      }

      // Lookup placeholder par email (invitation revendeur)
      const placeholder = await prisma.user.findUnique({ where: { email } });
      if (placeholder) {
        await prisma.user.update({
          where: { id: placeholder.id },
          data: {
            clerkId: data.id,
            name: placeholder.name ?? name,
            imageUrl: data.image_url,
          },
        });
      } else {
        const userCount = await prisma.user.count();
        await prisma.user.create({
          data: {
            clerkId: data.id,
            email,
            name,
            imageUrl: data.image_url,
            role: userCount === 0 ? "ADMIN" : "RESELLER",
          },
        });
      }
      break;
    }
    case "user.deleted": {
      await prisma.user.update({
        where: { clerkId: data.id },
        data: { active: false },
      }).catch(() => null);
      break;
    }
  }

  return NextResponse.json({ ok: true });
}
