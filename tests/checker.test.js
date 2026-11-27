import test from 'node:test';
import assert from 'node:assert/strict';
import { checkFavorites, checkUrl, classifyCode, readerModeTarget, skipReason } from '../src/lib/checker.js';

const reply = (status, extra = {}) => async () => ({ status, redirected: false, ...extra });

test('classifies response codes', () => {
  for (const code of [200, 204, 301, 401, 403, 429, 999]) assert.equal(classifyCode(code), 'good', `${code}`);
  for (const code of [400, 404, 410, 500, 503]) assert.equal(classifyCode(code), 'suspect', `${code}`);
});

test('skips addresses that cannot be checked', () => {
  for (const url of ['javascript:alert(1)', 'edge://settings', 'file:///c:/a.txt', 'nonsense', 'https://a:b@example.com']) {
    assert.ok(skipReason(url), url);
  }
  assert.equal(skipReason('https://example.com/a?b#c'), null);
});

test('retries server errors but not 404', async () => {
  let calls = 0;
  const counting = (status) => async () => (calls++, { status });
  await checkUrl('https://example.com', { fetchFn: counting(503) });
  assert.equal(calls, 2);
  calls = 0;
  await checkUrl('https://example.com', { fetchFn: counting(404) });
  assert.equal(calls, 1);
});

test('reports network failure and timeout without a code', async () => {
  const failed = await checkUrl('https://example.com', { fetchFn: async () => { throw new TypeError('x'); } });
  assert.deepEqual([failed.status, failed.code], ['suspect', null]);

  const hang = (url, { signal }) =>
    new Promise((_, reject) => signal.addEventListener('abort', () => reject(new Error('aborted'))));
  const slow = await checkUrl('https://example.com', { fetchFn: hang, timeoutMs: 5 });
  assert.equal(slow.note, 'Timed out');
});

test('records the redirect target', async () => {
  const result = await checkUrl('https://a.test', { fetchFn: reply(200, { redirected: true, url: 'https://b.test/' }) });
  assert.equal(result.redirectedTo, 'https://b.test/');
});

test('keeps order and requests duplicate URLs once', async () => {
  let calls = 0;
  const progress = [];
  const favorites = [{ id: 1, url: 'https://a.test' }, { id: 2, url: 'https://b.test' }, { id: 3, url: 'https://a.test' }];
  const results = await checkFavorites(favorites, {
    fetchFn: async () => (calls++, { status: 200 }),
    onProgress: (done) => progress.push(done),
  });
  assert.deepEqual(results.map((r) => r.id), [1, 2, 3]);
  assert.equal(calls, 2);
  assert.deepEqual(progress, [1, 2, 3]);
});

test('handles an empty list', async () => {
  assert.deepEqual(await checkFavorites([]), []);
});

const READER = 'read://https_example.com/?url=https%3A%2F%2Fexample.com%2Fpage%2F%3Fa%3D1%26b%3D2';

test('finds the page inside a Reader mode favorite', () => {
  assert.equal(readerModeTarget(READER), 'https://example.com/page/?a=1&b=2');
  assert.equal(readerModeTarget('https://example.com/?url=https%3A%2F%2Fb.test'), null);
  assert.equal(readerModeTarget('read://x/?url=javascript%3Aalert(1)'), null);
  assert.equal(readerModeTarget('read://x/'), null);
});

test('checks a Reader mode favorite through the page it wraps', async () => {
  const asked = [];
  const result = await checkUrl(READER, { fetchFn: async (url) => (asked.push(url), { status: 404 }) });
  assert.deepEqual(asked, ['https://example.com/page/?a=1&b=2']);
  assert.equal(result.status, 'suspect');
  assert.equal((await checkUrl('read://x/')).status, 'skipped');
});
