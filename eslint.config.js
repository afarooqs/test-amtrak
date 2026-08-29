const js = require("@eslint/js");
const globals = require("globals");
const playwright = require("eslint-plugin-playwright");

module.exports = [
  {
    ignores: [
      "node_modules/**",
      "playwright-report/**",
      "test-results/**",
      "blob-report/**",
    ],
  },
  js.configs.recommended,
  {
    files: ["**/*.js"],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: "commonjs",
      globals: {
        ...globals.node,
      },
    },
    rules: {
      "no-unused-vars": ["error", { argsIgnorePattern: "^_" }],
    },
  },
  {
    files: ["tests/**/*.js"],
    ...playwright.configs["flat/recommended"],
    rules: {
      ...playwright.configs["flat/recommended"].rules,
      "playwright/expect-expect": [
        "error",
        {
          assertFunctionNames: [
            "expect",
            "validateApiPayload",
            "setAdultPassengers",
            "addTrip",
            "expectStationsCommitted",
            "chooseRoundTrip",
            "selectStationsAndExpectReturnDate",
            "expectFindTrainsDisabled",
            "expectSameStationBlocked",
            "expectInvalidOriginBlocked",
          ],
        },
      ],
      "playwright/no-wait-for-timeout": "off",
      "playwright/no-force-option": "off",
    },
  },
];
