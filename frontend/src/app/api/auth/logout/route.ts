import { NextResponse } from "next/server";
import { clearSessionCookie } from "@/lib/session";

// No backend logout endpoint exists (JWTs are stateless) — session
// end is purely a client-side cookie clear, no Express call.
export async function POST() {
  await clearSessionCookie();

  return NextResponse.json({ success: true, message: "Déconnexion réussie" });
}
