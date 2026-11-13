import { API_ENDPOINTS } from "../config/endpoints";
import { http } from "../lib/http";

export const planningService = {
  hotels: (groupId, query) => http.get(API_ENDPOINTS.GROUP_HOTELS(groupId), query),
  saved: (groupId) => http.get(API_ENDPOINTS.GROUP_SAVED(groupId)),
  save: (groupId, roomId) => http.post(API_ENDPOINTS.GROUP_SAVED(groupId), { roomId }),
  unsave: (groupId, roomId) => http.delete(API_ENDPOINTS.GROUP_SAVED_ROOM(groupId, roomId)),
  booking: (groupId) => http.get(API_ENDPOINTS.GROUP_BOOKING(groupId)),
  book: (groupId, roomId) => http.post(API_ENDPOINTS.GROUP_BOOKING(groupId), { roomId }),
};
