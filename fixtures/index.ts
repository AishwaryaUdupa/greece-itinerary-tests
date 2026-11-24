import { test as base, expect } from '@playwright/test';
import { GreeceTripPlannerPage } from '../pages/GreeceTripPlannerPage';
import { GreeceGuidesPage } from '../pages/GreeceGuidesPage';

type Fixtures = {
  plannerPage: GreeceTripPlannerPage;
  guidesPage: GreeceGuidesPage;
};

/** Import `test` and `expect` from here, not from @playwright/test. */
export const test = base.extend<Fixtures>({
  plannerPage: async ({ page }, use) => {
    await use(new GreeceTripPlannerPage(page));
  },
  guidesPage: async ({ page }, use) => {
    await use(new GreeceGuidesPage(page));
  },
});

export { expect };
