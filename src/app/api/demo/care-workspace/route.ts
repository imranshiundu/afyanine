function retired() {
  return Response.json({ error: "DEMO_RETIRED" }, { status: 410, headers: { "Cache-Control": "no-store" } });
}
export const GET = retired;
export const POST = retired;
