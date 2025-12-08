import { Card, CardContent } from "@/components/ui/card";
import { Clock } from "lucide-react";
import { formatTime } from "@/lib/utils";

interface TimeStatProps {
  seconds: number;
}

export function TimeStat({ seconds }: TimeStatProps) {
  return (
    <Card className="bg-card border-border">
      <CardContent className="flex justify-between items-center p-4">
        <div className="flex items-center gap-2 text-muted-foreground">
          <Clock className="w-4 h-4" />
          <span className="font-medium text-sm">Time on X</span>
        </div>
        <div className="font-mono font-bold text-primary text-lg">
          {formatTime(seconds)}
        </div>
      </CardContent>
    </Card>
  );
}
