import Sidebar from "@/components/Sidebar";
import MapArea from "@/components/MapArea";
import RightPanel from "@/components/RightPanel";

export default function Home() {
  return (
    <div className="app">
      <Sidebar />
      <MapArea />
      <RightPanel />
    </div>
  );
}
