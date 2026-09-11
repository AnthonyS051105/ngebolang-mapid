import { db } from "@/lib/db";
import { getSession } from "@/lib/auth/session";

export async function POST(_req: Request, ctx: RouteContext<"/api/threads/[id]/upvote">) {
  const { id } = await ctx.params;

  const session = await getSession();
  if (!session.penggunaId) {
    return Response.json(
      { error: { code: "UNAUTHORIZED", message: "Silakan masuk terlebih dahulu." } },
      { status: 401 }
    );
  }

  const sudahVote = await db.query(
    "SELECT 1 FROM upvote_tracking WHERE pengguna_id = $1 AND report_id = $2",
    [session.penggunaId, id]
  );
  if ((sudahVote.rowCount ?? 0) > 0) {
    return Response.json(
      {
        error: {
          code: "ALREADY_VOTED",
          message: "Kamu sudah memberi suara untuk laporan ini.",
        },
      },
      { status: 409 }
    );
  }

  const pythonRes = await fetch(
    `${process.env.ROUTING_API_URL}/api/threads/${id}/upvote`,
    { method: "POST" }
  );
  if (!pythonRes.ok) {
    return Response.json(await pythonRes.json(), { status: pythonRes.status });
  }

  const data = await pythonRes.json();

  await db.query(
    "INSERT INTO upvote_tracking (pengguna_id, report_id) VALUES ($1, $2)",
    [session.penggunaId, id]
  );

  return Response.json(data);
}
