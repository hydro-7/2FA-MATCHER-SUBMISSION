import { useState } from "react";
import { Link, useOutletContext } from "react-router";
import {
  ArrowRight,
  BedDouble,
  CalendarCheck,
  ChevronLeft,
  ChevronRight,
  CircleCheck,
  Circle,
  ClipboardList,
  Hotel,
  Map as MapIcon,
  MessageSquare,
  ReceiptIndianRupee,
  Star,
  Users,
} from "lucide-react";
import { ROUTES } from "../../config/routes";
import { assetUrl, formatMoney } from "../../lib/format";
import { parseItinerary } from "../../lib/itinerary";
import { useResource } from "../../hooks/useResource";
import { planningService } from "../../services/planningService";
import { ItineraryView } from "../../components/ItineraryView";

export function Workspace() {
  const { group, isOwner } = useOutletContext();
  const saved = useResource(() => planningService.saved(group.id), `saved-${group.id}`);
  const [hotelIndex, setHotelIndex] = useState(0);
  const tab = (path) => ROUTES.GROUP_TAB(group.id, path);
  const plan = parseItinerary(group.itinerary);
  const options = saved.data ?? [];
  const booked = group.status === "BOOKED";

  const steps = [
    { label: "Trip created", done: true },
    { label: "Itinerary planned", done: plan.days.length > 0 },
    { label: "Travel buddies joined", done: group.memberCount > 1 },
    { label: "Hotels shortlisted", done: booked || options.length > 0 },
    { label: "Stay booked", done: booked },
  ];
  const doneCount = steps.filter((step) => step.done).length;

  let next = { title: "Book your stay", text: "Everyone’s in. Pick a hotel and confirm the booking.", cta: "Book a stay", to: tab("stays") };
  if (booked) next = { title: "You’re all set", text: `Stay confirmed at ${group.booking?.hotelName}. Say hi in the group chat.`, cta: "Open chat", to: tab("chat") };
  else if (!options.length) next = { title: "Shortlist hotels", text: "Save a few rooms so the group can compare prices.", cta: "Compare hotels", to: tab("stays") };
  else if (group.memberCount < 2) next = { title: "Find travel buddies", text: "Approve join requests to fill your group.", cta: isOwner ? "Review requests" : "View members", to: tab(isOwner ? "requests" : "members") };

  const hotel = options[hotelIndex % Math.max(options.length, 1)];
  const quickActions = [
    { icon: Hotel, label: "Compare hotels", to: tab("stays") },
    { icon: MessageSquare, label: "Group chat", to: tab("chat") },
    { icon: Users, label: "Members", to: tab("members") },
    ...(isOwner ? [{ icon: ClipboardList, label: "Join requests", to: tab("requests") }] : []),
  ];

  return (
    <div className="workspace">
      <div className="ws-left">
        <section className="ws-card">
          <div className="ws-head">
            <h3>Trip Progress</h3>
            <small>
              {doneCount} of {steps.length} done
            </small>
          </div>
          <div className="progress">
            <span style={{ width: `${(doneCount / steps.length) * 100}%` }} />
          </div>
          <ul className="checklist">
            {steps.map((step) => (
              <li key={step.label} className={step.done ? "done" : ""}>
                {step.done ? <CircleCheck size={22} /> : <Circle size={22} />} {step.label}
              </li>
            ))}
          </ul>
        </section>
        <section className="ws-card">
          <h3>Quick Actions</h3>
          <ul className="quick-actions">
            {quickActions.map(({ icon: Icon, label, to }) => (
              <li key={label}>
                <Link to={to} replace>
                  <Icon size={21} /> {label}
                </Link>
              </li>
            ))}
          </ul>
        </section>
      </div>

      <div className="ws-right">
        <section className="ws-card next-up">
          <span className="next-icon">
            <CalendarCheck size={28} />
          </span>
          <div>
            <h3>{next.title}</h3>
            <p>{next.text}</p>
          </div>
          <Link className="details-btn" to={next.to} replace>
            {next.cta} <ArrowRight size={18} />
          </Link>
        </section>

        <section className="ws-card">
          <div className="ws-head">
            <h3>
              <MapIcon size={22} /> Trip Itinerary
            </h3>
            <Link className="ws-link" to={tab("itinerary")} replace>
              View full itinerary <ArrowRight size={16} />
            </Link>
          </div>
          <ItineraryView plan={plan} compact />
        </section>

        <div className="ws-pair">
          <section className="ws-card">
            <div className="ws-head">
              <h3>
                <BedDouble size={22} /> Hotels ({options.length})
              </h3>
              <Link className="ws-link" to={tab("stays")} replace>
                View all <ArrowRight size={16} />
              </Link>
            </div>
            {hotel ? (
              <div className="ws-hotel">
                <div className="ws-hotel-img" style={{ backgroundImage: `url("${assetUrl(hotel.image)}")` }} />
                <div>
                  <strong>{hotel.hotelName}</strong>
                  <small>
                    <Star size={15} fill="#f59e0b" color="#f59e0b" /> {hotel.rating} · {formatMoney(hotel.perMemberInr)} / person
                  </small>
                  <span className="tag-green">Saved by {hotel.alignment}</span>
                </div>
                {options.length > 1 && (
                  <div className="ws-arrows">
                    <button type="button" aria-label="Previous hotel" onClick={() => setHotelIndex(hotelIndex - 1 + options.length)}>
                      <ChevronLeft size={18} />
                    </button>
                    <button type="button" aria-label="Next hotel" onClick={() => setHotelIndex(hotelIndex + 1)}>
                      <ChevronRight size={18} />
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <p className="muted-line">{saved.loading ? "Loading saved hotels…" : "No hotels saved yet."}</p>
            )}
          </section>

          <section className="ws-card">
            <div className="ws-head">
              <h3>
                <ReceiptIndianRupee size={22} /> Stay cost
              </h3>
              <Link className="ws-link" to={tab("stays")} replace>
                Details <ArrowRight size={16} />
              </Link>
            </div>
            {booked && group.booking ? (
              <CostSplit total={group.booking.totalInr} perMember={group.booking.perMemberInr} members={group.booking.members} note={`Booked at ${group.booking.hotelName}`} />
            ) : hotel ? (
              <CostSplit total={hotel.totalInr} perMember={hotel.perMemberInr} members={hotel.memberCount} note="Estimate from the hotel shown" />
            ) : (
              <p className="muted-line">Save a hotel to see the cost split.</p>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}

function CostSplit({ total, perMember, members, note }) {
  return (
    <div className="cost-split">
      <div>
        <strong>{formatMoney(total)}</strong>
        <small>Total ({members} members)</small>
      </div>
      <div className="per-person">
        <strong>{formatMoney(perMember)}</strong>
        <small>Per person</small>
      </div>
      <p className="muted-line">{note}</p>
    </div>
  );
}
