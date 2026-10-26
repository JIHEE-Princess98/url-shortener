import { randomInt } from "node:crypto";
import { createClient } from "@supabase/supabase-js";

export type ShortenedUrl = { shortCode: string; originalUrl: string };

function db() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SECRET_KEY;
  if (!url || !key) throw new Error("Supabase environment variables are missing");
  return createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
}

function mapRow(row: { short_code: string; original_url: string }): ShortenedUrl {
  return { shortCode: row.short_code, originalUrl: row.original_url };
}

export async function findByUrl(originalUrl: string): Promise<ShortenedUrl | null> {
  const { data, error } = await db().from("short_urls").select("short_code,original_url").eq("original_url", originalUrl).maybeSingle();
  if (error) throw error;
  return data ? mapRow(data) : null;
}

export async function findByCode(shortCode: string): Promise<ShortenedUrl | null> {
  const { data, error } = await db().from("short_urls").select("short_code,original_url").eq("short_code", shortCode).maybeSingle();
  if (error) throw error;
  return data ? mapRow(data) : null;
}

const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
function makeShortCode(): string {
  return Array.from({ length: 6 }, () => alphabet[randomInt(alphabet.length)]).join("");
}

export async function createUrl(originalUrl: string): Promise<{ item: ShortenedUrl; existing: boolean }> {
  const found = await findByUrl(originalUrl);
  if (found) return { item: found, existing: true };

  for (let attempt = 0; attempt < 8; attempt++) {
    const shortCode = makeShortCode();
    const { data, error } = await db().from("short_urls")
      .insert({ short_code: shortCode, original_url: originalUrl })
      .select("short_code,original_url").single();
    if (!error && data) return { item: mapRow(data), existing: false };
    if (error?.code === "23505") {
      const duplicate = await findByUrl(originalUrl);
      if (duplicate) return { item: duplicate, existing: true };
      continue; // short code collision
    }
    throw error ?? new Error("Database insert failed");
  }
  throw new Error("Could not generate unique short code");
}
