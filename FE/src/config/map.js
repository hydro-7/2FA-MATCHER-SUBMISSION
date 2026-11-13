// OpenStreetMap tiles and geocoder (no API key); override per deployment via env.
export const MAP_CONFIG = {
  TILE_URL: import.meta.env.VITE_MAP_TILE_URL || "https://tile.openstreetmap.org/{z}/{x}/{y}.png",
  TILE_ATTRIBUTION:
    import.meta.env.VITE_MAP_TILE_ATTRIBUTION || '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
  GEOCODER_URL: import.meta.env.VITE_GEOCODER_URL || "https://nominatim.openstreetmap.org/search",
};
