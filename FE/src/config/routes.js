const id = encodeURIComponent;

export const ROUTES = {
  HOME: "/",
  PROFILE: "/profile",
  FRIENDS: "/friends",
  START: "/start",
  DISCOVER: "/discover",
  TRIPS: "/trips",
  NEW_GROUP: "/groups/new",
  GROUP: (groupId) => `/groups/${id(groupId)}`,
  GROUP_TAB: (groupId, tab) => `/groups/${id(groupId)}/${tab}`,
  TRAVELLER: (travellerId) => `/travellers/${id(travellerId)}`,
};
