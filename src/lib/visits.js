/**
 * Adds a visitCount to each favorite from the browsing history. Each unique URL
 * is looked up once. getVisits is chrome.history.getVisits or a stand-in.
 */
export async function addVisitCounts(favorites, getVisits) {
  const counts = new Map();
  for (const url of new Set(favorites.map((f) => f.url))) {
    counts.set(url, (await getVisits({ url })).length);
  }
  return favorites.map((f) => ({ ...f, visitCount: counts.get(f.url) }));
}
