import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router";
import {
  ArrowUpRight,
  Inbox,
  MapPin,
  RefreshCw,
  Search,
  UserPlus,
  Users,
} from "lucide-react";
import { ROUTES } from "../config/routes";
import { useResource } from "../hooks/useResource";
import { friendService } from "../services/friendService";
import { travellerService } from "../services/travellerService";
import { useSession } from "../store/session";
import { FriendActions } from "../components/FriendActions";
import { Avatar, Empty, RemoteState } from "../components/ui";

const TABS = [
  { id: "friends", label: "Your friends", icon: Users },
  { id: "requests", label: "Requests", icon: Inbox },
  { id: "discover", label: "Find travellers", icon: UserPlus },
];

export function Friends() {
  const userId = useSession((state) => state.userId);
  const [params, setParams] = useSearchParams();
  const [query, setQuery] = useState("");
  const tab = TABS.some((item) => item.id === params.get("tab"))
    ? params.get("tab")
    : "friends";
  const resource = useResource(friendService.list, `friends-${userId}`);
  const people = useResource(
    () => (tab === "discover" ? travellerService.list() : Promise.resolve([])),
    `friend-directory-${userId}-${tab}`,
  );
  const { friends = [], incoming = [], outgoing = [] } = resource.data ?? {};
  const relationships = new Map([
    ...friends.map((item) => [
      item.traveller.id,
      { status: "FRIENDS", requestId: item.id },
    ]),
    ...incoming.map((item) => [
      item.traveller.id,
      { status: "INCOMING", requestId: item.id },
    ]),
    ...outgoing.map((item) => [
      item.traveller.id,
      { status: "OUTGOING", requestId: item.id },
    ]),
  ]);
  const matches = (person) =>
    `${person.name} ${person.homeCity}`
      .toLowerCase()
      .includes(query.trim().toLowerCase());

  // Keep requests current when another traveller responds in a separate session.
  useEffect(() => {
    const refresh = () => {
      if (!document.hidden) resource.reload();
    };
    const timer = window.setInterval(refresh, 15000);
    window.addEventListener("focus", refresh);
    return () => {
      window.clearInterval(timer);
      window.removeEventListener("focus", refresh);
    };
  }, [userId]);

  function card(person) {
    return (
      <article className="friend-card" key={person.id}>
        <Link className="friend-person" to={ROUTES.TRAVELLER(person.id)}>
          <Avatar person={person} large />
          <div>
            <h3>{person.name}</h3>
            <p>
              <MapPin size={14} /> {person.homeCity}
            </p>
          </div>
        </Link>
        <FriendActions
          person={person}
          relationship={
            relationships.get(person.id) ?? { status: "NONE", requestId: null }
          }
          onChange={resource.reload}
          disabled={resource.loading}
        />
        {relationships.get(person.id)?.status === "FRIENDS" && (
          <Link
            className="friend-profile-link"
            to={ROUTES.TRAVELLER(person.id)}
          >
            View groups <ArrowUpRight size={16} />
          </Link>
        )}
      </article>
    );
  }

  const visibleFriends = friends.filter((item) => matches(item.traveller));
  const visiblePeople = (people.data ?? []).filter(
    (person) => person.id !== userId && matches(person),
  );
  return (
    <section className="friends-page">
      <header className="friends-heading">
        <div>
          <span className="friends-eyebrow">
            <Users size={16} /> YOUR TRAVEL CIRCLE
          </span>
          <h1>Friends</h1>
          <p>
            Keep your travel people close. See their groups and plan your next
            adventure.
          </p>
        </div>
        <button
          className="friend-button"
          disabled={resource.loading}
          onClick={resource.reload}
        >
          <RefreshCw size={16} /> Refresh
        </button>
      </header>
      <div
        className="friends-tabs"
        role="tablist"
        aria-label="Friends sections"
      >
        {TABS.map((item) => (
          <button
            key={item.id}
            role="tab"
            aria-selected={tab === item.id}
            className={tab === item.id ? "active" : ""}
            onClick={() => {
              setQuery("");
              setParams(item.id === "friends" ? {} : { tab: item.id }, {
                replace: true,
              });
            }}
          >
            <item.icon size={18} /> {item.label}
            {item.id === "friends" && <span>{friends.length}</span>}
            {item.id === "requests" && incoming.length > 0 && (
              <span>{incoming.length}</span>
            )}
          </button>
        ))}
      </div>
      <RemoteState resource={resource} />
      {resource.data && (
        <>
          {tab !== "requests" && (
            <label className="friends-search">
              <Search size={19} />
              <input
                type="search"
                aria-label="Search travellers"
                placeholder={
                  tab === "friends"
                    ? "Search your friends by name or city"
                    : "Find travellers by name or city"
                }
                value={query}
                onChange={(event) => setQuery(event.target.value)}
              />
            </label>
          )}
          {tab === "friends" &&
            (friends.length === 0 ? (
              <div className="friends-empty">
                <Users size={36} />
                <h2>Good company starts here</h2>
                <p>Add people you’ve met on your trips, or find someone new.</p>
                <button
                  className="friend-button primary"
                  onClick={() => setParams({ tab: "discover" })}
                >
                  <UserPlus size={17} /> Find travellers
                </button>
              </div>
            ) : visibleFriends.length ? (
              <div className="friends-grid">
                {visibleFriends.map((entry) => card(entry.traveller))}
              </div>
            ) : (
              <Empty title="No friends match your search">
                Try another name or city.
              </Empty>
            ))}
          {tab === "requests" && (
            <div className="friend-requests">
              <section>
                <h2>
                  Incoming requests <span>{incoming.length}</span>
                </h2>
                <p className="friends-section-note">
                  Accept a request to add each other as friends.
                </p>
                {incoming.length ? (
                  <div className="friends-grid">
                    {incoming.map((entry) => card(entry.traveller))}
                  </div>
                ) : (
                  <Empty title="You’re all caught up">
                    New friend requests will appear here.
                  </Empty>
                )}
              </section>
              <section>
                <h2>
                  Sent requests <span>{outgoing.length}</span>
                </h2>
                {outgoing.length ? (
                  <div className="friends-grid">
                    {outgoing.map((entry) => card(entry.traveller))}
                  </div>
                ) : (
                  <p className="muted">You have no pending sent requests.</p>
                )}
              </section>
            </div>
          )}
          {tab === "discover" && (
            <>
              <RemoteState resource={people} />
              {people.data &&
                (visiblePeople.length ? (
                  <div className="friends-grid">{visiblePeople.map(card)}</div>
                ) : (
                  <Empty title="No travellers found">
                    Try another name or city.
                  </Empty>
                ))}
            </>
          )}
        </>
      )}
    </section>
  );
}
