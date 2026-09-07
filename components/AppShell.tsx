"use client";

import { useState } from "react";
import Sidebar from "./Sidebar";
import MapArea from "./MapArea";
import RightPanel from "./RightPanel";
import ReportComposerModal from "./ReportComposerModal";
import MobileBottomNav from "./MobileBottomNav";

export default function AppShell() {
  const [active, setActive] = useState("peta");
  const [collapsed, setCollapsed] = useState(false);
  const [showPlanner, setShowPlanner] = useState(false);
  const [showComposer, setShowComposer] = useState(false);

  const handleNavigate = (key: string) => {
    setActive(key);
    if (key === "planner") setShowPlanner(true);
    if (key === "lapor") setShowComposer(true);
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
        showPlanner={showPlanner}
        onClosePlanner={() => setShowPlanner(false)}
      />
      <RightPanel onPlanTrip={() => setShowPlanner(true)} />

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
