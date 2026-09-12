import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth/session";
import AppShell from "@/components/AppShell";

export default async function Home() {
  const session = await getSession();
  if (!session.penggunaId) {
    redirect("/masuk");
  }

  return (
    <AppShell
      user={{
        namaTampilan: session.namaTampilan ?? "Pengguna",
        email: session.email ?? "",
      }}
    />
  );
}
