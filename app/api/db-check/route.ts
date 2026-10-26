import { createClient } from "@supabase/supabase-js";

export async function GET() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SECRET_KEY;

  if (!url || !key) {
    return Response.json({ ok: false, issue: "Missing SUPABASE_URL or SUPABASE_SECRET_KEY" }, { status: 500 });
  }

  try {
    const client = createClient(url, key, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
    const { error } = await client.from("short_urls").select("short_code").limit(1);

    if (error) {
      return Response.json({ ok: false, code: error.code, message: error.message }, { status: 500 });
    }

    return Response.json({ ok: true });
  } catch (error) {
    return Response.json(
      { ok: false, message: error instanceof Error ? error.message : "Unknown database error" },
      { status: 500 },
    );
  }
}
