import { getSession } from "@/lib/auth/session";

export async function POST(req: Request) {
  const session = await getSession();
  if (!session.penggunaId) {
    return Response.json(
      { error: { code: "UNAUTHORIZED", message: "Silakan masuk terlebih dahulu." } },
      { status: 401 }
    );
  }

  const body = await req.json();
  const pythonRes = await fetch(`${process.env.ROUTING_API_URL}/api/threads`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  return Response.json(await pythonRes.json(), { status: pythonRes.status });
}
