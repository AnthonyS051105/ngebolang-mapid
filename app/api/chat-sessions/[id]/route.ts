import { db } from "@/lib/db";
import { getSession } from "@/lib/auth/session";
import type { ChatMessageData } from "@/components/ChatMessage";

interface MessageMetadata {
  suggestions?: string[];
  routeData?: unknown;
  routeDisplayOptions?: unknown;
}

export async function GET(_req: Request, ctx: RouteContext<"/api/chat-sessions/[id]">) {
  const { id } = await ctx.params;

  const session = await getSession();
  if (!session.penggunaId) {
    return Response.json(
      { error: { code: "UNAUTHORIZED", message: "Silakan masuk terlebih dahulu." } },
      { status: 401 }
    );
  }

  const sessionRes = await db.query<{
    id: string;
    judul: string;
    python_session_id: string;
  }>(
    `SELECT id, judul, python_session_id FROM chat_session
     WHERE id = $1 AND pengguna_id = $2`,
    [id, session.penggunaId]
  );
  const sessionRow = sessionRes.rows[0];
  if (!sessionRow) {
    return Response.json(
      { error: { code: "NOT_FOUND", message: "Sesi percakapan tidak ditemukan." } },
      { status: 404 }
    );
  }

  const messagesRes = await db.query<{
    id: string;
    peran: "user" | "assistant";
    isi: string;
    metadata: MessageMetadata | null;
  }>(
    `SELECT id, peran, isi, metadata FROM chat_message
     WHERE chat_session_id = $1
     ORDER BY dibuat_pada ASC`,
    [id]
  );

  const messages: ChatMessageData[] = messagesRes.rows.map((row) => ({
    id: row.id,
    role: row.peran,
    text: row.isi,
    suggestions: row.metadata?.suggestions,
    routeData: (row.metadata?.routeData as ChatMessageData["routeData"]) ?? undefined,
    routeDisplayOptions: row.metadata?.routeDisplayOptions as ChatMessageData["routeDisplayOptions"],
  }));

  return Response.json({
    id: sessionRow.id,
    title: sessionRow.judul,
    pythonSessionId: sessionRow.python_session_id,
    messages,
  });
}

export async function DELETE(_req: Request, ctx: RouteContext<"/api/chat-sessions/[id]">) {
  const { id } = await ctx.params;

  const session = await getSession();
  if (!session.penggunaId) {
    return Response.json(
      { error: { code: "UNAUTHORIZED", message: "Silakan masuk terlebih dahulu." } },
      { status: 401 }
    );
  }

  const result = await db.query(
    `DELETE FROM chat_session WHERE id = $1 AND pengguna_id = $2`,
    [id, session.penggunaId]
  );

  if ((result.rowCount ?? 0) === 0) {
    return Response.json(
      { error: { code: "NOT_FOUND", message: "Sesi percakapan tidak ditemukan." } },
      { status: 404 }
    );
  }

  return Response.json({ status: "deleted" });
}
