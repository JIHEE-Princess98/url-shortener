import { NextResponse } from "next/server";
import { createUrl } from "@/lib/urls";

export async function POST(request: Request) {
  let body: { originalUrl?: unknown };

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: { code: "MISSING_URL" } }, { status: 400 });
  }

  if (typeof body.originalUrl !== "string" || body.originalUrl.trim() === "") {
    return NextResponse.json({ error: { code: "MISSING_URL" } }, { status: 400 });
  }

  const originalUrl = body.originalUrl.trim();
  let parsedUrl: URL;

  try {
    parsedUrl = new URL(originalUrl);
  } catch {
    return NextResponse.json({ error: { code: "INVALID_URL" } }, { status: 400 });
  }

  if (parsedUrl.protocol !== "http:" && parsedUrl.protocol !== "https:") {
    return NextResponse.json({ error: { code: "INVALID_URL" } }, { status: 400 });
  }

  const serviceUrl = new URL(request.url);
  if (parsedUrl.hostname.toLowerCase() === serviceUrl.hostname.toLowerCase()) {
    return NextResponse.json({ error: "SELF_URL_NOT_ALLOWED" }, { status: 400 });
  }

  try {
    const { item, existing } = await createUrl(originalUrl);
    const shortUrl = new URL(`/${item.shortCode}`, serviceUrl.origin).toString();
    return NextResponse.json(
      { shortCode: item.shortCode, shortUrl, originalUrl: item.originalUrl },
      { status: existing ? 200 : 201 },
    );
  } catch (error) {
    console.error("shorten_db_error", error instanceof Error ? error.message : "unknown");
    return NextResponse.json({ error: { code: "INTERNAL_ERROR" } }, { status: 500 });
  }
}
