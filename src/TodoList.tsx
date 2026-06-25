import { useEffect, useState } from "react";
import { invoke } from "@tauri-apps/api/core";
import { Plus, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";

type Todo = { id: number; text: string; done: boolean };

function TodoList() {
  const [todos, setTodos] = useState<Todo[]>([]);
  const [input, setInput] = useState("");

  useEffect(() => {
    invoke<Todo[]>("list_todos").then(setTodos);
  }, []);

  async function addTodo() {
    const text = input.trim();
    if (!text) return;
    const created = await invoke<Todo>("add_todo", { text });
    setTodos((prev) => [...prev, created]);
    setInput("");
  }

  async function toggle(id: number) {
    await invoke("toggle_todo", { id });
    setTodos((prev) =>
      prev.map((t) => (t.id === id ? { ...t, done: !t.done } : t)),
    );
  }

  async function remove(id: number) {
    await invoke("delete_todo", { id });
    setTodos((prev) => prev.filter((t) => t.id !== id));
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Todos</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <form
          className="flex gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            addTodo();
          }}
        >
          <Input
            value={input}
            onChange={(e) => setInput(e.currentTarget.value)}
            placeholder="Add a todo..."
          />
          <Button type="submit" size="icon" aria-label="Add todo">
            <Plus />
          </Button>
        </form>

        {todos.length === 0 ? (
          <p className="text-sm text-muted-foreground">Chưa có todo nào.</p>
        ) : (
          <ul className="flex flex-col gap-1">
            {todos.map((todo) => (
              <li
                key={todo.id}
                className="flex items-center gap-3 rounded-md px-2 py-1.5 hover:bg-muted/50"
              >
                <Checkbox
                  checked={todo.done}
                  onCheckedChange={() => toggle(todo.id)}
                  id={`todo-${todo.id}`}
                />
                <label
                  htmlFor={`todo-${todo.id}`}
                  className={
                    "flex-1 cursor-pointer text-sm " +
                    (todo.done ? "text-muted-foreground line-through" : "")
                  }
                >
                  {todo.text}
                </label>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  aria-label="Delete todo"
                  onClick={() => remove(todo.id)}
                >
                  <X />
                </Button>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}

export default TodoList;
