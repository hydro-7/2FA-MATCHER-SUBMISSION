import { Link } from "react-router";
import { MapPin, Plus, Search, Users } from "lucide-react";
import { HERO_PHOTO } from "../constants/app";
import { FALLBACK_ICON, INTEREST_ICONS } from "../constants/icons";
import { ROUTES } from "../config/routes";
import { labelOf } from "../lib/format";
import { useMeta } from "../hooks/useMeta";
import { useSession } from "../store/session";
import { Swoosh } from "../components/Swoosh";
import { RemoteState } from "../components/ui";

export function Profile() {
  const meta = useMeta();
  const profile = useSession((state) => state.profile);
  return (
    <div className="wizard">
      <aside className="wizard-photo" style={{ backgroundImage: `url("${HERO_PHOTO.SRC}")` }}>
        <p className="handwritten">
          Your profile travels with you.
          <Swoosh className="white" />
        </p>
      </aside>
      <section className="wizard-main">
        <RemoteState resource={meta} />
        {meta.data && profile && <SavedProfile meta={meta.data} profile={profile} />}
      </section>
    </div>
  );
}

function SavedProfile({ meta, profile }) {
  const interestLabel = (id) => meta.interests.find((interest) => interest.id === id)?.label ?? id;
  return (
    <>
      <h1 className="wizard-title">
        Hi, <span className="accent">{profile.name.split(" ")[0]}<Swoosh className="orange" /></span>
      </h1>
      <p className="wizard-sub">Your profile is saved. Groups are matched on these details.</p>
      <div className="field-row">
        <div className="field-card">
          <span className="field-label">Home city</span>
          <span className="field-value">
            <MapPin size={18} /> {profile.homeCity}
          </span>
        </div>
        <div className="field-card">
          <span className="field-label">Gender</span>
          <span className="field-value">{labelOf("gender", profile.gender)}</span>
        </div>
        <div className="field-card">
          <span className="field-label">Travels with</span>
          <span className="field-value">{labelOf("genderPreference", profile.genderPreference)}</span>
        </div>
      </div>
      <div className="tile-chips">
        {profile.interests.map((id) => {
          const Icon = INTEREST_ICONS[id] ?? FALLBACK_ICON;
          return (
            <span key={id} className="tile-chip">
              <Icon size={16} /> {interestLabel(id)}
            </span>
          );
        })}
      </div>
      <div className="wizard-actions">
        <Link className="ghost-btn" to={ROUTES.FRIENDS}>
          <Users size={18} /> My friends
        </Link>
        <Link className="ghost-btn" to={ROUTES.NEW_GROUP}>
          <Plus size={18} /> Create a trip
        </Link>
        <Link className="next-btn" to={ROUTES.DISCOVER}>
          <Search size={18} /> Find a group
        </Link>
      </div>
    </>
  );
}
