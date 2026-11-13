import { useEffect, useMemo, useState } from "react";
import { useNavigate, useOutletContext } from "react-router";
import { MapContainer, Marker, Polyline, TileLayer, Tooltip, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { BedDouble, CalendarDays, Clock, LocateFixed, MapPin, Navigation, Route } from "lucide-react";
import { MAP_CONFIG } from "../../config/map";
import { ROUTES } from "../../config/routes";
import { formatClock, formatMoney } from "../../lib/format";
import { distanceKm } from "../../lib/geo";
import { parseItinerary, placesFromText } from "../../lib/itinerary";
import { useResource } from "../../hooks/useResource";
import { cachedPlace, geocodeCity, geocodePlace } from "../../services/geocodeService";
import { planningService } from "../../services/planningService";

const BED_SVG =
  '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M2 20v-8a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v8"/><path d="M4 10V6a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v4"/><path d="M12 4v6"/><path d="M2 18h20"/></svg>';
const hotelIcon = L.divIcon({ className: "", html: `<span class="map-pin hotel">${BED_SVG}</span>`, iconSize: [40, 48], iconAnchor: [20, 46] });
const optionIcon = L.divIcon({ className: "", html: `<span class="map-pin hotel option">${BED_SVG}</span>`, iconSize: [30, 36], iconAnchor: [15, 34] });
const placeIcon = (number) => L.divIcon({ className: "", html: `<span class="map-pin place">${number}</span>`, iconSize: [32, 40], iconAnchor: [16, 38] });

function FitBounds({ points, fallback }) {
  const map = useMap();
  const key = points.map((point) => `${point.lat},${point.lng}`).join("|");
  useEffect(() => {
    if (points.length > 1) map.fitBounds(points.map((point) => [point.lat, point.lng]), { padding: [60, 60], maxZoom: 15 });
    else if (points.length === 1) map.setView([points[0].lat, points[0].lng], 14);
    else if (fallback) map.setView([fallback.lat, fallback.lng], 12);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, fallback?.lat, fallback?.lng]);
  return null;
}

// Pans to the stop picked in the list below the map.
function FlyTo({ point }) {
  const map = useMap();
  useEffect(() => {
    if (point) map.flyTo([point.lat, point.lng], Math.max(map.getZoom(), 15), { duration: 0.6 });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [point?.lat, point?.lng]);
  return null;
}

const MAPS = "https://www.google.com/maps";
const latLng = (point) => `${point.lat},${point.lng}`;
// Falls back to a text search when the place could not be pinned.
const placeLink = (stop, city) =>
  stop.point ? `${MAPS}/dir/?api=1&destination=${latLng(stop.point)}` : `${MAPS}/search/?api=1&query=${encodeURIComponent(`${stop.text}, ${city}`)}`;
function dayRouteLink(points) {
  if (points.length < 2) return null;
  const params = new URLSearchParams({ api: "1", origin: latLng(points[0]), destination: latLng(points.at(-1)) });
  if (points.length > 2) params.set("waypoints", points.slice(1, -1).map(latLng).join("|"));
  return `${MAPS}/dir/?${params}`;
}

function LocateButton({ points, fallback }) {
  const map = useMap();
  return (
    <button
      type="button"
      className="map-locate"
      aria-label="Fit map to trip"
      onClick={() => (points.length ? map.fitBounds(points.map((p) => [p.lat, p.lng]), { padding: [60, 60], maxZoom: 15 }) : fallback && map.setView([fallback.lat, fallback.lng], 12))}
    >
      <LocateFixed size={20} />
    </button>
  );
}

// Cached places show at once; the rest are looked up one by one once the city is known.
function useCoordinates(days, city, near, ready) {
  const texts = useMemo(() => [...new Set(days.flatMap((day) => day.items.map((item) => item.text)))], [days]);
  const [coords, setCoords] = useState({});
  const textsKey = texts.join("|");
  useEffect(() => {
    let active = true;
    const known = {};
    for (const text of texts) {
      const hit = cachedPlace(text, city);
      if (hit !== undefined) known[text] = hit;
    }
    setCoords(known);
    if (!ready) return;
    (async () => {
      for (const text of texts.filter((item) => !(item in known))) {
        const found = await geocodePlace(text, city, near, () => active);
        if (!active) return;
        if (found !== undefined) setCoords((current) => ({ ...current, [text]: found }));
      }
    })();
    return () => {
      active = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [textsKey, city, ready]);
  return { coords, pending: texts.filter((text) => !(text in coords)).length };
}

export function TripMap() {
  const { group } = useOutletContext();
  const navigate = useNavigate();
  const plan = useMemo(() => parseItinerary(group.itinerary), [group.itinerary]);
  // No day plan: fall back to the places named in the trip description.
  const days = useMemo(
    () => (plan.days.length ? plan.days : [{ number: 1, date: "", title: "", items: placesFromText(plan.summary), fromText: true }].filter((day) => day.items.length)),
    [plan],
  );
  const saved = useResource(() => planningService.saved(group.id), `saved-${group.id}`);
  // Hotels bookable for this trip's dates, shown until the group saves or books one.
  const available = useResource(() => (group.booking ? Promise.resolve(null) : planningService.hotels(group.id)), `map-hotels-${group.id}`);
  const [city, setCity] = useState({ ready: false, point: null });
  const [dayIndex, setDayIndex] = useState(0);
  const [layers, setLayers] = useState({ hotels: true, places: true, route: true });
  const [selected, setSelected] = useState(null);

  useEffect(() => {
    let active = true;
    setCity({ ready: false, point: null });
    geocodeCity(group.city).then((point) => active && setCity({ ready: true, point }));
    return () => {
      active = false;
    };
  }, [group.city]);

  const hotels = useMemo(() => {
    if (group.booking?.lat != null) return [{ id: "booked", name: group.booking.hotelName, area: group.booking.area, lat: group.booking.lat, lng: group.booking.lng, booked: true }];
    const unique = new Map();
    for (const option of saved.data ?? []) {
      if (option.lat != null && !unique.has(option.hotelId)) unique.set(option.hotelId, { id: option.hotelId, name: option.hotelName, area: option.area, lat: option.lat, lng: option.lng });
    }
    if (unique.size) return [...unique.values()];
    for (const option of available.data?.options ?? []) {
      if (option.lat == null) continue;
      const seen = unique.get(option.hotelId);
      // One pin per hotel, labelled with its cheapest room.
      if (!seen || option.perMemberInr < seen.perMemberInr)
        unique.set(option.hotelId, { id: option.hotelId, name: option.hotelName, area: option.area, lat: option.lat, lng: option.lng, perMemberInr: option.perMemberInr, option: true });
    }
    return [...unique.values()];
  }, [group.booking, saved.data, available.data]);
  const hotelKind = group.booking ? "Booked stay" : hotels[0]?.option ? "Available hotels" : "Saved hotels";

  const near = city.point ?? hotels[0] ?? null;
  const { coords, pending } = useCoordinates(days, group.city, city.point, city.ready);
  const day = days[dayIndex];
  // The route starts at the group's own hotel, never at one that is only available.
  const base = hotels[0]?.option ? undefined : hotels[0];
  const dayName = day?.fromText ? "Places in this trip" : `Day ${day?.number}`;

  const stops = (day?.items ?? []).map((item, index) => ({ ...item, number: index + 1, point: coords[item.text] }));
  const located = stops.filter((stop) => stop.point);
  const legs = located.map((stop, index) => {
    const from = index === 0 ? base : located[index - 1].point;
    return { ...stop, km: from && !day.fromText ? distanceKm(from, stop.point) : null };
  });
  // Places read from free text have no order, so no route is drawn through them.
  const route = day?.fromText ? [] : [base, ...located.map((stop) => stop.point)].filter(Boolean);
  const visible = [...(layers.hotels ? hotels : []), ...(layers.places ? located.map((stop) => stop.point) : [])];
  const placeCount = days.reduce((sum, item) => sum + item.items.length, 0);
  const toggle = (key) => setLayers({ ...layers, [key]: !layers[key] });
  const dayKm = legs.reduce((sum, leg) => sum + (leg.km ?? 0), 0);
  const routeLink = dayRouteLink(route);
  const selectedStop = located.find((stop) => stop.number === selected);

  return (
    <div className="trip-map">
      <aside className="ws-card map-panel">
        <div>
          <h3>Trip Map</h3>
          <p className="muted-line">Your stays and planned places in one view.</p>
        </div>
        <ul className="layer-list">
          <li>
            <span className="layer-icon hotel">
              <BedDouble size={18} />
            </span>
            {hotelKind} ({hotels.length})
            <input type="checkbox" aria-label="Show hotels" checked={layers.hotels} onChange={() => toggle("hotels")} />
          </li>
          <li>
            <span className="layer-icon place">
              <MapPin size={18} />
            </span>
            Planned places ({placeCount})
            <input type="checkbox" aria-label="Show places" checked={layers.places} onChange={() => toggle("places")} />
          </li>
          <li>
            <span className="layer-icon route">
              <Route size={18} />
            </span>
            Route
            <input type="checkbox" aria-label="Show route" checked={layers.route} onChange={() => toggle("route")} />
          </li>
        </ul>
        {plan.days.length > 0 && (
          <>
            <h4>View by day</h4>
            <div className="day-select">
              {plan.days.map((item, index) => (
                <button key={item.number} type="button" className={index === dayIndex ? "active" : ""} onClick={() => {
                    setDayIndex(index);
                    setSelected(null);
                  }}
                >
                  <CalendarDays size={17} /> <strong>Day {item.number}</strong> <small>{item.date}</small>
                </button>
              ))}
            </div>
          </>
        )}
        {pending > 0 && <p className="muted-line">Finding {pending} place{pending === 1 ? "" : "s"} on the map…</p>}
      </aside>

      <section className="ws-card map-main">
        <div className="map-frame">
          {!near && !city.ready ? (
            <div className="map-canvas map-loading">Locating {group.city}…</div>
          ) : (
          <MapContainer center={near ? [near.lat, near.lng] : [0, 0]} zoom={near ? 12 : 2} scrollWheelZoom className="map-canvas">
            <TileLayer url={MAP_CONFIG.TILE_URL} attribution={MAP_CONFIG.TILE_ATTRIBUTION} />
            <FitBounds points={visible} fallback={near} />
            {layers.hotels &&
              hotels.map((hotel) => (
                <Marker
                  key={hotel.id}
                  position={[hotel.lat, hotel.lng]}
                  icon={hotel.option ? optionIcon : hotelIcon}
                  eventHandlers={{ click: () => navigate(ROUTES.GROUP_TAB(group.id, "stays")) }}
                >
                  <Tooltip direction="top" offset={[0, hotel.option ? -32 : -44]} className="map-label">
                    {hotel.name}
                    {hotel.booked ? " · booked" : ""}
                    {hotel.option ? ` · from ${formatMoney(hotel.perMemberInr)} each` : ""}
                  </Tooltip>
                </Marker>
              ))}
            {layers.places &&
              located.map((stop) => (
                <Marker
                  key={`${stop.number}-${selected === stop.number}`}
                  position={[stop.point.lat, stop.point.lng]}
                  icon={placeIcon(stop.number)}
                  eventHandlers={{ click: () => setSelected(stop.number) }}
                >
                  {/* Only the picked stop keeps its label open, so labels do not pile up. */}
                  <Tooltip direction="right" offset={[14, -22]} permanent={selected === stop.number} className="map-label">
                    {stop.text}
                  </Tooltip>
                </Marker>
              ))}
            {layers.route && route.length > 1 && (
              <Polyline positions={route.map((point) => [point.lat, point.lng])} pathOptions={{ color: "#0057ff", weight: 3, dashArray: "6 8" }} />
            )}
            <FlyTo point={selectedStop?.point} />
            <LocateButton points={visible} fallback={near} />
          </MapContainer>
          )}
        </div>

        {day && stops.length > 0 && (
          <div className="route-bar">
            <span>
              {dayName}: {located.length} of {stops.length} on the map
              {dayKm > 0 && <> · ≈ {dayKm.toFixed(1)} km straight-line</>}
            </span>
            {routeLink && (
              <a href={routeLink} target="_blank" rel="noreferrer">
                <Navigation size={16} /> Open day route in Google Maps
              </a>
            )}
          </div>
        )}
        {day ? (
          <div className="stop-strip">
            {stops.length === 0 && <p className="muted-line">Nothing planned for {dayName} yet. Add activities when you create the trip.</p>}
            {stops.map((stop) => {
              const leg = legs.find((item) => item.number === stop.number);
              return (
                <article key={stop.number} className={`stop-card ${stop.point ? "" : "off-map"} ${selected === stop.number ? "active" : ""}`}>
                  <button type="button" className="stop-pick" disabled={!stop.point} onClick={() => setSelected(stop.number)} aria-pressed={selected === stop.number}>
                    <strong>
                      <span className="stop-num">{stop.number}</span> {stop.text}
                    </strong>
                    <small>
                      {stop.time && (
                        <>
                          <Clock size={14} /> {formatClock(stop.time)}
                        </>
                      )}
                      {leg?.km != null && <> · ≈ {leg.km.toFixed(1)} km</>}
                      {stop.point === null && " · not found on map"}
                    </small>
                  </button>
                  <a href={placeLink(stop, group.city)} target="_blank" rel="noreferrer">
                    <Navigation size={14} /> {stop.point ? "Directions" : "Search in Google Maps"}
                  </a>
                </article>
              );
            })}
          </div>
        ) : (
          <p className="muted-line">
            This trip names no places yet. {hotels.length > 0 ? "The pins are hotels for your dates: click one to open Hotels." : "Save a hotel in the Hotels tab to see it here."}
          </p>
        )}
      </section>
    </div>
  );
}
