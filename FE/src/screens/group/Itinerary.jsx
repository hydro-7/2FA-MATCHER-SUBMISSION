import { useState } from "react";
import { Link, useOutletContext } from "react-router";
import { CalendarDays, Clock, MapPin, Navigation, Sparkles } from "lucide-react";
import { ROUTES } from "../../config/routes";
import { formatClock } from "../../lib/format";
import { parseItinerary, placesFromText } from "../../lib/itinerary";

const mapsSearch = (text, city) => `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${text}, ${city}`)}`;

export function Itinerary() {
  const { group, isMember } = useOutletContext();
  const plan = parseItinerary(group.itinerary);
  const [active, setActive] = useState(0);
  const day = plan.days[Math.min(active, plan.days.length - 1)];
  const places = plan.days.length ? [] : placesFromText(plan.summary);

  return (
    <section className="itin">
      <header className="itin-head">
        <div>
          <h2>Trip itinerary</h2>
          {/* A trip written as a list of places shows that list below instead of repeating it here. */}
          {plan.summary && !places.length && <p>{plan.summary}</p>}
        </div>
        {isMember && (
          <Link className="itin-map-link" to={ROUTES.GROUP_TAB(group.id, "map")} replace>
            <MapPin size={16} /> See it on the map
          </Link>
        )}
      </header>

      {(plan.style || plan.rules.length > 0) && (
        <div className="itin-notes">
          {plan.style && (
            <span className="itin-style">
              <Sparkles size={15} /> {plan.style}
            </span>
          )}
          {plan.rules.map((rule) => (
            <span key={rule} className="rule-chip">
              {rule}
            </span>
          ))}
        </div>
      )}

      {day ? (
        <div className="itin-body">
          <nav className="itin-days" aria-label="Days">
            {plan.days.map((item, index) => (
              <button key={item.number} type="button" className={item === day ? "active" : ""} aria-pressed={item === day} onClick={() => setActive(index)}>
                <span className="itin-day-num">{item.number}</span>
                <span>
                  <strong>{item.title || `Day ${item.number}`}</strong>
                  <small>
                    {item.date} · {item.items.length ? `${item.items.length} plan${item.items.length === 1 ? "" : "s"}` : "free day"}
                  </small>
                </span>
              </button>
            ))}
          </nav>
          <div className="itin-day">
            <h3>
              <CalendarDays size={20} /> Day {day.number}
              <small>{day.date}</small>
            </h3>
            {day.title && <p className="itin-day-title">{day.title}</p>}
            {day.items.length ? (
              <ol className="itin-timeline">
                {day.items.map((item, index) => (
                  <li key={index}>
                    <span className="itin-time">{item.time ? formatClock(item.time) : "Anytime"}</span>
                    <span className="itin-dot" aria-hidden="true" />
                    <div className="itin-stop">
                      <strong>{item.text}</strong>
                      <a href={mapsSearch(item.text, group.city)} target="_blank" rel="noreferrer">
                        <Navigation size={13} /> Open in Google Maps
                      </a>
                    </div>
                  </li>
                ))}
              </ol>
            ) : (
              <p className="itin-empty">
                <Clock size={18} /> Free day. Nothing planned yet.
              </p>
            )}
          </div>
        </div>
      ) : (
        places.length > 0 && (
          <div className="itin-places">
            <h3>Places on this trip</h3>
            <ul>
              {places.map((place, index) => (
                <li key={place.text}>
                  <span className="itin-day-num">{index + 1}</span>
                  <strong>{place.text}</strong>
                  <a href={mapsSearch(place.text, group.city)} target="_blank" rel="noreferrer" aria-label={`Open ${place.text} in Google Maps`}>
                    <Navigation size={15} />
                  </a>
                </li>
              ))}
            </ul>
            <p className="muted-line">The organiser wrote this trip without a day-by-day plan.</p>
          </div>
        )
      )}
    </section>
  );
}
