import { formatDay } from "./format";

// The API stores the itinerary as plain text, so the trip plan is written and read back in this line format.
const STYLE_PREFIX = "Travel style: ";
const RULES_PREFIX = "Trip rules: ";
const RULE_SEPARATOR = " · ";
const DAY_LINE = /^Day (\d+) · (.+?)(?: – (.*))?$/;
const ITEM_LINE = /^• (?:(\d{2}:\d{2}) )?(.*)$/;

export function formatItinerary({ summary, style, rules, dates, plan }) {
  const blocks = [summary.trim()];
  const meta = [style && `${STYLE_PREFIX}${style}`, rules.length > 0 && `${RULES_PREFIX}${rules.join(RULE_SEPARATOR)}`].filter(Boolean);
  if (meta.length) blocks.push(meta.join("\n"));
  dates.forEach((date, index) => {
    const day = plan[index];
    const items = (day?.activities ?? []).filter((activity) => activity.text.trim());
    if (!day?.title.trim() && !items.length) return;
    const heading = `Day ${index + 1} · ${formatDay(date)}${day.title.trim() ? ` – ${day.title.trim()}` : ""}`;
    blocks.push([heading, ...items.map((item) => `• ${item.time ? `${item.time} ` : ""}${item.text.trim()}`)].join("\n"));
  });
  return blocks.join("\n\n");
}

export function parseItinerary(text = "") {
  const result = { summary: [], style: "", rules: [], days: [] };
  for (const block of text.split(/\n\s*\n/)) {
    const lines = block.split("\n").map((line) => line.trim()).filter(Boolean);
    const day = lines[0]?.match(DAY_LINE);
    if (day) {
      result.days.push({
        number: Number(day[1]),
        date: day[2],
        title: day[3] ?? "",
        items: lines.slice(1).map((line) => {
          const item = line.match(ITEM_LINE);
          return item ? { time: item[1] ?? "", text: item[2] } : { time: "", text: line };
        }),
      });
      continue;
    }
    const rest = lines.filter((line) => {
      if (line.startsWith(STYLE_PREFIX)) result.style = line.slice(STYLE_PREFIX.length);
      else if (line.startsWith(RULES_PREFIX)) result.rules = line.slice(RULES_PREFIX.length).split(RULE_SEPARATOR);
      else return true;
      return false;
    });
    if (rest.length) result.summary.push(rest.join("\n"));
  }
  return { ...result, summary: result.summary.join("\n\n") };
}

// Trips written as one line ("Tsukiji market, Shibuya crossing at night, Akihabara") have no day plan:
// read the listed places so the map still has something to pin.
export function placesFromText(text = "", max = 8) {
  const parts = text
    .split(/[,;\n]|\.\s|\s(?:and|then)\s|\s[-–]\s/)
    .map((part) => part.replace(/\.$/, "").trim())
    .filter((part) => part.length >= 3 && part.length <= 60 && part.split(/\s+/).length <= 6);
  return [...new Set(parts)].slice(0, max).map((placeText) => ({ time: "", text: placeText }));
}
