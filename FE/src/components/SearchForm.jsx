import { useState } from "react";
import { Chips, Field, Notice, Select } from "./ui";

export function SearchForm({
  meta,
  profile,
  initial,
  onSearch,
  disabled = false,
}) {
  const [form, setForm] = useState(
    initial ?? {
      homeCity: profile.homeCity,
      city: "",
      checkIn: "",
      checkOut: "",
      budgetInr: "",
      genderPreference: profile.genderPreference,
      interests: profile.interests,
    },
  );
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const change = (key) => (event) =>
    setForm({ ...form, [key]: event.target.value });
  const { FIRST_CHECK_IN, LAST_CHECK_OUT } = meta.dateWindow;

  async function submit(event) {
    event.preventDefault();
    if (form.checkOut <= form.checkIn)
      return setError("Check-out must be after check-in.");
    setBusy(true);
    setError("");
    try {
      await onSearch({ ...form, budgetInr: Number(form.budgetInr) });
    } catch (failure) {
      setError(failure.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="panel">
      <div className="section-heading">
        <div>
          <span className="eyebrow">YOUR NEXT CHAPTER</span>
          <h2>Where are you headed?</h2>
        </div>
        <span className="badge">Find your fit</span>
      </div>
      <form onSubmit={submit}>
        <div className="form-grid">
          <Field label="Destination">
            <Select
              required
              options={meta.cityOptions}
              value={form.city}
              onChange={change("city")}
            />
          </Field>
          <Field label="Check-in">
            <input
              required
              type="date"
              min={FIRST_CHECK_IN}
              max={LAST_CHECK_OUT}
              value={form.checkIn}
              onChange={change("checkIn")}
            />
          </Field>
          <Field label="Check-out">
            <input
              required
              type="date"
              min={form.checkIn || FIRST_CHECK_IN}
              max={LAST_CHECK_OUT}
              value={form.checkOut}
              onChange={change("checkOut")}
            />
          </Field>
          <Field
            label="Budget per person (INR)"
            hint="Approximate overall trip budget."
          >
            <input
              required
              type="number"
              min="1"
              step="1"
              value={form.budgetInr}
              onChange={change("budgetInr")}
            />
          </Field>
          <Field label="Group gender preference">
            <Select
              required
              options={meta.genderPreferenceOptions}
              value={form.genderPreference}
              onChange={change("genderPreference")}
            />
          </Field>
        </div>
        <details className="interest-picker">
          <summary>
            Trip interests <span>{form.interests.length} selected</span>
          </summary>
          <p className="caption">
            Choose what you’d like to share on this trip.
          </p>
          <Chips
            options={meta.interests}
            selected={form.interests}
            onChange={(interests) => setForm({ ...form, interests })}
          />
        </details>
        <Notice error>{error}</Notice>
        <button disabled={busy || disabled || form.interests.length === 0}>
          {busy ? "Finding groups…" : "Find compatible groups →"}
        </button>
      </form>
    </div>
  );
}
