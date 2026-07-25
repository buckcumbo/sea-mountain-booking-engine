import React, { useState, useRef, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useAuth } from "@/lib/AuthContext";
import { Button } from "@/components/ui/button";
import { MessageCircle, Send, Loader2, Phone } from "lucide-react";
import { PHONE } from "@/lib/contact";

// "Ask about this home" — chat with the home_concierge agent, scoped to this
// listing. The agent has read-only access to Listing/CalendarDay/AreaGuide and
// hard rules against money talk (see base44/agents/home_concierge.jsonc).
// The SDK agents module requires an authenticated user; logged-out visitors
// get a friendly nudge plus the phone path.
const SUGGESTIONS = [
  "How far is the beach?",
  "Where does everyone sleep?",
  "Is it pet-friendly?",
];

export default function AskAboutHome({ listing }) {
  const { isAuthenticated } = useAuth();
  const [open, setOpen] = useState(false);
  const [conversation, setConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const unsubRef = useRef(null);
  const scrollRef = useRef(null);
  const firstMessageSent = useRef(false);

  useEffect(() => {
    return () => {
      if (unsubRef.current) unsubRef.current();
    };
  }, []);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages, sending]);

  const visibleMessages = messages.filter(
    (m) => !m.hidden && (m.role === "user" || m.role === "assistant") && m.content
  );

  const send = async (text) => {
    const question = String(text || "").trim();
    if (!question || sending) return;
    setSending(true);
    setError("");
    setInput("");
    try {
      let conv = conversation;
      if (!conv) {
        conv = await base44.agents.createConversation({
          agent_name: "home_concierge",
          metadata: {
            listing_id: listing.id,
            listing_slug: listing.slug || "",
            listing_title: listing.title || "",
            area: listing.area || "",
          },
        });
        setConversation(conv);
        unsubRef.current = base44.agents.subscribeToConversation(conv.id, (updated) => {
          setMessages(updated.messages || []);
          const last = (updated.messages || []).filter((m) => !m.hidden).slice(-1)[0];
          if (last && last.role === "assistant") setSending(false);
        });
      }
      // Scope the first message to this home so the agent always has context.
      const content = firstMessageSent.current
        ? question
        : `[Guest is asking about: ${listing.title} (slug: ${listing.slug || listing.id})]\n${question}`;
      firstMessageSent.current = true;
      setMessages((prev) => [
        ...prev,
        { id: `local-${Date.now()}`, role: "user", content: question },
      ]);
      await base44.agents.addMessage(conv, { role: "user", content });
    } catch {
      setSending(false);
      setError(`Chat is having a moment — call us instead: ${PHONE}`);
    }
  };

  if (!open) {
    return (
      <div className="bg-card rounded-2xl border border-border shadow-sm p-5">
        <div className="flex items-center gap-2 mb-1">
          <MessageCircle className="w-4 h-4 text-coast-ocean" />
          <h3 className="font-heading text-sm font-semibold text-coast-navy">
            Ask about this home
          </h3>
        </div>
        <p className="text-xs text-muted-foreground mb-3">
          Is the pool heated? How far to the pier? Ask away — instant answers about this exact home.
        </p>
        <Button
          size="sm"
          onClick={() => setOpen(true)}
          className="bg-coast-ocean hover:bg-coast-navy text-white text-xs w-full"
        >
          Start asking
        </Button>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="bg-card rounded-2xl border border-border shadow-sm p-5">
        <div className="flex items-center gap-2 mb-1">
          <MessageCircle className="w-4 h-4 text-coast-ocean" />
          <h3 className="font-heading text-sm font-semibold text-coast-navy">
            Ask about this home
          </h3>
        </div>
        <p className="text-xs text-muted-foreground mb-3">
          Log in to chat — it takes a few seconds. Or skip the typing and call:
        </p>
        <div className="flex flex-col gap-2">
          <Button
            size="sm"
            onClick={() => base44.auth.redirectToLogin(window.location.href)}
            className="bg-coast-ocean hover:bg-coast-navy text-white text-xs"
          >
            Log in to chat
          </Button>
          <Button asChild size="sm" variant="outline" className="border-coast-ocean text-coast-ocean text-xs">
            <a href={`tel:${PHONE.replace(/[^0-9+]/g, "")}`}>
              <Phone className="w-3.5 h-3.5 mr-1.5" /> {PHONE}
            </a>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-card rounded-2xl border border-border shadow-sm p-5 space-y-3">
      <div className="flex items-center gap-2">
        <MessageCircle className="w-4 h-4 text-coast-ocean" />
        <h3 className="font-heading text-sm font-semibold text-coast-navy">
          Ask about this home
        </h3>
      </div>

      <div
        ref={scrollRef}
        className="max-h-72 overflow-y-auto space-y-2 pr-1"
        aria-live="polite"
      >
        {visibleMessages.length === 0 && !sending && (
          <div className="space-y-2">
            <p className="text-xs text-muted-foreground">Try one of these:</p>
            {SUGGESTIONS.map((s) => (
              <button
                key={s}
                onClick={() => send(s)}
                className="block w-full text-left text-xs px-3 py-2 rounded-lg border border-border bg-coast-foam text-coast-navy hover:border-coast-ocean transition-colors"
              >
                {s}
              </button>
            ))}
          </div>
        )}
        {visibleMessages.map((m, i) => (
          <div
            key={m.id || i}
            className={`text-sm rounded-xl px-3 py-2 whitespace-pre-line ${
              m.role === "user"
                ? "bg-coast-navy text-white ml-6"
                : "bg-coast-foam text-coast-navy mr-6"
            }`}
          >
            {typeof m.content === "string" ? m.content : ""}
          </div>
        ))}
        {sending && (
          <div className="bg-coast-foam text-coast-navy mr-6 rounded-xl px-3 py-2 inline-flex items-center gap-2 text-sm">
            <Loader2 className="w-3.5 h-3.5 animate-spin" /> Checking the home…
          </div>
        )}
      </div>

      {error && <p className="text-xs text-destructive">{error}</p>}

      <form
        onSubmit={(e) => {
          e.preventDefault();
          send(input);
        }}
        className="flex gap-2"
      >
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask anything about this home"
          className="flex-1 h-9 rounded-lg border border-border bg-card px-3 text-sm text-coast-navy"
        />
        <Button
          type="submit"
          size="sm"
          disabled={sending || !input.trim()}
          className="bg-coast-ocean hover:bg-coast-navy text-white h-9 px-3"
          aria-label="Send question"
        >
          <Send className="w-4 h-4" />
        </Button>
      </form>
      <p className="text-[10px] text-muted-foreground">
        Instant answers from this home's details. For anything about an existing
        reservation, call {PHONE}.
      </p>
    </div>
  );
}