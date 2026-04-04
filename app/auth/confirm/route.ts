import { redirect } from "next/navigation";
import { type NextRequest } from "next/server";
import { verifyEmailOtp } from "@/lib/auth";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const token_hash = searchParams.get("token_hash");
  const type = searchParams.get("type");
  const next = searchParams.get("next") ?? "/";

  const { error } = await verifyEmailOtp(token_hash, type);
  if (!error) {
    redirect(next);
  }
  redirect(`/auth/error?error=${encodeURIComponent(error)}`);
}
