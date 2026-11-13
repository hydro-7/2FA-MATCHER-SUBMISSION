import { create } from "zustand";
import { TOAST_MS } from "../constants/app";

export const useToasts = create(() => ({ toasts: [] }));

export function toast(message, tone = "success") {
  const id = crypto.randomUUID();
  useToasts.setState((state) => ({ toasts: [...state.toasts, { id, message, tone }] }));
  setTimeout(() => useToasts.setState((state) => ({ toasts: state.toasts.filter((item) => item.id !== id) })), TOAST_MS);
}
