import { useState } from "react";
import { useOutletContext } from "react-router";
import { formatDates, labelOf } from "../../lib/format";
import { useResource } from "../../hooks/useResource";
import { requestService } from "../../services/requestService";
import { toast } from "../../store/toast";
import { Avatar, Empty, Money, Notice, RemoteState, RuleChips } from "../../components/ui";

export function Requests() {
  const { group, reload, isOwner } = useOutletContext();
  const requests = useResource(() => (isOwner ? requestService.listForGroup(group.id) : Promise.resolve([])), group.id);
  const [busyId, setBusyId] = useState("");
  const [error, setError] = useState("");

  async function decide(request, action) {
    setBusyId(request.id);
    setError("");
    try {
      await requestService.decide(request.id, action);
      toast(action === "APPROVE" ? `${request.seeker.name} joined the group.` : "Request declined.");
      reload();
    } catch (failure) {
      setError(failure.message);
    } finally {
      setBusyId("");
      requests.reload();
    }
  }

  if (!isOwner) return <Empty title="Only the trip creator can review requests" />;
  return (
    <section className="panel">
      <div className="section-heading">
        <h2>Join requests</h2>
        <button className="secondary" onClick={requests.reload}>
          Refresh
        </button>
      </div>
      <RemoteState resource={requests} />
      <Notice error>{error}</Notice>
      {requests.data?.length === 0 && <Empty title="Good company is on its way">Pending requests will appear here for you to review.</Empty>}
      {requests.data?.map((request) => (
        <article className="request-card" key={request.id}>
          <div className="person">
            <Avatar person={request.seeker} />
            <span>
              <strong>{request.seeker.name}</strong>
              <small>{request.seeker.homeCity}</small>
            </span>
            <span className="badge">{labelOf("requestStatus", request.status)}</span>
          </div>
          {request.criteria && (
            <p className="muted">
              {formatDates(request.criteria.checkIn, request.criteria.checkOut)} · budget <Money value={request.criteria.budgetInr} />
            </p>
          )}
          <RuleChips rules={request.rules ?? []} />
          {request.status === "PENDING" && (
            <div className="actions">
              <button disabled={Boolean(busyId)} onClick={() => decide(request, "APPROVE")}>
                {busyId === request.id ? "Updating…" : "Approve"}
              </button>
              <button className="secondary" disabled={Boolean(busyId)} onClick={() => decide(request, "REJECT")}>
                Decline
              </button>
            </div>
          )}
        </article>
      ))}
    </section>
  );
}
