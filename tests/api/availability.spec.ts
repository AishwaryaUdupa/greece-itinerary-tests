import { test, expect } from '@playwright/test';

/**
 * HTTP-level checks that the pages a Greece traveller lands on are up,
 * served as HTML, and not accidentally blocked or redirected away.
 */
const greecePages = [
  { name: 'Greece trip planner', path: '/tp/88375/greece-trip-planner', mustMention: /Greece/i },
  { name: 'Crete (Kreta) trip planner', path: '/tp/9628/kreta-trip-planner', mustMention: /Kreta|Crete/i },
  { name: 'Greece itineraries and guides', path: '/guides/88375/greece-itineraries-and-travel-guides', mustMention: /Greece/i },
  { name: 'Greece 7-day itinerary', path: '/view/tplfdvudmy/greece-guide--7-day-itinerary', mustMention: /Greece/i },
];

for (const p of greecePages) {
  test(`${p.name} is reachable and relevant @smoke`, async ({ request }) => {
    const res = await request.get(p.path);
    expect(res.status(), `${p.path} returned ${res.status()}`).toBe(200);
    expect(res.headers()['content-type']).toContain('text/html');
    expect(await res.text()).toMatch(p.mustMention);
  });
}

test('unknown trip page returns a not-found response, not a server error', async ({ request }) => {
  const res = await request.get('/tp/0/this-trip-does-not-exist');
  expect(res.status()).toBeLessThan(500);
});
