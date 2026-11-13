import { API_ENDPOINTS } from "../config/endpoints";
import { http } from "../lib/http";

export const matchService = {
  search: (criteria) => http.post(API_ENDPOINTS.MATCH_SEARCH, criteria),
};
