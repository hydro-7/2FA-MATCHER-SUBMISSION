import { useRef, useState } from "react";
import { Empty } from "./ui";

const EXIT_MS = 260;

export function SwipeDeck({ matches, renderCard, onRequest, busy }) {
  const [index, setIndex] = useState(0);
  const [drag, setDrag] = useState(0);
  const [exit, setExit] = useState("");
  const [dragging, setDragging] = useState(false);
  const start = useRef(null);
  const match = matches[index];
  const canRequest = match && !match.myRequestStatus && match.seatsLeft > 0;

  // Fly the card out, then skip or request and show the next card.
  function leave(direction) {
    if (exit || busy || (direction === "right" && !canRequest)) return;
    setExit(direction);
    setTimeout(() => {
      if (direction === "right") onRequest(match);
      setIndex((value) => value + 1);
      setExit("");
      setDrag(0);
    }, EXIT_MS);
  }

  function release(event) {
    if (start.current) {
      const dx = event.clientX - start.current.x;
      const dy = event.clientY - start.current.y;
      if (Math.abs(dx) > 90 && Math.abs(dx) > Math.abs(dy) && (dx < 0 || canRequest)) {
        start.current = null;
        setDragging(false);
        return leave(dx < 0 ? "left" : "right");
      }
    }
    start.current = null;
    setDragging(false);
    setDrag(0);
  }

  if (!match)
    return (
      <Empty title="You’re all caught up">
        <p>Switch to List or revisit the cards.</p>
        <button className="secondary" onClick={() => setIndex(0)}>
          Revisit cards
        </button>
      </Empty>
    );
  return (
    <div
      className="swipe-area"
      aria-label="Swipe group discovery"
      onPointerDown={(event) => {
        if (
          busy ||
          event.target.closest("button,a,input,select") ||
          event.button !== 0
        )
          return;
        if (exit) return;
        start.current = { x: event.clientX, y: event.clientY };
        setDragging(true);
        event.currentTarget.setPointerCapture(event.pointerId);
      }}
      onPointerMove={(event) => {
        if (!start.current) return;
        const dx = event.clientX - start.current.x;
        const dy = event.clientY - start.current.y;
        if (Math.abs(dx) > Math.abs(dy))
          setDrag(Math.max(-150, Math.min(150, dx)));
      }}
      onPointerUp={release}
      onPointerCancel={() => {
        start.current = null;
        setDragging(false);
        setDrag(0);
      }}
    >
      <div
        key={index}
        className={`swipe-card ${dragging ? "dragging" : ""} ${exit ? `exit-${exit}` : ""}`}
        style={exit ? undefined : { transform: `translateX(${drag}px) rotate(${drag / 25}deg)` }}
      >
        {(Math.abs(drag) > 25 || exit) && (
          <span className={`swipe-stamp ${drag > 0 || exit === "right" ? "yes" : "no"}`}>
            {drag > 0 || exit === "right" ? (canRequest ? "LET’S GO" : "REQUEST EXISTS") : "PASS"}
          </span>
        )}
        {renderCard(match)}
      </div>
      <div className="swipe-actions">
        <button
          className="secondary"
          disabled={busy || Boolean(exit)}
          onClick={() => leave("left")}
        >
          × Skip
        </button>
        <button disabled={busy || !canRequest || Boolean(exit)} onClick={() => leave("right")}>
          {busy
            ? "Sending…"
            : match.myRequestStatus
              ? `${match.myRequestStatus.toLowerCase()} request`
              : "♡ Express interest"}
        </button>
      </div>
      <p className="caption">
        {index + 1} of {matches.length} · Swipe left to skip, right to request.
        Buttons work too.
      </p>
    </div>
  );
}
