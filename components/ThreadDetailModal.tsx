"use client";

import { useState } from "react";
import { MapPin, MessageCircle, Send, Share2, ThumbsUp, X } from "lucide-react";
import { CAT } from "@/lib/data";
import type { ReportPin } from "@/lib/types";

interface ThreadDetailModalProps {
  report: ReportPin;
  onClose: () => void;
}

export default function ThreadDetailModal({
  report,
  onClose,
}: ThreadDetailModalProps) {
  const [liked, setLiked] = useState(false);
  const [draft, setDraft] = useState("");
  const [comments, setComments] = useState(report.commentList);
  const c = CAT[report.cat];

  const submitComment = () => {
    if (!draft.trim()) return;
    setComments((prev) => [
      ...prev,
      { author: "Anda", text: draft.trim(), time: "Baru saja" },
    ]);
    setDraft("");
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
          <div
            className="thread-photo"
            style={{ backgroundImage: `url(${report.photo})` }}
          />
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
              {report.time}
            </span>
          </div>

          <div style={{ fontSize: 14.5, fontWeight: 800, color: "#1c2230", marginBottom: 6 }}>
            {report.title}
          </div>
          <div className="loc" style={{ marginBottom: 12 }}>
            <MapPin width={12} height={12} /> {report.loc}
          </div>

          <div className="thread-desc">{report.description}</div>

          <div className="thread-actions">
            <div
              className={`thread-action${liked ? " liked" : ""}`}
              onClick={() => setLiked((v) => !v)}
            >
              <ThumbsUp width={15} height={15} /> {report.likes + (liked ? 1 : 0)}
            </div>
            <div className="thread-action">
              <MessageCircle width={15} height={15} /> {comments.length}
            </div>
            <div className="thread-action">
              <Share2 width={15} height={15} /> Bagikan
            </div>
          </div>

          {comments.map((cm, i) => (
            <div className="thread-comment" key={i}>
              <div className="avatar-sm">{cm.author.charAt(0)}</div>
              <div className="bubble">
                <div className="author">{cm.author}</div>
                <div className="text">{cm.text}</div>
                <div className="time">{cm.time}</div>
              </div>
            </div>
          ))}

          <div className="comment-input-row">
            <input
              placeholder="Tulis komentar..."
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && submitComment()}
            />
            <button className="comment-send" onClick={submitComment}>
              <Send width={15} height={15} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
