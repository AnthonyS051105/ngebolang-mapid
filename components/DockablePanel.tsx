"use client";

import type { ReactNode } from "react";
import type { DockablePanelState, ResizeEdge } from "@/lib/hooks/useDockablePanel";

interface DockablePanelProps {
  panel: DockablePanelState;
  className?: string;
  children: ReactNode;
  /** Sudut/tepi resize yang ditampilkan -- default semua 8 titik. */
  resizeEdges?: ResizeEdge[];
  /** Override/tambahan style di atas panel.style (mis. inset untuk hindari
   * tumpang tindih dengan panel lain yang docked ke sisi bersebelahan). */
  style?: React.CSSProperties;
}

const ALL_EDGES: ResizeEdge[] = ["n", "s", "e", "w", "ne", "nw", "se", "sw"];

export default function DockablePanel({
  panel,
  className,
  children,
  resizeEdges = ALL_EDGES,
  style,
}: DockablePanelProps) {
  const dockClass = panel.dock !== "float" ? ` docked docked-${panel.dock}` : " floating";
  const motionClass = panel.isDragging || panel.isResizing ? " panel-no-transition" : "";

  return (
    <div
      className={`dockable-panel${className ? ` ${className}` : ""}${dockClass}${motionClass}`}
      style={style ? { ...panel.style, ...style } : panel.style}
    >
      {children}
      {resizeEdges.map((edge) => {
        const { className: handleClassName, onPointerDown } = panel.getResizeHandleProps(edge);
        return <div key={edge} className={handleClassName} onPointerDown={onPointerDown} />;
      })}
    </div>
  );
}
