import { API_ENDPOINTS } from "../config/endpoints";
import { http } from "../lib/http";

let cached;

export const metaService = {
  get() {
    cached ||= http.get(API_ENDPOINTS.META).catch((error) => {
      cached = undefined;
      throw error;
    });
    return cached;
  },
};
