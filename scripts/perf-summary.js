// Prints a readable table from test-results/perf-metrics.jsonl
const fs = require('fs');
const file = 'test-results/perf-metrics.jsonl';
if (!fs.existsSync(file)) { console.log('No perf metrics recorded.'); process.exit(0); }
const rows = fs.readFileSync(file, 'utf8').trim().split('\n').filter(Boolean).map((l) => JSON.parse(l));
const groups = {};
for (const r of rows) (groups[r.scenario.split(':')[0]] ||= []).push(r);
const fmt = (v) => (v === undefined ? '-' : String(v));
const table = (title, cols, items) => {
  console.log(`\n### ${title}`);
  const header = ['Scenario', ...cols.map((c) => c[1])];
  const body = items.map((r) => [r.scenario.split(': ').slice(1).join(': '), ...cols.map((c) => fmt(r[c[0]]))]);
  const w = header.map((h, i) => Math.max(h.length, ...body.map((b) => b[i].length)));
  const line = (a) => '| ' + a.map((x, i) => x.padEnd(w[i])).join(' | ') + ' |';
  console.log(line(header)); console.log('|' + w.map((x) => '-'.repeat(x + 2)).join('|') + '|');
  body.forEach((b) => console.log(line(b)));
};
const nav = [['ttfbMs', 'TTFB ms'], ['domContentLoadedMs', 'DCL ms'], ['loadMs', 'Load ms'], ['lcpMs', 'LCP ms'], ['cls', 'CLS']];
if (groups.load) table('Cold page loads (median of 3)', nav, groups.load);
if (groups['slow-4g']) table('Slow 4G + 4x CPU throttle (mobile)', nav, groups['slow-4g']);
if (groups.weight) table('Page weight', [['requests', 'Requests'], ['decodedMB', 'Decoded MB']], groups.weight);
if (groups.interaction) table('Interaction', [['feedbackMs', 'Feedback ms']], groups.interaction);
if (groups.http) table('Server response (5 requests)', [['medianMs', 'Median ms'], ['maxMs', 'Max ms'], ['encoding', 'Encoding']], groups.http);
