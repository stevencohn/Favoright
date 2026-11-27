/*
 * Copyright (c) 2026 Steven M. Cohn
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

import { STATUS } from './checker.js';

/**
 * Chooses and orders the report rows: suspect first, then (when including all)
 * good, then those that could not be checked. Tree order is kept in each group.
 */
export function buildSections(results, includeAll) {
  const wanted = includeAll ? [STATUS.SUSPECT, STATUS.GOOD, STATUS.SKIPPED] : [STATUS.SUSPECT];
  const titles = {
    [STATUS.SUSPECT]: 'Suspect favorites',
    [STATUS.GOOD]: 'Good favorites',
    [STATUS.SKIPPED]: 'Not checked',
  };
  return wanted
    .map((status) => ({ status, title: titles[status], rows: results.filter((r) => r.status === status) }))
    .filter((section) => section.status === STATUS.SUSPECT || section.rows.length > 0);
}

export function countByStatus(results) {
  const counts = { [STATUS.SUSPECT]: 0, [STATUS.GOOD]: 0, [STATUS.SKIPPED]: 0 };
  for (const result of results) counts[result.status]++;
  return counts;
}

export function formatCount(count) {
  if (count === null || count === undefined) return '—';
  return count.toLocaleString();
}

export function formatDate(milliseconds) {
  if (!milliseconds) return '—';
  return new Date(milliseconds).toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}
