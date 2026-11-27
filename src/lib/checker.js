export const STATUS = Object.freeze({
  SUSPECT: 'suspect',
  GOOD: 'good',
  SKIPPED: 'skipped',
});

// The server answered but refused this anonymous, automated request. The site
// still exists, so these are not treated as broken. 999 is used by LinkedIn.
export const REACHABLE_BUT_RESTRICTED = new Set([401, 403, 429, 999]);

export const DEFAULTS = Object.freeze({ timeoutMs: 15000, concurrency: 8, attempts: 2 });

export function classifyCode(code) {
  if (code >= 200 && code < 400) return STATUS.GOOD;
  if (REACHABLE_BUT_RESTRICTED.has(code)) return STATUS.GOOD;
  return STATUS.SUSPECT;
}

/** Explains why a URL cannot be checked, or returns null if it can. */
export function skipReason(url) {
  let parsed;
  try {
    parsed = new URL(url);
  } catch {
    return 'Invalid URL';
  }
  if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
    return `Not a web address (${parsed.protocol})`;
  }
  if (parsed.username || parsed.password) return 'URL contains a user name or password';
  return null;
}

/**
 * Returns the page inside an Edge Reader mode favorite
 * (read://https_example.com/?url=https%3A%2F%2Fexample.com%2F), or null when
 * the URL is not one or the page inside is not a web address.
 */
export function readerModeTarget(url) {
  let parsed;
  try {
    parsed = new URL(url);
  } catch {
    return null;
  }
  if (parsed.protocol !== 'read:') return null;
  const inner = parsed.searchParams.get('url');
  if (!inner || skipReason(inner)) return null;
  return inner;
}

async function requestOnce(url, fetchFn, timeoutMs) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    // GET, because many servers reject or mishandle HEAD. Cookies are omitted
    // so a check never acts on the user's signed-in sessions.
    const response = await fetchFn(url, {
      method: 'GET',
      redirect: 'follow',
      credentials: 'omit',
      cache: 'no-store',
      referrerPolicy: 'no-referrer',
      signal: controller.signal,
    });
    const result = {
      status: classifyCode(response.status),
      code: response.status,
      note: REACHABLE_BUT_RESTRICTED.has(response.status) ? 'Reachable, access restricted' : '',
      redirectedTo: response.redirected ? response.url : '',
    };
    // Only the status line is needed; do not download the page.
    response.body?.cancel().catch(() => {});
    return result;
  } catch {
    return {
      status: STATUS.SUSPECT,
      code: null,
      note: controller.signal.aborted ? 'Timed out' : 'No response (DNS, connection or certificate error)',
      redirectedTo: '',
    };
  } finally {
    clearTimeout(timer);
  }
}

export async function checkUrl(url, options = {}) {
  const { fetchFn = fetch, timeoutMs, attempts } = { ...DEFAULTS, ...options };
  // Reader mode favorites are checked through the page they wrap.
  const target = readerModeTarget(url) ?? url;
  const reason = skipReason(target);
  if (reason) return { status: STATUS.SKIPPED, code: null, note: reason, redirectedTo: '' };

  let result;
  for (let attempt = 0; attempt < attempts; attempt++) {
    result = await requestOnce(target, fetchFn, timeoutMs);
    // Retry only failures that are often temporary.
    if (result.code !== null && result.code < 500) break;
  }
  return result;
}

/**
 * Checks every favorite with limited concurrency. Identical URLs are requested
 * once. Results keep the order of the input.
 */
export async function checkFavorites(favorites, options = {}) {
  const { concurrency, onProgress } = { ...DEFAULTS, ...options };
  const results = new Array(favorites.length);
  const pending = new Map();
  let next = 0;
  let done = 0;

  const worker = async () => {
    while (next < favorites.length) {
      const index = next++;
      const favorite = favorites[index];
      if (!pending.has(favorite.url)) {
        pending.set(favorite.url, checkUrl(favorite.url, options));
      }
      results[index] = { ...favorite, ...(await pending.get(favorite.url)) };
      onProgress?.(++done, favorites.length);
    }
  };

  await Promise.all(Array.from({ length: Math.min(concurrency, favorites.length) }, worker));
  return results;
}
