import { findByCode } from "@/lib/urls";

export async function GET(
  _request: Request,
  context: { params: Promise<{ shortCode: string }> },
) {
  const { shortCode } = await context.params;
  let item;
  try {
    item = await findByCode(shortCode);
  } catch (error) {
    console.error("redirect_db_error", error instanceof Error ? error.message : "unknown");
    return new Response("Internal Server Error", { status: 500 });
  }

  if (!item) {
    return new Response("Not Found", { status: 404 });
  }

  return new Response(null, {
    status: 307,
    headers: {
      Location: item.originalUrl,
      "Cache-Control": "no-store",
    },
  });
}
