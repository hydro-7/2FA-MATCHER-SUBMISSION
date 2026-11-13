import { API_ENDPOINTS } from "../config/endpoints";
import { http } from "../lib/http";

export const friendService = {
  list: () => http.get(API_ENDPOINTS.FRIENDS),
  relationship: (travellerId) =>
    http.get(API_ENDPOINTS.FRIEND_RELATIONSHIP(travellerId)),
  request: (travellerId) =>
    http.post(API_ENDPOINTS.FRIEND_REQUESTS, { travellerId }),
  accept: (requestId) => http.post(API_ENDPOINTS.FRIEND_ACCEPT(requestId)),
  dismiss: (requestId) => http.delete(API_ENDPOINTS.FRIEND_REQUEST(requestId)),
  remove: (travellerId) => http.delete(API_ENDPOINTS.FRIEND(travellerId)),
};
