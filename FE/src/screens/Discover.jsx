import { useEffect, useRef, useState } from "react";
import { Link, useSearchParams } from "react-router";
import {
  ArrowRight,
  CalendarDays,
  CircleAlert,
  Filter,
  Layers,
  List,
  MapPin,
  Sparkles,
  Wand2,
  Moon,
  Search,
  Users,
  Zap,
} from "lucide-react";
import {
  BUDGET_SLIDER,
  CITY_PHOTOS,
  DISCOVER_SORTS,
  HERO_PHOTO,
  SEARCH_DEBOUNCE_MS,
} from "../constants/app";
import { ROUTES } from "../config/routes";
import {
  formatDates,
  formatMoney,
  labelOf,
  nightsBetween,
} from "../lib/format";
import { searchCriteriaError, searchCriteriaKey } from "../lib/searchCriteria";
import { useMeta } from "../hooks/useMeta";
import { matchService } from "../services/matchService";
import { requestService } from "../services/requestService";
import { useSearch } from "../store/search";
import { useSession } from "../store/session";
import { toast } from "../store/toast";
import { Dropdown } from "../components/Dropdown";
import { SwipeDeck } from "../components/SwipeDeck";
import { Notice, RemoteState } from "../components/ui";
import "../discovery-acceptance.css";

const VISIBLE_INTERESTS = 6;
const RESULTS_PER_PAGE = 8;

const SORTERS = {
  BEST: () => 0,
  BUDGET: (a, b) => a.budgetInr - b.budgetInr,
  DATES: (a, b) => a.checkIn.localeCompare(b.checkIn),
};

export function Discover() {
  const meta = useMeta();
  return (
    <div className="discover">
      <RemoteState resource={meta} />
      {meta.data && <DiscoverBody meta={meta.data} />}
    </div>
  );
}

function initialFilters(meta, profile, params, saved) {
  // The URL wins for what it carries; everything else comes from the saved search.
  if (saved)
    return {
      ...saved,
      sharedInterests: saved.sharedInterests ?? [],
      city: params.get("city") ?? saved.city,
      checkIn: params.get("checkIn") ?? saved.checkIn,
      checkOut: params.get("checkOut") ?? saved.checkOut,
      budgetInr: params.get("budget") ?? saved.budgetInr,
    };
  return {
    homeCity: profile.homeCity,
    city: params.get("city") ?? "",
    checkIn: params.get("checkIn") ?? meta.dateWindow.FIRST_CHECK_IN,
    checkOut: params.get("checkOut") ?? meta.dateWindow.LAST_CHECK_OUT,
    budgetInr: params.get("budget") || useSession.getState().budget || "",
    interests: profile.interests,
    genderPreference: profile.genderPreference,
    genderMix: "",
    sharedInterests: [],
  };
}

