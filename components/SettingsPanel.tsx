import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { RotateCcw } from "lucide-react";

interface SettingsPanelProps {
  targets: { tweets: number; replies: number };
  apiKey: string;
  llmModel: string;
  useImageUnderstanding: boolean;
  memoryApiKey: string;
  memoryProjectId: string;
  useMemory: boolean;
  onUpdateTargets: (targets: { tweets: number; replies: number }) => void;
  onUpdateApiKey: (key: string) => void;
  onUpdateLlmModel: (model: string) => void;
  onUpdateUseImageUnderstanding: (enabled: boolean) => void;
  onUpdateMemoryApiKey: (key: string) => void;
  onUpdateMemoryProjectId: (id: string) => void;
  onUpdateUseMemory: (enabled: boolean) => void;
  onReset: () => void;
}

export function SettingsPanel({
  targets,
  apiKey,
  llmModel,
  useImageUnderstanding,
  memoryApiKey,
  memoryProjectId,
  useMemory,
  onUpdateTargets,
  onUpdateApiKey,
  onUpdateLlmModel,
  onUpdateUseImageUnderstanding,
  onUpdateMemoryApiKey,
  onUpdateMemoryProjectId,
  onUpdateUseMemory,
  onReset,
}: SettingsPanelProps) {
  return (
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

        <Separator className="my-2 bg-border/50" />
        <div className="space-y-2">
          <h3 className="font-medium text-muted-foreground text-xs">Memory</h3>
          <div className="space-y-1">
            <label className="text-muted-foreground text-xs">Memory API Key</label>
            <Input
              type="password"
              value={memoryApiKey}
              onChange={(e) => onUpdateMemoryApiKey(e.target.value)}
              className="bg-background border-border h-8"
              placeholder="Supermemory API Key"
            />
          </div>
          <div className="space-y-1">
            <label className="text-muted-foreground text-xs">Project ID</label>
            <Input
              type="text"
              value={memoryProjectId}
              onChange={(e) => onUpdateMemoryProjectId(e.target.value)}
              className="bg-background border-border h-8"
              placeholder="Project ID (Optional)"
            />
          </div>
          <div className="flex justify-between items-center">
            <label className="text-muted-foreground text-xs">Enable Memory</label>
            <Switch checked={useMemory} onCheckedChange={onUpdateUseMemory} />
          </div>
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
  );
}
