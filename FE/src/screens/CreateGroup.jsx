import { useState } from "react";
import { Link, useNavigate } from "react-router";
import { ArrowLeft, ArrowRight, CalendarDays, Check, Layers, ListChecks, MapPin, Moon, PenLine, Plus, Rocket, Trash2, Users, Wallet, X } from "lucide-react";
import { HERO_PHOTO, LIMITS, TRAVEL_STYLES } from "../constants/app";
import { FALLBACK_ICON, GENDER_GLYPHS, INTEREST_ICONS, TRAVEL_STYLE_ICONS } from "../constants/icons";
import { ROUTES } from "../config/routes";
import { addDays, formatDates, formatDay, formatMoney, labelOf, nightsBetween } from "../lib/format";
import { formatItinerary } from "../lib/itinerary";
import { useMeta } from "../hooks/useMeta";
import { groupService } from "../services/groupService";
import { EMPTY_TRIP_DRAFT, useDrafts } from "../store/drafts";
import { useSession } from "../store/session";
import { toast } from "../store/toast";
import { Dropdown } from "../components/Dropdown";
import { Stepper } from "../components/Stepper";
import { TimePicker } from "../components/TimePicker";
import { Swoosh } from "../components/Swoosh";
import { Notice, RemoteState } from "../components/ui";

const STEPS = [
  { label: "Trip Details", note: "Create a group trip and find your travel buddies." },
  { label: "Itinerary", note: "Plan your trip itinerary day by day." },
  { label: "Preferences", note: "Set your preferences and publish your trip." },
];

const EMPTY_ACTIVITY = { time: "", text: "" };

function tripDays(trip) {
  const nights = trip.checkIn && trip.checkOut > trip.checkIn ? nightsBetween(trip.checkIn, trip.checkOut) : 0;
  return Array.from({ length: nights }, (_, index) => addDays(trip.checkIn, index));
}

function useTripDraft() {
  const userId = useSession((state) => state.userId);
  const draft = useDrafts((state) => state.trips[userId]) ?? EMPTY_TRIP_DRAFT;
  const setTripDraft = useDrafts((state) => state.setTripDraft);
  const clearTripDraft = useDrafts((state) => state.clearTripDraft);
  return { draft, hasDraft: draft !== EMPTY_TRIP_DRAFT, update: (patch) => setTripDraft(userId, patch), clear: () => clearTripDraft(userId) };
}

export function CreateGroup() {
  const meta = useMeta();
  const { draft, update } = useTripDraft();
  const step = draft.step;
  const setStep = (value) => update({ step: value });
  return (
    <div className="wizard">
      <aside className="wizard-photo" style={{ backgroundImage: `url("${HERO_PHOTO.SRC}")` }}>
        <p className="handwritten">
          {STEPS[step].note}
          <Swoosh className="white" />
        </p>
      </aside>
      <section className="wizard-main">
        <RemoteState resource={meta} />
        {meta.data && <TripWizard meta={meta.data} step={step} setStep={setStep} />}
      </section>
    </div>
  );
}

