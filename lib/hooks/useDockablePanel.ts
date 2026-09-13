"use client";

import { useCallback, useEffect, useRef, useState } from "react";

export type DockSide = "left" | "right" | "bottom" | "float";
export type ResizeEdge = "n" | "s" | "e" | "w" | "ne" | "nw" | "se" | "sw";

export interface Size {
  width: number;
  height: number;
}

export interface Point {
  x: number;
  y: number;
}

export interface DockablePanelConfig {
  /** Kunci penyimpanan geometri terakhir (localStorage). */
  id: string;
  initialDock: DockSide;
  initialSize: Size;
  /** Posisi awal saat float (diabaikan untuk dock non-float). */
  initialPosition?: Point;
  minSize: Size;
  maxSize?: Size;
  allowedDocks?: DockSide[];
  /** false = panel selalu float, drag tidak pernah snap ke sisi layar
   * (tetap bisa di-drag pindah posisi & di-resize). Default true. */
  dockable?: boolean;
  /** Elemen pembatas drag/resize -- default viewport penuh. */
  getBounds?: () => DOMRect;
  snapThreshold?: number;
  /** Nonaktifkan drag/resize sepenuhnya (mis. saat mobile). */
  disabled?: boolean;
}

export interface DockablePanelState {
  dock: DockSide;
  size: Size;
  position: Point;
  isDragging: boolean;
  isResizing: boolean;
  style: React.CSSProperties;
  dragHandleProps: {
    onPointerDown: (e: React.PointerEvent) => void;
  };
  getResizeHandleProps: (edge: ResizeEdge) => {
    onPointerDown: (e: React.PointerEvent) => void;
    className: string;
  };
  setDock: (dock: DockSide) => void;
}

const DEFAULT_SNAP_THRESHOLD = 28;

function loadGeometry(id: string): { dock: DockSide; size: Size; position: Point } | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(`ngebolang_panel_${id}`);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function saveGeometry(id: string, geo: { dock: DockSide; size: Size; position: Point }) {
  try {
    window.localStorage.setItem(`ngebolang_panel_${id}`, JSON.stringify(geo));
  } catch {
    // localStorage tidak tersedia -- geometri hanya bertahan di sesi ini
  }
}

function defaultBounds(): DOMRect {
  return new DOMRect(0, 0, window.innerWidth, window.innerHeight);
}

