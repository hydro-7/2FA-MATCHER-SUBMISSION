export const API_URL = import.meta.env.VITE_API_URL || "/api";

export const ASSET_ORIGIN = new URL(API_URL, window.location.origin).origin;
