import { useOutletContext } from "react-router";
import { BedDouble, Users, UserRoundCheck, Wallet } from "lucide-react";
import { formatMoney, labelOf } from "../../lib/format";
import { parseItinerary } from "../../lib/itinerary";
import { ItineraryView } from "../../components/ItineraryView";
import { Workspace } from "./Workspace";

function genderPreferenceLabel(group, owner) {
  if (group.genderPreference !== "SAME_GENDER" || !owner) return labelOf("genderPreference", "ANY");
  return `${labelOf("gender", owner.gender)} only`;
}

export function Overview() {
  const { group, isMember } = useOutletContext();
  if (isMember) return <Workspace />;
  return <TripOverview group={group} />;
}

function TripOverview({ group }) {
  const plan = parseItinerary(group.itinerary);
  const owner = group.members.find((member) => member.id === group.ownerId);
  const stats = [
    { icon: Users, label: "Group size", value: `${group.maxSize} people` },
    { icon: Wallet, label: "Budget", hint: "(per person)", value: formatMoney(group.budgetInr) },
    { icon: UserRoundCheck, label: "Travels with", value: genderPreferenceLabel(group, owner) },
  ];
  if (group.booking)
    stats.push({ icon: BedDouble, label: "Booked stay", hint: `(${formatMoney(group.booking.perMemberInr)} each)`, value: group.booking.hotelName });

  return (
    <section className="overview">
      <h2>About this trip</h2>
      <p>{plan.summary}</p>
      <div className="stat-row">
        {stats.map(({ icon: Icon, label, hint, value }) => (
          <div key={label} className="stat-card">
            <Icon size={22} />
            <span>
              <small>
                {label} {hint && <i>{hint}</i>}
              </small>
              <strong>{value}</strong>
            </span>
          </div>
        ))}
      </div>
      {plan.days.length > 0 && (
        <>
          <h2 className="spaced">Day by day</h2>
          <ItineraryView plan={plan} />
        </>
      )}
    </section>
  );
}
