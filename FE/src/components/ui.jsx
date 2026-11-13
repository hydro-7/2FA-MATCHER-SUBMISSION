import { Dropdown } from "./Dropdown";
import { useEffect, useRef } from "react";
import { formatMoney } from "../lib/format";

export function Notice({ children, error = false }) {
  if (!children) return null;
  return (
    <div className={`notice ${error ? "error" : ""}`} role={error ? "alert" : "status"}>
      {children}
    </div>
  );
}

export function Loading({ label = "Loading your travel plans…" }) {
  return (
    <div className="empty" role="status">
      <span className="status-dot" /> {label}
    </div>
  );
}

export function RemoteState({ resource }) {
  if (resource.loading && !resource.data) return <Loading />;
  if (!resource.error) return null;
  return (
    <div className="empty">
      <div className="empty-icon" aria-hidden="true">
        ◎
      </div>
      <h3>We couldn’t load this yet</h3>
      <Notice error>{resource.error}</Notice>
      <button className="secondary" onClick={resource.reload}>
        Try again
      </button>
    </div>
  );
}

export function Empty({ title, children }) {
  return (
    <div className="empty">
      <div className="empty-icon" aria-hidden="true">
        ↗
      </div>
      <h3>{title}</h3>
      {children && <p>{children}</p>}
    </div>
  );
}

export function Field({ label, hint, children }) {
  return (
    <label className="field">
      <span>{label}</span>
      {children}
      {hint && <small>{hint}</small>}
    </label>
  );
}

export function Select(props) {
  return <Dropdown {...props} />;
}

export function Chips({ options = [], selected = [], onChange }) {
  const toggle = (id) => onChange(selected.includes(id) ? selected.filter((value) => value !== id) : [...selected, id]);
  return (
    <div className="chips">
      {options.map((option) => (
        <button
          key={option.id}
          type="button"
          className={`chip ${selected.includes(option.id) ? "selected" : ""}`}
          aria-pressed={selected.includes(option.id)}
          onClick={() => toggle(option.id)}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}

export function RuleChips({ rules = [] }) {
  return (
    <div className="chips">
      {rules.map((rule) => (
        <span key={rule.id} className={`chip ${rule.pass ? "selected" : "failed"}`} title={rule.label}>
          {rule.pass ? "✓" : "✗"} {rule.detail}
        </span>
      ))}
    </div>
  );
}

export function Avatar({ person, large = false }) {
  return <span className={`avatar ${large ? "large" : ""}`}>{person?.name?.charAt(0).toUpperCase() || "?"}</span>;
}

export function Money({ value }) {
  return <>{formatMoney(value)}</>;
}

export function Modal({ title, onClose, children, className }) {
  const dialog = useRef(null);
  useEffect(() => {
    const element = dialog.current;
    element.showModal();
    return () => element.close();
  }, []);
  return (
    <dialog
      ref={dialog}
      className={className}
      aria-labelledby="dialog-title"
      onCancel={(event) => {
        event.preventDefault();
        onClose();
      }}
    >
      <div className="dialog-header">
        <h2 id="dialog-title">{title}</h2>
        <button className="icon-button" aria-label="Close dialog" onClick={onClose}>
          ×
        </button>
      </div>
      {children}
    </dialog>
  );
}
