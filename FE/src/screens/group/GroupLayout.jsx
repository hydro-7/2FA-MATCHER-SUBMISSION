import { useState } from "react";
import { Link, NavLink, Outlet, useLocation, useNavigate, useParams } from "react-router";
import { ArrowLeft, CalendarDays, CircleCheck, CircleX, MapPin, MessageSquare, Moon, Users, Zap } from "lucide-react";
import { CITY_PHOTOS, GROUP_TABS, HERO_PHOTO } from "../../constants/app";
import { FALLBACK_ICON, INTEREST_ICONS, TAB_ICONS } from "../../constants/icons";
import { ROUTES } from "../../config/routes";
import { formatDates, formatMoney, labelOf, nightsBetween } from "../../lib/format";
import { useMeta } from "../../hooks/useMeta";
import { useResource } from "../../hooks/useResource";
import { groupService } from "../../services/groupService";
import { requestService } from "../../services/requestService";
import { useSearch } from "../../store/search";
import { useSession } from "../../store/session";
import { toast } from "../../store/toast";
import { Avatar, Notice, RemoteState } from "../../components/ui";
import { ChatPopup } from "./Chat";

export function GroupLayout() {
  const { groupId } = useParams();
  const location = useLocation();
  const userId = useSession((state) => state.userId);
  const searchResult = useSearch((state) => state.result);
  const [fromSearch] = useState(location.state);
  const meta = useMeta();
  const resource = useResource(() => groupService.get(groupId), groupId);
  const group = resource.data;
  // Older backends omit pendingRequestCount on group detail; count pending requests directly for the owner.
  const needsPending = group?.ownerId === userId && group?.pendingRequestCount == null;
  const pending = useResource(() => (needsPending ? requestService.listForGroup(groupId, "PENDING") : Promise.resolve([])), `${groupId}-${needsPending}-${group?.memberCount}`);
  const back = (
    <Link className="back-link" to={ROUTES.DISCOVER}>
      <span>
        <ArrowLeft size={20} />
      </span>
      Back to Groups
    </Link>
  );

  if (!group)
    return (
      <div className="group-page">
        {back}
        <RemoteState resource={resource} />
      </div>
    );

  const match = fromSearch?.match ?? searchResult?.matches.find((item) => item.groupId === groupId);
  const searchId = fromSearch?.searchId ?? (match && searchResult?.searchId);
  const isOwner = group.ownerId === userId;
  const pendingRequestCount = group.pendingRequestCount ?? pending.data?.length ?? 0;
  const isMember = group.members.some((member) => member.id === userId);
  const owner = group.members.find((member) => member.id === group.ownerId);
  const tabs = GROUP_TABS.filter((tab) => (!tab.membersOnly || isMember) && (!tab.ownerOnly || isOwner));
  const interestLabel = (id) => meta.data?.interests.find((interest) => interest.id === id)?.label ?? id;

  const tabNav = (
    <nav className="group-tabs" aria-label="Group sections">
      {tabs.map((tab) => {
        const Icon = TAB_ICONS[tab.path];
        return (
          <NavLink key={tab.path} end to={tab.path ? ROUTES.GROUP_TAB(groupId, tab.path) : ROUTES.GROUP(groupId)} replace state={fromSearch}>
            {Icon && <Icon size={19} />} {(isMember && tab.memberLabel) || tab.label}
            {tab.path === "members" && ` (${group.memberCount})`}
            {tab.ownerOnly && pendingRequestCount > 0 && <span className="count-badge">{pendingRequestCount}</span>}
          </NavLink>
        );
      })}
    </nav>
  );
  const outlet = <Outlet context={{ group, reload: resource.reload, isOwner, isMember, match, searchId }} />;

  if (isMember)
    return (
      <div className="group-page">
        <header className="trip-banner" style={{ backgroundImage: `url("${CITY_PHOTOS[group.city] ?? HERO_PHOTO.SRC}")` }}>
          <Link className="banner-back" to={ROUTES.TRIPS} aria-label="Back to My Trips">
            <ArrowLeft size={22} />
          </Link>
          <div>
            <h1>{group.name}</h1>
            <div className="banner-meta">
              <span>
                <MapPin size={18} /> {group.city}
              </span>
              <span>
                <CalendarDays size={18} /> {formatDates(group.checkIn, group.checkOut)}
              </span>
              <span>
                <Moon size={18} /> {nightsBetween(group.checkIn, group.checkOut)} nights
              </span>
            </div>
            <div className="banner-members">
              <AvatarStack people={group.members} />
              {group.memberCount} of {group.maxSize} members
              {isOwner && <span className="banner-chip">Created by you</span>}
              {group.status === "BOOKED" && <span className="banner-chip">Stay booked</span>}
            </div>
          </div>
        </header>
        {tabNav}
        {outlet}
        <ChatPopup key={`${group.id}-${userId}`} group={group} />
      </div>
    );

  return (
    <div className="group-page">
      {back}
      <div className="group-grid">
        <div className="group-main">
          <div className="group-hero" style={{ backgroundImage: `url("${CITY_PHOTOS[group.city] ?? HERO_PHOTO.SRC}")` }}>
            {group.status === "BOOKED" && <span className="hero-badge">Stay booked</span>}
          </div>
          <h1 className="group-title">{group.name}</h1>
          <div className="group-meta">
            <span>
              <MapPin size={18} /> {group.city}
            </span>
            <span>
              <CalendarDays size={18} /> {formatDates(group.checkIn, group.checkOut)}
            </span>
            <span>
              <Moon size={18} /> {nightsBetween(group.checkIn, group.checkOut)} nights
            </span>
            <span>
              <Users size={18} /> {group.memberCount} of {group.maxSize} joined
            </span>
          </div>
          {owner && (
            <div className="group-interests">
              {owner.interests.map((id) => {
                const Icon = INTEREST_ICONS[id] ?? FALLBACK_ICON;
                return (
                  <span key={id}>
                    <Icon size={18} /> {interestLabel(id)}
                  </span>
                );
              })}
            </div>
          )}
          {tabNav}
          {outlet}
        </div>

        <aside className="group-side">
          <div className="side-card">
            {match && <MatchPanel match={match} interestLabel={interestLabel} />}
            <div className="side-price">
              <div>
                <strong>{formatMoney(group.budgetInr)}</strong>
                <small>per person</small>
              </div>
              <span className="tag-orange">
                <Users size={16} /> {group.seatsLeft} {group.seatsLeft === 1 ? "spot" : "spots"} left
              </span>
            </div>
            <JoinAction group={group} isOwner={isOwner} isMember={isMember} searchId={searchId} onRequested={resource.reload} />
          </div>
          {owner && (
            <Link className="side-card creator-card" to={ROUTES.TRAVELLER(owner.id)}>
              <h3>Group Creator</h3>
              <div className="creator">
                <Avatar person={owner} large />
                <span>
                  <strong>{isOwner ? "You" : owner.name}</strong>
                  <small>{[owner.age, `From ${owner.homeCity}`].filter(Boolean).join(" · ")}</small>
                </span>
              </div>
            </Link>
          )}
        </aside>
      </div>
    </div>
  );
}

