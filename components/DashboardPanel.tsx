import { useEffect, useState } from "react";
import dayjs from "dayjs";
import {
  getState,
  resetForDate,
  setSelectedPromptId,
} from "@/lib/storage";
import type { State } from "@/lib/types";
import { DEFAULT_PROMPT_ID, SYSTEM_PROMPT_PRESETS } from "@/lib/systemPrompts";
import { MessageCircle, Twitter } from "lucide-react";
import { StatCard } from "@/components/StatCard";
import { TimeStat } from "@/components/TimeStat";
import { HistoryList } from "@/components/HistoryList";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { RotateCcw } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export function DashboardPanel() {
  const [state, setState] = useState<State | null>(null);
  const [selectedPrompt, setSelectedPromptLocal] = useState(DEFAULT_PROMPT_ID);

  useEffect(() => {
    let mounted = true;

    const loadState = async () => {
      const s = await getState();
      if (!mounted) return;
      setState(s);
      setSelectedPromptLocal(s.selectedPromptId || DEFAULT_PROMPT_ID);
    };

    loadState();

    const handleMessage = (m: any) => {
      if (m?.type === "stateChanged" && m.state) {
        setState(m.state);
      }
    };

    browser.runtime.onMessage.addListener(handleMessage);

    return () => {
      mounted = false;
      browser.runtime.onMessage.removeListener(handleMessage);
    };
  }, []);

  function onUpdateSelectedPrompt(promptId: string) {
    setSelectedPromptLocal(promptId);
    setSelectedPromptId(promptId);
  }

  async function onReset() {
    await resetForDate(dayjs().format("YYYY-MM-DD"));
    const s = await getState();
    setState(s);
  }

  if (!state) {
    return (
      <div className="flex justify-center items-center h-64 text-muted-foreground">
        Loading...
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Main Stats */}
      <div className="gap-4 grid grid-cols-1">
        <StatCard
          icon={<Twitter className="w-4 h-4 text-chart-1" />}
          label="Tweets"
          current={state.daily.tweets}
          target={state.targets.tweets}
          colorClass="bg-[var(--chart-1)]"
        />
        <StatCard
          icon={<MessageCircle className="w-4 h-4 text-chart-2" />}
          label="Replies"
          current={state.daily.replies}
          target={state.targets.replies}
          colorClass="bg-[var(--chart-2)]"
        />
      </div>

      {/* System Prompt Selection */}
      <div className="space-y-2 bg-secondary/50 p-3 border border-border rounded-xl">
        <div className="flex justify-between items-center px-1">
          <h3 className="font-medium text-muted-foreground text-xs uppercase tracking-wider">
            Persona Style
          </h3>
        </div>
        <Select value={selectedPrompt} onValueChange={onUpdateSelectedPrompt}>
          <SelectTrigger className="bg-background border-border h-9 w-full">
            <SelectValue placeholder="Select persona" />
          </SelectTrigger>
          <SelectContent>
            {SYSTEM_PROMPT_PRESETS.map((preset) => (
              <SelectItem key={preset.id} value={preset.id}>
                {preset.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Time Stat */}
      <TimeStat seconds={state.daily.seconds} />

      {/* Reset Button */}
      <Button
        variant="outline"
        size="sm"
        className="w-full h-8 text-xs text-destructive hover:text-destructive hover:bg-destructive/10 border-destructive/30"
        onClick={onReset}
      >
        <RotateCcw className="mr-2 w-3 h-3" />
        Reset Today's Data
      </Button>

      <Separator className="bg-border" />

      {/* History */}
      <HistoryList history={state.history} />
    </div>
  );
}
