/*
 * Copyright (c) 2026 Steven M. Cohn
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

import test from 'node:test';
import assert from 'node:assert/strict';
import { flattenFavorites } from '../src/lib/bookmarks.js';
import { buildSections, formatCount, formatDate } from '../src/lib/report-model.js';

test('builds folder paths without the invisible root', () => {
  const tree = [{ id: '0', title: '', children: [{ id: '1', parentId: '0', title: 'Favorites bar', children: [
    { id: '2', parentId: '1', title: 'Top', url: 'https://a.test', dateAdded: 5 },
    { id: '3', parentId: '1', title: 'Work', children: [{ id: '4', parentId: '3', title: 'Deep', url: 'https://b.test' }] },
  ] }] }];
  const list = flattenFavorites(tree);
  assert.deepEqual(list.map((f) => f.location), ['Favorites bar', 'Favorites bar › Work']);
  assert.equal(list[0].dateLastUsed, null);
});

const results = [
  { id: 1, status: 'good' }, { id: 2, status: 'suspect' }, { id: 3, status: 'skipped' }, { id: 4, status: 'suspect' },
];

test('shows suspect items first when including all', () => {
  const ids = buildSections(results, true).flatMap((s) => s.rows.map((r) => r.id));
  assert.deepEqual(ids, [2, 4, 1, 3]);
});

test('shows only suspect items otherwise, even when there are none', () => {
  assert.deepEqual(buildSections(results, false).map((s) => s.status), ['suspect']);
  assert.equal(buildSections([], false)[0].rows.length, 0);
});

test('formats missing dates as a dash', () => {
  assert.equal(formatDate(null), '—');
});

test('formats visit counts, with a dash when unknown', () => {
  assert.equal(formatCount(null), '—');
  assert.equal(formatCount(undefined), '—');
  assert.equal(formatCount(0), '0');
  assert.equal(formatCount(5), '5');
});
