import { useState } from "react";
import { Header, type PanelRoute } from "@/components/Header";
import { DashboardPanel } from "@/components/DashboardPanel";
import { SettingsPanel } from "@/components/SettingsPanel";
import { StoredRepliesPanel } from "@/components/StoredRepliesPanel";

function App() {
  const [currentRoute, setCurrentRoute] = useState<PanelRoute>("dashboard");

  return (
    <div className="bg-background selection:bg-primary/20 p-4 min-w-[350px] min-h-[500px] font-sans text-foreground">
      <Header currentRoute={currentRoute} onNavigate={setCurrentRoute} />

      {currentRoute === "dashboard" && <DashboardPanel />}
      {currentRoute === "settings" && <SettingsPanel />}
      {currentRoute === "replies" && <StoredRepliesPanel />}
    </div>
  );
}

export default App;
