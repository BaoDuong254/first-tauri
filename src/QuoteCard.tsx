import { useState } from "react";
import { invoke } from "@tauri-apps/api/core";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

type Quote = { text: string; author: string };

function QuoteCard() {
  const [quote, setQuote] = useState<Quote | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      setQuote(await invoke<Quote>("fetch_quote"));
    } catch (e) {
      setError(String(e));
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Quote of the moment</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        {quote && (
          <blockquote className="border-l-2 pl-3 text-sm">
            "{quote.text}"
            <footer className="mt-1 text-muted-foreground">
              - {quote.author}
            </footer>
          </blockquote>
        )}
        {error && <p className="text-sm text-destructive">{error}</p>}
        <Button onClick={load} disabled={loading}>
          {loading ? "Loading..." : "New quote"}
        </Button>
      </CardContent>
    </Card>
  );
}

export default QuoteCard;
