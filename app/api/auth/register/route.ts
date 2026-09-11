import { db } from "@/lib/db";
import { getSession } from "@/lib/auth/session";
import { hashPassword } from "@/lib/auth/password";

interface PenggunaRow {
  id: string;
  nama_tampilan: string;
  email: string;
}

export async function POST(req: Request) {
  const { namaTampilan, email, kataSandi } = await req.json();

  if (
    typeof namaTampilan !== "string" ||
    typeof email !== "string" ||
    typeof kataSandi !== "string" ||
    !namaTampilan.trim() ||
    !email.trim() ||
    kataSandi.length < 8
  ) {
    return Response.json(
      { error: { code: "INVALID_INPUT", message: "Data pendaftaran tidak valid." } },
      { status: 400 }
    );
  }

  const existing = await db.query<PenggunaRow>(
    "SELECT id FROM pengguna WHERE email = $1",
    [email]
  );
  if (existing.rows.length > 0) {
    return Response.json(
      { error: { code: "EMAIL_TAKEN", message: "Email sudah terdaftar." } },
      { status: 409 }
    );
  }

  const kataSandiHash = await hashPassword(kataSandi);
  const result = await db.query<PenggunaRow>(
    `INSERT INTO pengguna (nama_tampilan, email, kata_sandi_hash)
     VALUES ($1, $2, $3)
     RETURNING id, nama_tampilan, email`,
    [namaTampilan.trim(), email.trim(), kataSandiHash]
  );
  const pengguna = result.rows[0];

  const session = await getSession();
  session.penggunaId = pengguna.id;
  session.namaTampilan = pengguna.nama_tampilan;
  session.email = pengguna.email;
  await session.save();

  return Response.json(
    { id: pengguna.id, namaTampilan: pengguna.nama_tampilan },
    { status: 201 }
  );
}
