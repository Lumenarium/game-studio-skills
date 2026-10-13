import assert from 'node:assert/strict';

// Keep real process/HTTP coverage without a configurable production CLI endpoint.
const local = new URL(process.env.STUDIO_TEST_ORIGIN);
const loopback = (url) =>
  url.protocol === 'http:' && ['127.0.0.1', 'localhost', '[::1]'].includes(url.hostname);
assert.ok(loopback(local), 'Test transport requires a loopback HTTP server');
const originalFetch = globalThis.fetch;
globalThis.fetch = (input, init) => {
  const url = new URL(input instanceof Request ? input.url : input);
  if (url.origin === 'https://studio.lumenarium.biz') {
    url.protocol = local.protocol;
    url.host = local.host;
  }
  assert.ok(loopback(url), 'Test transport refuses external requests');
  return originalFetch(input instanceof Request ? new Request(url, input) : url, init);
};
