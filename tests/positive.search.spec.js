const { expect } = require("@playwright/test");
const { test } = require("./common/fixtures");
const cases = require("./data/search-cases");

async function chooseRoundTrip(home) {
  await home.chooseTripType("Round-Trip");
  await expect(home.tripTypeButton).toContainText(/Round-Trip/i);
}

async function selectStationsAndExpectReturnDate(home, data) {
  await home.selectStations(data);
  await expect(home.returnDate).toBeVisible();
  await expect(home.returnDate).toBeEnabled();
}

test.describe("[Positive tests] Amtrak search", () => {
  for (const data of cases.searchRequests) {
    test(
      `Search oneway itinerary [${data.name}]`,
      { tag: "@smoke" },
      async ({ home }) => {
        let payload;

        await test.step(`select origin ${data.fromCode} and destination ${data.toCode}`, async () => {
          await home.selectStations(data);
          await home.expectStationsCommitted(data);
        });

        await test.step("fill depart date", async () => {
          await home.fillDepartDate(data.departInDays);
        });

        await test.step("submit search", async () => {
          payload = await home.submitJourney();
        });

        await test.step("validate API payload", async () => {
          home.validateApiPayload(payload, data, "OW");
        });
      },
    );
  }

  for (const data of cases.roundTrips) {
    test(
      `Search round trip itinerary [${data.name}]`,
      { tag: "@smoke" },
      async ({ home }) => {
        let payload;

        await test.step("choose Round-Trip", async () => {
          await chooseRoundTrip(home);
        });

        await test.step(
          `select origin ${data.fromCode} and destination ${data.toCode}`,
          async () => {
            await selectStationsAndExpectReturnDate(home, data);
            await home.expectStationsCommitted(data);
          },
        );

        await test.step("fill depart and return dates", async () => {
          await home.fillDepartDate(data.departInDays);
          await home.fillReturnDate(data.returnInDays);
        });

        await test.step("submit search", async () => {
          payload = await home.submitJourney();
        });

        await test.step("validate API payload", async () => {
          home.validateApiPayload(payload, data, "RT");
        });
      },
    );
  }

  for (const data of cases.autocompleteRoutes) {
    test(`Station autocomplete selects a coded station [${data.name}]`, async ({
      home,
    }) => {
      await test.step(`type and select origin ${data.fromCode}`, async () => {
        await home.selectFromStation(data.fromQuery, data.fromCode);
        await expect(home.fromInput).toHaveValue(
          home.committedStationPattern(data.fromCode),
        );
      });

      await test.step(`type and select destination ${data.toCode}`, async () => {
        await home.selectToStation(data.toQuery, data.toCode);
        await expect(home.toInput).toHaveValue(
          home.committedStationPattern(data.toCode),
        );
      });
    });
  }

  test("Search with a random passenger count between 1 and 4", async ({
    home,
  }, testInfo) => {
    const data = cases.searchRequests[0];
    const passengers = 1 + Math.floor(Math.random() * 4);
    testInfo.annotations.push({
      type: "passengers",
      description: String(passengers),
    });

    await test.step(`select origin ${data.fromCode} and destination ${data.toCode}`, async () => {
      await home.selectStations(data);
      await home.expectStationsCommitted(data);
    });

    await test.step(`set adult passengers to ${passengers}`, async () => {
      await home.setAdultPassengers(passengers);
    });

    await test.step("fill depart date", async () => {
      await home.fillDepartDate(data.departInDays);
    });

    let payload;

    await test.step("submit search", async () => {
      payload = await home.submitJourney();
    });

    await test.step("validate API payload", async () => {
      home.validateApiPayload(payload, data, "OW", {
        passengerCount: passengers,
      });
    });
  });

  for (const data of cases.multiCitySearches) {
    test(`Multi-City Trip searches ${data.legs.length} itineraries [${data.name}]`, async ({
      home,
    }) => {
      const first = data.legs[0];

      await test.step(
        `fill itinerary 1: ${first.fromCode} to ${first.toCode}`,
        async () => {
          await home.selectStations(first, 0);
          await home.expectStationsCommitted(first, 0);
          await home.fillDepartDate(first.departInDays, 0);
        },
      );

      for (let i = 1; i < data.legs.length; i += 1) {
        const leg = data.legs[i];
        const tripNumber = i + 1;

        await test.step(`click Add Trip for itinerary ${tripNumber}`, async () => {
          await home.addTrip(i);
        });

        await test.step(
          `fill itinerary ${tripNumber}: ${leg.fromCode} to ${leg.toCode}`,
          async () => {
            await home.selectStations(leg, i);
            await home.expectStationsCommitted(leg, i);
            await home.fillDepartDate(leg.departInDays, i);
          },
        );
      }

      let payload;

      await test.step("submit search", async () => {
        payload = await home.submitJourney();
      });

      await test.step("validate API payload", async () => {
        home.validateApiPayload(payload, data.legs[0], data.tripType, {
          legs: data.legs,
        });
      });
    });
  }
});
