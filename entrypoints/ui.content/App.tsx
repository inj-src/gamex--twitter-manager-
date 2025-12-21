import { useEffect, useState, useCallback } from "react";
import { useHotkeys } from "react-hotkeys-hook";
import { toast } from "sonner";
import { Toaster } from "@/components/ui/sonner"

import {
  getState,
  setSelectedPromptId,
} from "@/lib/storage";
import {
  SYSTEM_PROMPT_PRESETS,
  DEFAULT_PROMPT_ID,
} from "@/lib/systemPrompts";

function App() {
  const [hotkey, setHotkey] = useState("alt+s");
  const [currentPromptIndex, setCurrentPromptIndex] = useState(0);

  // Load initial state
  useEffect(() => {
    const loadState = async () => {
      const state = await getState();
      const storedHotkey = state.promptCycleHotkey || "alt+s";
      setHotkey(storedHotkey);

      // Find current prompt index
      const promptId = state.selectedPromptId || DEFAULT_PROMPT_ID;
      const index = SYSTEM_PROMPT_PRESETS.findIndex((p) => p.id === promptId);
      setCurrentPromptIndex(index >= 0 ? index : 0);
    };

    loadState();

    // Listen for hotkey changes from popup
    const handleMessage = (message: any) => {
      if (message?.type === "hotkeyChanged" && message.hotkey) {
        setHotkey(message.hotkey);
      }
      if (message?.type === "stateChanged" && message.state) {
        if (message.state.promptCycleHotkey) {
          setHotkey(message.state.promptCycleHotkey);
        }
        if (message.state.selectedPromptId) {
          const index = SYSTEM_PROMPT_PRESETS.findIndex(
            (p) => p.id === message.state.selectedPromptId
          );
          setCurrentPromptIndex(index >= 0 ? index : 0);
        }
      }
    };

    browser.runtime.onMessage.addListener(handleMessage);
    return () => {
      browser.runtime.onMessage.removeListener(handleMessage);
    };
  }, []);

  const cyclePrompt = useCallback(async () => {
    const nextIndex = (currentPromptIndex + 1) % SYSTEM_PROMPT_PRESETS.length;
    const nextPrompt = SYSTEM_PROMPT_PRESETS[nextIndex];

    setCurrentPromptIndex(nextIndex);
    await setSelectedPromptId(nextPrompt.id);

    toast.success(`Prompt: ${nextPrompt.name}`, {
      description: nextPrompt.description,
      duration: 2500,
    });
  }, [currentPromptIndex]);

  // Register hotkey
  useHotkeys(
    hotkey,
    (e) => {
      e.preventDefault();
      cyclePrompt();
    },
    {
      enableOnFormTags: true,
      enableOnContentEditable: true,
    },
    [hotkey, cyclePrompt]
  );

  // Register hotkey
  useHotkeys(
    "alt",
    (e) => {
      e.preventDefault();
      const currentPrompt = SYSTEM_PROMPT_PRESETS[currentPromptIndex];
      toast.success(`Prompt: ${currentPrompt.name}`, {
        description: currentPrompt.description,
        duration: 2500,
      });
    },
    {
      keydown: true,
      enableOnContentEditable: true,
      enableOnFormTags: true,
    },
    [toast, currentPromptIndex]
  );

  return (
    <div>
      <Toaster />
    </div>

  );
}

export default App;
