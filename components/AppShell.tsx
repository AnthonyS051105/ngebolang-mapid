"use client";

import { useRef, useState } from "react";
import Sidebar from "./Sidebar";
import MapArea, { type MapAreaHandle } from "./MapArea";
import ChatPanel from "./ChatPanel";
import ReportComposerModal from "./ReportComposerModal";
import MobileBottomNav from "./MobileBottomNav";
import type { RouteResponse } from "@/lib/types/routingApi";
import type { RouteDisplayOptions } from "./MapView";

export default function AppShell() {
  const [active, setActive] = useState("peta");
  const [collapsed, setCollapsed] = useState(false);
  const [showPlanner, setShowPlanner] = useState(false);
  const [showComposer, setShowComposer] = useState(false);
  const mapAreaRef = useRef<MapAreaHandle | null>(null);

  const handleNavigate = (key: string) => {
    setActive(key);
    if (key === "planner") setShowPlanner(true);
    if (key === "lapor") setShowComposer(true);
  };

  const handleViewRouteOnMap = (routeData: RouteResponse, options?: RouteDisplayOptions) => {
    mapAreaRef.current?.showRoute(routeData, options);
  };

  return (
    <div className={`app${collapsed ? " sidebar-collapsed" : ""}`}>
      <Sidebar
        active={active}
        onNavigate={handleNavigate}
        collapsed={collapsed}
        onToggleCollapsed={() => setCollapsed((v) => !v)}
      />
      <MapArea
        ref={mapAreaRef}
        showPlanner={showPlanner}
        onClosePlanner={() => setShowPlanner(false)}
      />
      <div className="right-panel">
        <ChatPanel onViewRouteOnMap={handleViewRouteOnMap} />
      </div>

      {showComposer && (
        <ReportComposerModal
          onClose={() => setShowComposer(false)}
          onSubmit={() => setShowComposer(false)}
        />
      )}

      <MobileBottomNav
        active={active}
        onNavigate={handleNavigate}
        onFabClick={() => setShowComposer(true)}
      />
    </div>
  );
}
