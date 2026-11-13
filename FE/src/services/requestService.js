import { API_ENDPOINTS } from "../config/endpoints";
import { http } from "../lib/http";

export const requestService = {
  create: (groupId, searchId) => http.post(API_ENDPOINTS.GROUP_REQUESTS(groupId), { searchId }),
  listForGroup: (groupId, status = "ALL") => http.get(API_ENDPOINTS.GROUP_REQUESTS(groupId), { status }),
  mine: () => http.get(API_ENDPOINTS.MY_REQUESTS),
  decide: (requestId, action) => http.patch(API_ENDPOINTS.REQUEST(requestId), { action }),
};
