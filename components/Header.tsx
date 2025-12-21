import { Button } from "@/components/ui/button";
import { Target, MessageSquare, Home } from "lucide-react";
import { ActivityIcon } from "./ActivityIcon";

export type PanelRoute = "dashboard" | "settings" | "replies";

interface HeaderProps {
  currentRoute: PanelRoute;
  onNavigate: (route: PanelRoute) => void;
}

export function Header({ currentRoute, onNavigate }: HeaderProps) {
  return (
    <header className="flex justify-between items-center mb-6">
      <h1 className="flex items-center gap-2 font-bold text-xl tracking-tight">
        <ActivityIcon className="w-5 h-5 text-primary" />
        <span>Gamex</span>
      </h1>
      <div className="flex gap-1">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => onNavigate("dashboard")}
          className={`hover:bg-accent hover:text-primary transition-colors ${currentRoute === "dashboard" ? "bg-accent text-primary" : ""
            }`}
          title="Dashboard"
        >
          <Home className="w-4 h-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => onNavigate("replies")}
          className={`hover:bg-accent hover:text-primary transition-colors ${currentRoute === "replies" ? "bg-accent text-primary" : ""
            }`}
          title="Manage Stored Replies"
        >
          <MessageSquare className="w-4 h-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => onNavigate("settings")}
          className={`hover:bg-accent hover:text-primary transition-colors ${currentRoute === "settings" ? "bg-accent text-primary" : ""
            }`}
          title="Settings"
        >
          <Target className="w-4 h-4" />
        </Button>
      </div>
    </header>
  );
}
