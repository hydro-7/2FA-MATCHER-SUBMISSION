import { useEffect, useRef, useState } from "react";
import { Clock } from "lucide-react";
import { formatClock } from "../lib/format";

const HOURS = [12, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11];
const MINUTES = [0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55];
const pad = (n) => String(n).padStart(2, "0");

function split(value) {
  if (!value) return { hour: 9, minute: 0, pm: false };
  const [h, m] = value.split(":").map(Number);
  return { hour: h % 12 || 12, minute: m, pm: h >= 12 };
}

const join = ({ hour, minute, pm }) => `${pad((hour % 12) + (pm ? 12 : 0))}:${pad(minute)}`;

// Twelve positions on the dial, starting at the top and going clockwise.
function position(index) {
  const angle = (index * 30 - 90) * (Math.PI / 180);
  return { left: `${50 + 38 * Math.cos(angle)}%`, top: `${50 + 38 * Math.sin(angle)}%` };
}

// value and onChange use 24-hour "HH:mm", like <input type="time">.
export function TimePicker({ value, onChange, label = "Time" }) {
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState("hour");
  const root = useRef(null);
  const time = split(value);
  const set = (patch) => onChange(join({ ...time, ...patch }));
  const selectedIndex = mode === "hour" ? HOURS.indexOf(time.hour) : Math.round(time.minute / 5) % 12;

  useEffect(() => {
    if (!open) return;
    const close = (event) => !root.current?.contains(event.target) && setOpen(false);
    const escape = (event) => event.key === "Escape" && setOpen(false);
    document.addEventListener("pointerdown", close);
    document.addEventListener("keydown", escape);
    return () => {
      document.removeEventListener("pointerdown", close);
      document.removeEventListener("keydown", escape);
    };
  }, [open]);

  return (
    <div ref={root} className="time-picker">
      <button
        type="button"
        className={`time-trigger ${value ? "" : "empty"}`}
        aria-label={label}
        aria-expanded={open}
        onClick={() => {
          if (!value) onChange(join(time));
          setMode("hour");
          setOpen(!open);
        }}
      >
        <Clock size={16} /> {value ? formatClock(value) : "Set time"}
      </button>
      {open && (
        <div className="clock-pop" role="dialog" aria-label={`${label} picker`}>
          <div className="clock-head">
            <button type="button" className={mode === "hour" ? "on" : ""} onClick={() => setMode("hour")}>
              {time.hour}
            </button>
            <span>:</span>
            <button type="button" className={mode === "minute" ? "on" : ""} onClick={() => setMode("minute")}>
              {pad(time.minute)}
            </button>
            <div className="ampm">
              <button type="button" className={time.pm ? "" : "on"} onClick={() => set({ pm: false })}>
                AM
              </button>
              <button type="button" className={time.pm ? "on" : ""} onClick={() => set({ pm: true })}>
                PM
              </button>
            </div>
          </div>
          <div className="clock-face">
            <span className="clock-hand" style={{ transform: `rotate(${selectedIndex * 30}deg)` }} />
            <span className="clock-center" />
            {(mode === "hour" ? HOURS : MINUTES).map((item, index) => {
              const selected = index === selectedIndex;
              return (
                <button
                  key={item}
                  type="button"
                  className={`clock-num ${selected ? "on" : ""}`}
                  style={position(index)}
                  onClick={() => {
                    if (mode === "hour") {
                      set({ hour: item });
                      setMode("minute");
                    } else {
                      set({ minute: item });
                      setOpen(false);
                    }
                  }}
                >
                  {mode === "hour" ? item : pad(item)}
                </button>
              );
            })}
          </div>
          <div className="clock-foot">
            <button
              type="button"
              onClick={() => {
                onChange("");
                setOpen(false);
              }}
            >
              Clear
            </button>
            <button type="button" className="done" onClick={() => setOpen(false)}>
              Done
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
