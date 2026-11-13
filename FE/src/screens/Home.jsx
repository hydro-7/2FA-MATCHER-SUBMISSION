import { useEffect, useState } from "react";
import { createSearchParams, Link, useNavigate } from "react-router";
import { BedDouble, CalendarDays, MapPin, PenSquare, Plus, Search, Users, Wallet } from "lucide-react";
import { CITY_PHOTOS } from "../constants/app";
import { ROUTES } from "../config/routes";
import { useMeta } from "../hooks/useMeta";
import { useSession } from "../store/session";
import { Swoosh } from "../components/Swoosh";
import { Dropdown } from "../components/Dropdown";

const STEPS = [
  { icon: PenSquare, tone: "blue", title: "Share your plan", text: "Tell us where, when and what you love." },
  { icon: Users, tone: "purple", title: "Find your people", text: "Get matched with travellers who share your vibe." },
  { icon: BedDouble, tone: "green", title: "Plan & book together", text: "Choose stays, split costs and manage your trip in one place." },
];

const HERO_CITIES = ["Tokyo", "Kyoto", "Osaka", "Dubai", "Abu Dhabi"];

function HeroPhotos() {
  const [active, setActive] = useState(0);

  useEffect(() => {
    const motion = window.matchMedia("(prefers-reduced-motion: reduce)");
    const timer = window.setInterval(() => {
      if (!document.hidden && !motion.matches) {
        setActive((current) => (current + 1) % HERO_CITIES.length);
      }
    }, 5000);
    return () => window.clearInterval(timer);
  }, []);

  return (
    <>
      {HERO_CITIES.map((city, index) => (
        <img
          key={city}
          className={`hero-slide${index === active ? " is-active" : ""}`}
          src={CITY_PHOTOS[city]}
          alt=""
          aria-hidden="true"
          decoding="async"
        />
      ))}
      <span className="hero-city-label"><MapPin size={16} /> {HERO_CITIES[active]}</span>
    </>
  );
}

function SearchBar({ meta }) {
  const navigate = useNavigate();
  const savedBudget = useSession((state) => state.budget);
  const [form, setForm] = useState({ city: "", checkIn: "", checkOut: "", budget: savedBudget });
  const change = (key) => (event) => setForm({ ...form, [key]: event.target.value });
  const { FIRST_CHECK_IN, LAST_CHECK_OUT } = meta.dateWindow;

  function submit(event) {
    event.preventDefault();
    const params = Object.fromEntries(Object.entries(form).filter(([, value]) => value));
    navigate({ pathname: ROUTES.DISCOVER, search: `?${createSearchParams(params)}` });
  }

  return (
    <form className="search-bar" onSubmit={submit}>
      <label className="search-field">
        <span className="field-icon">
          <MapPin size={20} />
        </span>
        <span className="field-body">
          <small>Where to?</small>
          <Dropdown required options={meta.cityOptions} placeholder="Choose a city" value={form.city} onChange={change("city")} />
        </span>
      </label>
      <div className="search-field">
        <span className="field-icon">
          <CalendarDays size={20} />
        </span>
        <span className="field-body">
          <span className="date-range">
            <label className="date-endpoint">
              <small>From</small>
              <input required type="date" aria-label="From date" min={FIRST_CHECK_IN} max={LAST_CHECK_OUT} value={form.checkIn} onChange={change("checkIn")} />
            </label>
            <label className="date-endpoint">
              <small>To</small>
              <input
                required
                type="date"
                aria-label="To date"
                min={form.checkIn || FIRST_CHECK_IN}
                max={LAST_CHECK_OUT}
                value={form.checkOut}
                onChange={change("checkOut")}
              />
            </label>
          </span>
        </span>
      </div>
      <label className="search-field">
        <span className="field-icon">
          <Wallet size={20} />
        </span>
        <span className="field-body">
          <small>Budget (per person)</small>
          <span className="budget">
            ₹<input type="number" min="1" placeholder="60,000" value={form.budget} onChange={change("budget")} />
          </span>
        </span>
      </label>
      <button className="find-btn">
        <Search size={20} /> Find Groups
      </button>
    </form>
  );
}

export function Home() {
  const meta = useMeta();
  const data = meta.data;
  return (
    <div className="landing">
      <section className="landing-hero">
        <div className="hero-copy">
          <h1>
            Turn solo plans into a <br />
            <span className="accent">
              shared adventure.
              <Swoosh className="blue" />
            </span>
          </h1>
          <p>Find like-minded travellers, plan together, split costs, book stays and create better travel stories.</p>
          <div className="hero-ctas">
            <Link to={ROUTES.DISCOVER} className="cta cta-primary">
              <Users size={20} /> Find a Group
            </Link>
            <Link to={ROUTES.NEW_GROUP} className="cta cta-ghost">
              <Plus size={20} /> Create a Trip
            </Link>
          </div>
        </div>
        <div className="hero-photo">
          <HeroPhotos />
        </div>
        {data && <SearchBar meta={data} />}
      </section>

      <section className="journey">
        <h2>
          Start your journey in{" "}
          <span className="accent">
            {STEPS.length} simple steps
            <Swoosh className="orange" />
          </span>
        </h2>
        <div className="journey-steps">
          {STEPS.map((step, index) => (
            <article key={step.title} className="journey-card">
              <span className={`journey-icon ${step.tone}`}>
                <step.icon size={30} />
              </span>
              <div>
                <h3>
                  {index + 1}. {step.title}
                </h3>
                <p>{step.text}</p>
              </div>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}

export function Start() {
  const navigate = useNavigate();
  const profile = useSession((state) => state.profile);
  return (
    <section className="narrow">
      <span className="eyebrow">YOU’RE READY TO GO</span>
      <h1>Where do we start, {profile.name}?</h1>
      <p className="lede">Lead an adventure or find a group that feels like you.</p>
      <div className="choice-grid">
        <button className="choice" onClick={() => navigate(ROUTES.NEW_GROUP)}>
          <span>＋</span>
          <h2>Plan a trip</h2>
          <p>Create a group and welcome your travel companions.</p>
          <strong>Create a group →</strong>
        </button>
        <button className="choice" onClick={() => navigate(ROUTES.DISCOVER)}>
          <span>◎</span>
          <h2>Find your people</h2>
          <p>Discover trips that fit your interests, dates and budget.</p>
          <strong>Explore groups →</strong>
        </button>
      </div>
    </section>
  );
}
