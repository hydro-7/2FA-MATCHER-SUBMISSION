import { useNavigate, useOutletContext } from "react-router";
import { ROUTES } from "../../config/routes";
import { Avatar } from "../../components/ui";

export function Members() {
  const { group } = useOutletContext();
  const navigate = useNavigate();
  return (
    <div className="panel">
      <h2>Your travel company</h2>
      <div className="member-grid">
        {group.members.map((member) => (
          <button key={member.id} className="member-card" onClick={() => navigate(ROUTES.TRAVELLER(member.id))}>
            <Avatar person={member} large />
            <strong>{member.name}</strong>
            <small>{member.homeCity}</small>
            <span className="text-link">View profile →</span>
          </button>
        ))}
      </div>
    </div>
  );
}
