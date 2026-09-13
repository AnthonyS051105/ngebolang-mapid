"use client";

import { useEffect, useRef, useState } from "react";
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
  const [feedMinimized, setFeedMinimized] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
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

  return (
    <div className={appClassNames}>
      <Sidebar
        active={active}
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
      />

      {(!plannerOpen || plannerMinimized) && !isMobile && (
        <button
          type="button"
          className="panel-minimized-btn chat-panel-minimized-btn"
          style={{ bottom: !feedMinimized ? 285 : 86 }}
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

      {plannerOpen && !isMobile && !plannerMinimized && (
        <DockablePanel panel={plannerPanel} className="right-panel">
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

      {showComposer && (
        <ReportComposerModal
          user={user}
          onClose={() => setShowComposer(false)}
          onSubmit={handleReportSubmitted}
        />
      )}

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
