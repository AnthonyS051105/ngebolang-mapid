"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { AnimatePresence } from "framer-motion";
import { Sparkles } from "lucide-react";
import Sidebar from "./Sidebar";
import MapArea, { type MapAreaHandle } from "./MapArea";
import ChatPanel from "./ChatPanel";
import DockablePanel from "./DockablePanel";
import ReportComposerModal from "./ReportComposerModal";
import MobileBottomNav from "./MobileBottomNav";
import { useChatSession } from "@/lib/hooks/useChatSession";
import { useDockablePanel } from "@/lib/hooks/useDockablePanel";
import { useThreadsFeed } from "@/lib/hooks/useThreadsFeed";
import type { RouteResponse } from "@/lib/types/routingApi";
import type { RouteDisplayOptions } from "./MapView";

export interface AppShellUser {
  namaTampilan: string;
  email: string;
}

interface AppShellProps {
  user: AppShellUser;
}

export default function AppShell({ user }: AppShellProps) {
  const [active, setActive] = useState("peta");
  const [collapsed, setCollapsed] = useState(false);
  const [showComposer, setShowComposer] = useState(false);
  // AI Trip Planner: panel tetap di desktop/tablet (bisa diciutkan lewat
  // plannerMinimized), overlay layar penuh di mobile (showMobileChat).
  // Dibuka dari search-card/plan-btn di top-bar, atau tombol khusus di atas
  // Feed -- BUKAN dari tab navbar mobile (navbar sengaja cuma 3 item).
  const [plannerOpen, setPlannerOpen] = useState(false);
  const [plannerMinimized, setPlannerMinimized] = useState(false);
  const [plannerClosedByX, setPlannerClosedByX] = useState(false);
  const [showMobileChat, setShowMobileChat] = useState(false);
  const [feedExpanded, setFeedExpanded] = useState(false);
  // Default diciutkan di desktop supaya peta tidak langsung penuh panel saat
  // pertama dibuka (lihat DESIGN.md prinsip "progresif, bukan default ramai")
  // -- di mobile, Feed dirender sebagai bottom sheet draggable oleh
  // FeedPanel sendiri, jadi boolean ini efeknya minimal di sana.
  const [feedMinimized, setFeedMinimized] = useState(true);
  const [isMobile, setIsMobile] = useState(false);
  // Mobile only -- tinggi bottom sheet Feed yang sedang terlihat (px dari
  // bawah layar) & tinggi viewport saat itu, dilaporkan real-time oleh
  // FeedPanel (termasuk selama drag) supaya tombol AI Trip Planner mengambang
  // bisa selalu mengikuti tepi atas sheet, lihat mobileAiBtnStyle di bawah.
  const [feedSheetVisiblePx, setFeedSheetVisiblePx] = useState(320);
  const [feedSheetViewportH, setFeedSheetViewportH] = useState(0);
  const [feedSheetDragging, setFeedSheetDragging] = useState(false);
  // Overlay "Lihat semua" (FeedFullScreen, dikelola MapArea) -- dilacak di
  // sini juga (bukan cuma di dalam MapArea) supaya tab "Feed Threads" di
  // sidebar ikut ter-highlight selama overlay itu terbuka.
  const [feedFullScreen, setFeedFullScreen] = useState(false);
  const mapAreaRef = useRef<MapAreaHandle | null>(null);

  // AI Trip Planner dirender sebagai SALAH SATU dari dua bentuk berdasar
  // breakpoint ini -- .right-panel (desktop/tablet) atau .mobile-chat-overlay
  // (mobile) -- tidak pernah keduanya sekaligus, supaya tidak ada dua
  // instance ChatPanel (dua sesi chat, dua pemanggilan API) hidup bersamaan.
  useEffect(() => {
    const mq = window.matchMedia("(max-width: 600px)");
    const update = () => setIsMobile(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);

  const openPlanner = () => {
    setPlannerOpen(true);
    setPlannerMinimized(false);
    setPlannerClosedByX(false);
    if (isMobile) setShowMobileChat(true);
  };

  const closeMobileChat = () => {
    setShowMobileChat(false);
    setActive("peta");
  };

  const handleNavigate = (key: string) => {
    setActive(key);
    if (key === "planner") openPlanner();
    if (key === "lapor") setShowComposer(true);
    if (key === "feed") {
      setFeedExpanded(true);
      setFeedMinimized(false);
    }
    if (key === "peta") setFeedExpanded(false);
  };

  // Referensi fungsi ini HARUS stabil (useCallback, bukan arrow function baru
  // tiap render) -- diteruskan sampai ke dalam dependency array useEffect di
  // FeedPanel, jadi kalau referensinya berubah tiap render, efek itu akan
  // terus-menerus re-fire -> setState di sini -> re-render AppShell -> fungsi
  // baru lagi -> Maximum update depth exceeded (infinite loop).
  const handleFeedSheetVisibleChange = useCallback(
    (visiblePx: number, viewportHeight: number, dragging: boolean) => {
      setFeedSheetVisiblePx(visiblePx);
      setFeedSheetViewportH(viewportHeight);
      setFeedSheetDragging(dragging);
    },
    []
  );

  const handleViewRouteOnMap = (routeData: RouteResponse, options?: RouteDisplayOptions) => {
    mapAreaRef.current?.showRoute(routeData, options);
  };

  const chatSession = useChatSession(handleViewRouteOnMap);
  const threadsFeed = useThreadsFeed();

  const handleComposerSubmit = (text: string) => {
    chatSession.sendMessage(text);
    openPlanner();
  };

  const handleReportSubmitted = () => {
    setShowComposer(false);
    threadsFeed.refetch();
  };

  const plannerPanel = useDockablePanel({
    id: "ai-trip-planner",
    initialDock: "right",
    initialSize: { width: 380, height: 560 },
    minSize: { width: 340, height: 480 },
    maxSize: { width: 560, height: 900 },
    allowedDocks: ["left", "right", "bottom", "float"],
    disabled: isMobile,
  });

  // Feed Threads docked-bottom melebar penuh secara default -- kalau AI Trip
  // Planner sedang docked-right, sisakan lebarnya supaya keduanya membentuk
  // tata letak L-shape yang rapi, bukan tumpang tindih di pojok kanan-bawah.
  const plannerRightInset =
    plannerOpen && !isMobile && !plannerMinimized && plannerPanel.dock === "right"
      ? plannerPanel.size.width
      : 0;

  const appClassNames = ["app", collapsed && "sidebar-collapsed"].filter(Boolean).join(" ");

  // Highlight tab sidebar mengikuti apa yang SEDANG terlihat oleh pengguna,
  // bukan cuma navigasi terakhir lewat klik sidebar/navbar -- "Feed Threads"
  // menyala kalau overlay "Lihat semua" terbuka (desktop/tablet/mobile),
  // "AI Trip Planner" menyala selama panelnya terlihat & tidak diciutkan
  // (desktop/tablet: right-panel; mobile: overlay penuh layar). Aturan
  // sederhana & stabil: visible = aktif, bukan berbasis fokus/ketikan.
  const isPlannerVisible = isMobile
    ? showMobileChat
    : plannerOpen && !plannerMinimized;
  const sidebarActive = feedFullScreen
    ? "feed"
    : isPlannerVisible
      ? "planner"
      : active;

  // Mobile: tombol AI Trip Planner mengambang HARUS selalu ada di atas tepi
  // atas bottom sheet Feed & di bawah cluster zoom (bottom:50vh, lihat
  // globals.css) SELAMA sheet belum menyentuh cluster itu -- begitu tepi
  // atas sheet (+ jarak aman) sampai di tepi bawah cluster, tombol pindah ke
  // posisi tetap di pojok kanan-bawah. Sengaja TIDAK dipatok ke suatu nilai
  // maksimum yang lebih rendah dari titik peralihan ini -- itulah yang
  // sebelumnya bikin tombol berhenti bergerak ("tidak relatif lagi") jauh
  // sebelum sheet benar-benar sampai di ambang.
  const MOBILE_CLUSTER_BOTTOM_RATIO = 0.5;
  const MOBILE_GAP = 14;
  const mobileClusterBottomOffset =
    feedSheetViewportH * MOBILE_CLUSTER_BOTTOM_RATIO;
  const isFeedSheetNearCluster =
    feedSheetViewportH > 0 &&
    feedSheetVisiblePx + MOBILE_GAP >= mobileClusterBottomOffset;
  // Posisi "diam di pojok" adalah titik jangkar TETAP (sama persis dengan
  // bottom CSS .chat-panel-minimized-btn-mobile) -- posisi mengambang di
  // atas sheet dicapai lewat transform:translateY() relatif ke jangkar itu,
  // BUKAN dengan mengubah-ubah `bottom` tiap frame. Alasan: `bottom` memicu
  // reflow/layout tiap kali berubah (dianimasikan oleh browser di main
  // thread, gampang patah-patah/tersendat), sedangkan `transform` dikerjakan
  // compositor thread (GPU) sehingga animasinya jauh lebih mulus -- inilah
  // yang bikin transisi sebelumnya (animasi properti `bottom`) terasa kurang
  // halus meski durasi & easing-nya sudah benar.
  const MOBILE_AI_BTN_CORNER_BOTTOM = 140;
  const mobileAiBtnTranslateY = isFeedSheetNearCluster
    ? 0
    : -(feedSheetVisiblePx + MOBILE_GAP - MOBILE_AI_BTN_CORNER_BOTTOM);
  // Selama drag berlangsung, tombol harus mengikuti jari persis tanpa lag --
  // transisi CSS (lihat .chat-panel-minimized-btn-mobile) dinonaktifkan di
  // sini lewat transitionDuration:"0s", dan hanya aktif lagi setelah jari
  // dilepas (dragging=false) supaya perpindahan diskrit ke/dari pojok terasa
  // halus, bukan "berkedip" tiba-tiba pindah tempat.
  const mobileAiBtnStyle: React.CSSProperties = {
    transitionDuration: feedSheetDragging ? "0s" : undefined,
  };
  (mobileAiBtnStyle as React.CSSProperties & Record<string, string>)["--pos-y"] =
    `${mobileAiBtnTranslateY}px`;

  return (
    <div className={appClassNames}>
      <Sidebar
        active={sidebarActive}
        onNavigate={handleNavigate}
        collapsed={collapsed}
        onToggleCollapsed={() => setCollapsed((v) => !v)}
        user={user}
      />
      <MapArea
        ref={mapAreaRef}
        onOpenPlanner={openPlanner}
        onComposerSubmit={handleComposerSubmit}
        feedExpanded={feedExpanded}
        onFeedExpandedChange={setFeedExpanded}
        feedMinimized={feedMinimized}
        onFeedMinimizedChange={setFeedMinimized}
        isMobile={isMobile}
        feedReservedRightInset={plannerRightInset}
        user={user}
        plannerOpen={plannerOpen && !plannerMinimized}
        plannerPanelWidth={plannerPanel.size.width}
        threads={threadsFeed.threads}
        onThreadUpvoted={threadsFeed.applyUpvote}
        onFeedSheetVisibleChange={handleFeedSheetVisibleChange}
        onFeedFullScreenChange={setFeedFullScreen}
      />

      {(!plannerOpen || plannerMinimized) && !isMobile && (
        <button
          type="button"
          className="panel-minimized-btn chat-panel-minimized-btn"
          style={{ bottom: !feedMinimized ? 501 : 239 }}
          onClick={() => {
            if (plannerClosedByX || !plannerOpen) {
              setPlannerOpen(true);
              setPlannerMinimized(false);
              setPlannerClosedByX(false);
              chatSession.openHistoryView();
            } else {
              setPlannerOpen(true);
              setPlannerMinimized(false);
              chatSession.openChatView();
            }
          }}
          aria-label="Buka AI Trip Planner"
          title="AI Trip Planner"
        >
          <Sparkles width={18} height={18} />
        </button>
      )}

      {!showMobileChat && isMobile && (
        <button
          type="button"
          className="panel-minimized-btn chat-panel-minimized-btn-mobile"
          style={mobileAiBtnStyle}
          onClick={openPlanner}
          aria-label="Buka AI Trip Planner"
          title="AI Trip Planner"
        >
          <Sparkles width={18} height={18} />
        </button>
      )}

      <AnimatePresence>
        {plannerOpen && !isMobile && !plannerMinimized && (
          <DockablePanel key="ai-trip-planner" panel={plannerPanel} className="right-panel">
            <ChatPanel
              session={chatSession}
              onViewRouteOnMap={handleViewRouteOnMap}
              onMinimize={() => {
                setPlannerMinimized(true);
                setPlannerClosedByX(false);
              }}
              onClose={() => {
                setPlannerOpen(false);
                setPlannerMinimized(false);
                setPlannerClosedByX(true);
              }}
              dragHandleProps={plannerPanel.dragHandleProps}
            />
          </DockablePanel>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showComposer && (
          <ReportComposerModal
            key="report-composer"
            user={user}
            onClose={() => setShowComposer(false)}
            onSubmit={handleReportSubmitted}
          />
        )}
      </AnimatePresence>

      {showMobileChat && isMobile && (
        <div className="mobile-chat-overlay">
          <ChatPanel
            session={chatSession}
            onViewRouteOnMap={(routeData, options) => {
              handleViewRouteOnMap(routeData, options);
              closeMobileChat();
            }}
            onClose={closeMobileChat}
          />
        </div>
      )}

      <MobileBottomNav
        active={active}
        onNavigate={handleNavigate}
        onFabClick={() => setShowComposer(true)}
      />
    </div>
  );
}
