import { NextResponse } from "next/server";

// Auth désactivée : tout est public.
export default function middleware() {
  return NextResponse.next();
}

export const config = {
  matcher: [],
};
