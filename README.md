# Greece Itinerary Test Framework

Playwright (TypeScript) tests that exercise the way real travellers plan a trip to
Greece on a travel-planning site. Default target: [Wanderlog](https://wanderlog.com)'s
Greece trip planner. Point `BASE_URL` at a different site and adapt the page objects to reuse it.

## Real-world journeys covered

| # | Traveller goal | What is verified |
| --- | --- | --- |
| 1 | "I want to start planning" | Greece planner loads; asks for start/end dates; Log in / Sign up reachable |
| 2 | "Where should I go / what should I see?" | Top destinations and attractions shown, each with a Save button |
| 3 | "Shortlist places for my itinerary" | Saving a place updates the "N places saved" counter or prompts sign-in; Create trip is offered |
| 4 | "Pick dates and plan" | Plan trip never dead-ends (progresses, prompts sign-in, or validates dates) |
| 5 | "How did others plan Greece?" | Guides list opens a real itinerary; a 7-day itinerary is browsable |
| 6 | "I plan on my phone" | No horizontal overflow on mobile viewports |
| - | Availability (HTTP) | Greece and Crete pages return 200 HTML and mention the destination |

Projects: desktop Chrome and Firefox, mobile Chrome (Pixel 7) and Safari (iPhone 14), plus an HTTP-only `availability` project.
Locale is `en-US` and timezone `Europe/Athens`.

## Layout

```
playwright.config.ts            projects, reporters, trace/screenshot/video on failure
pages/                          BasePage, GreeceTripPlannerPage, GreeceGuidesPage
fixtures/index.ts               plannerPage, guidesPage fixtures (import test/expect from here)
tests/ui/greece-trip-planning.spec.ts   traveller journeys
tests/api/availability.spec.ts          page availability checks
.github/workflows/playwright.yml        CI (push, PR, manual, daily)
```

## Run

```bash
npm install
npx playwright install --with-deps
cp .env.example .env
npm test                 # everything
npm run test:smoke       # @smoke only
npx playwright test --project=mobile-chrome
npm run report           # open HTML report
```

## Caveats

- Tests run against a live third-party site. Locators are role/text based, but the
  site can change or rate-limit CI traffic; the daily scheduled run exists to catch drift.
- Journey 3 and 4 accept either outcome (action succeeds or a sign-in prompt appears)
  because anonymous behaviour may differ from site to site.
- Locators were written from the page's published structure, not from a live
  browser session, so expect to tune a few on the first real run.
