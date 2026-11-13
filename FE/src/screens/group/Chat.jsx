import { useEffect, useRef, useState } from "react";
import { useSearchParams } from "react-router";
import { Maximize2, MessageCircle, Minimize2, Send, X } from "lucide-react";
import { CHAT_POLL_MS, LIMITS } from "../../constants/app";
import { formatTime } from "../../lib/format";
import { messageService } from "../../services/messageService";
import { useSession } from "../../store/session";
import { Empty, Notice } from "../../components/ui";

const mergeById = (current, incoming) => {
  const known = new Set(current.map((message) => message.id));
  return [
    ...current,
    ...incoming.filter((message) => !known.has(message.id)),
  ].sort(
    (a, b) =>
      a.createdAt.localeCompare(b.createdAt) || a.id.localeCompare(b.id),
  );
};

export function ChatPopup({ group }) {
  const [params, setParams] = useSearchParams();
  const [open, setOpen] = useState(params.get("chat") === "open");
  const [expanded, setExpanded] = useState(false);
  const launcher = useRef(null);
  const popup = useRef(null);

  useEffect(() => {
    if (params.get("chat") === "open") setOpen(true);
  }, [params]);

  function close() {
    setOpen(false);
    setExpanded(false);
    if (params.has("chat")) {
      const next = new URLSearchParams(params);
      next.delete("chat");
      setParams(next, { replace: true });
    }
    launcher.current?.focus();
  }

  useEffect(() => {
    if (!open) return;
    const escape = (event) => {
      if (document.querySelector("dialog[open]")) return;
      if (event.key === "Escape") {
        if (expanded) setExpanded(false);
        else close();
      }
      if (expanded && event.key === "Tab") {
        const controls = popup.current?.querySelectorAll('button:not(:disabled), input:not(:disabled)');
        if (!controls?.length) return;
        const first = controls[0];
        const last = controls[controls.length - 1];
        if (event.shiftKey && document.activeElement === first) {
          event.preventDefault();
          last.focus();
        } else if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault();
          first.focus();
        }
      }
    };
    document.addEventListener("keydown", escape);
    return () => document.removeEventListener("keydown", escape);
  }, [open, params, expanded]);

  useEffect(() => {
    if (!expanded) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = previous; };
  }, [expanded]);

  return (
    <aside className={`chat-widget${expanded ? " is-expanded" : ""}`}>
      {open && (
        <div ref={popup} id="group-chat-popup" className="chat-popup" role="dialog" aria-modal={expanded || undefined} aria-label={`Group chat: ${group.name}`}>
          <Chat group={group} onClose={close} expanded={expanded} onExpand={() => setExpanded((value) => !value)} />
        </div>
      )}
      <button
        ref={launcher}
        className="chat-launcher"
        aria-expanded={open}
        aria-controls={open ? "group-chat-popup" : undefined}
        onClick={() => open ? close() : setOpen(true)}
      >
        {open ? <X size={20} /> : <MessageCircle size={21} />}
        {open ? "Close chat" : "Group chat"}
      </button>
    </aside>
  );
}

function Chat({ group, onClose, expanded, onExpand }) {
  const userId = useSession((state) => state.userId);
  const isMember = group.members.some((member) => member.id === userId);
  const [messages, setMessages] = useState([]);
  const [draft, setDraft] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const lastSeen = useRef(undefined);

  function receive(batch, advancePollCursor = false) {
    if (!batch.length) return;
    const newest = batch.at(-1).createdAt;
    if (advancePollCursor && (!lastSeen.current || newest > lastSeen.current))
      lastSeen.current = newest;
    setMessages((current) => mergeById(current, batch));
  }

  useEffect(() => {
    setMessages([]);
    setError("");
    setLoading(true);
    lastSeen.current = undefined;
    if (!isMember) return;
    let active = true;
    const poll = () =>
      messageService
        .list(group.id, lastSeen.current)
        .then((batch) => {
          if (active) {
            receive(batch, true);
            setError("");
          }
        })
        .catch((failure) => active && setError(failure.message))
        .finally(() => active && setLoading(false));
    poll();
    const timer = setInterval(poll, CHAT_POLL_MS);
    return () => {
      active = false;
      clearInterval(timer);
    };
  }, [group.id, isMember, userId]);

  async function send(event) {
    event.preventDefault();
    setBusy(true);
    setError("");
    try {
      receive([await messageService.post(group.id, draft.trim())]);
      setDraft("");
    } catch (failure) {
      setError(failure.message);
    } finally {
      setBusy(false);
    }
  }

  if (!isMember) return <Empty title="Only group members can chat" />;
  return (
    <section className="panel group-chat">
      <header className="chat-header">
        <span className="chat-header-icon"><MessageCircle size={23} /></span>
        <div>
          <h2>Group chat</h2>
          <p>{group.name}</p>
        </div>
        <button type="button" className="chat-close" aria-label={expanded ? "Reduce chat size" : "Expand chat"} title={expanded ? "Reduce chat size" : "Expand chat"} onClick={onExpand}>
          {expanded ? <Minimize2 size={18} /> : <Maximize2 size={18} />}
        </button>
        <button type="button" className="chat-close" aria-label="Close group chat" onClick={onClose}><X size={20} /></button>
      </header>
      <div className="chat-log">
        {loading && (
          <p role="status" className="muted">
            Loading messages…
          </p>
        )}
        {!loading && messages.length === 0 && (
          <div className="chat-empty">
            <MessageCircle size={30} />
            <strong>Your next adventure starts with hello</strong>
            <p>Send the first message to your travel group.</p>
          </div>
        )}
        {messages.map((message) => (
          <div
            key={message.id}
            className={`chat-message ${message.author.id === userId ? "mine" : ""}`}
          >
            <small>
              <strong>{message.author.id === userId ? "You" : message.author.name}</strong>
              <time dateTime={message.createdAt}>{formatTime(message.createdAt)}</time>
            </small>
            <p>{message.body}</p>
          </div>
        ))}
      </div>
      <Notice error>{error}</Notice>
      <form className="chat-form" onSubmit={send}>
        <input
          required
          maxLength={LIMITS.MESSAGE}
          placeholder="Write a message"
          aria-label="Write a message"
          autoFocus
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
        />
        <button disabled={busy || !draft.trim()}><Send size={18} /> {busy ? "Sending…" : "Send"}</button>
      </form>
    </section>
  );
}
