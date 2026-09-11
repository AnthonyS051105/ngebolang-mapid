"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { LogIn } from "lucide-react";

export default function LoginForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [kataSandi, setKataSandi] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, kataSandi }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data?.error?.message ?? "Gagal masuk. Coba lagi.");
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
        <LogIn width={16} height={16} color="var(--green)" />
        <h3>Masuk</h3>
      </div>
      <form className="overlay-body" onSubmit={handleSubmit}>
        {error && <div className="auth-error">{error}</div>}

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
            placeholder="Kata sandi"
            value={kataSandi}
            onChange={(e) => setKataSandi(e.target.value)}
            autoComplete="current-password"
            required
          />
        </div>

        <button type="submit" className="btn-primary" disabled={loading}>
          {loading ? "Memproses..." : "Masuk"}
        </button>

        <p className="auth-switch">
          Belum punya akun? <a href="/daftar">Daftar</a>
        </p>
      </form>
    </div>
  );
}
