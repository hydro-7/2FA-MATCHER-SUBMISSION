import { Link, useSearchParams } from "react-router";
import { Bell, CalendarDays, CircleCheck, Crown, Eye, Hourglass, Layers, MapPin, Moon, Plus, Search, Users, XCircle } from "lucide-react";
import { CITY_PHOTOS, HERO_PHOTO, MY_TRIP_TABS } from "../constants/app";
import { ROUTES } from "../config/routes";
import { formatDates, labelOf, nightsBetween } from "../lib/format";
import { useResource } from "../hooks/useResource";
import { groupService } from "../services/groupService";
import { requestService } from "../services/requestService";
import { RemoteState } from "../components/ui";

const TAB_ICONS = { all: Layers, created: Users, joined: CircleCheck, requests: Bell };
const REQUEST_ICONS = { PENDING: Hourglass, REJECTED: XCircle };

export function MyTrips() {
  const [params, setParams] = useSearchParams();
  const groups = useResource(groupService.mine, "my-groups");
  const requests = useResource(requestService.mine, "my-requests");
  const tab = MY_TRIP_TABS.some((item) => item.id === params.get("tab")) ? params.get("tab") : MY_TRIP_TABS[0].id;

  const mine = groups.data ?? [];
  const created = mine.filter((group) => group.role === "OWNER");
  const joined = mine.filter((group) => group.role !== "OWNER");
  const incoming = created.filter((group) => group.pendingRequestCount > 0);
  const outgoing = (requests.data ?? []).filter((request) => request.status !== "APPROVED");
  const counts = { all: mine.length, created: created.length, joined: joined.length, requests: incoming.length + outgoing.length };
  const rows = { all: mine, created, joined }[tab];

  return (
    <div className="trips-page">
      <h1>My Trips</h1>
      <p className="trips-sub">Track and manage your travel plans in one place.</p>
      <div className="trip-tabs" role="tablist">
        {MY_TRIP_TABS.map((item) => {
          const Icon = TAB_ICONS[item.id];
          return (
            <button
              key={item.id}
              type="button"
              role="tab"
              aria-selected={tab === item.id}
              className={tab === item.id ? "active" : ""}
              onClick={() => setParams(item.id === MY_TRIP_TABS[0].id ? {} : { tab: item.id }, { replace: true })}
            >
              <Icon size={20} /> {item.label} ({counts[item.id]})
            </button>
          );
        })}
      </div>

      <RemoteState resource={tab === "requests" ? requests : groups} />
      <div className="trip-list">
        {rows?.map((group) => (
          <TripRow key={group.id} group={group}>
            {group.role === "OWNER" ? (
              <span className="trip-chip green">
                <Crown size={16} /> Created by you
              </span>
            ) : (
              <span className="trip-chip blue">
                <CircleCheck size={16} /> Joined
              </span>
            )}
            {group.status === "BOOKED" && <span className="trip-chip green">Stay booked</span>}
            <TripActions>
              {group.pendingRequestCount > 0 && (
                <Link className="trip-btn primary" to={ROUTES.GROUP_TAB(group.id, "requests")}>
                  Respond ({group.pendingRequestCount})
                </Link>
              )}
              <Link className="trip-btn" to={ROUTES.GROUP(group.id)}>
                <Eye size={18} /> View Trip
              </Link>
            </TripActions>
          </TripRow>
        ))}

        {tab === "requests" &&
          incoming.map((group) => (
            <TripRow key={`in-${group.id}`} group={group}>
              <span className="trip-chip orange">
                <Hourglass size={16} /> {group.pendingRequestCount} join {group.pendingRequestCount === 1 ? "request" : "requests"}
              </span>
              <TripActions>
                <Link className="trip-btn" to={ROUTES.GROUP(group.id)}>
                  View Details
                </Link>
                <Link className="trip-btn primary" to={ROUTES.GROUP_TAB(group.id, "requests")}>
                  Respond
                </Link>
              </TripActions>
            </TripRow>
          ))}

        {tab === "requests" &&
          outgoing.map((request) => {
            const Icon = REQUEST_ICONS[request.status] ?? Hourglass;
            return (
              <TripRow key={request.id} group={{ ...request.group, id: request.groupId }}>
                <span className={`trip-chip ${request.status === "REJECTED" ? "red" : "orange"}`}>
                  <Icon size={16} /> Your request: {labelOf("requestStatus", request.status)}
                </span>
                <TripActions>
                  <Link className="trip-btn" to={ROUTES.GROUP(request.groupId)}>
                    View Details
                  </Link>
                </TripActions>
              </TripRow>
            );
          })}

        {groups.data && counts[tab] === 0 && (
          <div className="results-empty">
            <p>{tab === "requests" ? "No open requests. Requests you send or receive show up here." : "No trips here yet."}</p>
            <div className="empty-actions">
              <Link className="trip-btn" to={ROUTES.DISCOVER}>
                <Search size={18} /> Find a group
              </Link>
              <Link className="trip-btn primary" to={ROUTES.NEW_GROUP}>
                <Plus size={18} /> Create a trip
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function TripRow({ group, children }) {
  return (
    <article className="trip-row">
      <Link to={ROUTES.GROUP(group.id)} className="trip-photo" style={{ backgroundImage: `url("${CITY_PHOTOS[group.city] ?? HERO_PHOTO.SRC}")` }} aria-label={group.name} />
      <div className="trip-info">
        <h3>{group.name}</h3>
        <div className="match-meta">
          <span>
            <MapPin size={16} /> {group.city}
          </span>
          <span>
            <CalendarDays size={16} /> {formatDates(group.checkIn, group.checkOut)}
          </span>
          <span>
            <Moon size={16} /> {nightsBetween(group.checkIn, group.checkOut)} nights
          </span>
          {group.memberCount !== undefined && (
            <span>
              <Users size={16} /> {group.memberCount} of {group.maxSize}
            </span>
          )}
        </div>
      </div>
      {children}
    </article>
  );
}

function TripActions({ children }) {
  return <div className="trip-actions">{children}</div>;
}
