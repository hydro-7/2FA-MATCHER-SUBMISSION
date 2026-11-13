import { useNavigate } from "react-router";
import { formatDates } from "../lib/format";
import { Money } from "./ui";

export function GroupCard({ group, to, state, subtitle, badge, children, action }) {
  const navigate = useNavigate();
  return (
    <article className="group-card">
      <div className="group-cover">
        <span className="cover-label">{group.city}</span>
        <h2>{group.name}</h2>
      </div>
      <div className="card-body">
        <div className="person">
          <span>
            <strong>{formatDates(group.checkIn, group.checkOut)}</strong>
            <small>{subtitle}</small>
          </span>
          <span className="badge">{badge ?? `${group.memberCount} / ${group.maxSize} travellers`}</span>
        </div>
        {children}
        <div className="card-footer">
          <div>
            <strong>
              <Money value={group.budgetInr} />
            </strong>
            <small>Approx. trip budget / person</small>
          </div>
          <div className="actions">
            {action}
            <button className={action ? "secondary" : ""} onClick={() => navigate(to, { state })}>
              View group ↗
            </button>
          </div>
        </div>
      </div>
    </article>
  );
}
