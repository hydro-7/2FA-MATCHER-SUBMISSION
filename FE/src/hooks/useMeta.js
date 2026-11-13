import { metaService } from "../services/metaService";
import { toOptions } from "../lib/format";
import { LABELS } from "../constants/labels";
import { useResource } from "./useResource";

async function loadMeta() {
  const meta = await metaService.get();
  return {
    ...meta,
    cityOptions: meta.cities.map((city) => ({
      id: city.name,
      label: `${city.name}, ${city.country}`,
    })),
    homeCityOptions: meta.homeCities.map((home) => ({
      id: home.city,
      label: `${home.city} (${home.airport})`,
    })),
    genderOptions: toOptions(meta.genders, "gender"),
    genderPreferenceOptions: toOptions(
      meta.genderPreferences,
      "genderPreference",
    ),
    // The backend may omit these UI enum lists; keep the known supported labels.
    genderMixOptions: toOptions(
      meta.genderMixes ?? Object.keys(LABELS.genderMix),
      "genderMix",
    ),
    hotelSortOptions: toOptions(
      meta.hotelSorts ?? Object.keys(LABELS.hotelSort),
      "hotelSort",
    ),
  };
}

export const useMeta = () => useResource(loadMeta, "meta");
