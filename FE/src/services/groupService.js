import { API_ENDPOINTS } from "../config/endpoints";
import { http } from "../lib/http";

export const groupService = {
  create: (group) => http.post(API_ENDPOINTS.GROUPS, group),
  mine: () => http.get(API_ENDPOINTS.MY_GROUPS),
  get: (groupId) => http.get(API_ENDPOINTS.GROUP(groupId)),
};
