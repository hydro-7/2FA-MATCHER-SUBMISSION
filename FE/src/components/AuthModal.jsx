import { useState } from "react";
import { useNavigate } from "react-router";
import { Check } from "lucide-react";
import { LIMITS } from "../constants/app";
import { FALLBACK_ICON, GENDER_GLYPHS, INTEREST_ICONS } from "../constants/icons";
import { ROUTES } from "../config/routes";
import { labelOf } from "../lib/format";
import { useMeta } from "../hooks/useMeta";
import { useResource } from "../hooks/useResource";
import { travellerService } from "../services/travellerService";
import { useSession } from "../store/session";
import { toast } from "../store/toast";
import { Dropdown } from "./Dropdown";
import { Field, Modal, Notice, RemoteState } from "./ui";

const EMPTY = { name: "", email: "", password: "", gender: "", homeCity: "", age: "", genderPreference: "", interests: [] };

const TITLES = { signin: "Sign in", signup: "Create your account", demo: "Switch traveller" };

// One popup for both: sign in, or sign up in two short steps (account, then travel details).
export function AuthModal({ initialTab, onClose }) {
  const [tab, setTab] = useState(TITLES[initialTab] ? initialTab : "signin");
  const [detailsStep, setDetailsStep] = useState(false);
  const signIn = useSession((state) => state.signIn);
  const navigate = useNavigate();
  const [form, setForm] = useState(EMPTY);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const change = (key) => (event) => setForm({ ...form, [key]: event.target.value });

  function finish(profile, greeting) {
    signIn(profile);
    toast(`${greeting} ${profile.name}!`);
    onClose();
    navigate(ROUTES.DISCOVER);
  }

  async function run(action) {
    setBusy(true);
    setError("");
    try {
      await action();
    } catch (failure) {
      setError(failure.message);
      setBusy(false);
    }
  }

  function submitSignIn(event) {
    event.preventDefault();
    run(async () => finish(await travellerService.signIn(form.email.trim(), form.password), "Welcome back,"));
  }

  function submitAccount(event) {
    event.preventDefault();
    setError("");
    setDetailsStep(true);
  }

  if (tab === "signup" && detailsStep)
    return (
      <Modal title="Your travel details" onClose={onClose} className="wide">
        <TravelDetails
          form={form}
          setForm={setForm}
          busy={busy}
          error={error}
          setError={setError}
          onBack={() => setDetailsStep(false)}
          onSubmit={(payload) => run(async () => finish(await travellerService.signUp(payload), "Welcome,"))}
        />
      </Modal>
    );

  return (
    <Modal title={TITLES[tab]} onClose={onClose}>
      <div className="auth-tabs" role="tablist">
        {[
          ["signin", "Sign in"],
          ["signup", "Sign up"],
          ["demo", "Demo"],
        ].map(([id, label]) => (
          <button
            key={id}
            type="button"
            role="tab"
            aria-selected={tab === id}
            className={tab === id ? "active" : ""}
            onClick={() => {
              setTab(id);
              setError("");
            }}
          >
            {label}
          </button>
        ))}
      </div>
      {tab === "demo" ? (
        <DemoSwitch busy={busy} error={error} onPick={(id) => run(async () => finish(await travellerService.demoSignIn(id), "Now travelling as"))} />
      ) : (
      <form className="auth-form" onSubmit={tab === "signin" ? submitSignIn : submitAccount}>
        <Notice error>{error}</Notice>
        {tab === "signup" && (
          <Field label="Full name">
            <input required autoFocus maxLength={LIMITS.NAME} autoComplete="name" value={form.name} onChange={change("name")} />
          </Field>
        )}
        <Field label="Email">
          <input required autoFocus={tab === "signin"} type="email" maxLength={200} autoComplete="email" value={form.email} onChange={change("email")} />
        </Field>
        <Field label="Password" hint={tab === "signup" ? "At least 8 characters." : undefined}>
          <input
            required
            type="password"
            minLength={tab === "signup" ? 8 : undefined}
            maxLength={200}
            autoComplete={tab === "signup" ? "new-password" : "current-password"}
            value={form.password}
            onChange={change("password")}
          />
        </Field>
        <button className="full" disabled={busy}>
          {tab === "signup" ? "Continue" : busy ? "Signing in…" : "Sign in"}
        </button>
      </form>
      )}
    </Modal>
  );
}

