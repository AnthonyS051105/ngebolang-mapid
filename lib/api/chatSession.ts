// session_id disimpan di localStorage agar konsisten selama satu sesi pengguna/tab
// (backend Python mengelola riwayat percakapan sendiri berdasarkan session_id ini,
// bukan lewat history yang dikirim ulang klien -- lihat docs/PYTHON_API_CONTRACT.md Bagian 5).
const STORAGE_KEY = "ngebolang_chat_session_id";

export function getOrCreateChatSessionId(): string {
  if (typeof window === "undefined") return "server";

  try {
    const existing = window.localStorage.getItem(STORAGE_KEY);
    if (existing) return existing;

    const fresh =
      typeof crypto !== "undefined" && "randomUUID" in crypto
        ? crypto.randomUUID()
        : `sess_${Date.now()}_${Math.random().toString(36).slice(2)}`;
    window.localStorage.setItem(STORAGE_KEY, fresh);
    return fresh;
  } catch {
    return `sess_${Date.now()}_${Math.random().toString(36).slice(2)}`;
  }
}

export function resetChatSessionId(): string {
  const fresh =
    typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID()
      : `sess_${Date.now()}_${Math.random().toString(36).slice(2)}`;
  try {
    window.localStorage.setItem(STORAGE_KEY, fresh);
  } catch {
    // localStorage tidak tersedia (mode privat dsb.) -- id tetap dipakai in-memory
  }
  return fresh;
}
