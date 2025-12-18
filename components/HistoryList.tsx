import { History } from "lucide-react";
import { formatTime } from "@/lib/utils";
import type { State } from "@/lib/types";

interface HistoryListProps {
  history: State['history'];
}

export function HistoryList({ history }: HistoryListProps) {
  const historyDates = history ? Object.keys(history).sort().slice(-7).reverse() : [];

  return (
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
                <span className="text-chart-1 text-xs">{history[d].tweets}t</span>
                <span className="text-chart-2 text-xs">{history[d].replies}r</span>
                <span className="w-12 text-muted-foreground text-xs text-right">
                  {formatTime(history[d].seconds)}
                </span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