// Demo only: jump into any seeded traveller without a password.
function DemoSwitch({ busy, error, onPick }) {
  const currentId = useSession((state) => state.userId);
  const travellers = useResource(travellerService.demoList, "demo-travellers");
  const [selected, setSelected] = useState("");
  const [query, setQuery] = useState("");
  const options = travellers.data?.filter((person) => `${person.name} ${person.homeCity}`.toLowerCase().includes(query.trim().toLowerCase()));
  return (
    <div className="auth-form">
      <p className="muted">Jump into one of the seeded demo travellers. No password needed.</p>
      <Notice error>{error}</Notice>
      <RemoteState resource={travellers} />
      {options && (
        <div className="identity-picker">
          <Field label="Find a traveller">
            <input type="search" placeholder="Search by name or home city" value={query} onChange={(event) => setQuery(event.target.value)} />
          </Field>
          <div className="identity-list" role="group" aria-label="Travellers">
            {options.map((person) => (
              <label key={person.id} className={`identity-option${selected === person.id ? " selected" : ""}`}>
                <input type="radio" name="traveller" value={person.id} checked={selected === person.id} onChange={() => setSelected(person.id)} />
                <span>
                  <strong>{person.name}</strong>
                  <small>{person.homeCity}</small>
                </span>
                {person.id === currentId && <small className="identity-current">Current</small>}
              </label>
            ))}
            {!options.length && <p className="muted">No travellers found. Try another name or city.</p>}
          </div>
          <button className="full" disabled={busy || !selected || selected === currentId} onClick={() => onPick(selected)}>
            {busy ? "Switching…" : "Use this traveller"}
          </button>
        </div>
      )}
    </div>
  );
}

function TravelDetails({ form, setForm, busy, error, setError, onBack, onSubmit }) {
  const meta = useMeta();
  if (!meta.data) return <RemoteState resource={meta} />;
  const { genderOptions, genderPreferenceOptions, homeCityOptions, homeCities, interests, matchRules } = meta.data;
  const minInterests = 1;
  const toggleInterest = (id) =>
    setForm({ ...form, interests: form.interests.includes(id) ? form.interests.filter((value) => value !== id) : [...form.interests, id] });

  function submit(event) {
    event.preventDefault();
    if (!form.gender) return setError("Choose your gender.");
    if (!form.genderPreference) return setError("Choose who you want to travel with.");
    if (form.interests.length < minInterests) return setError(`Pick at least ${minInterests} interests.`);
    const homeCity = form.homeCity.trim();
    onSubmit({
      name: form.name.trim(),
      email: form.email.trim(),
      password: form.password,
      homeCity,
      homeAirport: homeCities.find((city) => city.city === homeCity)?.airport,
      age: form.age ? Number(form.age) : undefined,
      gender: form.gender,
      genderPreference: form.genderPreference,
      interests: form.interests,
    });
  }

  return (
    <form className="auth-form" onSubmit={submit}>
      <p className="muted">Choose at least one interest. A group match needs {matchRules.MIN_SHARED_INTERESTS} shared interests with its creator.</p>
      <Notice error>{error}</Notice>
      <div className="auth-grid">
        <Field label="Home city">
          <Dropdown
            freeText
            required
            maxLength={LIMITS.HOME_CITY}
            options={homeCityOptions}
            placeholder="e.g. Mumbai"
            value={form.homeCity}
            onChange={(event) => setForm({ ...form, homeCity: event.target.value })}
          />
        </Field>
        <Field label="Age (optional)">
          <input type="number" min={LIMITS.MIN_AGE} max={LIMITS.MAX_AGE} value={form.age} onChange={(event) => setForm({ ...form, age: event.target.value })} />
        </Field>
        <Choice label="Gender" options={genderOptions} value={form.gender} onPick={(gender) => setForm({ ...form, gender })} render={(option) => `${GENDER_GLYPHS[option.id] ?? ""} ${option.label}`} />
        <Choice
          label="Travel with"
          options={genderPreferenceOptions}
          value={form.genderPreference}
          onPick={(genderPreference) => setForm({ ...form, genderPreference })}
          render={(option) => (option.id === "SAME_GENDER" && form.gender ? `${labelOf("gender", form.gender)} only` : option.label)}
        />
      </div>
      <div className="field">
        <span>
          Interests <small>(pick at least {minInterests})</small>
        </span>
        <div className="auth-chips">
          {interests.map((interest) => {
            const Icon = INTEREST_ICONS[interest.id] ?? FALLBACK_ICON;
            const selected = form.interests.includes(interest.id);
            return (
              <button key={interest.id} type="button" className={selected ? "selected" : ""} aria-pressed={selected} onClick={() => toggleInterest(interest.id)}>
                {selected ? <Check size={15} strokeWidth={3} /> : <Icon size={15} />} {interest.label}
              </button>
            );
          })}
        </div>
      </div>
      <div className="actions">
        <button type="button" className="secondary" onClick={onBack}>
          Back
        </button>
        <button disabled={busy}>{busy ? "Creating account…" : "Create account"}</button>
      </div>
    </form>
  );
}

function Choice({ label, options, value, onPick, render }) {
  return (
    <div className="field">
      <span>{label}</span>
      <div className="auth-choice">
        {options.map((option) => (
          <button key={option.id} type="button" className={value === option.id ? "selected" : ""} aria-pressed={value === option.id} onClick={() => onPick(option.id)}>
            {render(option)}
          </button>
        ))}
      </div>
    </div>
  );
}

