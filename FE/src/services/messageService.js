import { API_ENDPOINTS } from "../config/endpoints";
import { http } from "../lib/http";

export const messageService = {
  list: (groupId, after) => http.get(API_ENDPOINTS.GROUP_MESSAGES(groupId), { after }),
  post: (groupId, body) => http.post(API_ENDPOINTS.GROUP_MESSAGES(groupId), { body }),
};
