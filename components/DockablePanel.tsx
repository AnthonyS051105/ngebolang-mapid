"use client";

import type { ReactNode } from "react";
import { motion, useReducedMotion } from "framer-motion";
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

const EASE = [0.22, 1, 0.36, 1] as const;

// Mount/unmount fade+scale -- diterapkan lewat Framer Motion `initial`/
// `animate`/`exit` di sini (bukan lewat prop `animate` yang bisa dikendalikan
// terus-menerus) supaya TIDAK bentrok dengan left/top/width/height inline
// style yang di-commit langsung oleh useDockablePanel selama drag/resize --
// motion di sini hanya menyentuh opacity & scale, sumbu yang sama sekali
// tidak dipakai oleh logika drag/resize tersebut.
const panelVariants = {
  hidden: { opacity: 0, scale: 0.97 },
  visible: { opacity: 1, scale: 1 },
};

export default function DockablePanel({
  panel,
  className,
  children,
  resizeEdges = ALL_EDGES,
  style,
}: DockablePanelProps) {
  const prefersReducedMotion = useReducedMotion();
  const dockClass = panel.dock !== "float" ? ` docked docked-${panel.dock}` : " floating";
  const motionClass = panel.isDragging || panel.isResizing ? " panel-no-transition" : "";

  return (
    <motion.div
      className={`dockable-panel${className ? ` ${className}` : ""}${dockClass}${motionClass}`}
      style={style ? { ...panel.style, ...style } : panel.style}
      initial="hidden"
      animate="visible"
      exit="hidden"
      variants={panelVariants}
      transition={
        prefersReducedMotion ? { duration: 0 } : { duration: 0.22, ease: EASE }
      }
    >
      {children}
      {resizeEdges.map((edge) => {
        const { className: handleClassName, onPointerDown } = panel.getResizeHandleProps(edge);
        return <div key={edge} className={handleClassName} onPointerDown={onPointerDown} />;
      })}
    </motion.div>
  );
}
