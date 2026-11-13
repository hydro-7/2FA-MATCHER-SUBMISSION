import {
  BedSingle,
  Camera,
  ClipboardList,
  Hotel,
  LayoutGrid,
  MapPinned,
  MessageSquare,
  Castle,
  FerrisWheel,
  Compass,
  Gem,
  Leaf,
  Map as MapIcon,
  Sofa,
  WalletCards,
  Landmark,
  Martini,
  Mountain,
  MountainSnow,
  Palette,
  ShoppingBag,
  Soup,
  Sparkles,
  Sun,
  Trees,
  Users,
  UtensilsCrossed,
  Waves,
} from "lucide-react";

// Icons for interest codes from /meta; unknown codes fall back to FALLBACK_ICON.
export const INTEREST_ICONS = {
  TEMPLES: Landmark,
  MUSEUMS: Palette,
  HISTORY: Castle,
  STREET_FOOD: Soup,
  FINE_DINING: UtensilsCrossed,
  NIGHTLIFE: Martini,
  SHOPPING: ShoppingBag,
  PHOTOGRAPHY: Camera,
  HIKING: Mountain,
  NATURE: Trees,
  BEACHES: Waves,
  DESERT: Sun,
  ADVENTURE: MountainSnow,
  THEME_PARKS: FerrisWheel,
  BUDGET_STAYS: BedSingle,
  LUXURY: Gem,
};

export const FALLBACK_ICON = Sparkles;

export const GENDER_GLYPHS = { MALE: "♂", FEMALE: "♀" };

// Group tab icons keyed by GROUP_TABS path.
export const TAB_ICONS = { "": LayoutGrid, map: MapPinned, itinerary: MapIcon, members: Users, stays: Hotel, chat: MessageSquare, requests: ClipboardList };

export const TRAVEL_STYLE_ICONS = { Budget: WalletCards, Comfort: Sofa, Explorer: Compass, Slow: Leaf };
