import { useState } from "react";
import { invoke } from "@tauri-apps/api/core";
import { getCurrentWebviewWindow } from "@tauri-apps/api/webviewWindow";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";

function QuickNote() {
  const [content, setContent] = useState("");
  const [saving, setSaving] = useState(false);

  async function save() {
    const text = content.trim();
    if (!text || saving) return;
    setSaving(true);
    try {
      await invoke("save_quick_note", { content: text });
    } catch (e) {
      toast.error(String(e));
      setSaving(false);
    }
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      save();
    } else if (e.key === "Escape") {
      e.preventDefault();
      getCurrentWebviewWindow().close();
    }
  }

  return (
    <main className="flex h-screen flex-col gap-3 bg-background p-4 text-foreground">
      <div className="flex items-center justify-between">
        <h1 className="text-sm font-semibold">Quick Note</h1>
        <span className="text-xs text-muted-foreground">Ctrl+Enter để lưu</span>
      </div>
      <textarea
        autoFocus
        value={content}
        onChange={(e) => setContent(e.currentTarget.value)}
        onKeyDown={onKeyDown}
        placeholder="Ghi nhanh... (dòng đầu là tiêu đề)"
        className="flex-1 w-full resize-none rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-xs outline-none placeholder:text-muted-foreground focus-visible:ring-[3px] focus-visible:ring-ring/50"
      />
      <div className="flex justify-end gap-2">
        <Button
          type="button"
          variant="ghost"
          onClick={() => getCurrentWebviewWindow().close()}
        >
          Hủy
        </Button>
        <Button type="button" onClick={save} disabled={saving}>
          Lưu
        </Button>
      </div>
    </main>
  );
}

export default QuickNote;
