import { useEffect } from "react";
import { ArrowUpRight, CalendarDays, Cake, Crown, LockKeyhole, MapPin, UserRound, Users } from "lucide-react";
import { Link, useParams } from "react-router";
import { ROUTES } from "../config/routes";
import { CITY_PHOTOS, HERO_PHOTO } from "../constants/app";
import { FALLBACK_ICON, INTEREST_ICONS } from "../constants/icons";
import { formatDates, labelOf } from "../lib/format";
import { useMeta } from "../hooks/useMeta";
import { useResource } from "../hooks/useResource";
import { travellerService } from "../services/travellerService";
import { friendService } from "../services/friendService";
import { useSession } from "../store/session";
import { FriendActions } from "../components/FriendActions";
import { Avatar, RemoteState } from "../components/ui";

export function MemberProfile() {
  const { travellerId } = useParams();
  const userId = useSession((state) => state.userId);
  const meta = useMeta();
  const traveller = useResource(
    () => travellerService.get(travellerId),
    `${userId}-${travellerId}`,
  );
  const member = traveller.data;
  const relationship = useResource(
    () => friendService.relationship(travellerId),
    `relationship-${userId}-${travellerId}`,
  );
  // The server decides: self, friends and groupmates see groups.
  const canViewGroups = Boolean(member?.canViewGroups);
  function refreshFriendship() {
    traveller.reload();
    relationship.reload();
  }
  useEffect(() => {
    const refresh = () => {
      if (!document.hidden) refreshFriendship();
    };
    window.addEventListener("focus", refresh);
    const timer = window.setInterval(refresh, 15000);
    return () => {
      window.removeEventListener("focus", refresh);
      window.clearInterval(timer);
    };
  }, [userId, travellerId]);
  const interestLabel = (id) =>
    meta.data?.interests.find((interest) => interest.id === id)?.label ?? id;

  const self = userId === member?.id;
  return (
    <section className="member-profile mp">
      <RemoteState resource={traveller} />
      {member && (
        <div className="mp-layout">
          <aside className="panel mp-card">
            <Avatar person={member} large />
            <h1>{member.name}</h1>
            <ul className="mp-facts">
              <li>
                <MapPin size={16} /> {member.homeCity}
              </li>
              {member.age && (
                <li>
                  <Cake size={16} /> {member.age} years
                </li>
              )}
              <li>
                <UserRound size={16} /> {labelOf("gender", member.gender)}
              </li>
              <li>
                <Users size={16} /> Travels with: {labelOf("genderPreference", member.genderPreference)}
              </li>
            </ul>
            <h2 className="mp-label">Interests</h2>
            <div className="mp-interests">
              {member.interests.map((id) => {
                const Icon = INTEREST_ICONS[id] ?? FALLBACK_ICON;
                return (
                  <span className="tile-chip" key={id}>
                    <Icon size={15} /> {interestLabel(id)}
                  </span>
                );
              })}
            </div>
            <div className="profile-friend-actions">
              {self ? (
                <Link className="friend-button" to={ROUTES.FRIENDS}>
                  My friends
                </Link>
              ) : (
                <>
                  <RemoteState resource={relationship} />
                  {!relationship.error && (
                    <FriendActions
                      key={`${userId}-${member.id}`}
                      person={member}
                      relationship={relationship.data}
                      onChange={refreshFriendship}
                      disabled={relationship.loading}
                    />
                  )}
                </>
              )}
            </div>
          </aside>

          <div className="mp-groups">
            <h2>{self ? "Your groups" : `${member.name.split(" ")[0]}’s groups`}</h2>
            {!canViewGroups ? (
              <div className="panel mp-private">
                <LockKeyhole size={26} />
                <h3>Groups are private</h3>
                <p>Become friends, or travel in the same group, to see where {member.name.split(" ")[0]} is going.</p>
              </div>
            ) : member.groups.length === 0 ? (
              <div className="panel mp-private">
                <CalendarDays size={26} />
                <h3>No trips yet</h3>
                <p>{self ? "You haven’t" : "They haven’t"} joined a group yet.</p>
              </div>
            ) : (
              <div className="mp-group-list">
                {member.groups.map((group) => (
                  <Link key={group.id} to={ROUTES.GROUP(group.id)} className="mp-group">
                    <span className="mp-group-photo" style={{ backgroundImage: `url("${CITY_PHOTOS[group.city] ?? HERO_PHOTO.SRC}")` }} />
                    <span className="mp-group-body">
                      <strong>{group.name}</strong>
                      <small>
                        <MapPin size={14} /> {group.city} · {formatDates(group.checkIn, group.checkOut)}
                      </small>
                      <span className="mp-group-tags">
                        <span>
                          <Users size={13} /> {group.memberCount}/{group.maxSize}
                        </span>
                        {group.role === "OWNER" && (
                          <span>
                            <Crown size={13} /> Organiser
                          </span>
                        )}
                        {group.status === "BOOKED" && <span className="booked">Stay booked</span>}
                      </span>
                    </span>
                    <ArrowUpRight size={18} className="mp-group-go" />
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </section>
  );
}