function TripWizard({ meta, step, setStep }) {
  const profile = useSession((state) => state.profile);
  const navigate = useNavigate();
  const { draft, hasDraft, update, clear } = useTripDraft();
  const { trip, plan, activeDay, style, rules } = draft;
  const [restored] = useState(hasDraft);
  const setTrip = (value) => update({ trip: value });
  const setPlan = (value) => update({ plan: value });
  const setActiveDay = (value) => update({ activeDay: value });
  const setStyle = (value) => update({ style: value });
  // Per trip; starts from the profile setting.
  const genderPreference = draft.genderPreference ?? profile.genderPreference;
  const setRules = (value) => update({ rules: value });
  const [ruleDraft, setRuleDraft] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const { FIRST_CHECK_IN, LAST_CHECK_OUT } = meta.dateWindow;
  const dates = tripDays(trip);
  const itinerary = formatItinerary({ summary: trip.summary, style, rules, dates, plan });
  const set = (key) => (event) => setTrip({ ...trip, [key]: event.target.value });
  const sizeOptions = Array.from({ length: meta.groupSize.MAX - meta.groupSize.MIN + 1 }, (_, index) => {
    const size = meta.groupSize.MIN + index;
    return { id: String(size), label: size === 1 ? "Just me for now" : `${size} people (incl. you)` };
  });
  const interestLabel = (id) => meta.interests.find((interest) => interest.id === id)?.label ?? id;
  const cityLabel = meta.cityOptions.find((city) => city.id === trip.city)?.label ?? trip.city;
  const day = plan[activeDay] ?? { title: "", activities: [] };

  function updateDay(patch) {
    const next = [...plan];
    next[activeDay] = { ...day, ...patch };
    setPlan(next);
  }

  function updateActivity(index, patch) {
    updateDay({ activities: day.activities.map((activity, i) => (i === index ? { ...activity, ...patch } : activity)) });
  }

  function addRule() {
    const rule = ruleDraft.trim();
    if (rule && !rules.includes(rule)) setRules([...rules, rule]);
    setRuleDraft("");
  }

  async function submit(event) {
    event.preventDefault();
    setError("");
    if (step === 0) {
      if (!trip.city) return setError("Choose a destination.");
      if (trip.checkOut <= trip.checkIn) return setError("Check-out must be after check-in.");
      if (!trip.maxSize) return setError("Choose a group size.");
      setActiveDay(0);
      return setStep(1);
    }
    if (step === 1) {
      if (itinerary.length > LIMITS.ITINERARY) return setError(`Keep the itinerary under ${LIMITS.ITINERARY} characters.`);
      return setStep(2);
    }
    setBusy(true);
    try {
      const group = await groupService.create({
        name: trip.name.trim(),
        city: trip.city,
        checkIn: trip.checkIn,
        checkOut: trip.checkOut,
        maxSize: Number(trip.maxSize),
        budgetInr: Number(trip.budgetInr),
        itinerary,
        genderPreference,
      });
      clear();
      toast("Trip published. Join requests will show up on your group page.");
      navigate(ROUTES.GROUP(group.id));
    } catch (failure) {
      setError(failure.message);
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit}>
      <Stepper steps={STEPS.map((item) => item.label)} current={step} />
      {restored && hasDraft && (
        <p className="draft-note">
          Your unfinished trip is saved on this device.{" "}
          <button type="button" className="link-btn" onClick={clear}>
            Start over
          </button>
        </p>
      )}

      {step === 0 && (
        <>
          <h1 className="wizard-title">
            Create a new{" "}
            <span className="accent">
              group trip
              <Swoosh className="orange" />
            </span>
          </h1>
          <p className="wizard-sub">Share your plan, set the details and find the right travel buddies.</p>
          <div className="form-panel">
            <label className="plain-field">
              <span className="field-label">
                Trip title <i>*</i>
              </span>
              <span className="input-with-icon">
                <PenLine size={20} />
                <input required autoFocus maxLength={LIMITS.NAME} placeholder="e.g. Kyoto Culture Explorers" value={trip.name} onChange={set("name")} />
              </span>
            </label>
            <div className="plain-row">
              <div className="plain-field">
                <span className="field-label">
                  Destination <i>*</i>
                </span>
                <span className="input-with-icon">
                  <MapPin size={20} />
                  <Dropdown required options={meta.cityOptions} placeholder="Choose a city" value={trip.city} onChange={set("city")} />
                </span>
              </div>
              <div className="plain-field">
                <span className="field-label">
                  Travel dates <i>*</i>
                </span>
                <span className="input-with-icon date-pair">
                  <CalendarDays size={20} />
                  <input required type="date" aria-label="Check-in" min={FIRST_CHECK_IN} max={LAST_CHECK_OUT} value={trip.checkIn} onChange={set("checkIn")} />
                  <span>–</span>
                  <input
                    required
                    type="date"
                    aria-label="Check-out"
                    min={trip.checkIn || FIRST_CHECK_IN}
                    max={LAST_CHECK_OUT}
                    value={trip.checkOut}
                    onChange={set("checkOut")}
                  />
                </span>
              </div>
            </div>
            <div className="plain-row three">
              <div className="plain-field">
                <span className="field-label">Trip duration</span>
                <span className="input-with-icon readonly">
                  <Moon size={20} />
                  {dates.length ? `${dates.length} ${dates.length === 1 ? "night" : "nights"}` : "Pick your dates"}
                </span>
              </div>
              <div className="plain-field">
                <span className="field-label">
                  Group size <i>*</i>
                </span>
                <span className="input-with-icon">
                  <Users size={20} />
                  <Dropdown required options={sizeOptions} placeholder="How many?" value={trip.maxSize} onChange={set("maxSize")} />
                </span>
              </div>
              <label className="plain-field">
                <span className="field-label">
                  Budget <small>(per person)</small> <i>*</i>
                </span>
                <span className="input-with-icon">
                  <Wallet size={20} />₹
                  <input required type="number" min="1" step="1" placeholder="60000" value={trip.budgetInr} onChange={set("budgetInr")} />
                </span>
              </label>
            </div>
            <div className="plain-field">
              <span className="field-label">Trip interests</span>
              <div className="interest-grid compact">
                {profile.interests.map((id) => {
                  const Icon = INTEREST_ICONS[id] ?? FALLBACK_ICON;
                  return (
                    <span key={id} className="interest-tile selected">
                      <span className="tick">
                        <Check size={14} strokeWidth={3} />
                      </span>
                      <Icon size={26} strokeWidth={1.6} />
                      <span>{interestLabel(id)}</span>
                    </span>
                  );
                })}
              </div>
              <small className="field-hint">
                Groups match on the creator’s interests. Change them in <Link to={ROUTES.PROFILE}>your profile</Link>.
              </small>
            </div>
          </div>
        </>
      )}

      {step === 1 && (
        <>
          <h1 className="wizard-title">
            Add your trip{" "}
            <span className="accent">
              itinerary
              <Swoosh className="orange" />
            </span>
          </h1>
          <p className="wizard-sub">Plan your trip day by day. Keep it flexible, your group can discuss the details.</p>
          <div className="form-panel">
            <label className="plain-field">
              <span className="field-label">
                Short description <i>*</i>
              </span>
              <input required maxLength={LIMITS.ITINERARY} placeholder="e.g. Temples, local street food and slow evenings in Gion." value={trip.summary} onChange={set("summary")} />
            </label>
            <div className="day-planner">
              <ol className="day-list">
                {dates.map((date, index) => (
                  <li key={date}>
                    <button type="button" className={index === activeDay ? "active" : ""} onClick={() => setActiveDay(index)}>
                      <strong>Day {index + 1}</strong>
                      <small>{formatDay(date)}</small>
                      {plan[index]?.activities.some((activity) => activity.text.trim()) && <span className="day-dot" />}
                    </button>
                  </li>
                ))}
              </ol>
              <div className="day-detail">
                <label className="day-title">
                  <span>Day {activeDay + 1} –</span>
                  <input placeholder="e.g. Arrival & Kyoto explore" value={day.title} onChange={(e) => updateDay({ title: e.target.value })} />
                </label>
                <ol className="timeline">
                  {day.activities.map((activity, index) => (
                    <li key={index}>
                      <TimePicker value={activity.time} onChange={(time) => updateActivity(index, { time })} />
                      <input placeholder="What are you doing?" value={activity.text} onChange={(e) => updateActivity(index, { text: e.target.value })} />
                      <button
                        type="button"
                        aria-label="Remove activity"
                        onClick={() => updateDay({ activities: day.activities.filter((_, i) => i !== index) })}
                      >
                        <Trash2 size={18} />
                      </button>
                    </li>
                  ))}
                </ol>
                <button type="button" className="add-activity" onClick={() => updateDay({ activities: [...day.activities, EMPTY_ACTIVITY] })}>
                  <Plus size={20} /> Add Activity
                </button>
              </div>
            </div>
            <small className="field-hint">
              Optional day plan. Days follow your travel dates. {itinerary.length}/{LIMITS.ITINERARY} characters.
            </small>
          </div>
        </>
      )}

      {step === 2 && (
        <>
          <h1 className="wizard-title">
            Set preferences &{" "}
            <span className="accent">
              publish
              <Swoosh className="orange" />
            </span>
          </h1>
          <p className="wizard-sub">Final details to find the right travel buddies for your trip.</p>
          <div className="form-panel pref-panel">
            <div className="pref-block">
              <span className="pref-title">
                <Users size={22} /> Gender preference
              </span>
              <div className="pill-options">
                {meta.genderPreferenceOptions.map((option) => {
                  const selected = genderPreference === option.id;
                  return (
                    <button
                      key={option.id}
                      type="button"
                      className={selected ? "selected" : ""}
                      aria-pressed={selected}
                      onClick={() => update({ genderPreference: option.id })}
                    >
                      {option.id === "SAME_GENDER" ? `${GENDER_GLYPHS[profile.gender] ?? ""} ${labelOf("gender", profile.gender)} only` : "Any"}
                      {selected && <Check size={16} />}
                    </button>
                  );
                })}
              </div>
              <small className="field-hint">
                Applies to this trip only. Only travellers this setting allows can request to join.
              </small>
            </div>
            <div className="pref-block">
              <span className="pref-title">
                <Layers size={22} /> Travel style
              </span>
              <div className="style-grid">
                {TRAVEL_STYLES.map((name) => {
                  const Icon = TRAVEL_STYLE_ICONS[name] ?? FALLBACK_ICON;
                  const selected = style === name;
                  return (
                    <button
                      key={name}
                      type="button"
                      className={`interest-tile ${selected ? "selected" : ""}`}
                      aria-pressed={selected}
                      onClick={() => setStyle(selected ? "" : name)}
                    >
                      {selected && (
                        <span className="tick">
                          <Check size={14} strokeWidth={3} />
                        </span>
                      )}
                      <Icon size={26} strokeWidth={1.6} />
                      <span>{name}</span>
                    </button>
                  );
                })}
              </div>
            </div>
            <div className="pref-block wide">
              <span className="pref-title">
                <ListChecks size={22} /> Trip rules <small>(optional)</small>
              </span>
              <div className="rule-box">
                {rules.map((rule) => (
                  <span key={rule} className="rule-chip">
                    {rule}
                    <button type="button" aria-label={`Remove ${rule}`} onClick={() => setRules(rules.filter((value) => value !== rule))}>
                      <X size={15} />
                    </button>
                  </span>
                ))}
                <input
                  placeholder="Add a rule and press Enter"
                  value={ruleDraft}
                  onChange={(e) => setRuleDraft(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key !== "Enter") return;
                    e.preventDefault();
                    addRule();
                  }}
                  onBlur={addRule}
                />
              </div>
            </div>
          </div>
          <div className="trip-summary">
            <CalendarDays size={26} />
            <div>
              <strong>{trip.name}</strong>
              <div className="review-grid">
                <span>
                  <MapPin size={17} /> {cityLabel}
                </span>
                <span>
                  <CalendarDays size={17} /> {formatDates(trip.checkIn, trip.checkOut)}
                </span>
                <span>
                  <Moon size={17} /> {dates.length} nights
                </span>
                <span>
                  <Users size={17} /> Up to {trip.maxSize}
                </span>
              </div>
            </div>
            <div className="summary-price">
              <strong>{formatMoney(Number(trip.budgetInr))}</strong>
              <small>per person</small>
            </div>
          </div>
        </>
      )}

      <Notice error>{error}</Notice>
      <div className="wizard-actions">
        {step > 0 ? (
          <button type="button" className="ghost-btn" onClick={() => setStep(step - 1)}>
            <ArrowLeft size={18} /> Back
          </button>
        ) : (
          <span />
        )}
        <button className="next-btn" disabled={busy}>
          {step === STEPS.length - 1 && <Rocket size={18} />}
          {busy ? "Publishing…" : step < STEPS.length - 1 ? `Next: ${STEPS[step + 1].label}` : "Publish Trip"}
          {step < STEPS.length - 1 && <ArrowRight size={18} />}
        </button>
      </div>
    </form>
  );
}
