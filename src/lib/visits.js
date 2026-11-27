/*
 * Copyright (c) 2026 Steven M. Cohn
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

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
