"use client";

import { useState } from "react";
import { MapPin, ThumbsUp, X } from "lucide-react";
import { categoryOf } from "@/lib/data";
import { ProxyApiError, upvoteThread } from "@/lib/api/threadsClient";
import type { ThreadItem } from "@/lib/types/routingApi";

interface ThreadDetailModalProps {
  report: ThreadItem;
  onClose: () => void;
}

const STATUS_LABEL: Record<ThreadItem["status"], string> = {
  APPROVED: "Tayang",
  MERGED_DUPLICATE: "Digabung dengan laporan lain",
  FLAGGED_REVIEW: "Sedang Ditinjau",
  REJECTED: "Ditolak",
};

function timeAgo(iso: string): string {
  const diffMs = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return "Baru saja";
  if (mins < 60) return `${mins} menit lalu`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours} jam lalu`;
  return `${Math.floor(hours / 24)} hari lalu`;
}

export default function ThreadDetailModal({
  report,
  onClose,
}: ThreadDetailModalProps) {
  const [upvotes, setUpvotes] = useState(report.upvotes);
  const [voted, setVoted] = useState(false);
  const [voteMessage, setVoteMessage] = useState<string | null>(null);
  const [voting, setVoting] = useState(false);
  const c = categoryOf(report.category);

  const handleUpvote = async () => {
    if (voting || voted) return;
    setVoting(true);
    setVoteMessage(null);
    try {
      const res = await upvoteThread(report.id);
      setUpvotes(res.upvotes);
      setVoted(true);
    } catch (err) {
      if (err instanceof ProxyApiError && err.status === 401) {
        setVoteMessage("Kamu harus masuk terlebih dahulu untuk memberi suara.");
      } else if (err instanceof ProxyApiError && err.status === 409) {
        setVoteMessage("Kamu sudah pernah memberi suara untuk laporan ini.");
        setVoted(true);
      } else {
        setVoteMessage("Gagal mengirim suara. Coba lagi nanti.");
      }
    } finally {
      setVoting(false);
    }
  };

  return (
    <div className="overlay-backdrop" onClick={onClose}>
      <div className="overlay-panel wide" onClick={(e) => e.stopPropagation()}>
        <div className="overlay-head">
          <h3>Detail Laporan</h3>
          <div className="overlay-close" onClick={onClose}>
            <X width={16} height={16} />
          </div>
        </div>
        <div className="overlay-body">
          {report.photo_url && (
            <div
              className="thread-photo"
              style={{ backgroundImage: `url(${report.photo_url})` }}
            />
          )}
          <div className="thread-badge-row">
            <span
              className="cat"
              style={{
                background: c.color,
                position: "static",
                display: "inline-flex",
                alignItems: "center",
                gap: 4,
              }}
            >
              {c.label}
            </span>
            <span style={{ fontSize: 11.5, color: "#9aa2b1", fontWeight: 600 }}>
              {timeAgo(report.created_at)}
            </span>
            {report.status !== "APPROVED" && (
              <span style={{ fontSize: 11.5, color: "#b45309", fontWeight: 700 }}>
                {STATUS_LABEL[report.status]}
              </span>
            )}
          </div>

          <div style={{ fontSize: 14.5, fontWeight: 800, color: "#1c2230", marginBottom: 6 }}>
            {report.description}
          </div>
          <div className="loc" style={{ marginBottom: 12 }}>
            <MapPin width={12} height={12} /> Dilaporkan oleh {report.reporter_name || "Warga"}
          </div>

          <div className="thread-actions">
            <div
              className={`thread-action${voted ? " liked" : ""}`}
              onClick={handleUpvote}
              style={{ opacity: voting ? 0.6 : 1, cursor: voting ? "wait" : "pointer" }}
            >
              <ThumbsUp width={15} height={15} /> {upvotes}
            </div>
          </div>

          {voteMessage && (
            <div style={{ fontSize: 12.5, color: "#b45309", marginTop: 8, fontWeight: 600 }}>
              {voteMessage}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
