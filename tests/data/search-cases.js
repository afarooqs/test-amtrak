module.exports = {
  autocompleteRoutes: [
    {
      name: "Northeast Corridor codes",
      fromQuery: "New York",
      fromCode: "NYP",
      toQuery: "Washington",
      toCode: "WAS",
    },
    {
      name: "Midwest city names",
      fromQuery: "Chicago",
      fromCode: "CHI",
      toQuery: "Milwaukee",
      toCode: "MKE",
    },
  ],
  searchRequests: [
    {
      name: "one-way Chicago to Milwaukee",
      tripType: "one-way",
      fromQuery: "Chicago",
      fromCode: "CHI",
      toQuery: "Milwaukee",
      toCode: "MKE",
      departInDays: 14,
    },
    {
      name: "one-way New York to Washington",
      tripType: "one-way",
      fromQuery: "New York",
      fromCode: "NYP",
      toQuery: "Washington",
      toCode: "WAS",
      departInDays: 21,
    },
  ],
  multiCitySearches: [
    {
      name: "two trips NYP-WAS-BOS",
      tripType: "MC",
      legs: [
        {
          fromQuery: "New York",
          fromCode: "NYP",
          toQuery: "Washington",
          toCode: "WAS",
          departInDays: 14,
        },
        {
          fromQuery: "Washington",
          fromCode: "WAS",
          toQuery: "Boston",
          toCode: "BOS",
          departInDays: 18,
        },
      ],
    },
    {
      name: "three trips NYP-WAS-BOS-PHL",
      tripType: "MC",
      legs: [
        {
          fromQuery: "New York",
          fromCode: "NYP",
          toQuery: "Washington",
          toCode: "WAS",
          departInDays: 14,
        },
        {
          fromQuery: "Washington",
          fromCode: "WAS",
          toQuery: "Boston",
          toCode: "BOS",
          departInDays: 18,
        },
        {
          fromQuery: "Boston",
          fromCode: "BOS",
          toQuery: "Philadelphia",
          toCode: "PHL",
          departInDays: 21,
        },
      ],
    },
  ],
  roundTrips: [
    {
      name: "open return date for NYP-WAS",
      fromQuery: "New York",
      fromCode: "NYP",
      toQuery: "Washington",
      toCode: "WAS",
      departInDays: 14,
      returnInDays: 21,
    },
    {
      name: "open return date for CHI-MKE",
      fromQuery: "Chicago",
      fromCode: "CHI",
      toQuery: "Milwaukee",
      toCode: "MKE",
      departInDays: 16,
      returnInDays: 23,
    },
  ],
  incompleteSearches: [
    {
      name: "both stations empty",
      setup: async (home) => {
        await home.findTrains.waitFor({ state: "visible" });
      },
    },
    {
      name: "destination missing",
      setup: async (home) => {
        await home.selectFromStation("Chicago", "CHI");
      },
    },
  ],
  sameStation: [
    {
      name: "same New York station",
      query: "New York",
      code: "NYP",
    },
    {
      name: "same Chicago station",
      query: "Chicago",
      code: "CHI",
    },
  ],
  invalidStations: [
    {
      name: "nonsense token",
      query: "ZZZXQ9NOTASTATION",
    },
    {
      name: "symbols only",
      query: "@@@###",
    },
  ],
};
