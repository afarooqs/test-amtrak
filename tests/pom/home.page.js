const { expect } = require("@playwright/test");
const { formatMmDdYyyy, futureDate, isoDate } = require("../common/dates");

/**
 * Page Object Model - Home page
 *
 */

class HomePage {
  /**
   * @param {import('@playwright/test').Page} page
   */
  constructor(page) {
    this.page = page;
    this.fareFinder = page.locator('[amt-auto-test-id="fare-finder-cmp"]');
    this.inputFromStation = this.fareFinder
      .locator('[amt-auto-test-id="fare-finder-from-station-field-page"]')
      .first();
    this.inputToStation = this.fareFinder
      .locator('[amt-auto-test-id="fare-finder-to-station-field-page"]')
      .first();
    this.fromInput = this.inputFromStation.locator("input.station-input");
    this.toInput = this.inputToStation.locator("input.station-input");
    this.departDate = this.fareFinder
      .locator('[data-julie="departdisplay_booking_oneway"]')
      .locator("visible=true")
      .first();
    this.travelerDropdown = this.fareFinder.locator(
      '[amt-auto-test-id="traveler-dropdown-button"]',
    );
    this.addTripButton = this.fareFinder.locator(
      '[amt-auto-test-id="multi-city-add-trip"]',
    );
    this.adultIncrement = this.page
      .locator('[amt-auto-test-id="traveler-component-adult-incr-button"]')
      .locator("visible=true")
      .first();
    this.adultCountInput = this.page
      .getByRole("group", { name: /Adult,\s*16\+/i })
      .getByRole("textbox");
    this.travelerDone = this.page.locator(
      '[amt-auto-test-id="traveler-component-discount-done-button"]',
    );
    this.roundTripDepartDate = this.fareFinder.locator(
      '[data-julie="departdisplay_booking_roundtrip"]',
    );
    this.returnDate = this.fareFinder.locator(
      '[data-julie="returndisplay_booking_roundtrip"]',
    );
    this.findTrains = this.fareFinder
      .getByRole("button", { name: "FIND TRAINS" })
      .locator("visible=true")
      .first();
    this.tripTypeButton = this.fareFinder.locator(
      '[amt-auto-test-id="fare-finder-travel-selection"]',
    );
    this.sameStationError = this.fareFinder.locator(".same-station-error");
    this.alert = page.locator('[role="alert"]');
    this.cookieBanner = page.locator(
      "#onetrust-banner-sdk, #onetrust-consent-sdk",
    );
    this.rejectAllCookies = page
      .locator("#onetrust-reject-all-handler")
      .or(page.getByRole("button", { name: /^Reject All$/i }))
      .or(page.getByRole("link", { name: /^Reject All$/i }));
  }

  async open() {
    await this.page.goto("/home", { waitUntil: "domcontentloaded" });
    await this.dismissCookieBanner();
    await this.fareFinder.waitFor({ state: "visible" });
    await this.dismissSignInPrompt();
  }

  async dismissCookieBanner() {
    const rejectAll = this.rejectAllCookies.first();
    try {
      await rejectAll.waitFor({ state: "visible", timeout: 10_000 });
    } catch {
      return;
    }
    await rejectAll.click();
    await this.cookieBanner
      .first()
      .waitFor({ state: "hidden", timeout: 5_000 })
      .catch(() => {});
  }

  async dismissSignInPrompt() {
    const signInClose = this.page.locator(
      '[amt-auto-test-id="sign-in-register-close"]',
    );
    if (await signInClose.isVisible().catch(() => false)) {
      await signInClose.click();
    }
  }

  /**
   * Angular keeps document focus on From even after To is clicked.
   * Keyboard typing therefore lands in the wrong field. Set the value
   * on the target input and fire InputEvents instead.
   */
  async setInputValue(input, value) {
    await input.evaluate((el, next) => {
      const view = el.ownerDocument.defaultView;
      const descriptor = Object.getOwnPropertyDescriptor(
        view.HTMLInputElement.prototype,
        "value",
      );
      descriptor.set.call(el, next);
      el.dispatchEvent(
        new view.InputEvent("input", {
          bubbles: true,
          composed: true,
          data: next,
          inputType: "insertText",
        }),
      );
      el.dispatchEvent(new view.Event("change", { bubbles: true }));
    }, value);
  }

  async clickStationOption(field, stationCode) {
    const option = field
      .locator(".ads-cursor-pointer")
      .filter({ hasText: `(${stationCode})` });

    await expect
      .poll(
        async () =>
          option.evaluateAll(
            (els, code) =>
              els.findIndex((el) => {
                const box = el.getBoundingClientRect();
                return (
                  box.height > 8 &&
                  box.width > 8 &&
                  el.textContent.includes(`(${code})`)
                );
              }),
            stationCode,
          ),
        { timeout: 15_000 },
      )
      .not.toBe(-1);

    await option.evaluateAll((els, code) => {
      const match = els.find((el) => {
        const box = el.getBoundingClientRect();
        return (
          box.height > 8 &&
          box.width > 8 &&
          el.textContent.includes(`(${code})`)
        );
      });
      if (!match) {
        throw new Error(`No visible station option for (${code})`);
      }
      match.click();
    }, stationCode);
  }

