"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { UserPlus } from "lucide-react";

export default function RegisterForm() {
  const router = useRouter();
  const [namaTampilan, setNamaTampilan] = useState("");
  const [email, setEmail] = useState("");
  const [kataSandi, setKataSandi] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ namaTampilan, email, kataSandi }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data?.error?.message ?? "Gagal mendaftar. Coba lagi.");
        return;
      }
      router.push("/");
      router.refresh();
    } catch {
      setError("Tidak bisa terhubung ke server. Coba lagi.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="overlay-panel" style={{ margin: "0 auto" }}>
      <div className="overlay-head">
        <UserPlus width={16} height={16} color="var(--green)" />
        <h3>Daftar</h3>
      </div>
      <form className="overlay-body" onSubmit={handleSubmit}>
        {error && <div className="auth-error">{error}</div>}

        <span className="composer-label">Nama Tampilan</span>
        <div className="auth-field">
          <input
            type="text"
            className="auth-input"
            placeholder="Nama kamu"
            value={namaTampilan}
            onChange={(e) => setNamaTampilan(e.target.value)}
            autoComplete="name"
            required
          />
        </div>

        <span className="composer-label">Email</span>
        <div className="auth-field">
          <input
            type="email"
            className="auth-input"
            placeholder="nama@email.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="email"
            required
          />
        </div>

        <span className="composer-label">Kata Sandi</span>
        <div className="auth-field">
          <input
            type="password"
            className="auth-input"
            placeholder="Minimal 8 karakter"
            value={kataSandi}
            onChange={(e) => setKataSandi(e.target.value)}
            autoComplete="new-password"
            minLength={8}
            required
          />
        </div>

        <button type="submit" className="btn-primary" disabled={loading}>
          {loading ? "Memproses..." : "Daftar"}
        </button>

        <p className="auth-switch">
          Sudah punya akun? <a href="/masuk">Masuk</a>
        </p>
      </form>
    </div>
  );
}
