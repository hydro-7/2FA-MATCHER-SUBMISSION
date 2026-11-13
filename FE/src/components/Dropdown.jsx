import { useEffect, useId, useRef, useState } from "react";
import { Check, ChevronDown } from "lucide-react";

// onChange gets { target: { value } } so callers can keep their native-input handlers.
export function Dropdown({ options = [], value = "", onChange, placeholder = "Choose an option", required, freeText, maxLength, className = "", ...rest }) {
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const root = useRef(null);
  const listId = useId();
  const emit = (next) => onChange?.({ target: { value: next } });
  const query = freeText ? value.trim().toLowerCase() : "";
  const shown = query ? options.filter((option) => option.label.toLowerCase().includes(query) || option.id.toLowerCase().includes(query)) : options;
  const selected = options.find((option) => option.id === value);

  useEffect(() => {
    if (!open) return;
    const close = (event) => !root.current?.contains(event.target) && setOpen(false);
    document.addEventListener("pointerdown", close);
    return () => document.removeEventListener("pointerdown", close);
  }, [open]);

  function pick(option) {
    emit(option.id);
    setOpen(false);
  }

  function onKeyDown(event) {
    if (event.key === "ArrowDown" || event.key === "ArrowUp") {
      event.preventDefault();
      if (!open) return setOpen(true);
      const step = event.key === "ArrowDown" ? 1 : -1;
      setActive((index) => (index + step + shown.length) % Math.max(shown.length, 1));
    } else if (event.key === "Enter" && open && shown[active]) {
      event.preventDefault();
      pick(shown[active]);
    } else if (event.key === "Escape") {
      setOpen(false);
    } else if (!freeText && (event.key === " " || event.key === "Enter")) {
      event.preventDefault();
      setOpen(true);
    }
  }

  const a11y = { role: "combobox", "aria-expanded": open, "aria-controls": listId, "aria-required": required, onKeyDown };

  return (
    <div ref={root} className={`dropdown ${open ? "open" : ""} ${className}`}>
      {freeText ? (
        <input
          {...rest}
          {...a11y}
          required={required}
          maxLength={maxLength}
          autoComplete="off"
          placeholder={placeholder}
          value={value}
          onChange={(event) => {
            emit(event.target.value);
            setActive(0);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
        />
      ) : (
        <>
          <button type="button" {...rest} {...a11y} className="dropdown-trigger" onClick={() => setOpen(!open)}>
            <span className={selected ? "" : "dropdown-placeholder"}>{selected?.label ?? placeholder}</span>
          </button>
          {required && <input className="dropdown-validate" tabIndex={-1} aria-hidden="true" required value={value} onChange={() => {}} />}
        </>
      )}
      <ChevronDown size={18} className="dropdown-chevron" aria-hidden="true" />
      {open && shown.length > 0 && (
        // preventDefault stops a wrapping <label> from re-clicking the trigger.
        <ul id={listId} role="listbox" className="dropdown-menu" onClick={(e) => e.preventDefault()}>
          {!freeText && !required && (
            <li role="option" aria-selected={!value} className={!value ? "selected" : ""} onPointerDown={(e) => e.preventDefault()} onClick={() => pick({ id: "" })}>
              {placeholder}
            </li>
          )}
          {shown.map((option, index) => (
            <li
              key={option.id}
              role="option"
              aria-selected={option.id === value}
              className={`${option.id === value ? "selected" : ""} ${index === active ? "active" : ""}`}
              onPointerDown={(e) => e.preventDefault()}
              onMouseEnter={() => setActive(index)}
              onClick={() => pick(option)}
            >
              <span>{option.label}</span>
              {option.id === value && <Check size={16} />}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
