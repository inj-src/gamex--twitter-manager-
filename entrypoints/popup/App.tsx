import { useEffect, useState } from "react";
import dayjs from "dayjs";
import { getState, setTargets, resetForDate, setOpenRouterApiKey, setLlmModel, setUseImageUnderstanding } from "@/lib/storage";
import type { State } from "@/lib/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { MessageCircle, Twitter, Clock, RotateCcw, History, Target } from "lucide-react";

function App() {
  const [state, setState] = useState<State | null>(null);
  const [targets, setLocalTargets] = useState({ tweets: 5, replies: 50 });
  const [apiKey, setApiKey] = useState("");
  const [llmModel, setLlmModelLocal] = useState("");
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [useImageUnderstanding, setUseImageUnderstandingLocal] = useState(false);

  useEffect(() => {
    let mounted = true;

    const loadState = async () => {
      const s = await getState();
      if (!mounted) return;
      setState(s);
      setLocalTargets(s.targets || { tweets: 5, replies: 50 });
      setApiKey(s.openRouterApiKey || "");
      setLlmModelLocal(s.llmModel || "");
      setUseImageUnderstandingLocal(s.useImageUnderstanding || false);
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

  function onUpdateTargets(newTargets: { tweets: number; replies: number }) {
    setLocalTargets(newTargets);
    setTargets(newTargets.tweets, newTargets.replies);
  }

  function onUpdateApiKey(newKey: string) {
    setApiKey(newKey);
    setOpenRouterApiKey(newKey);
  }

  function onUpdateLlmModel(newModel: string) {
    setLlmModelLocal(newModel);
    setLlmModel(newModel);
  }

  function onUpdateUseImageUnderstanding(enabled: boolean) {
    setUseImageUnderstandingLocal(enabled);
    setUseImageUnderstanding(enabled);
  }

  async function onReset() {
    await resetForDate(dayjs().format("YYYY-MM-DD"));
    const s = await getState();
    setState(s);
  }

  const historyDates = state?.history ? Object.keys(state.history).sort().slice(-7).reverse() : [];

  if (!state) {
    return (
      <div className="flex justify-center items-center h-screen text-muted-foreground">
        Loading...
      </div>
    );
  }

  return (
    <div className="bg-background selection:bg-primary/20 p-4 min-w-[350px] min-h-[500px] font-sans text-foreground">
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

        {/* Time Stat */}
        <Card className="bg-card border-border">
          <CardContent className="flex justify-between items-center p-4">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Clock className="w-4 h-4" />
              <span className="font-medium text-sm">Time on X</span>
            </div>
            <div className="font-mono font-bold text-primary text-lg neon-text">
              {formatTime(state.daily.seconds)}
            </div>
          </CardContent>
        </Card>

        {/* Settings / Controls */}
        {isSettingsOpen && (
          <Card className="bg-secondary slide-in-from-top-2 border-border animate-in duration-200 fade-in">
            <CardHeader className="pb-2">
              <CardTitle className="font-medium text-muted-foreground text-sm">Targets</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="gap-3 grid grid-cols-2">
                <div className="space-y-1">
                  <label className="text-muted-foreground text-xs">Tweets</label>
                  <Input
                    type="number"
                    value={targets.tweets}
                    onChange={(e) =>
                      onUpdateTargets({ ...targets, tweets: Number(e.target.value) })
                    }
                    className="bg-background border-border h-8"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-muted-foreground text-xs">Replies</label>
                  <Input
                    type="number"
                    value={targets.replies}
                    onChange={(e) =>
                      onUpdateTargets({ ...targets, replies: Number(e.target.value) })
                    }
                    className="bg-background border-border h-8"
                  />
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-muted-foreground text-xs">OpenRouter API Key</label>
                <Input
                  type="password"
                  value={apiKey}
                  onChange={(e) => onUpdateApiKey(e.target.value)}
                  className="bg-background border-border h-8"
                  placeholder="sk-or-..."
                />
              </div>
              <div className="space-y-1">
                <label className="text-muted-foreground text-xs">LLM Model</label>
                <Input
                  type="text"
                  value={llmModel}
                  onChange={(e) => onUpdateLlmModel(e.target.value)}
                  className="bg-background border-border h-8"
                  placeholder="moonshotai/kimi-k2:free"
                />
              </div>
              <div className="flex justify-between items-center">
                <label className="text-muted-foreground text-xs">Image Understanding</label>
                <Switch
                  checked={useImageUnderstanding}
                  onCheckedChange={onUpdateUseImageUnderstanding}
                />
              </div>
              <Button
                variant="destructive"
                size="sm"
                className="mt-2 w-full h-8 text-xs"
                onClick={onReset}
              >
                <RotateCcw className="mr-2 w-3 h-3" />
                Reset Today's Data
              </Button>
            </CardContent>
          </Card>
        )}

        <Separator className="bg-border" />

        {/* History */}
        <div className="space-y-3">
          <div className="flex items-center gap-2 px-1 text-muted-foreground">
            <History className="w-3 h-3" />
            <span className="font-semibold text-xs uppercase tracking-wider">Recent History</span>
          </div>
          <div className="space-y-2 pr-1 max-h-[150px] overflow-y-auto custom-scrollbar">
            {historyDates.length === 0 ? (
              <div className="py-4 text-muted-foreground text-xs text-center">No history yet</div>
            ) : (
              historyDates.map((d) => (
                <div
                  key={d}
                  className="flex justify-between items-center hover:bg-accent p-2 border border-transparent hover:border-border rounded-md text-sm transition-colors"
                >
                  <span className="font-mono text-muted-foreground text-xs">{d}</span>
                  <div className="flex items-center gap-3">
                    <span className="text-chart-1 text-xs">{state.history[d].tweets}t</span>
                    <span className="text-chart-2 text-xs">{state.history[d].replies}r</span>
                    <span className="w-12 text-muted-foreground text-xs text-right">
                      {formatTime(state.history[d].seconds)}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({
  icon,
  label,
  current,
  target,
  colorClass,
}: {
  icon: React.ReactNode;
  label: string;
  current: number;
  target: number;
  colorClass: string;
}) {
  const progress = Math.min(100, (current / target) * 100);

  return (
    <div className="relative bg-linear-to-br from-chart-1 via-chart-2 to-chart-3 p-px rounded-(--radius)">
      <div className="flex flex-col justify-between gap-3 bg-card p-4 rounded-[calc(var(--radius)-1px)] h-full">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-2 text-muted-foreground">
            {icon}
            <span className="font-medium text-sm">{label}</span>
          </div>
          <div className="text-muted-foreground text-xs">Target: {target}</div>
        </div>

        <div className="flex justify-between items-end">
          <div className="font-bold text-2xl tracking-tight">
            {current}
            <span className="ml-1 font-normal text-muted-foreground text-sm">/ {target}</span>
          </div>
          <div className="mb-1 font-medium text-xs">{Math.round(progress)}%</div>
        </div>

        <Progress value={progress} className="h-1.5" indicatorClassName={colorClass} />
      </div>
    </div>
  );
}

function ActivityIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
    </svg>
  );
}

function formatTime(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  if (h > 0) return `${h}h ${m}m`;
  if (m > 0) return `${m}m ${s}s`;
  return `${s}s`;
}

export default App;
