import { cookies } from "next/headers";
import { getIronSession, type IronSession, type SessionOptions } from "iron-session";

export interface SessionData {
  penggunaId: string;
  namaTampilan: string;
  email: string;
}

const sessionOptions: SessionOptions = {
  password: process.env.SESSION_SECRET!,
  cookieName: "ngebolang_session",
  cookieOptions: {
    secure: process.env.NODE_ENV === "production",
    httpOnly: true,
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 7,
  },
};

export async function getSession(): Promise<IronSession<SessionData>> {
  return getIronSession<SessionData>(await cookies(), sessionOptions);
}
