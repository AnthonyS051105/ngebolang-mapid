"use client";

import { useEffect, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { MapPin, MessageCircle, Send, ThumbsUp, X } from "lucide-react";
import { categoryOf } from "@/lib/data";
import {
  ProxyApiError,
  fetchComments,
  submitComment,
  upvoteThread,
  type CommentItem,
} from "@/lib/api/threadsClient";
import type { ThreadItem } from "@/lib/types/routingApi";

interface ThreadDetailModalProps {
  report: ThreadItem;
  onClose: () => void;
  onUpvoted?: (id: string, upvotes: number) => void;
}

const STATUS_LABEL: Record<ThreadItem["status"], string> = {
  APPROVED: "Tayang",
  MERGED_DUPLICATE: "Digabung dengan laporan lain",
  FLAGGED_REVIEW: "Sedang Ditinjau",
  REJECTED: "Ditolak",
};

const EASE = [0.22, 1, 0.36, 1] as const;

const backdropVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1 },
};

const dialogVariants = {
  hidden: { opacity: 0, scale: 0.96, y: 8 },
  visible: { opacity: 1, scale: 1, y: 0 },
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
  onUpvoted,
}: ThreadDetailModalProps) {
  // Pakai report.upvotes langsung (bukan disalin ke state) supaya kalau
  // useThreadsFeed() di atas me-refresh daftar threads sementara modal ini
  // terbuka, angkanya ikut ter-update -- localUpvotes cuma dipakai untuk
  // override optimistic setelah vote sukses supaya tidak menunggu refetch.
  const [localUpvotes, setLocalUpvotes] = useState<number | null>(null);
  const upvotes = localUpvotes ?? report.upvotes;
  const [voted, setVoted] = useState(false);
  const [voteMessage, setVoteMessage] = useState<string | null>(null);
  const [voting, setVoting] = useState(false);
  const [comments, setComments] = useState<CommentItem[]>([]);
  const [loadingComments, setLoadingComments] = useState(true);
  const [commentDraft, setCommentDraft] = useState("");
  const [commentError, setCommentError] = useState<string | null>(null);
  const [postingComment, setPostingComment] = useState(false);
  const c = categoryOf(report.category);
  const prefersReducedMotion = useReducedMotion();
  const backdropTransition = prefersReducedMotion ? { duration: 0 } : { duration: 0.18, ease: EASE };
  const dialogTransition = prefersReducedMotion ? { duration: 0 } : { duration: 0.2, ease: EASE };

  useEffect(() => {
    let cancelled = false;
    fetchComments(report.id)
      .then((res) => {
        if (!cancelled) setComments(res.comments);
      })
      .catch((err) => {
        console.error("Gagal memuat komentar:", err);
      })
      .finally(() => {
        if (!cancelled) setLoadingComments(false);
      });
    return () => {
      cancelled = true;
    };
  }, [report.id]);

  const handleUpvote = async () => {
    if (voting || voted) return;
    setVoting(true);
    setVoteMessage(null);
    try {
      const res = await upvoteThread(report.id);
      setLocalUpvotes(res.upvotes);
      setVoted(true);
      onUpvoted?.(report.id, res.upvotes);
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

  const handleSubmitComment = async () => {
    const text = commentDraft.trim();
    if (!text || postingComment) return;
    setPostingComment(true);
    setCommentError(null);
    try {
      const newComment = await submitComment(report.id, text);
      setComments((prev) => [...prev, newComment]);
      setCommentDraft("");
    } catch (err) {
      if (err instanceof ProxyApiError && err.status === 401) {
        setCommentError("Kamu harus masuk terlebih dahulu untuk berkomentar.");
      } else {
        setCommentError("Gagal mengirim komentar. Coba lagi nanti.");
      }
    } finally {
      setPostingComment(false);
    }
  };

  return (
    <motion.div
      className="overlay-backdrop"
      onClick={onClose}
      initial="hidden"
      animate="visible"
      exit="hidden"
      variants={backdropVariants}
      transition={backdropTransition}
    >
      <motion.div
        className="overlay-panel wide"
        onClick={(e) => e.stopPropagation()}
        initial="hidden"
        animate="visible"
        exit="hidden"
        variants={dialogVariants}
        transition={dialogTransition}
      >
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

          <div className="thread-comments-section">
            <div className="thread-comments-label">
              <MessageCircle width={14} height={14} /> Komentar {comments.length > 0 && `(${comments.length})`}
            </div>

            {loadingComments ? (
              <div className="thread-comments-empty">Memuat komentar...</div>
            ) : comments.length === 0 ? (
              <div className="thread-comments-empty">Belum ada komentar.</div>
            ) : (
              <div className="thread-comments-list">
                {comments.map((cm) => (
                  <div key={cm.id} className="thread-comment">
                    <div className="avatar-sm">{cm.authorName.charAt(0).toUpperCase()}</div>
                    <div className="bubble">
                      <div className="author">{cm.authorName}</div>
                      <div className="text">{cm.text}</div>
                      <div className="time">{timeAgo(cm.createdAt)}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {commentError && (
              <div style={{ fontSize: 12, color: "#b45309", fontWeight: 600, marginTop: 8 }}>
                {commentError}
              </div>
            )}

            <form
              className="comment-input-row"
              onSubmit={(e) => {
                e.preventDefault();
                handleSubmitComment();
              }}
            >
              <input
                type="text"
                placeholder="Tulis komentar..."
                value={commentDraft}
                onChange={(e) => setCommentDraft(e.target.value)}
                disabled={postingComment}
              />
              <button
                type="submit"
                className="comment-send"
                disabled={!commentDraft.trim() || postingComment}
              >
                <Send width={15} height={15} />
              </button>
            </form>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}
