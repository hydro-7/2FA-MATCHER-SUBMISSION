import { useState } from "react";
import { Check, Clock3, UserMinus, UserPlus } from "lucide-react";
import { friendService } from "../services/friendService";
import { toast } from "../store/toast";
import { Modal, Notice } from "./ui";

export function FriendActions({
  person,
  relationship,
  onChange,
  disabled = false,
}) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [confirmRemove, setConfirmRemove] = useState(false);
  const status = relationship?.status;
  const locked = busy || disabled || !status;

  async function act(action, message) {
    if (locked) return;
    setBusy(true);
    setError("");
    try {
      await action();
      setConfirmRemove(false);
      onChange();
      toast(message);
    } catch (failure) {
      setError(failure.message);
      if (failure.status === 404 || failure.status === 409) {
        setConfirmRemove(false);
        onChange();
      }
    } finally {
      setBusy(false);
    }
  }

  if (status === "SELF") return null;
  return (
    <div className="friend-controls" aria-busy={busy}>
      {!status && <span className="friend-status">Loading friendship…</span>}
      {status === "NONE" && (
        <button
          className="friend-button primary"
          disabled={locked}
          onClick={() =>
            act(() => friendService.request(person.id), "Friend request sent.")
          }
        >
          <UserPlus size={17} /> {busy ? "Sending…" : "Add friend"}
        </button>
      )}
      {status === "OUTGOING" && (
        <>
          <span className="friend-status">
            <Clock3 size={16} /> Request sent
          </span>
          <button
            className="friend-button"
            disabled={locked}
            onClick={() =>
              act(
                () => friendService.dismiss(relationship.requestId),
                "Friend request cancelled.",
              )
            }
          >
            Cancel request
          </button>
        </>
      )}
      {status === "INCOMING" && (
        <>
          <button
            className="friend-button primary"
            disabled={locked}
            onClick={() =>
              act(
                () => friendService.accept(relationship.requestId),
                "You’re now friends.",
              )
            }
          >
            <Check size={17} /> Accept
          </button>
          <button
            className="friend-button"
            disabled={locked}
            onClick={() =>
              act(
                () => friendService.dismiss(relationship.requestId),
                "Friend request declined.",
              )
            }
          >
            Decline
          </button>
        </>
      )}
      {status === "FRIENDS" && (
        <>
          <span className="friend-status confirmed">
            <Check size={16} /> Friends
          </span>
          <button
            className="friend-button friend-remove"
            disabled={locked}
            aria-label={`Remove ${person.name} as a friend`}
            title="Remove friend"
            onClick={() => setConfirmRemove(true)}
          >
            <UserMinus size={17} />
          </button>
        </>
      )}
      {!confirmRemove && <Notice error>{error}</Notice>}
      {confirmRemove && (
        <Modal
          title="Remove friend?"
          onClose={() => !busy && setConfirmRemove(false)}
        >
          <p>
            Remove {person.name} from your friends? Your existing groups and
            bookings will stay the same.
          </p>
          <Notice error>{error}</Notice>
          <div className="actions">
            <button
              className="secondary"
              disabled={busy}
              onClick={() => setConfirmRemove(false)}
            >
              Keep friend
            </button>
            <button
              disabled={busy}
              onClick={() =>
                act(() => friendService.remove(person.id), "Friend removed.")
              }
            >
              {busy ? "Removing…" : "Remove friend"}
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
}
