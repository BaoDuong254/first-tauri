import { useEffect, useState } from "react";
import { listen } from "@tauri-apps/api/event";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

type SystemStats = { cpu_usage: number; mem_used: number; mem_total: number };

const toGB = (bytes: number) => bytes / 1024 ** 3;

function Bar({ percent }: { percent: number }) {
  return (
    <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
      <div
        className="h-full bg-primary transition-[width] duration-500"
        style={{ width: `${Math.min(percent, 100)}%` }}
      />
    </div>
  );
}

function SystemMonitor() {
  const [stats, setStats] = useState<SystemStats | null>(null);

  useEffect(() => {
    const unlisten = listen<SystemStats>("system-stats", (e) =>
      setStats(e.payload),
    );
    return () => {
      unlisten.then((f) => f());
    };
  }, []);

  const memPercent = stats ? (stats.mem_used / stats.mem_total) * 100 : 0;

  return (
    <Card>
      <CardHeader>
        <CardTitle>System Monitor</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        {stats ? (
          <>
            <div className="flex flex-col gap-1">
              <div className="flex justify-between text-sm">
                <span>CPU</span>
                <span className="text-muted-foreground">
                  {stats.cpu_usage.toFixed(1)}%
                </span>
              </div>
              <Bar percent={stats.cpu_usage} />
            </div>
            <div className="flex flex-col gap-1">
              <div className="flex justify-between text-sm">
                <span>RAM</span>
                <span className="text-muted-foreground">
                  {toGB(stats.mem_used).toFixed(1)} /{" "}
                  {toGB(stats.mem_total).toFixed(1)} GB
                </span>
              </div>
              <Bar percent={memPercent} />
            </div>
          </>
        ) : (
          <p className="text-sm text-muted-foreground">Đang đo...</p>
        )}
      </CardContent>
    </Card>
  );
}

export default SystemMonitor;
