import { ROUTES } from "../config/routes";

export const STORAGE_KEYS = {
  SESSION: "travel-matcher-session",
  GEOCODE: "travel-matcher-geocode",
  DRAFTS: "travel-matcher-drafts",
  SEARCH: "travel-matcher-search",
  THEME: "travel-matcher-theme",
};

// Nominatim allows one request per second; stay just under it.
export const GEOCODE = { SPACING_MS: 1100, VIEWBOX_DEG: 0.2, SHORT_WORDS: 3 };

export const REQUEST_TIMEOUT_MS = 30000;
export const CHAT_POLL_MS = 4000;
export const TOAST_MS = 3500;

export const HOTEL_PAGE_SIZE = 10;
export const HOTEL_STAR_OPTIONS = [1, 2, 3, 4, 5];

export const LOCALE = "en-IN";
export const CURRENCY = "INR";

export const PHOTO_CREDITS_PATH = "images/ATTRIBUTIONS.md";

export const LIMITS = {
  NAME: 100,
  HOME_CITY: 100,
  ITINERARY: 2000,
  MESSAGE: 1000,
  MIN_AGE: 18,
  MAX_AGE: 100,
};

export const BUDGET_SLIDER = { MIN: 10000, MAX: 300000, STEP: 1000 };

export const NAV_ITEMS = [
  { to: ROUTES.HOME, label: "Home" },
  { to: ROUTES.DISCOVER, label: "Groups" },
  { to: ROUTES.TRIPS, label: "My Trips" },
  { to: ROUTES.NEW_GROUP, label: "Create Trip" },
];

// Decorative covers keyed by catalog city name; unknown cities fall back to HERO_PHOTO.
export const CITY_PHOTOS = {
  Kyoto: "/cities/kyoto.jpg",
  Tokyo: "/cities/tokyo.jpg",
  Osaka: "/cities/osaka.jpg",
  Dubai: "/cities/dubai.jpg",
  "Abu Dhabi": "/cities/abu-dhabi.jpg",
};

export const CITY_PHOTO_CREDITS = "/cities/CREDITS.txt";

export const DISCOVER_SORTS = [
  { id: "BEST", label: "Best match" },
  { id: "BUDGET", label: "Lowest budget" },
  { id: "DATES", label: "Earliest dates" },
];

export const EMPTY_TRIP = { name: "", city: "", checkIn: "", checkOut: "", maxSize: "", budgetInr: "", summary: "" };

export const TRAVEL_STYLES = ["Budget", "Comfort", "Explorer", "Slow"];

export const RULE_SUGGESTIONS = ["Respect each other", "Be on time", "Share expenses equally"];

export const MY_TRIP_TABS = [
  { id: "all", label: "All Trips" },
  { id: "created", label: "Created" },
  { id: "joined", label: "Joined" },
  { id: "requests", label: "Requests" },
];

export const SEARCH_DEBOUNCE_MS = 400;

export const HERO_PHOTO = {
  SRC: "/hero/chureito-pagoda.jpg",
  CREDITS: "/hero/CREDITS.txt",
};

export const GROUP_TABS = [
  { path: "", label: "Overview", memberLabel: "Workspace" },
  { path: "map", label: "Map", membersOnly: true },
  { path: "itinerary", label: "Itinerary" },
  { path: "members", label: "Members" },
  { path: "stays", label: "Hotels", membersOnly: true },
  { path: "requests", label: "Requests", ownerOnly: true },
];
