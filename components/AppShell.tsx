"use client";

import { useEffect, useRef, useState } from "react";
import Sidebar from "./Sidebar";
import MapArea, { type MapAreaHandle } from "./MapArea";
import ChatPanel from "./ChatPanel";
import ReportComposerModal from "./ReportComposerModal";
import MobileBottomNav from "./MobileBottomNav";
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

  const appClassNames = [
    "app",
    collapsed && "sidebar-collapsed",
    !plannerOpen && "planner-closed",
  ]
    .filter(Boolean)
    .join(" ");

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
        feedExpanded={feedExpanded}
        onFeedExpandedChange={setFeedExpanded}
        feedMinimized={feedMinimized}
        onFeedMinimizedChange={setFeedMinimized}
        onOpenPlannerFromFeed={openPlanner}
        user={user}
      />

      {plannerOpen && !isMobile && (
        <div className={`right-panel${plannerMinimized ? " minimized" : ""}`}>
          {plannerMinimized ? (
            <button
              type="button"
              className="right-panel-restore"
              onClick={() => setPlannerMinimized(false)}
            >
              AI Trip Planner
            </button>
          ) : (
            <ChatPanel
              onViewRouteOnMap={handleViewRouteOnMap}
              onMinimize={() => setPlannerMinimized(true)}
              onClose={() => {
                setPlannerOpen(false);
                setPlannerMinimized(false);
              }}
            />
          )}
        </div>
      )}

      {showComposer && (
        <ReportComposerModal
          onClose={() => setShowComposer(false)}
          onSubmit={() => setShowComposer(false)}
        />
      )}

      {showMobileChat && isMobile && (
        <div className="mobile-chat-overlay">
          <ChatPanel
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
