import { Button } from "@/components/ui/button";
import { Target } from "lucide-react";
import { ActivityIcon } from "./ActivityIcon";

interface HeaderProps {
  isSettingsOpen: boolean;
  setIsSettingsOpen: (isOpen: boolean) => void;
}

export function Header({ isSettingsOpen, setIsSettingsOpen }: HeaderProps) {
  return (
    <header className="flex justify-between items-center mb-6">
      <h1 className="flex items-center gap-2 font-bold text-xl tracking-tight neon-text">
        <ActivityIcon className="w-5 h-5 text-primary" />
        <span>X-Tracker</span>
      </h1>
      <Button
        variant="ghost"
        size="icon"
        onClick={() => setIsSettingsOpen(!isSettingsOpen)}
        className="hover:bg-accent hover:text-primary transition-colors"
      >
        <Target className="w-4 h-4" />
      </Button>
    </header>
  );
}
