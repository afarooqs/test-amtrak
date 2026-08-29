# Amtrak search tests

Data-driven Playwright coverage for the Amtrak.com fare finder. Tests use a page object, HTML reporting with `test.step()`, screenshots on failure, and video on every run.

## Requirements

Minimum tooling to clone and run the suite:

| Software            | Minimum   | Notes                                                                                                                                                        |
| ------------------- | --------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Git                 | 2.30+     | Needed to clone the repository                                                                                                                               |
| Node.js             | 22        | Required by `package.json` `engines`. GitHub Actions uses Node 22                                                                                            |
| npm                 | 10        | Ships with Node 22; `npm ci` needs lockfile version 3                                                                                                        |
| Playwright browsers | see below | Default CI/local run uses **Chromium**. Cross-browser and mobile projects need extra binaries (install them yourself; see [Extra browsers](#extra-browsers)) |

You also need outbound HTTPS to `github.com`, the npm registry, and `www.amtrak.com`.

## Setup

```bash
git clone https://github.com/afarooqs/test-amtrak.git
cd test-amtrak
npm ci
npx playwright install chromium
```

## Commands

| Command                      | Purpose                                                     |
| ---------------------------- | ----------------------------------------------------------- |
| `npm test`                   | Full suite on Playwright Chromium; retry a failed test once |
| `npm run test:headed`        | Headed Chromium                                             |
| `npm run test:cross-browser` | Desktop Google Chrome, Microsoft Edge, and Firefox          |
| `npm run test:mobile`        | Mobile viewport on Chrome (Pixel 7) and Safari (iPhone 14)  |
| `npm run test:report`        | Open the last HTML report                                   |
| `npm run lint`               | ESLint                                                      |

## Extra browsers

`npm test` only launches Playwright **Chromium**. Do not run these install commands until you want those projects. On Linux, add `--with-deps` if system libraries are missing.

**Cross-browser (`npm run test:cross-browser`)**

```bash
npx playwright install chrome
npx playwright install msedge
npx playwright install firefox
```

**Mobile (`npm run test:mobile`)**

```bash
npx playwright install webkit
```

Install everything for extra projects in one line:

```bash
npx playwright install chrome msedge firefox webkit
```

## Summary of Repository

A brief overview of the features of this repository:

- Uses Playwright to run Page Object Model pattern for tests.
- Positive and Negative tests.
- Data Driven tests.
- Use of fixtures in Playwright.
- API validation from Amtrak's API when search is performed.
- A couple of tests are tagged `smoke` tests which are run on every push to remote origin, giving quick feedback for each Pull Request.
- Integration with Github Actions to show CI features.
- 3 different Github Actions workflows: smoke test, scheduled runs (every hour), e2e tests (runs full test suite).
- Videos are recorded for every test case whether they pass or fail for demonstration purposes. Ideally videos are recorded only on failure.
- If a test fails it is retried once and a screenshot is also attached in the test report.
- Review test activity in Playwright trace in the test report.
- Cross Browser testing through Playwright projects setup.
  - Setup required: `npx playwright install chrome msedge firefox webkit`
- Test reports published to GitHub Pages https://afarooqs.github.io/test-amtrak/

## Test Suite

The current test suite covers these areas:

1. One-way search payload validation with smoke coverage (`@smoke`)
2. Round-trip search payload validation with smoke coverage (`@smoke`)
3. Station autocomplete selects a coded station
4. Search request includes a random passenger count between 1 and 4
5. Multi-city itinerary requests validate multiple legs in one submission
6. Incomplete stations keep Find Trains disabled
7. Same origin and destination is rejected
8. Invalid station queries do not yield coded station results

Search submission asserts the `POST /dotcom/journey-solution-option` body. Amtrak may still return HTTP 403 to automated browsers; the suite verifies that the request was sent with the expected origin, destination, trip type, and date.

## CI

GitHub Actions on `main` and pull requests:

- ESLint
- Playwright (one run per test, retry once on failure)
- HTML report published to [GitHub Pages](https://afarooqs.github.io/test-amtrak/) after each `main` run
