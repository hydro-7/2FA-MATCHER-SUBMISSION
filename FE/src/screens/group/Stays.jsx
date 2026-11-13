import { useState } from "react";
import { useOutletContext } from "react-router";
import { HOTEL_PAGE_SIZE, HOTEL_STAR_OPTIONS } from "../../constants/app";
import { assetUrl, formatDates } from "../../lib/format";
import { useMeta } from "../../hooks/useMeta";
import { useResource } from "../../hooks/useResource";
import { planningService } from "../../services/planningService";
import { useSession } from "../../store/session";
import { toast } from "../../store/toast";
import {
  Empty,
  Field,
  Modal,
  Money,
  Notice,
  RemoteState,
  Select,
} from "../../components/ui";

const STAR_OPTIONS = HOTEL_STAR_OPTIONS.map((stars) => ({
  id: String(stars),
  label: `${stars}+ stars`,
}));

export function Stays() {
  const { group, reload, isMember } = useOutletContext();
  if (!isMember) return <Empty title="Only group members can plan stays" />;
  if (group.status === "BOOKED") return <BookingConfirmation group={group} />;
  return <HotelSearch group={group} onBooked={reload} />;
}

function PriceBreakdown({ nights, members, totalInr, perMemberInr }) {
  return (
    <div className="price-breakdown">
      <div className="price-row">
        <span>Whole stay · {nights} nights</span>
        <strong>
          <Money value={totalInr} />
        </strong>
      </div>
      <div className="price-row highlight">
        <span>Per traveller · {members} people</span>
        <strong>
          <Money value={perMemberInr} />
        </strong>
      </div>
    </div>
  );
}

function BookingConfirmation({ group }) {
  const booking = useResource(
    () => planningService.booking(group.id),
    group.id,
  );
  const data = booking.data;
  if (!data) return <RemoteState resource={booking} />;
  return (
    <div className="booking-success">
      <span className="eyebrow">✓ GROUP STAY CONFIRMED</span>
      <h2>{data.hotelName}</h2>
      <p>
        Reference: <strong>{data.id}</strong> · Demo booking, no payment
      </p>
      <p>
        {formatDates(group.checkIn, group.checkOut)} · {data.rooms} ×{" "}
        {data.roomName} · {data.members} travellers
      </p>
      <PriceBreakdown
        nights={data.nights}
        members={data.members}
        totalInr={data.totalInr}
        perMemberInr={data.perMemberInr}
      />
      <p className="caption">
        Booked by {data.bookedBy?.name}. This booking is locked for the whole
        group.
      </p>
    </div>
  );
}