  itinerary(index = 0) {
    const fromField = this.fareFinder
      .locator('[amt-auto-test-id="fare-finder-from-station-field-page"]')
      .nth(index);
    const toField = this.fareFinder
      .locator('[amt-auto-test-id="fare-finder-to-station-field-page"]')
      .nth(index);
    return {
      fromField,
      toField,
      fromInput: fromField.locator("input.station-input"),
      toInput: toField.locator("input.station-input"),
      departDate: this.fareFinder
        .locator('[data-julie="departdisplay_booking_oneway"]')
        .locator("visible=true")
        .nth(index),
    };
  }

  async selectStation(field, input, sibling, query, stationCode) {
    const siblingBefore = await sibling.inputValue();

    await field.click({ force: true });
    await this.setInputValue(input, query);
    await expect.poll(async () => sibling.inputValue()).toBe(siblingBefore);

    await this.clickStationOption(field, stationCode);
    await expect(input).toHaveValue(this.committedStationPattern(stationCode));
    await expect.poll(async () => sibling.inputValue()).toBe(siblingBefore);
  }

  async selectFromStation(query, stationCode, index = 0) {
    const trip = this.itinerary(index);
    await this.selectStation(
      trip.fromField,
      trip.fromInput,
      trip.toInput,
      query,
      stationCode,
    );
  }

  async selectToStation(query, stationCode, index = 0) {
    const trip = this.itinerary(index);
    await this.selectStation(
      trip.toField,
      trip.toInput,
      trip.fromInput,
      query,
      stationCode,
    );
  }

  async selectStations(data, index = 0) {
    await this.selectFromStation(data.fromQuery, data.fromCode, index);
    await this.selectToStation(data.toQuery, data.toCode, index);
  }

  async selectSameStation(data) {
    await this.selectFromStation(data.query, data.code);
    await this.selectToStation(data.query, data.code);
  }

  async typeStationQuery(which, query) {
    const input = which === "from" ? this.fromInput : this.toInput;
    const field = which === "from" ? this.inputFromStation : this.inputToStation;
    await field.click({ force: true });
    await this.setInputValue(input, query);
  }

  async visibleDepartDateInput() {
    if (await this.roundTripDepartDate.isVisible().catch(() => false)) {
      return this.roundTripDepartDate;
    }
    return this.departDate;
  }

  calendarDayName(date) {
    return date.toLocaleDateString("en-US", {
      weekday: "long",
      month: "long",
      day: "numeric",
      year: "numeric",
    });
  }

  async confirmDatePicker() {
    const done = this.page.getByRole("button", { name: "Done" });
    await done.waitFor({ state: "visible", timeout: 10_000 });
    if (await done.isEnabled()) {
      await done.click();
      await done.waitFor({ state: "hidden", timeout: 5_000 }).catch(() => {});
    }
  }

  async fillDateInput(input, daysAhead, trip = this.itinerary(0)) {
    const fromBefore = await trip.fromInput.inputValue();
    const toBefore = await trip.toInput.inputValue();
    const date = futureDate(daysAhead);
    const value = formatMmDdYyyy(date);
    const dayName = this.calendarDayName(date);
    const calendarOpen = await this.page
      .getByRole("gridcell")
      .first()
      .isVisible()
      .catch(() => false);

    if (!calendarOpen) {
      await input.click({ force: true });
    }

    const day = this.page.getByRole("gridcell", { name: dayName });
    await day.waitFor({ state: "visible", timeout: 10_000 });
    await day.click();
    await this.confirmDatePicker();

    await expect(trip.fromInput).toHaveValue(fromBefore);
    await expect(trip.toInput).toHaveValue(toBefore);
    return value;
  }

  /**
   * Fills the departure date field with a date a specified number of days in the future.
   * @param {*} daysAhead - this is hardcoded for simplicity, but could be made dynamic to support testing different date ranges
   * @returns
   */
  async fillDepartDate(daysAhead = 14, index = 0) {
    const trip = this.itinerary(index);
    if (index === 0) {
      return this.fillDateInput(
        await this.visibleDepartDateInput(),
        daysAhead,
        trip,
      );
    }
    return this.fillDateInput(trip.departDate, daysAhead, trip);
  }

  async fillReturnDate(daysAhead = 21) {
    return this.fillDateInput(this.returnDate, daysAhead);
  }

