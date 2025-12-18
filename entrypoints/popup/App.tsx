import { useEffect, useState } from "react";
import dayjs from "dayjs";
import {
  getState,
  setTargets,
  resetForDate,
  setOpenRouterApiKey,
  setLlmModel,
  setUseImageUnderstanding,
  setMemoryApiKey,
  setMemoryProjectId,
  setUseMemory,
} from "@/lib/storage";
import type { State } from "@/lib/types";
import { MessageCircle, Twitter } from "lucide-react";
import { Header } from "@/components/Header";
import { StatCard } from "@/components/StatCard";
import { TimeStat } from "@/components/TimeStat";
import { SettingsPanel } from "@/components/SettingsPanel";
import { HistoryList } from "@/components/HistoryList";
import { Separator } from "@/components/ui/separator";

function App() {
  const [state, setState] = useState<State | null>(null);
  const [targets, setLocalTargets] = useState({ tweets: 5, replies: 50 });
  const [apiKey, setApiKey] = useState("");
  const [llmModel, setLlmModelLocal] = useState("");
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [useImageUnderstanding, setUseImageUnderstandingLocal] = useState(false);
  const [memoryApiKey, setMemoryApiKeyLocal] = useState("");
  const [memoryProjectId, setMemoryProjectIdLocal] = useState("");
  const [useMemory, setUseMemoryLocal] = useState(false);

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
      setMemoryApiKeyLocal(s.memoryApiKey || "");
      setMemoryProjectIdLocal(s.memoryProjectId || "");
      setUseMemoryLocal(s.useMemory || false);
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

  function onUpdateMemoryApiKey(newKey: string) {
    setMemoryApiKeyLocal(newKey);
    setMemoryApiKey(newKey);
  }

  function onUpdateMemoryProjectId(newId: string) {
    setMemoryProjectIdLocal(newId);
    setMemoryProjectId(newId);
  }

  function onUpdateUseMemory(enabled: boolean) {
    setUseMemoryLocal(enabled);
    setUseMemory(enabled);
  }

  async function onReset() {
    await resetForDate(dayjs().format("YYYY-MM-DD"));
    const s = await getState();
    setState(s);
  }

  if (!state) {
    return (
      <div className="flex justify-center items-center h-screen text-muted-foreground">
        Loading...
      </div>
    );
  }

  return (
    <div className="bg-background selection:bg-primary/20 p-4 min-w-[350px] min-h-[500px] font-sans text-foreground">
      <Header isSettingsOpen={isSettingsOpen} setIsSettingsOpen={setIsSettingsOpen} />

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
        <TimeStat seconds={state.daily.seconds} />

        {/* Settings / Controls */}
        {isSettingsOpen && (
          <SettingsPanel
            targets={targets}
            apiKey={apiKey}
            llmModel={llmModel}
            useImageUnderstanding={useImageUnderstanding}
            memoryApiKey={memoryApiKey}
            memoryProjectId={memoryProjectId}
            useMemory={useMemory}
            onUpdateTargets={onUpdateTargets}
            onUpdateApiKey={onUpdateApiKey}
            onUpdateLlmModel={onUpdateLlmModel}
            onUpdateUseImageUnderstanding={onUpdateUseImageUnderstanding}
            onUpdateMemoryApiKey={onUpdateMemoryApiKey}
            onUpdateMemoryProjectId={onUpdateMemoryProjectId}
            onUpdateUseMemory={onUpdateUseMemory}
            onReset={onReset}
          />
        )}

        <Separator className="bg-border" />

        {/* History */}
        <HistoryList history={state.history} />
      </div>
    </div>
  );
}

export default App;
