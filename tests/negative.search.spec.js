const { test } = require("./common/fixtures");
const cases = require("./data/search-cases");

test.describe("[Negative tests] Amtrak search", () => {
  for (const data of cases.incompleteSearches) {
    test(`Incomplete stations keep Find Trains button disabled [${data.name}]`, async ({
      home,
    }) => {
      await test.step(`Leave search incomplete: ${data.name}`, async () => {
        await data.setup(home);
      });

      await test.step("Find Trains stays disabled", async () => {
        await home.expectFindTrainsDisabled();
      });
    });
  }

  for (const data of cases.sameStation) {
    test(`Find Trains button is disabled when Same origin and destination [${data.name}]`, async ({
      home,
    }) => {
      await test.step(`Select ${data.code} as origin and destination`, async () => {
        await home.selectSameStation(data);
      });

      await test.step("Find Trains stays disabled", async () => {
        await home.expectSameStationBlocked();
      });
    });
  }

  for (const data of cases.invalidStations) {
    test(`Invalid station name does not show any results [${data.name}]`, async ({
      home,
    }) => {
      await test.step("Type an invalid origin and confirm no coded station", async () => {
        await home.typeInvalidOrigin(data.query);
        await home.expectInvalidOriginBlocked();
      });

      await test.step("Type an invalid destination and confirm no coded station", async () => {
        await home.typeInvalidDestination(data.query);
        await home.expectInvalidDestinationBlocked();
      });
    });
  }
});