  async setAdultPassengers(count) {
    await this.travelerDropdown.click();
    await this.adultIncrement.waitFor({ state: "visible" });
    const current = Number(await this.adultCountInput.inputValue());
    for (let i = current; i < count; i += 1) {
      await this.adultIncrement.click();
    }
    await expect(this.adultCountInput).toHaveValue(String(count));
    await this.travelerDone.click();
    await this.adultIncrement.waitFor({ state: "hidden", timeout: 10_000 });
    await expect(this.travelerDropdown).toContainText(
      count === 1 ? /1\s*Traveler/ : new RegExp(`${count}\\s*Travelers`),
    );
  }

  async addTrip(index) {
    await this.addTripButton.evaluate((button) => button.click());
    await expect(this.tripTypeButton).toContainText(/Multi-City/i);
    await expect(this.itinerary(index).fromInput).toBeVisible();
  }

  async submitFindTrains() {
    await this.findTrains.evaluate((button) => button.click());
  }

  async chooseTripType(label) {
    await this.tripTypeButton.click();
    const option = this.page
      .getByRole("button", { name: label, exact: true })
      .last();
    await option.click();
  }

  stationSuggestions(which) {
    const field =
      which === "from" ? this.inputFromStation : this.inputToStation;
    return field.locator(".ads-cursor-pointer"); //Dropdown suggestions for station search results
  }

  committedStationPattern(code) {
    return new RegExp(`(^${code}\\b)|(\\(${code}\\))`);
  }

  async expectStationsCommitted(data, index = 0) {
    const trip = this.itinerary(index);
    await expect(trip.fromInput).toHaveValue(
      this.committedStationPattern(data.fromCode),
    );
    await expect(trip.toInput).toHaveValue(
      this.committedStationPattern(data.toCode),
    );
  }

  async submitJourney() {
    const isJourneyPost = (url, method) =>
      method === "POST" && url.includes("/dotcom/journey-solution-option");
    const requestPromise = this.page.waitForRequest(
      (request) => isJourneyPost(request.url(), request.method()),
      { timeout: 25_000 },
    );
    await this.submitFindTrains();
    const request = await requestPromise;
    return request.postDataJSON();
  }

  passengerCountFromPayload(payload) {
    const journey = payload.journeyRequest;
    const groups = [
      journey.passengers,
      journey.customers,
      journey.travelers,
      journey.passenger,
      journey.passengers?.passenger,
    ].filter((value) => Array.isArray(value));
    if (groups.length) {
      return groups[0].length;
    }
    const adultMarks = JSON.stringify(payload).match(/"type":"F"/g);
    if (adultMarks) {
      return adultMarks.length;
    }
    throw new Error(
      `Unable to read passenger count. journeyRequest keys: ${Object.keys(journey).join(", ")}`,
    );
  }

  validateApiPayload(payload, data, tripType, options = {}) {
    const expectedLegs =
      options.legs ||
      (tripType === "RT"
        ? [
            {
              fromCode: data.fromCode,
              toCode: data.toCode,
              departInDays: data.departInDays,
            },
            {
              fromCode: data.toCode,
              toCode: data.fromCode,
              departInDays: data.returnInDays,
            },
          ]
        : [data]);
    const legs = payload.journeyRequest.journeyLegRequests;
    expect(payload.journeyRequest.type).toBe(tripType);
    expect(legs).toHaveLength(expectedLegs.length);
    for (let i = 0; i < expectedLegs.length; i += 1) {
      const leg = legs[i];
      const expected = expectedLegs[i];
      expect(leg.origin.code).toBe(expected.fromCode);
      expect(leg.destination.code).toBe(expected.toCode);
      expect(leg.origin.schedule.departureDateTime).toContain(
        isoDate(expected.departInDays),
      );
    }
    if (options.passengerCount != null) {
      expect(this.passengerCountFromPayload(payload)).toBe(
        options.passengerCount,
      );
    }
  }

  async expectFindTrainsDisabled() {
    await expect(this.findTrains).toBeDisabled();
  }

  async expectSameStationBlocked() {
    await expect
      .poll(async () => {
        const disabled = await this.findTrains.isDisabled();
        const message = (await this.sameStationError.textContent()) || "";
        return disabled || /same|identical|different station/i.test(message);
      })
      .toBe(true);
  }

  async typeInvalidOrigin(query) {
    await this.typeStationQuery("from", query);
    await this.page.waitForTimeout(1200);
  }

  async typeInvalidDestination(query) {
    await this.typeStationQuery("to", query);
    await this.page.waitForTimeout(1200);
  }

  async expectInvalidOriginBlocked() {
    await expect(this.fromInput).not.toHaveValue(/\([A-Z]{3}\)/);
    await this.expectFindTrainsDisabled();
  }

  async expectInvalidDestinationBlocked() {
    await expect(this.toInput).not.toHaveValue(/\([A-Z]{3}\)/);
    await this.expectFindTrainsDisabled();
  }
}

module.exports = { HomePage };
