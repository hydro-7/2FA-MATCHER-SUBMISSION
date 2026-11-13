import { useState } from "react";
import { Clock } from "lucide-react";
import { formatClock } from "../lib/format";

export function ItineraryView({ plan, compact = false }) {
  const [active, setActive] = useState(0);
  if (!plan.days.length) return <p className="itinerary-text">{plan.summary}</p>;
  const day = plan.days[Math.min(active, plan.days.length - 1)];
  return (
    <div className={`itinerary-view ${compact ? "compact" : ""}`}>
      <div className="day-chips">
        {plan.days.map((item, index) => (
          <button key={item.number} type="button" className={item === day ? "active" : ""} onClick={() => setActive(index)}>
            <strong>Day {item.number}</strong>
            <small>{item.date}</small>
          </button>
        ))}
      </div>
      <div className="day-plan">
        <h4>{day.title || `Day ${day.number}`}</h4>
        {day.items.length ? (
          <ul>
            {day.items.map((item, index) => (
              <li key={index}>
                <Clock size={16} />
                {item.time && <b>{formatClock(item.time)}</b>}
                <span>{item.text}</span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="muted-line">Free day, nothing planned yet.</p>
        )}
      </div>
    </div>
  );
}
