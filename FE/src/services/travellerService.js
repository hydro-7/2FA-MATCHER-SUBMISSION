import { API_ENDPOINTS } from "../config/endpoints";
import { http } from "../lib/http";

export const travellerService = {
  signUp: (profile) => http.post(API_ENDPOINTS.TRAVELLERS, profile),
  signIn: (email, password) => http.post(API_ENDPOINTS.SIGN_IN, { email, password }),
  demoList: () => http.get(API_ENDPOINTS.DEMO_TRAVELLERS),
  demoSignIn: (id) => http.post(API_ENDPOINTS.DEMO_SIGN_IN, { id }),
  list: () => http.get(API_ENDPOINTS.TRAVELLERS),
  get: (travellerId) => http.get(API_ENDPOINTS.TRAVELLER(travellerId)),
  me: () => http.get(API_ENDPOINTS.ME),
};