export function useDockablePanel(config: DockablePanelConfig): DockablePanelState {
  const {
    id,
    initialDock,
    initialSize,
    initialPosition,
    minSize,
    maxSize,
    allowedDocks,
    dockable = true,
    getBounds,
    snapThreshold = DEFAULT_SNAP_THRESHOLD,
    disabled = false,
  } = config;

  // Nilai awal HARUS sama persis di server & client-first-render (baca
  // localStorage di sini akan menyebabkan hydration mismatch) -- geometri
  // tersimpan dipulihkan lewat efek terpisah setelah mount, lihat di bawah.
  const [dock, setDockState] = useState<DockSide>(initialDock);
  const [size, setSize] = useState<Size>(initialSize);
  const [position, setPosition] = useState<Point>(initialPosition ?? { x: 120, y: 120 });
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const restoredRef = useRef(false);

  useEffect(() => {
    if (restoredRef.current) return;
    restoredRef.current = true;
    const saved = loadGeometry(id);
    if (!saved) return;
    // Restore geometri tersimpan dari localStorage -- ini hanya bisa dibaca
    // di client setelah mount (SSR tidak punya localStorage), jadi satu kali
    // setState di sini setelah hydration adalah cara yang tepat, bukan anti-pola.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setDockState(saved.dock);
    setSize(saved.size);
    setPosition(saved.position);
  }, [id]);

  const dragState = useRef<{
    startX: number;
    startY: number;
    originX: number;
    originY: number;
  } | null>(null);
  const resizeState = useRef<{
    edge: ResizeEdge;
    startX: number;
    startY: number;
    originW: number;
    originH: number;
    originX: number;
    originY: number;
  } | null>(null);
  const rafRef = useRef<number | null>(null);
  const pendingRef = useRef<{ dock?: DockSide; size?: Size; position?: Point }>({});

  const flush = useCallback(() => {
    rafRef.current = null;
    const pending = pendingRef.current;
    pendingRef.current = {};
    if (pending.dock !== undefined) setDockState(pending.dock);
    if (pending.size !== undefined) setSize(pending.size);
    if (pending.position !== undefined) setPosition(pending.position);
  }, []);

  const schedule = useCallback(
    (patch: { dock?: DockSide; size?: Size; position?: Point }) => {
      pendingRef.current = { ...pendingRef.current, ...patch };
      if (rafRef.current === null) {
        rafRef.current = requestAnimationFrame(flush);
      }
    },
    [flush]
  );

  useEffect(() => {
    return () => {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
    };
  }, []);

  useEffect(() => {
    saveGeometry(id, { dock, size, position });
  }, [id, dock, size, position]);

  const setDock = useCallback((next: DockSide) => {
    setDockState(next);
  }, []);

  // Ref memegang nilai terbaru (size/position/dll.) supaya handler pointermove/up
  // yang didaftarkan ke window tetap "stabil" (identitas fungsi tidak berubah)
  // sepanjang satu gesture drag/resize, tanpa perlu re-attach listener tiap render.
  const canDockSide = (s: DockSide) => dockable && (!allowedDocks || allowedDocks.includes(s));
  const liveRef = useRef({
    size,
    position,
    dock,
    getBounds,
    minSize,
    maxSize,
    canDock: canDockSide,
    snapThreshold,
  });
  useEffect(() => {
    liveRef.current = {
      size,
      position,
      dock,
      getBounds,
      minSize,
      maxSize,
      canDock: canDockSide,
      snapThreshold,
    };
  });

  const onDragPointerMove = useRef((e: PointerEvent) => {
    const drag = dragState.current;
    if (!drag) return;
    const { size, canDock, getBounds, snapThreshold } = liveRef.current;
    const bounds = (getBounds ?? defaultBounds)();
    const dx = e.clientX - drag.startX;
    const dy = e.clientY - drag.startY;
    const nextX = drag.originX + dx;
    const nextY = drag.originY + dy;

    // Deteksi "dekat sisi layar" berdasarkan posisi KURSOR (e.clientX/Y), bukan
    // tepi panel (position + size) -- untuk panel yang tinggi/lebar, tepi
    // trailing-nya bisa "dekat" batas layar meski kursor & panel masih jauh
    // dari sana secara visual, menyebabkan snap-dock tiba-tiba/tidak terduga.
    let nextDock: DockSide = "float";
    if (canDock("left") && e.clientX <= bounds.left + snapThreshold) nextDock = "left";
    else if (canDock("right") && e.clientX >= bounds.right - snapThreshold) nextDock = "right";
    else if (canDock("bottom") && e.clientY >= bounds.bottom - snapThreshold) nextDock = "bottom";

    // `nextX/nextY` di sini viewport-relative (dihitung dari getBoundingClientRect
    // saat drag mulai) -- tapi CSS left/top panel relatif terhadap offset parent-
    // nya (mis. .map-area, bisa punya offset sendiri dari viewport kalau ada
    // sidebar dsb). Kurangi bounds.left/top supaya position yang disimpan cocok
    // dengan sistem koordinat CSS-nya, bukan viewport -- ini penyebab panel
    // "melompat" saat drag pertama kali dimulai.
    const clampedX = Math.min(Math.max(nextX, bounds.left), bounds.right - size.width);
    const clampedY = Math.min(Math.max(nextY, bounds.top), bounds.bottom - size.height);

    schedule({
      dock: nextDock,
      position: {
        x: clampedX - bounds.left,
        y: clampedY - bounds.top,
      },
    });
  }).current;

  const endDrag = useRef(() => {
    dragState.current = null;
    setIsDragging(false);
    document.body.classList.remove("panel-interaction-active");
    window.removeEventListener("pointermove", onDragPointerMove);
    window.removeEventListener("pointerup", endDrag);
  }).current;

  const onDragHandlePointerDown = useCallback(
    (e: React.PointerEvent) => {
      if (disabled) return;
      // Jangan mulai drag dari elemen interaktif di dalam header (tombol aksi dll).
      const target = e.target as HTMLElement;
      if (target.closest("button, a, input, textarea, select")) return;
      // Cegah browser memulai text-selection dari titik mousedown ini --
      // tanpa ini, gerakan cepat selama drag bisa mem-block/highlight teks
      // di sekitar header (lihat body.panel-interaction-active di CSS).
      e.preventDefault();

      // Kalau sedang docked, `position` state adalah posisi float TERAKHIR
      // (basi) -- pakai posisi visual nyata (getBoundingClientRect) sebagai
      // origin drag supaya panel tidak "melompat" balik ke posisi lama.
      // originX/Y di sini VIEWPORT-relative (dipakai bersama e.clientX/Y yang
      // juga viewport-relative di onDragPointerMove) -- dikonversi ke
      // container-relative baru saat ditulis ke `position` state/CSS.
      const panelEl = target.closest(".dockable-panel") as HTMLElement | null;
      const rect = panelEl?.getBoundingClientRect();
      const { getBounds } = liveRef.current;
      const containerRect = (getBounds ?? defaultBounds)();
      const originX = rect ? rect.left : liveRef.current.position.x + containerRect.left;
      const originY = rect ? rect.top : liveRef.current.position.y + containerRect.top;
      if (rect) {
        liveRef.current.position = {
          x: originX - containerRect.left,
          y: originY - containerRect.top,
        };
      }

      dragState.current = {
        startX: e.clientX,
        startY: e.clientY,
        originX,
        originY,
      };
      setIsDragging(true);
      document.body.classList.add("panel-interaction-active");
      window.addEventListener("pointermove", onDragPointerMove);
      window.addEventListener("pointerup", endDrag);
    },
    [disabled, endDrag, onDragPointerMove]
  );

  const onResizePointerMove = useRef((e: PointerEvent) => {
    const resize = resizeState.current;
    if (!resize) return;
    const { getBounds, minSize, maxSize } = liveRef.current;
    const dx = e.clientX - resize.startX;
    const dy = e.clientY - resize.startY;
    const bounds = (getBounds ?? defaultBounds)();

    let width = resize.originW;
    let height = resize.originH;
    let x = resize.originX;
    let y = resize.originY;

    // Hanya dimensi yang benar-benar disentuh tepi/sudut aktif yang diubah &
    // di-clamp -- tepi lain (mis. resize dari atas saja) harus mempertahankan
    // lebar apa adanya, termasuk saat lebar asalnya "auto" (docked-bottom).
    if (resize.edge.includes("e")) {
      width = Math.max(minSize.width, Math.min(resize.originW + dx, maxSize?.width ?? bounds.width));
    }
    if (resize.edge.includes("w")) {
      width = Math.max(minSize.width, Math.min(resize.originW - dx, maxSize?.width ?? bounds.width));
      x = resize.originX + (resize.originW - width);
    }
    if (resize.edge.includes("s")) {
      height = Math.max(minSize.height, Math.min(resize.originH + dy, maxSize?.height ?? bounds.height));
    }
    if (resize.edge.includes("n")) {
      height = Math.max(minSize.height, Math.min(resize.originH - dy, maxSize?.height ?? bounds.height));
      y = resize.originY + (resize.originH - height);
    }

    schedule({ size: { width, height }, position: { x, y } });
  }).current;

  const endResize = useRef(() => {
    resizeState.current = null;
    setIsResizing(false);
    document.body.classList.remove("panel-interaction-active");
    window.removeEventListener("pointermove", onResizePointerMove);
    window.removeEventListener("pointerup", endResize);
  }).current;

  const getResizeHandleProps = useCallback(
    (edge: ResizeEdge) => ({
      className: `panel-resize-handle panel-resize-${edge}`,
      onPointerDown: (e: React.PointerEvent) => {
        if (disabled) return;
        e.stopPropagation();
        e.preventDefault();
        const { dock, getBounds } = liveRef.current;
        const panelEl = (e.target as HTMLElement).closest(".dockable-panel") as HTMLElement | null;
        const rect = panelEl?.getBoundingClientRect();
        // `position` (state/CSS) itu relatif ke offset parent panel (mis.
        // .map-area), bukan viewport -- kurangi origin container supaya
        // origin resize konsisten dengan sistem koordinat yang sama dipakai
        // saat commit (lihat komentar serupa di onDragPointerMove).
        const containerRect = (getBounds ?? defaultBounds)();
        const originW = rect ? rect.width : liveRef.current.size.width;
        const originH = rect ? rect.height : liveRef.current.size.height;
        const originX = rect ? rect.left - containerRect.left : liveRef.current.position.x;
        const originY = rect ? rect.top - containerRect.top : liveRef.current.position.y;
        if (rect) {
          liveRef.current.size = { width: originW, height: originH };
          liveRef.current.position = { x: originX, y: originY };
        }
        resizeState.current = { edge, startX: e.clientX, startY: e.clientY, originW, originH, originX, originY };
        setIsResizing(true);
        document.body.classList.add("panel-interaction-active");
        // Resize selalu melepas dock -- panel jadi float dengan ukuran baru.
        if (dock !== "float") setDockState("float");
        window.addEventListener("pointermove", onResizePointerMove);
        window.addEventListener("pointerup", endResize);
      },
    }),
    [disabled, endResize, onResizePointerMove]
  );

  // Skala konten proporsional terhadap ukuran awal panel -- dipakai lewat
  // CSS custom property `--panel-scale` di elemen yang perlu ikut membesar/
  // mengecil (font-size, padding, gap dsb, lihat app/globals.css). Dihitung
  // dari rasio lebar & tinggi sekaligus (ambil yang terkecil) supaya proporsi
  // konten tetap wajar walau panel di-resize tidak proporsional (mis. cuma
  // dilebarkan tanpa ditinggikan).
  const widthRatio = size.width / initialSize.width;
  const heightRatio = size.height / initialSize.height;
  const scale = Math.min(Math.max(Math.min(widthRatio, heightRatio), 0.8), 1.6);

  let style: React.CSSProperties;
  if (dock === "left") {
    style = { position: "absolute", left: 0, top: 0, bottom: 0, width: size.width, height: "auto" };
  } else if (dock === "right") {
    style = { position: "absolute", right: 0, top: 0, bottom: 0, width: size.width, height: "auto" };
  } else if (dock === "bottom") {
    style = { position: "absolute", left: 0, right: 0, bottom: 0, height: size.height, width: "auto" };
  } else {
    style = {
      position: "absolute",
      left: position.x,
      top: position.y,
      width: size.width,
      height: size.height,
    };
  }
  (style as React.CSSProperties & Record<string, string>)["--panel-scale"] = scale.toFixed(3);

  return {
    dock,
    size,
    position,
    isDragging,
    isResizing,
    style,
    dragHandleProps: { onPointerDown: onDragHandlePointerDown },
    getResizeHandleProps,
    setDock,
  };
}
