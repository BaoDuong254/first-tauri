import { useState } from "react";
import { Channel, invoke } from "@tauri-apps/api/core";
import { open } from "@tauri-apps/plugin-dialog";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

type HashProgress = { processed: number; total: number };

function HashCard() {
  const [percent, setPercent] = useState<number | null>(null);
  const [hash, setHash] = useState("");

  async function pickAndHash() {
    const path = await open({ multiple: false, directory: false });
    if (typeof path !== "string") return;

    setHash("");
    setPercent(0);

    const onProgress = new Channel<HashProgress>();
    onProgress.onmessage = ({ processed, total }) =>
      setPercent(total ? (processed / total) * 100 : 100);

    const result = await invoke<string>("hash_file", { path, onProgress });
    setHash(result);
    setPercent(null);
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>File Hasher (SHA-256)</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <Button onClick={pickAndHash}>Chọn file để hash</Button>
        {percent !== null && (
          <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
            <div
              className="h-full bg-primary transition-[width]"
              style={{ width: `${percent}%` }}
            />
          </div>
        )}
        {hash && (
          <p className="break-all font-mono text-xs text-muted-foreground">
            {hash}
          </p>
        )}
      </CardContent>
    </Card>
  );
}

export default HashCard;