function HotelSearch({ group, onBooked }) {
  const userId = useSession((state) => state.userId);
  const meta = useMeta();
  const [query, setQuery] = useState({ sort: "", minStars: "", page: 1 });
  const hotels = useResource(
    () =>
      planningService.hotels(group.id, { ...query, limit: HOTEL_PAGE_SIZE }),
    `${group.id}:${query.sort}:${query.minStars}:${query.page}`,
    { keepPrevious: true },
  );
  const saved = useResource(
    () => planningService.saved(group.id),
    `saved:${group.id}`,
  );
  const [compare, setCompare] = useState([]);
  const [selected, setSelected] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const savedByRoom = new Map(
    (saved.data ?? []).map((item) => [item.roomId, item]),
  );
  const savedByMe = (roomId) =>
    Boolean(
      savedByRoom.get(roomId)?.savedBy.some((member) => member.id === userId),
    );
  const options = hotels.data?.options ?? [];
  const pages = hotels.data
    ? Math.ceil(hotels.data.total / hotels.data.limit)
    : 0;
  const changeQuery = (next) => {
    setQuery({ ...query, ...next });
    setCompare([]);
  };

  async function toggleSave(roomId) {
    if (busy || saved.loading) return;
    setBusy(true);
    setError("");
    try {
      if (savedByMe(roomId)) await planningService.unsave(group.id, roomId);
      else await planningService.save(group.id, roomId);
      saved.reload();
    } catch (failure) {
      setError(failure.message);
      if (failure.status === 409) onBooked();
    } finally {
      setBusy(false);
    }
  }

  async function book() {
    setBusy(true);
    setError("");
    try {
      await planningService.book(group.id, selected.roomId);
      toast("Group stay confirmed!");
      onBooked();
    } catch (failure) {
      // A lost response can arrive after the database committed. Read before retrying.
      try {
        const existing = await planningService.booking(group.id);
        if (existing) {
          setSelected(null);
          onBooked();
          return;
        }
      } catch {
        /* Keep the original error if no booking can be retrieved. */
      }
      setError(failure.message);
      if (failure.status === 409) {
        setSelected(null);
        onBooked();
      }
    } finally {
      setBusy(false);
    }
  }

  return (
    <section>
      <div className="section-heading">
        <div>
          <span className="eyebrow">FIND YOUR SHARED HOME BASE</span>
          <h2>A stay everyone can agree on.</h2>
          <p className="muted">
            {group.city} · {formatDates(group.checkIn, group.checkOut)} ·{" "}
            {group.memberCount} travellers
          </p>
        </div>
      </div>
      <Notice error>{error}</Notice>
      <div className="hotel-filters">
        <Field label="Sort stays">
          <Select
            options={meta.data?.hotelSortOptions}
            placeholder="Default order"
            value={query.sort}
            onChange={(e) => changeQuery({ sort: e.target.value, page: 1 })}
          />
        </Field>
        <Field label="Minimum hotel stars">
          <Select
            options={STAR_OPTIONS}
            placeholder="All hotel classes"
            value={query.minStars}
            onChange={(e) => changeQuery({ minStars: e.target.value, page: 1 })}
          />
        </Field>
      </div>

      {saved.data?.length > 0 && (
        <div className="panel">
          <h3>Group shortlist</h3>
          {saved.data.map((item) => (
            <div key={item.roomId} className="request-row">
              <div>
                <strong>{item.hotelName}</strong> · {item.rooms} ×{" "}
                {item.roomName}
                <p className="muted">
                  {item.alignment} ·{" "}
                  {item.savedBy.map((member) => member.name).join(", ")} ·{" "}
                  <Money value={item.perMemberInr} /> each
                </p>
              </div>
              <button
                disabled={busy || !item.available}
                onClick={() => setSelected(item)}
              >
                {item.available ? "Review & book" : "No longer available"}
              </button>
            </div>
          ))}
        </div>
      )}

      <RemoteState resource={hotels} />
      {hotels.data && options.length === 0 && (
        <Empty title="No stays available for this group">
          No hotel has enough free rooms on every night. Try another hotel
          class.
        </Empty>
      )}
      <div className="hotel-list" aria-busy={hotels.loading} style={hotels.loading ? { opacity: 0.55 } : undefined}>
        {options.map((option) => (
          <article key={option.roomId} className="hotel-card">
            <div
              className="hotel-image"
              style={{ backgroundImage: `url("${assetUrl(option.image)}")` }}
            />
            <div className="hotel-content">
              <div className="section-heading">
                <div>
                  <h3>{option.hotelName}</h3>
                  <p className="muted">
                    {group.city} · {option.area}
                  </p>
                </div>
                <span className="rating">{option.rating}</span>
              </div>
              <p>
                {option.rooms} × {option.roomName} · {hotels.data.membersUsed}{" "}
                travellers
              </p>
              <div className="chips">
                <span className="chip">{option.stars} stars</span>
                <span className="chip">
                  {option.refundable ? "Free cancellation" : "Non-refundable"}
                </span>
              </div>
              <PriceBreakdown
                nights={option.nights}
                members={hotels.data.membersUsed}
                totalInr={option.totalInr}
                perMemberInr={option.perMemberInr}
              />
              <p className="caption">
                {savedByRoom.get(option.roomId)?.alignment ??
                  `0/${group.memberCount} members`}{" "}
                saved this
              </p>
              <div className="actions">
                <button
                  className="secondary"
                  disabled={busy || saved.loading}
                  onClick={() => toggleSave(option.roomId)}
                >
                  {savedByMe(option.roomId) ? "♥ Saved" : "♡ Shortlist"}
                </button>
                <button disabled={busy} onClick={() => setSelected(option)}>
                  Review & book
                </button>
              </div>
              <label className="checkbox">
                <input
                  type="checkbox"
                  checked={compare.includes(option.roomId)}
                  onChange={(e) =>
                    setCompare(
                      e.target.checked
                        ? [...compare, option.roomId]
                        : compare.filter((id) => id !== option.roomId),
                    )
                  }
                />{" "}
                Compare this option
              </label>
            </div>
          </article>
        ))}
      </div>

      {compare.length > 0 && (
        <div className="panel compare-panel">
          <div className="section-heading">
            <h2>Compare selected stays</h2>
            <button className="text-button" onClick={() => setCompare([])}>
              Clear comparison
            </button>
          </div>
          <div className="compare-grid">
            {options
              .filter((option) => compare.includes(option.roomId))
              .map((option) => (
                <article key={option.roomId}>
                  <h3>{option.hotelName}</h3>
                  <p>
                    {option.rooms} × {option.roomName}
                  </p>
                  <PriceBreakdown
                    nights={option.nights}
                    members={hotels.data.membersUsed}
                    totalInr={option.totalInr}
                    perMemberInr={option.perMemberInr}
                  />
                  <p className="muted">
                    {option.stars} stars · rating {option.rating}
                  </p>
                  <button disabled={busy} onClick={() => setSelected(option)}>
                    Review stay
                  </button>
                </article>
              ))}
          </div>
        </div>
      )}

      {pages > 1 && (
        <div className="actions pagination">
          <button
            className="secondary"
            disabled={query.page === 1}
            onClick={() => changeQuery({ page: query.page - 1 })}
          >
            Previous page
          </button>
          <span>
            Page {query.page} of {pages}
          </span>
          <button
            className="secondary"
            disabled={query.page >= pages}
            onClick={() => changeQuery({ page: query.page + 1 })}
          >
            Next page
          </button>
        </div>
      )}

      {selected && (
        <Modal
          title="Confirm your group’s stay"
          onClose={() => !busy && setSelected(null)}
        >
          <h3>{selected.hotelName}</h3>
          <p>{formatDates(group.checkIn, group.checkOut)}</p>
          <p>
            {selected.rooms} × {selected.roomName}
          </p>
          <PriceBreakdown
            nights={selected.nights}
            members={group.memberCount}
            totalInr={selected.totalInr}
            perMemberInr={selected.perMemberInr}
          />
          <Notice>
            Confirm only after your group agrees. This creates one locked demo
            booking for all members. No payment is taken.
          </Notice>
          <Notice error>{error}</Notice>
          <div className="actions">
            <button disabled={busy} onClick={book}>
              {busy ? "Confirming…" : "Confirm group booking"}
            </button>
            <button
              className="secondary"
              disabled={busy}
              onClick={() => setSelected(null)}
            >
              Keep comparing
            </button>
          </div>
        </Modal>
      )}
    </section>
  );
}