function AvatarStack({ people, max = 4 }) {
  return (
    <span className="avatar-stack">
      {people.slice(0, max).map((person) => (
        <Avatar key={person.id} person={person} />
      ))}
      {people.length > max && <span className="avatar more">+{people.length - max}</span>}
    </span>
  );
}

function MatchPanel({ match, interestLabel }) {
  const passed = match.rules.filter((rule) => rule.pass).length;
  const allPass = passed === match.rules.length;
  const score = Math.round(match.score);
  // Rule details carry raw interest ids (STREET_FOOD); show their labels instead.
  const readable = (detail) => detail.replace(/\b[A-Z][A-Z_]{2,}\b/g, interestLabel);
  return (
    <div className={`match-panel ${allPass ? "" : "warn"}`}>
      <header>
        <div>
          <h3>
            <Zap size={20} fill="currentColor" /> {allPass ? "You’re a great match!" : "Not a full match"}
          </h3>
          <p>
            {passed} of {match.rules.length} checks passed
          </p>
        </div>
        <div className="score-ring" style={{ "--score": score }} title="How closely your interests, dates, budget and open seats line up">
          <strong>{score}%</strong>
          <small>Fit</small>
        </div>
      </header>
      <ul>
        {match.rules.map((rule) => (
          <li key={rule.id}>
            {rule.pass ? <CircleCheck size={18} /> : <CircleX size={18} />}
            <span>
              <strong>{rule.label}</strong>
              <small>{readable(rule.detail)}</small>
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function JoinAction({ group, isOwner, isMember, searchId, onRequested }) {
  const navigate = useNavigate();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function join() {
    setBusy(true);
    setError("");
    try {
      await requestService.create(group.id, searchId);
      toast("Request sent. You’ll join once the creator approves.");
      onRequested();
    } catch (failure) {
      setError(failure.message);
    } finally {
      setBusy(false);
    }
  }

  if (isMember)
    return (
      <div className="side-actions">
        <Link className="primary-action" to={ROUTES.GROUP_TAB(group.id, "stays")} replace>
          {group.status === "BOOKED" ? "View your booking" : "Find a stay together"}
        </Link>
        <Link className="secondary-action" to={ROUTES.GROUP_TAB(group.id, "chat")} replace>
          <MessageSquare size={20} /> Message Group
        </Link>
        {isOwner && <p className="side-note">You created this group.</p>}
      </div>
    );

  let label = "Express Interest";
  if (group.myRequestStatus) label = `Request ${labelOf("requestStatus", group.myRequestStatus).toLowerCase()}`;
  else if (group.status === "BOOKED") label = "Group stay confirmed";
  else if (group.seatsLeft === 0) label = "Group full";
  else if (!searchId) label = "Search to check compatibility";
  const canJoin = !group.myRequestStatus && group.status !== "BOOKED" && group.seatsLeft > 0;

  return (
    <div className="side-actions">
      <Notice error>{error}</Notice>
      <button className="primary-action" disabled={busy || !canJoin} onClick={() => (searchId ? join() : navigate(ROUTES.DISCOVER))}>
        <Users size={20} /> {busy ? "Sending…" : label}
      </button>
      <p className="side-note">The creator reviews your request before you join. Chat opens once you’re in.</p>
    </div>
  );
}
