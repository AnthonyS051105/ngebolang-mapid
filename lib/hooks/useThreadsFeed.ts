"use client";

import { useCallback, useEffect, useState } from "react";
import { fetchThreads } from "@/lib/api/routingClient";
import type { ThreadItem } from "@/lib/types/routingApi";

// Shared oleh FeedPanel & FeedFullScreen (via AppShell -> MapArea) supaya
// laporan baru/upvote langsung terlihat tanpa reload manual, tanpa duplikasi
// fetch logic di masing-masing komponen feed.
export function useThreadsFeed() {
  const [threads, setThreads] = useState<ThreadItem[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(() => {
    return fetchThreads("APPROVED")
      .then((items) => setThreads(items))
      .catch((err) => {
        console.error("Gagal memuat laporan warga dari backend:", err);
      })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const refetch = useCallback(() => {
    setLoading(true);
    return load();
  }, [load]);

  const applyUpvote = useCallback((id: string, upvotes: number) => {
    setThreads((prev) => prev.map((t) => (t.id === id ? { ...t, upvotes } : t)));
  }, []);

  return { threads, loading, refetch, applyUpvote };
}
