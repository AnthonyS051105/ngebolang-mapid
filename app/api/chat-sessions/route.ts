import { db } from "@/lib/db";
import { getSession } from "@/lib/auth/session";

export async function GET() {
  const session = await getSession();
  if (!session.penggunaId) {
    return Response.json(
      { error: { code: "UNAUTHORIZED", message: "Silakan masuk terlebih dahulu." } },
      { status: 401 }
    );
  }

  const result = await db.query<{
    id: string;
    judul: string;
    diperbarui_pada: string;
    jumlah_pesan: string;
  }>(
    `SELECT cs.id, cs.judul, cs.diperbarui_pada,
            (SELECT count(*) FROM chat_message WHERE chat_session_id = cs.id) AS jumlah_pesan
     FROM chat_session cs
     WHERE cs.pengguna_id = $1
     ORDER BY cs.diperbarui_pada DESC
     LIMIT 50`,
    [session.penggunaId]
  );

  return Response.json({
    sessions: result.rows.map((row) => ({
      id: row.id,
      title: row.judul,
      updatedAt: row.diperbarui_pada,
      messageCount: Number(row.jumlah_pesan),
    })),
  });
}
