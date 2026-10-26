export async function GET() {
  const key = process.env.SUPABASE_SECRET_KEY ?? "";
  const kind = key.startsWith("sb_secret_")
    ? "secret"
    : key.startsWith("sb_publishable_")
      ? "publishable"
      : key.length === 0
        ? "missing"
        : "legacy-or-other";

  return Response.json({ configured: key.length > 0, kind });
}
