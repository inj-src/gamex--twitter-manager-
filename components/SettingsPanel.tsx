import { useEffect, useState } from "react";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  getState,
  setTargets,
  setProvider,
  setOpenRouterApiKey,
  setGoogleApiKey,
  setOpenRouterModel,
  setGoogleModel,
  setUseImageUnderstanding,
  setMemoryApiKey,
  setMemoryProjectId,
  setUseMemory,
  setPromptCycleHotkey,
} from "@/lib/storage";
import type { Provider } from "@/lib/types";

export function SettingsPanel() {
  const [targets, setLocalTargets] = useState({ tweets: 5, replies: 50 });
  const [provider, setProviderLocal] = useState<Provider>("openrouter");
  const [apiKey, setApiKey] = useState("");
  const [googleApiKey, setGoogleApiKeyLocal] = useState("");
  const [openRouterModel, setOpenRouterModelLocal] = useState("");
  const [googleModel, setGoogleModelLocal] = useState("");
  const [useImageUnderstanding, setUseImageUnderstandingLocal] = useState(false);
  const [memoryApiKey, setMemoryApiKeyLocal] = useState("");
  const [memoryProjectId, setMemoryProjectIdLocal] = useState("");
  const [useMemory, setUseMemoryLocal] = useState(false);
  const [promptHotkey, setPromptHotkeyLocal] = useState("alt+s");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadState = async () => {
      const s = await getState();
      setLocalTargets(s.targets || { tweets: 5, replies: 50 });
      setProviderLocal(s.provider || "openrouter");
      setApiKey(s.openRouterApiKey || "");
      setGoogleApiKeyLocal(s.googleApiKey || "");
      setOpenRouterModelLocal(s.openRouterModel || "");
      setGoogleModelLocal(s.googleModel || "");
      setUseImageUnderstandingLocal(s.useImageUnderstanding || false);
      setMemoryApiKeyLocal(s.memoryApiKey || "");
      setMemoryProjectIdLocal(s.memoryProjectId || "");
      setUseMemoryLocal(s.useMemory || false);
      setPromptHotkeyLocal(s.promptCycleHotkey || "alt+s");
      setIsLoading(false);
    };

    loadState();
  }, []);

  function onUpdateTargets(newTargets: { tweets: number; replies: number }) {
    setLocalTargets(newTargets);
    setTargets(newTargets.tweets, newTargets.replies);
  }

  function onUpdateProvider(newProvider: Provider) {
    setProviderLocal(newProvider);
    setProvider(newProvider);
  }

  function onUpdateApiKey(newKey: string) {
    setApiKey(newKey);
    setOpenRouterApiKey(newKey);
  }

  function onUpdateGoogleApiKey(newKey: string) {
    setGoogleApiKeyLocal(newKey);
    setGoogleApiKey(newKey);
  }

  function onUpdateOpenRouterModel(newModel: string) {
    setOpenRouterModelLocal(newModel);
    setOpenRouterModel(newModel);
  }

  function onUpdateGoogleModel(newModel: string) {
    setGoogleModelLocal(newModel);
    setGoogleModel(newModel);
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

  async function onUpdatePromptHotkey(newHotkey: string) {
    setPromptHotkeyLocal(newHotkey);
    await setPromptCycleHotkey(newHotkey);
    // Notify content scripts of the hotkey change
    try {
      const tabs = await browser.tabs.query({});
      for (const tab of tabs) {
        if (tab.id && tab.url?.includes("x.com")) {
          browser.tabs.sendMessage(tab.id, { type: "hotkeyChanged", hotkey: newHotkey }).catch(() => { });
        }
      }
    } catch (e) {
      // Ignore errors
    }
  }

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64 text-muted-foreground">
        Loading...
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Targets Section */}
      <div className="space-y-3 bg-secondary/50 p-3 border border-border rounded-xl">
        <div className="px-1">
          <h3 className="font-medium text-muted-foreground text-xs uppercase tracking-wider">
            Daily Targets
          </h3>
        </div>
        <div className="gap-3 grid grid-cols-2">
          <div className="space-y-1">
            <label className="text-muted-foreground text-xs">Tweets</label>
            <Input
              type="number"
              value={targets.tweets}
              onChange={(e) =>
                onUpdateTargets({ ...targets, tweets: Number(e.target.value) })
              }
              className="bg-background border-border h-9"
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
              className="bg-background border-border h-9"
            />
          </div>
        </div>
      </div>

      {/* AI Provider Section */}
      <div className="space-y-3 bg-secondary/50 p-3 border border-border rounded-xl">
        <div className="px-1">
          <h3 className="font-medium text-muted-foreground text-xs uppercase tracking-wider">
            AI Provider
          </h3>
        </div>

        <div className="space-y-1">
          <label className="text-muted-foreground text-xs">Provider</label>
          <Select
            value={provider}
            onValueChange={(value) => onUpdateProvider(value as Provider)}
          >
            <SelectTrigger className="bg-background border-border h-9 w-full">
              <SelectValue placeholder="Select provider" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="openrouter">OpenRouter</SelectItem>
              <SelectItem value="google">Google AI</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {provider === "openrouter" && (
          <>
            <div className="space-y-1">
              <label className="text-muted-foreground text-xs">
                OpenRouter API Key
              </label>
              <Input
                type="text"
                value={apiKey}
                onChange={(e) => onUpdateApiKey(e.target.value)}
                className="bg-background border-border h-9"
                placeholder="sk-or-..."
              />
            </div>
            <div className="space-y-1">
              <label className="text-muted-foreground text-xs">
                OpenRouter Model
              </label>
              <Input
                type="text"
                value={openRouterModel}
                onChange={(e) => onUpdateOpenRouterModel(e.target.value)}
                className="bg-background border-border h-9"
                placeholder="moonshotai/kimi-k2:free"
              />
            </div>
          </>
        )}

        {provider === "google" && (
          <>
            <div className="space-y-1">
              <label className="text-muted-foreground text-xs">
                Google API Key
              </label>
              <Input
                type="text"
                value={googleApiKey}
                onChange={(e) => onUpdateGoogleApiKey(e.target.value)}
                className="bg-background border-border h-9"
                placeholder="AIza..."
              />
            </div>
            <div className="space-y-1">
              <label className="text-muted-foreground text-xs">
                Google Model
              </label>
              <Input
                type="text"
                value={googleModel}
                onChange={(e) => onUpdateGoogleModel(e.target.value)}
                className="bg-background border-border h-9"
                placeholder="gemini-3-flash-preview"
              />
            </div>
          </>
        )}

        <div className="flex justify-between items-center py-1">
          <label className="text-muted-foreground text-xs">
            Image Understanding
          </label>
          <Switch
            checked={useImageUnderstanding}
            onCheckedChange={onUpdateUseImageUnderstanding}
          />
        </div>
      </div>

      {/* Hotkeys Section */}
      <div className="space-y-3 bg-secondary/50 p-3 border border-border rounded-xl">
        <div className="px-1">
          <h3 className="font-medium text-muted-foreground text-xs uppercase tracking-wider">
            Hotkeys
          </h3>
        </div>
        <div className="space-y-1">
          <label className="text-muted-foreground text-xs">
            Cycle System Prompt
          </label>
          <Input
            type="text"
            value={promptHotkey}
            onChange={(e) => onUpdatePromptHotkey(e.target.value)}
            className="bg-background border-border h-9"
            placeholder="alt+s"
          />
          <p className="text-muted-foreground text-[10px]">
            Use format: ctrl+k, alt+s, shift+p, etc.
          </p>
        </div>
      </div>
    </div>
  );
}
