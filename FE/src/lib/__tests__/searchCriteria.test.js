import { test } from "node:test";
import assert from "node:assert/strict";
import { searchCriteriaError, searchCriteriaKey } from "../searchCriteria.js";

const meta = {
  cities: [{ name: "Kyoto" }],
  dateWindow: { FIRST_CHECK_IN: "2027-04-01", LAST_CHECK_OUT: "2027-04-20" },
};
const valid = {
  homeCity: "Mumbai",
  city: "Kyoto",
  checkIn: "2027-04-10",
  checkOut: "2027-04-15",
  budgetInr: 62001,
  interests: ["TEMPLES"],
  genderPreference: "ANY",
  sharedInterests: [],
};

test("one interest and positive whole-rupee budgets are valid inputs, independent of matching thresholds", () => {
  for (const budgetInr of [1, 9999, 62001, 400001])
    assert.equal(searchCriteriaError({ ...valid, budgetInr }, meta), "");
});
test("invalid windows, dates and zero/fractional budgets are rejected before displaying results", () => {
  for (const patch of [
    { checkIn: "2027-03-31" },
    { checkOut: "2027-04-21" },
    { checkIn: "2027-04-15" },
    { checkOut: "2027-02-30" },
    { budgetInr: 0 },
    { budgetInr: 1.5 },
    { interests: [] },
  ]) {
    assert.notEqual(searchCriteriaError({ ...valid, ...patch }, meta), "");
  }
});
test("origin is required, but does not have to be a destination city", () => {
  assert.equal(searchCriteriaError({ ...valid, homeCity: "London" }, meta), "");
  assert.notEqual(searchCriteriaError({ ...valid, homeCity: "  " }, meta), "");
  assert.notEqual(
    searchCriteriaError({ ...valid, city: "Not in catalogue" }, meta),
    "",
  );
});
test("criteria identity ignores checkbox order and numeric formatting, but changes with required tags or dates", () => {
  const first = {
    ...valid,
    interests: ["TEMPLES", "STREET_FOOD"],
    budgetInr: "62001",
  };
  assert.equal(
    searchCriteriaKey(first),
    searchCriteriaKey({
      ...first,
      interests: ["STREET_FOOD", "TEMPLES"],
      budgetInr: 62001,
    }),
  );
  assert.notEqual(
    searchCriteriaKey(first),
    searchCriteriaKey({ ...first, sharedInterests: ["TEMPLES"] }),
  );
  assert.notEqual(
    searchCriteriaKey(first),
    searchCriteriaKey({ ...first, checkOut: "2027-04-16" }),
  );
});
