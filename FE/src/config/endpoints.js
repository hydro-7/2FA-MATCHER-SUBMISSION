const id = encodeURIComponent;

export const API_ENDPOINTS = {
  META: "/meta",
  ME: "/me",
  FRIENDS: "/friends",
  FRIEND_RELATIONSHIP: (travellerId) => `/friends/relationship/${id(travellerId)}`,
  FRIEND_REQUESTS: "/friends/requests",
  FRIEND_ACCEPT: (requestId) => `/friends/requests/${id(requestId)}/accept`,
  FRIEND_REQUEST: (requestId) => `/friends/requests/${id(requestId)}`,
  FRIEND: (travellerId) => `/friends/${id(travellerId)}`,

  TRAVELLERS: "/travellers",
  SIGN_IN: "/travellers/sign-in",
  DEMO_TRAVELLERS: "/travellers/demo",
  DEMO_SIGN_IN: "/travellers/demo/sign-in",
  TRAVELLER: (travellerId) => `/travellers/${id(travellerId)}`,

  GROUPS: "/groups",
  MY_GROUPS: "/groups/mine",
  GROUP: (groupId) => `/groups/${id(groupId)}`,
  GROUP_REQUESTS: (groupId) => `/groups/${id(groupId)}/requests`,
  GROUP_HOTELS: (groupId) => `/groups/${id(groupId)}/hotels`,
  GROUP_SAVED: (groupId) => `/groups/${id(groupId)}/saved`,
  GROUP_SAVED_ROOM: (groupId, roomId) => `/groups/${id(groupId)}/saved/${id(roomId)}`,
  GROUP_BOOKING: (groupId) => `/groups/${id(groupId)}/booking`,
  GROUP_MESSAGES: (groupId) => `/groups/${id(groupId)}/messages`,

  MATCH_SEARCH: "/matches/search",

  MY_REQUESTS: "/requests/mine",
  REQUEST: (requestId) => `/requests/${id(requestId)}`,
};
