import { create } from "zustand";
import { persist } from "zustand/middleware";
import { EMPTY_TRIP, RULE_SUGGESTIONS, STORAGE_KEYS } from "../constants/app";

export const EMPTY_TRIP_DRAFT = { step: 0, trip: EMPTY_TRIP, plan: [], activeDay: 0, style: "", rules: RULE_SUGGESTIONS };

// An unfinished trip wizard survives a refresh; drafts are kept per traveller.
export const useDrafts = create(
  persist(
    (set) => ({
      trips: {},
      setTripDraft: (userId, patch) =>
        set((state) => ({ trips: { ...state.trips, [userId]: { ...(state.trips[userId] ?? EMPTY_TRIP_DRAFT), ...patch } } })),
      clearTripDraft: (userId) =>
        set((state) => {
          const { [userId]: _removed, ...rest } = state.trips;
          return { trips: rest };
        }),
    }),
    { name: STORAGE_KEYS.DRAFTS },
  ),
);
