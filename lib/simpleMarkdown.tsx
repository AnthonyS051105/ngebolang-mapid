import { Fragment, type ReactNode } from "react";

// Parser markdown ringan untuk balasan chat LLM (bold/italic/heading/list) --
// tanpa dependency baru, karena LLM di /api/chat hanya memakai subset markdown
// dasar (lihat contoh balasan di llmapp/agent.py: **bold**, ### heading, bullet *).
function renderInline(text: string, keyPrefix: string): ReactNode[] {
  const parts = text.split(/(\*\*[^*]+\*\*|\*[^*]+\*)/g).filter(Boolean);
  return parts.map((part, i) => {
    if (part.startsWith("**") && part.endsWith("**")) {
      return <strong key={`${keyPrefix}-${i}`}>{part.slice(2, -2)}</strong>;
    }
    if (part.startsWith("*") && part.endsWith("*") && part.length > 2) {
      return <em key={`${keyPrefix}-${i}`}>{part.slice(1, -1)}</em>;
    }
    return <Fragment key={`${keyPrefix}-${i}`}>{part}</Fragment>;
  });
}

export function renderSimpleMarkdown(text: string): ReactNode {
  const lines = text.split("\n");
  const blocks: ReactNode[] = [];
  let listBuffer: string[] = [];

  const flushList = (key: string) => {
    if (listBuffer.length === 0) return;
    blocks.push(
      <ul key={key} className="chat-md-list">
        {listBuffer.map((item, i) => (
          <li key={i}>{renderInline(item, `${key}-li-${i}`)}</li>
        ))}
      </ul>
    );
    listBuffer = [];
  };

  lines.forEach((line, i) => {
    const trimmed = line.trim();
    const listMatch = /^[*-]\s+(.*)/.exec(trimmed);
    const headingMatch = /^#{1,6}\s+(.*)/.exec(trimmed);

    if (listMatch) {
      listBuffer.push(listMatch[1]);
      return;
    }
    flushList(`list-${i}`);

    if (headingMatch) {
      blocks.push(<div key={i} className="chat-md-heading">{renderInline(headingMatch[1], `h-${i}`)}</div>);
    } else if (trimmed === "---") {
      blocks.push(<hr key={i} className="chat-md-hr" />);
    } else if (trimmed.length > 0) {
      blocks.push(<p key={i}>{renderInline(trimmed, `p-${i}`)}</p>);
    }
  });
  flushList("list-end");

  return <>{blocks}</>;
}
