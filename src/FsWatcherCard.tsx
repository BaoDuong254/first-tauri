import { useEffect, useState } from "react";
import { invoke } from "@tauri-apps/api/core";
import { listen } from "@tauri-apps/api/event";
import { open } from "@tauri-apps/plugin-dialog";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type FsEvent = { kind: string; paths: string[] };

function FsWatcherCard() {
  const [watching, setWatching] = useState(false);
  const [files, setFiles] = useState<string[]>([]);
  const [log, setLog] = useState<FsEvent[]>([]);

  useEffect(() => {
    const unlisten = listen<FsEvent>("fs-event", (e) =>
      setLog((prev) => [e.payload, ...prev].slice(0, 50)),
    );
    return () => {
      unlisten.then((f) => f());
    };
  }, []);

  async function pickAndWatch() {
    const path = await open({ directory: true });
    if (typeof path !== "string") return;
    const initial = await invoke<string[]>("start_watch", { path });
    setFiles(initial);
    setLog([]);
    setWatching(true);
  }

  async function stop() {
    await invoke("stop_watch");
    setWatching(false);
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Folder Watcher</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <div className="flex gap-2">
          <Button onClick={pickAndWatch}>Chọn thư mục</Button>
          {watching && (
            <Button variant="outline" onClick={stop}>
              Dừng
            </Button>
          )}
        </div>
        {files.length > 0 && (
          <p className="text-sm text-muted-foreground">
            {files.length} file ban đầu
          </p>
        )}
        <div className="flex flex-col gap-1 font-mono text-xs">
          {log.map((e, i) => (
            <span key={i} className="text-muted-foreground">
              [{e.kind}] {e.paths[0]}
            </span>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

export default FsWatcherCard;