function DiscoverBody({ meta }) {
  const profile = useSession((state) => state.profile);
  const search = useSearch();
  const [params, setParams] = useSearchParams();
  const [filters, setFilters] = useState(() =>
    initialFilters(
      meta,
      profile,
      params,
      search.travellerId === profile.id ? search.criteria : null,
    ),
  );
  const [query, setQuery] = useState("");
  const sort = search.view.sort || DISCOVER_SORTS[0].id;
  const setSort = (value) => search.setView({ sort: value });
  const [showAllInterests, setShowAllInterests] = useState(false);
  const [loading, setLoading] = useState(false);
  const view = search.view.mode;
  const setView = (mode) => search.setView({ mode });
  const [joining, setJoining] = useState(false);
  const [error, setError] = useState("");
  const [joinError, setJoinError] = useState("");
  const [retry, setRetry] = useState(0);
  const [page, setPage] = useState(1);
  const resultHeading = useRef(null);
  const latest = useRef(0);
  const criteriaKey = searchCriteriaKey(filters);
  const missing = searchCriteriaError(filters, meta);
  const result =
    !missing &&
    !error &&
    search.travellerId === profile.id &&
    searchCriteriaKey(search.criteria ?? {}) === criteriaKey
      ? search.result
      : null;
  const { FIRST_CHECK_IN, LAST_CHECK_OUT } = meta.dateWindow;
  const set = (patch) =>
    setFilters((current) => {
      const next = { ...current, ...patch };
      return {
        ...next,
        sharedInterests: next.sharedInterests.filter((id) =>
          next.interests.includes(id),
        ),
      };
    });
  const interestLabel = (id) =>
    meta.interests.find((interest) => interest.id === id)?.label ?? id;

  useEffect(() => {
    const ticket = ++latest.current;
    let active = true;
    search.beginSearch(profile.id, filters);
    setError("");
    setJoinError("");
    setPage(1);
    setLoading(!missing);
    if (missing)
      return () => {
        active = false;
      };
    const timer = setTimeout(async () => {
      setParams(
        {
          city: filters.city,
          checkIn: filters.checkIn,
          checkOut: filters.checkOut,
          budget: filters.budgetInr,
        },
        { replace: true },
      );
      try {
        const { genderMix, sharedInterests, ...criteria } = filters;
        const resultFilters = {
          genderMix: genderMix || undefined,
          sharedInterests,
        };
        const data = await matchService.search({
          ...criteria,
          homeCity: criteria.homeCity.trim(),
          budgetInr: Number(criteria.budgetInr),
          filters: resultFilters,
        });
        if (active && ticket === latest.current)
          search.setResult(profile.id, filters, resultFilters, data);
      } catch (failure) {
        if (active && ticket === latest.current) setError(failure.message);
      } finally {
        if (active && ticket === latest.current) setLoading(false);
      }
    }, SEARCH_DEBOUNCE_MS);
    return () => {
      active = false;
      clearTimeout(timer);
    };
    // Re-search only when the criteria change.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters, missing, profile.id, retry]);

  async function join(match) {
    if (
      joining ||
      loading ||
      !result ||
      useSearch.getState().result?.searchId !== result.searchId ||
      match.myRequestStatus ||
      match.seatsLeft === 0
    )
      return;
    setJoining(true);
    setJoinError("");
    try {
      await requestService.create(match.groupId, result.searchId);
      search.markRequested(match.groupId, result.searchId);
      toast("Request sent. You’ll join once the creator approves.");
    } catch (failure) {
      setJoinError(failure.message);
    } finally {
      setJoining(false);
    }
  }

  function clearAll() {
    setFilters({
      ...initialFilters(meta, profile, new URLSearchParams(), null),
      city: filters.city,
    });
    setQuery("");
  }

  const needle = query.trim().toLowerCase();
  const matches = (result?.matches ?? [])
    .filter(
      (match) =>
        !needle ||
        [match.name, match.city, ...match.interests.map(interestLabel)].some(
          (text) => text.toLowerCase().includes(needle),
        ),
    )
    .sort(SORTERS[sort]);
  const interests = showAllInterests
    ? meta.interests
    : meta.interests.slice(0, VISIBLE_INTERESTS);
  const sharedOptions = meta.interests.filter((interest) =>
    filters.interests.includes(interest.id),
  );
  const pages = Math.max(1, Math.ceil(matches.length / RESULTS_PER_PAGE));
  const currentPage = Math.min(page, pages);
  const pageMatches = matches.slice(
    (currentPage - 1) * RESULTS_PER_PAGE,
    currentPage * RESULTS_PER_PAGE,
  );
  useEffect(() => setPage(1), [sort, query]);
  const toggleInterest = (id, on) =>
    set({
      interests: on
        ? [...filters.interests, id]
        : filters.interests.filter((value) => value !== id),
    });

  return (
    <>
      <header className="discover-head">
        <div>
          <h1>Discover Groups</h1>
          <p>
            Find travel groups that match your dates, destination and interests.
          </p>
        </div>
        <label className="discover-search">
          <Search size={20} />
          <input
            type="search"
            placeholder="Search groups, destinations or interests…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </label>
        <div className="sort-box">
          <span>Sort by:</span>
          <Dropdown
            required
            options={DISCOVER_SORTS}
            value={sort}
            onChange={(e) => setSort(e.target.value)}
          />
        </div>
      </header>

      <div className="discover-layout">
        <aside className="filter-card">
          <div className="filter-title">
            <h2>
              <Filter size={20} /> Filters
            </h2>
            <button type="button" className="link-btn" onClick={clearAll}>
              Clear all
            </button>
          </div>

          <div className="filter-group">
            <label className="filter-label" htmlFor="search-home-city">
              Home city
            </label>
            <div className="boxed">
              <input
                id="search-home-city"
                type="text"
                maxLength={100}
                value={filters.homeCity}
                onChange={(event) => set({ homeCity: event.target.value })}
              />
            </div>
            <small className="discovery-help">
              Your starting city. It doesn’t affect compatibility.
            </small>
          </div>

          <div className="filter-group">
            <span className="filter-label">Destination</span>
            <div className="boxed with-icon">
              <MapPin size={18} />
              <Dropdown
                required
                options={meta.cityOptions}
                placeholder="Choose a city"
                value={filters.city}
                onChange={(e) => set({ city: e.target.value })}
              />
            </div>
          </div>

          <div className="filter-group">
            <span className="filter-label">
              Travel dates <small>(overlap)</small>
            </span>
            <div className="date-stack">
              <label className="boxed with-icon dates">
                <CalendarDays size={18} />
                <small>From</small>
                <input
                  type="date"
                  aria-label="Check-in"
                  min={FIRST_CHECK_IN}
                  max={LAST_CHECK_OUT}
                  value={filters.checkIn}
                  onChange={(e) => set({ checkIn: e.target.value })}
                />
              </label>
              <label className="boxed with-icon dates">
                <CalendarDays size={18} />
                <small>To</small>
                <input
                  type="date"
                  aria-label="Check-out"
                  min={filters.checkIn || FIRST_CHECK_IN}
                  max={LAST_CHECK_OUT}
                  value={filters.checkOut}
                  onChange={(e) => set({ checkOut: e.target.value })}
                />
              </label>
            </div>
          </div>

          <div className="filter-group">
            <span className="filter-label">
              Budget <small>(per person)</small>
              <b>
                {filters.budgetInr
                  ? formatMoney(Number(filters.budgetInr))
                  : "—"}
              </b>
            </span>
            <div className="boxed">
              <input
                type="number"
                aria-label="Budget amount (INR)"
                min="1"
                step="1"
                placeholder="e.g. 62001"
                value={filters.budgetInr}
                onChange={(event) => set({ budgetInr: event.target.value })}
              />
            </div>
            <input
              type="range"
              className="range"
              aria-label="Budget per person"
              min={BUDGET_SLIDER.MIN}
              max={BUDGET_SLIDER.MAX}
              step={BUDGET_SLIDER.STEP}
              value={filters.budgetInr || BUDGET_SLIDER.MIN}
              onChange={(e) => set({ budgetInr: e.target.value })}
            />
            <div className="range-ends">
              <span>{formatMoney(BUDGET_SLIDER.MIN)}</span>
              <span>{formatMoney(BUDGET_SLIDER.MAX)}</span>
            </div>
            <small className="discovery-help">
              Enter any positive whole-rupee amount. The slider is a shortcut.
            </small>
          </div>

          <div className="filter-group">
            <span className="filter-label">Your interests</span>
            {interests.map((interest) => (
              <label key={interest.id} className="check-row">
                <input
                  type="checkbox"
                  checked={filters.interests.includes(interest.id)}
                  onChange={(e) =>
                    toggleInterest(interest.id, e.target.checked)
                  }
                />
                {interest.label}
              </label>
            ))}
            <button
              type="button"
              className="link-btn"
              onClick={() => setShowAllInterests(!showAllInterests)}
            >
              {showAllInterests
                ? "Show fewer"
                : `Show all ${meta.interests.length}`}
            </button>
          </div>

          <div className="filter-group">
            <span className="filter-label">Gender preference</span>
            <div className="boxed">
              <Dropdown
                required
                options={meta.genderPreferenceOptions}
                value={filters.genderPreference}
                onChange={(e) => set({ genderPreference: e.target.value })}
              />
            </div>
          </div>

          <details className="filter-group shared-result-filter">
            <summary className="filter-label">
              Required shared interests
            </summary>
            <p className="discovery-help">
              Only show groups whose owner shares every selected interest. This
              narrows your matches.
            </p>
            {sharedOptions.map((interest) => (
              <label key={interest.id} className="check-row">
                <input
                  type="checkbox"
                  aria-label={`Require shared: ${interest.label}`}
                  checked={filters.sharedInterests.includes(interest.id)}
                  onChange={(event) =>
                    set({
                      sharedInterests: event.target.checked
                        ? [...filters.sharedInterests, interest.id]
                        : filters.sharedInterests.filter(
                            (id) => id !== interest.id,
                          ),
                    })
                  }
                />
                {interest.label}
              </label>
            ))}
          </details>

          <div className="filter-group">
            <span className="filter-label">Group mix</span>
            <div className="boxed">
              <Dropdown
                options={meta.genderMixOptions}
                placeholder="Any"
                value={filters.genderMix}
                onChange={(e) => set({ genderMix: e.target.value })}
              />
            </div>
          </div>
        </aside>

        <section className="results">
          <div className="results-head" ref={resultHeading}>
            <h2 className="results-count">
              {missing
                ? "Set your trip"
                : error
                  ? "Search unavailable"
                  : !result
                    ? "Finding groups…"
                    : `${matches.length} matching ${matches.length === 1 ? "group" : "groups"}`}
            </h2>
            <div className="view-toggle" role="group" aria-label="Result view">
              <button
                type="button"
                className={view === "list" ? "active" : ""}
                aria-pressed={view === "list"}
                onClick={() => setView("list")}
              >
                <List size={18} /> List
              </button>
              <button
                type="button"
                className={view === "swipe" ? "active" : ""}
                aria-pressed={view === "swipe"}
                onClick={() => setView("swipe")}
              >
                <Layers size={18} /> Swipe
              </button>
            </div>
          </div>
          <Notice error>{error}</Notice>
          <Notice error>{joinError}</Notice>
          {missing ? (
            <div className="results-empty">{missing}</div>
          ) : error ? (
            <div className="results-empty">
              <p>
                Your previous results have been cleared. Retry to search with
                the current details.
              </p>
              <button
                className="secondary"
                onClick={() => setRetry((value) => value + 1)}
              >
                Retry search
              </button>
            </div>
          ) : !result ? (
            <div className="results-empty" role="status">
              Finding compatible groups…
            </div>
          ) : (
            <div className="match-list">
              {result.totalMatches > result.matches.length && (
                <p className="discovery-help">
                  Showing the {result.matches.length} highest-ranked matches out
                  of {result.totalMatches}. Sorting and text search apply to
                  this selection.
                </p>
              )}
              {result && matches.length === 0 && (
                <div className="results-empty">
                  No groups match yet. Try other dates, a wider budget or more
                  interests.
                </div>
              )}
              {view === "swipe" && matches.length > 0 ? (
                <SwipeDeck
                  key={`${result.searchId}-${sort}-${needle}`}
                  matches={matches}
                  busy={joining}
                  onRequest={join}
                  renderCard={(match) => (
                    <MatchCard
                      match={match}
                      searchId={result.searchId}
                      interestLabel={interestLabel}
                    />
                  )}
                />
              ) : (
                pageMatches.map((match) => (
                  <MatchCard
                    key={match.groupId}
                    match={match}
                    searchId={result.searchId}
                    interestLabel={interestLabel}
                  />
                ))
              )}
              {view === "list" && pages > 1 && (
                <nav
                  className="discovery-pagination"
                  aria-label="Group result pages"
                >
                  <button
                    className="secondary"
                    disabled={currentPage === 1}
                    onClick={() => {
                      setPage(currentPage - 1);
                      resultHeading.current?.scrollIntoView({ block: "start" });
                    }}
                  >
                    Previous page
                  </button>
                  <span aria-live="polite">
                    Page {currentPage} of {pages}
                  </span>
                  <button
                    className="secondary"
                    disabled={currentPage === pages}
                    onClick={() => {
                      setPage(currentPage + 1);
                      resultHeading.current?.scrollIntoView({ block: "start" });
                    }}
                  >
                    Next page
                  </button>
                </nav>
              )}
              <NearMisses
                key={result?.searchId}
                groups={result?.nearMisses ?? []}
                filters={filters}
                onFix={set}
              />
            </div>
          )}
        </section>
      </div>
    </>
  );
}

function MatchCard({ match, searchId, interestLabel }) {
  const to = ROUTES.GROUP(match.groupId);
  const state = { match, searchId };
  return (
    <article className="match-card">
      <Link
        to={to}
        state={state}
        className="match-photo"
        style={{
          backgroundImage: `url("${CITY_PHOTOS[match.city] ?? HERO_PHOTO.SRC}")`,
        }}
        aria-label={match.name}
      />
      <div className="match-body">
        <div className="match-tags">
          <span className="tag-green">
            <Zap size={14} fill="currentColor" /> {Math.round(match.score)}%
            Match
          </span>
          <span className="tag-orange">
            <Users size={14} /> {match.seatsLeft}{" "}
            {match.seatsLeft === 1 ? "spot" : "spots"} left
          </span>
          {match.myRequestStatus && (
            <span className="tag-blue">
              Request{" "}
              {labelOf("requestStatus", match.myRequestStatus).toLowerCase()}
            </span>
          )}
        </div>
        <h3>
          <Link to={to} state={state}>
            {match.name}
          </Link>
        </h3>
        <div className="match-meta">
          <span>
            <MapPin size={16} /> {match.city}
          </span>
          <span>
            <CalendarDays size={16} />{" "}
            {formatDates(match.checkIn, match.checkOut)}
          </span>
          <span>
            <Moon size={16} /> {nightsBetween(match.checkIn, match.checkOut)}{" "}
            nights
          </span>
        </div>
        <div className="match-people">
          <span>
            <Users size={15} /> {match.memberCount}/{match.maxSize} travellers
          </span>
          <span>Hosted by {match.ownerName}</span>
        </div>
        <p className="match-desc">{match.itinerary}</p>
        <div className="match-interests">
          {match.interests.map((id) => (
            <span key={id}>{interestLabel(id)}</span>
          ))}
        </div>
      </div>
      <div className="match-side">
        <div className="match-price">
          <strong>{formatMoney(match.budgetInr)}</strong>
          <small>per person</small>
        </div>
        <Link className="details-btn" to={to} state={state}>
          View Details <ArrowRight size={18} />
        </Link>
      </div>
    </article>
  );
}

// One-tap fixes for rules the seeker controls; near misses without one are hidden.
function fixFor(rule, group, filters) {
  if (rule === "GENDER" && filters.genderPreference === "SAME_GENDER")
    return { label: "Open to any gender", patch: { genderPreference: "ANY" } };
  if (rule === "DATES_OVERLAP")
    return {
      label: "Use their dates",
      patch: { checkIn: group.checkIn, checkOut: group.checkOut },
    };
  if (rule === "BUDGET")
    return {
      label: `Set budget to ${formatMoney(group.budgetInr)}`,
      patch: { budgetInr: String(group.budgetInr) },
    };
  if (rule === "SHARED_INTERESTS" && group.interests)
    return {
      label: "Add their interests",
      patch: {
        interests: [...new Set([...filters.interests, ...group.interests])],
      },
    };
  return null;
}

function NearMisses({ groups, filters, onFix }) {
  const [visibleCount, setVisibleCount] = useState(6);
  const fixable = groups.flatMap((group) =>
    group.suggestions.flatMap((item) => {
      const fix = fixFor(item.rule, group, filters);
      return fix
        ? [
            {
              group,
              item,
              fix,
              rule: group.rules.find((r) => r.id === item.rule),
            },
          ]
        : [];
    }),
  );
  if (!fixable.length) return null;
  return (
    <section className="near-miss">
      <header>
        <span className="near-icon">
          <Sparkles size={22} />
        </span>
        <div>
          <h3>
            {fixable.length} more{" "}
            {fixable.length === 1 ? "group is" : "groups are"} one change away
          </h3>
          <p>
            Each of these fails just one rule. Fix it and they move into your
            matches.
          </p>
        </div>
      </header>
      <div className="near-grid">
        {fixable.slice(0, visibleCount).map(({ group, item, fix, rule }) => (
          <article key={`${group.groupId}-${item.rule}`} className="near-card">
            <div
              className="near-photo"
              style={{
                backgroundImage: `url("${CITY_PHOTOS[group.city] ?? HERO_PHOTO.SRC}")`,
              }}
            />
            <div className="near-body">
              <Link to={ROUTES.GROUP(group.groupId)}>{group.name}</Link>
              <small>
                {formatDates(group.checkIn, group.checkOut)} ·{" "}
                {formatMoney(group.budgetInr)}
              </small>
              <span className="near-reason">
                <CircleAlert size={15} /> {rule?.label ?? item.rule}:{" "}
                {item.suggestion}
              </span>
            </div>
            <button
              type="button"
              className="fix-btn"
              onClick={() => onFix(fix.patch)}
            >
              <Wand2 size={16} /> {fix.label}
            </button>
          </article>
        ))}
      </div>
      {visibleCount < fixable.length && (
        <button type="button" className="btn btn-secondary" onClick={() => setVisibleCount((count) => count + 6)}>
          Show more suggestions
        </button>
      )}
    </section>
  );
}
