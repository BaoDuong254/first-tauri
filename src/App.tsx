import { useEffect, useState } from "react";
import { invoke } from "@tauri-apps/api/core";

import { checkForUpdates } from "./Updater";
import HashCard from "./HashCard";
import QuoteCard from "./QuoteCard";
import SystemMonitor from "./SystemMonitor";
import TodoList from "./TodoList";
import ThemeToggle from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import "./App.css";

function App() {
  const [greetMsg, setGreetMsg] = useState("");
  const [name, setName] = useState("");

  useEffect(() => {
    checkForUpdates({ silent: true });
  }, []);

  async function greet() {
    setGreetMsg(await invoke("greet", { name }));
  }

  return (
    <main className="min-h-screen bg-background text-foreground">
      <div className="mx-auto flex max-w-md flex-col gap-6 px-4 py-8">
        <header className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">first-tauri</h1>
          <ThemeToggle />
        </header>

        <Card>
          <CardHeader>
            <CardTitle>Greet from Rust</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <form
              className="flex gap-2"
              onSubmit={(e) => {
                e.preventDefault();
                greet();
              }}
            >
              <Input
                value={name}
                onChange={(e) => setName(e.currentTarget.value)}
                placeholder="Enter a name..."
              />
              <Button type="submit">Greet</Button>
            </form>
            {greetMsg && (
              <p className="text-sm text-muted-foreground">{greetMsg}</p>
            )}
            <Button
              type="button"
              variant="outline"
              onClick={() => checkForUpdates()}
            >
              Check for updates
            </Button>
          </CardContent>
        </Card>

        <QuoteCard />

        <SystemMonitor />

        <HashCard />

        <TodoList />
      </div>
    </main>
  );
}

export default App;
