import { useEffect, useState } from "react";
import { invoke } from "@tauri-apps/api/core";
import { listen } from "@tauri-apps/api/event";
import { toast } from "sonner";
import { Check, Pencil, Plus, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";

type Note = {
  id: number;
  title: string;
  body: string;
  createdAt: number;
  updatedAt: number;
};

function NotesCard() {
  const [notes, setNotes] = useState<Note[]>([]);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");

  const [editingId, setEditingId] = useState<number | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editBody, setEditBody] = useState("");

  useEffect(() => {
    function reload() {
      invoke<Note[]>("list_notes")
        .then(setNotes)
        .catch((e) => toast.error(String(e)));
    }
    reload();
    const unlisten = listen("note-added", reload);
    return () => {
      unlisten.then((fn) => fn());
    };
  }, []);

  async function addNote() {
    const t = title.trim();
    if (!t) return;
    try {
      const created = await invoke<Note>("add_note", { title: t, body });
      setNotes((prev) => [created, ...prev]);
      setTitle("");
      setBody("");
    } catch (e) {
      toast.error(String(e));
    }
  }

  function startEdit(note: Note) {
    setEditingId(note.id);
    setEditTitle(note.title);
    setEditBody(note.body);
  }

  function cancelEdit() {
    setEditingId(null);
    setEditTitle("");
    setEditBody("");
  }

  async function saveEdit(id: number) {
    const t = editTitle.trim();
    if (!t) return;
    try {
      await invoke("update_note", { id, title: t, body: editBody });
      setNotes((prev) =>
        prev.map((n) =>
          n.id === id ? { ...n, title: t, body: editBody } : n,
        ),
      );
      cancelEdit();
    } catch (e) {
      toast.error(String(e));
    }
  }

  async function remove(id: number) {
    try {
      await invoke("delete_note", { id });
      setNotes((prev) => prev.filter((n) => n.id !== id));
    } catch (e) {
      toast.error(String(e));
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Notes</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <form
          className="flex flex-col gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            addNote();
          }}
        >
          <div className="flex gap-2">
            <Input
              value={title}
              onChange={(e) => setTitle(e.currentTarget.value)}
              placeholder="Tiêu đề..."
            />
            <Button type="submit" size="icon" aria-label="Add note">
              <Plus />
            </Button>
          </div>
          <textarea
            value={body}
            onChange={(e) => setBody(e.currentTarget.value)}
            placeholder="Nội dung..."
            rows={2}
            className="flex min-h-16 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-xs outline-none placeholder:text-muted-foreground focus-visible:ring-[3px] focus-visible:ring-ring/50"
          />
        </form>

        {notes.length === 0 ? (
          <p className="text-sm text-muted-foreground">Chưa có note nào.</p>
        ) : (
          <ul className="flex flex-col gap-2">
            {notes.map((note) => (
              <li
                key={note.id}
                className="rounded-md border border-border px-3 py-2"
              >
                {editingId === note.id ? (
                  <div className="flex flex-col gap-2">
                    <Input
                      value={editTitle}
                      onChange={(e) => setEditTitle(e.currentTarget.value)}
                      placeholder="Tiêu đề..."
                    />
                    <textarea
                      value={editBody}
                      onChange={(e) => setEditBody(e.currentTarget.value)}
                      placeholder="Nội dung..."
                      rows={2}
                      className="flex min-h-16 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-xs outline-none placeholder:text-muted-foreground focus-visible:ring-[3px] focus-visible:ring-ring/50"
                    />
                    <div className="flex justify-end gap-1">
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        aria-label="Save note"
                        onClick={() => saveEdit(note.id)}
                      >
                        <Check />
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        aria-label="Cancel edit"
                        onClick={cancelEdit}
                      >
                        <X />
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-start gap-3">
                    <div className="flex-1">
                      <p className="text-sm font-medium">{note.title}</p>
                      {note.body && (
                        <p className="whitespace-pre-wrap text-sm text-muted-foreground">
                          {note.body}
                        </p>
                      )}
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      aria-label="Edit note"
                      onClick={() => startEdit(note)}
                    >
                      <Pencil />
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      aria-label="Delete note"
                      onClick={() => remove(note.id)}
                    >
                      <X />
                    </Button>
                  </div>
                )}
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}

export default NotesCard;
