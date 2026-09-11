import { db } from "@/lib/db";
import { getSession } from "@/lib/auth/session";
import { verifyPassword } from "@/lib/auth/password";

interface PenggunaRow {
  id: string;
  nama_tampilan: string;
  email: string;
  kata_sandi_hash: string;
}

export async function POST(req: Request) {
  const { email, kataSandi } = await req.json();

  if (typeof email !== "string" || typeof kataSandi !== "string") {
    return Response.json(
      { error: { code: "INVALID_INPUT", message: "Email dan kata sandi wajib diisi." } },
      { status: 400 }
    );
  }

  const result = await db.query<PenggunaRow>(
    "SELECT id, nama_tampilan, email, kata_sandi_hash FROM pengguna WHERE email = $1",
    [email.trim()]
  );
  const pengguna = result.rows[0];

  const valid = pengguna ? await verifyPassword(kataSandi, pengguna.kata_sandi_hash) : false;
  if (!pengguna || !valid) {
    return Response.json(
      { error: { code: "INVALID_CREDENTIALS", message: "Email atau kata sandi salah." } },
      { status: 401 }
    );
  }

  const session = await getSession();
  session.penggunaId = pengguna.id;
  session.namaTampilan = pengguna.nama_tampilan;
  session.email = pengguna.email;
  await session.save();

  return Response.json({ id: pengguna.id, namaTampilan: pengguna.nama_tampilan });
}
