import { db } from "@/lib/db";
import { getSession } from "@/lib/auth/session";

const MAX_COMMENT_LENGTH = 1000;

export async function GET(_req: Request, ctx: RouteContext<"/api/threads/[id]/comments">) {
  const { id } = await ctx.params;

  const result = await db.query<{
    id: string;
    isi: string;
    dibuat_pada: string;
    nama_tampilan: string;
  }>(
    `SELECT lk.id, lk.isi, lk.dibuat_pada, p.nama_tampilan
     FROM laporan_komentar lk
     JOIN pengguna p ON p.id = lk.pengguna_id
     WHERE lk.report_id = $1
     ORDER BY lk.dibuat_pada ASC`,
    [id]
  );

  return Response.json({
    comments: result.rows.map((row) => ({
      id: row.id,
      text: row.isi,
      authorName: row.nama_tampilan,
      createdAt: row.dibuat_pada,
    })),
  });
}

export async function POST(req: Request, ctx: RouteContext<"/api/threads/[id]/comments">) {
  const { id } = await ctx.params;

  const session = await getSession();
  if (!session.penggunaId) {
    return Response.json(
      { error: { code: "UNAUTHORIZED", message: "Silakan masuk terlebih dahulu." } },
      { status: 401 }
    );
  }

  const body = await req.json().catch(() => ({}));
  const text = typeof body.text === "string" ? body.text.trim() : "";

  if (!text) {
    return Response.json(
      { error: { code: "INVALID_INPUT", message: "Komentar tidak boleh kosong." } },
      { status: 400 }
    );
  }
  if (text.length > MAX_COMMENT_LENGTH) {
    return Response.json(
      {
        error: {
          code: "INVALID_INPUT",
          message: `Komentar maksimal ${MAX_COMMENT_LENGTH} karakter.`,
        },
      },
      { status: 400 }
    );
  }

  const result = await db.query<{ id: string; dibuat_pada: string }>(
    `INSERT INTO laporan_komentar (report_id, pengguna_id, isi)
     VALUES ($1, $2, $3)
     RETURNING id, dibuat_pada`,
    [id, session.penggunaId, text]
  );
  const row = result.rows[0];

  return Response.json({
    id: row.id,
    text,
    authorName: session.namaTampilan,
    createdAt: row.dibuat_pada,
  });
}
