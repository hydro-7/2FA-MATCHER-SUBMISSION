import { create } from "zustand";
import { persist } from "zustand/middleware";
import { STORAGE_KEYS } from "../constants/app";

export const useSession = create(
  persist(
    (set) => ({
      userId: "",
      token: "",
      profile: null,
      ready: false,
      // false, "signin", "signup" or "demo": which tab of the auth popup is open.
      signInOpen: false,
      setSignInOpen: (signInOpen) => set({ signInOpen }),
      budget: "",
      setBudget: (budget) => set({ budget }),
      // Sign-up and sign-in both return the profile with its token.
      signIn: ({ token, ...profile }) => set({ userId: profile.id, token, profile, ready: true }),
      setProfile: (profile) => set({ profile, ready: true }),
      signOut: () => set({ userId: "", token: "", profile: null, ready: true }),
    }),
    { name: STORAGE_KEYS.SESSION, partialize: (state) => ({ userId: state.userId, token: state.token, budget: state.budget }) },
  ),
);
