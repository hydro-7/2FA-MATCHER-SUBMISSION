// Compare the actual search values, not object identity or checkbox ordering.
export function searchCriteriaKey(criteria = {}) {
  return JSON.stringify({
    homeCity: criteria.homeCity?.trim() ?? "",
    city: criteria.city ?? "",
    checkIn: criteria.checkIn ?? "",
    checkOut: criteria.checkOut ?? "",
    budgetInr: Number(criteria.budgetInr),
    interests: [...new Set(criteria.interests ?? [])].sort(),
    genderPreference: criteria.genderPreference ?? "",
    genderMix: criteria.genderMix ?? "",
    sharedInterests: [...new Set(criteria.sharedInterests ?? [])].sort(),
  });
}

function validDate(value) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = new Date(`${value}T00:00:00Z`);
  return (
    Number.isFinite(date.getTime()) && date.toISOString().slice(0, 10) === value
  );
}

export function searchCriteriaError(criteria, meta) {
  if (!criteria.homeCity?.trim()) return "Enter your home city.";
  if (!criteria.city) return "Pick a destination to see matching groups.";
  if (!meta.cities.some((city) => city.name === criteria.city))
    return "Choose one of the available destinations.";
  if (
    !validDate(criteria.checkIn) ||
    !validDate(criteria.checkOut) ||
    criteria.checkOut <= criteria.checkIn
  ) {
    return "Choose travel dates with check-out after check-in.";
  }
  const { FIRST_CHECK_IN, LAST_CHECK_OUT } = meta.dateWindow;
  if (criteria.checkIn < FIRST_CHECK_IN || criteria.checkOut > LAST_CHECK_OUT) {
    return `Only ${FIRST_CHECK_IN} to ${LAST_CHECK_OUT} is available.`;
  }
  if (
    !Number.isSafeInteger(Number(criteria.budgetInr)) ||
    Number(criteria.budgetInr) <= 0
  )
    return "Enter a positive whole-rupee budget per person.";
  if (!criteria.interests.length) return "Pick at least one interest.";
  return "";
}
