import { create } from "zustand";
import { persist } from "zustand/middleware";
import { STORAGE_KEYS } from "../constants/app";

export const NO_FILTERS = { sharedInterests: [], genderMix: "" };

// The last search is kept so Discover and group pages restore it after a refresh.
export const useSearch = create(
  persist(
    (set) => ({
      travellerId: "",
      criteria: null,
      filters: NO_FILTERS,
      result: null,
      view: { sort: "", mode: "list" },
      setView: (patch) =>
        set((state) => ({ view: { ...state.view, ...patch } })),
      beginSearch: (travellerId, criteria) =>
        set({
          travellerId,
          criteria,
          result: null,
          filters: {
            sharedInterests: criteria.sharedInterests ?? [],
            genderMix: criteria.genderMix ?? "",
          },
        }),
      setResult: (travellerId, criteria, filters, result) =>
        set({ travellerId, criteria, filters, result }),
      clear: () =>
        set({
          travellerId: "",
          criteria: null,
          filters: NO_FILTERS,
          result: null,
        }),
      markRequested: (groupId, searchId) =>
        set((state) =>
          !state.result || (searchId && state.result.searchId !== searchId)
            ? {}
            : {
                result: {
                  ...state.result,
                  matches: state.result.matches.map((match) =>
                    match.groupId === groupId
                      ? { ...match, myRequestStatus: "PENDING" }
                      : match,
                  ),
                },
              },
        ),
    }),
    { name: STORAGE_KEYS.SEARCH },
  ),
);
