import { getSession } from "@/lib/auth/session";

export async function GET() {
  const session = await getSession();
  if (!session.penggunaId) {
    return Response.json({ user: null }, { status: 200 });
  }
  return Response.json({
    user: {
      id: session.penggunaId,
      namaTampilan: session.namaTampilan,
      email: session.email,
    },
  });
}
