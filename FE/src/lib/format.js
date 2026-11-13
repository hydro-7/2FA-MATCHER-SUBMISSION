import { ASSET_ORIGIN } from "../config/env";
import { CURRENCY, LOCALE } from "../constants/app";
import { LABELS } from "../constants/labels";

const money = new Intl.NumberFormat(LOCALE, {
  style: "currency",
  currency: CURRENCY,
  minimumFractionDigits: 0,
  maximumFractionDigits: 2,
});

export const formatMoney = (value) => (typeof value === "number" ? money.format(value) : "—");

// Trip dates are plain YYYY-MM-DD in the city's local time, so format them in UTC to avoid shifting a day.
function formatDate(value) {
  return new Date(`${value}T00:00:00Z`).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  });
}

export const formatDates = (start, end) => `${formatDate(start)} – ${formatDate(end)}`;

const DAY_MS = 86_400_000;
export const nightsBetween = (start, end) => Math.round((Date.parse(end) - Date.parse(start)) / DAY_MS);

export const addDays = (date, days) => new Date(Date.parse(`${date}T00:00:00Z`) + days * DAY_MS).toISOString().slice(0, 10);

export const formatDay = (date) => new Date(`${date}T00:00:00Z`).toLocaleDateString("en-GB", { day: "numeric", month: "short", timeZone: "UTC" });

export function formatClock(value) {
  const [hours, minutes] = value.split(":").map(Number);
  return `${hours % 12 || 12}:${String(minutes).padStart(2, "0")} ${hours >= 12 ? "PM" : "AM"}`;
}

export const formatTime = (iso) =>
  new Date(iso).toLocaleString("en-GB", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });

export const labelOf = (group, code) => LABELS[group][code] ?? code;

export const toOptions = (codes, group) => codes.map((code) => ({ id: code, label: labelOf(group, code) }));

export const assetUrl = (path) => (path ? new URL(path, `${ASSET_ORIGIN}/`).href : undefined);
