import { pool } from "@/lib/db";
import { getSession } from "@/lib/auth/session";

interface AssistantMessageBody {
  text: string;
  suggestions?: string[];
  routeData?: unknown;
  routeDisplayOptions?: unknown;
}

export async function POST(req: Request, ctx: RouteContext<"/api/chat-sessions/[id]/messages">) {
  const { id } = await ctx.params;

  const session = await getSession();
  if (!session.penggunaId) {
    return Response.json(
      { error: { code: "UNAUTHORIZED", message: "Silakan masuk terlebih dahulu." } },
      { status: 401 }
    );
  }

  const body = await req.json().catch(() => ({}));
  const pythonSessionId = typeof body.pythonSessionId === "string" ? body.pythonSessionId : "";
  const title = typeof body.title === "string" ? body.title : undefined;
  const userMessage = body.userMessage as { text?: string } | undefined;
  const assistantMessage = body.assistantMessage as AssistantMessageBody | undefined;

  if (!pythonSessionId || !userMessage?.text || !assistantMessage?.text) {
    return Response.json(
      { error: { code: "INVALID_INPUT", message: "Data pesan tidak lengkap." } },
      { status: 400 }
    );
  }

  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    let chatSessionId = id;
    if (id === "new") {
      const judul = (title?.trim() || "Percakapan Baru").slice(0, 120);
      const created = await client.query<{ id: string }>(
        `INSERT INTO chat_session (pengguna_id, judul, python_session_id)
         VALUES ($1, $2, $3)
         RETURNING id`,
        [session.penggunaId, judul, pythonSessionId]
      );
      chatSessionId = created.rows[0].id;
    } else {
      const owned = await client.query(
        `SELECT 1 FROM chat_session WHERE id = $1 AND pengguna_id = $2`,
        [id, session.penggunaId]
      );
      if ((owned.rowCount ?? 0) === 0) {
        await client.query("ROLLBACK");
        return Response.json(
          { error: { code: "NOT_FOUND", message: "Sesi percakapan tidak ditemukan." } },
          { status: 404 }
        );
      }
    }

    const userRow = await client.query<{ id: string }>(
      `INSERT INTO chat_message (chat_session_id, peran, isi)
       VALUES ($1, 'user', $2)
       RETURNING id`,
      [chatSessionId, userMessage.text]
    );

    const assistantMetadata = {
      suggestions: assistantMessage.suggestions,
      routeData: assistantMessage.routeData,
      routeDisplayOptions: assistantMessage.routeDisplayOptions,
    };
    const assistantRow = await client.query<{ id: string }>(
      `INSERT INTO chat_message (chat_session_id, peran, isi, metadata)
       VALUES ($1, 'assistant', $2, $3)
       RETURNING id`,
      [chatSessionId, assistantMessage.text, JSON.stringify(assistantMetadata)]
    );

    await client.query(
      `UPDATE chat_session SET diperbarui_pada = now() WHERE id = $1`,
      [chatSessionId]
    );

    await client.query("COMMIT");

    return Response.json({
      chatSessionId,
      userMessageId: userRow.rows[0].id,
      assistantMessageId: assistantRow.rows[0].id,
    });
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }
}
