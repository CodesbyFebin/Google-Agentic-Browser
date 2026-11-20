// Liveness only. This endpoint deliberately does not claim database or Gemini readiness.
export const dynamic = "force-dynamic";

export async function GET() {
  return Response.json(
    {
      status: "ok",
      service: "agenticbrowser-showcase",
      app: "v3",
    },
    {
      status: 200,
      headers: { "Cache-Control": "no-store" },
    },
  );
}
