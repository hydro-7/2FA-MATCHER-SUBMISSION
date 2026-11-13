import { create } from "zustand";
import { persist } from "zustand/middleware";
import { STORAGE_KEYS } from "../constants/app";

const systemDark = () => window.matchMedia?.("(prefers-color-scheme: dark)").matches ?? false;

export function applyTheme(theme) {
  if (theme) document.documentElement.dataset.theme = theme;
  else delete document.documentElement.dataset.theme;
}

// theme is "light", "dark", or "" to follow the system setting.
export const useTheme = create(
  persist(
    (set, get) => ({
      theme: "",
      isDark: () => (get().theme ? get().theme === "dark" : systemDark()),
      toggle: () => {
        const theme = get().isDark() ? "light" : "dark";
        applyTheme(theme);
        set({ theme });
      },
    }),
    { name: STORAGE_KEYS.THEME, onRehydrateStorage: () => (state) => applyTheme(state?.theme) },
  ),
);
