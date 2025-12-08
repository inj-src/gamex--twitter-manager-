import React from "react";
import { Progress } from "@/components/ui/progress";

interface StatCardProps {
  icon: React.ReactNode;
  label: string;
  current: number;
  target: number;
  colorClass: string;
}

export function StatCard({
  icon,
  label,
  current,
  target,
  colorClass,
}: StatCardProps) {
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
