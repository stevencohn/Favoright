/*
 * Copyright (c) 2026 Steven M. Cohn
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

import test from 'node:test';
import assert from 'node:assert/strict';
import { addVisitCounts } from '../src/lib/visits.js';

test('counts visits once per unique URL', async () => {
  const history = { 'https://a.test/': 3, 'https://b.test/': 0 };
  const asked = [];
  const getVisits = async ({ url }) => {
    asked.push(url);
    return new Array(history[url] ?? 0).fill({});
  };
  const favorites = [
    { id: '1', url: 'https://a.test/' },
    { id: '2', url: 'https://b.test/' },
    { id: '3', url: 'https://a.test/' },
  ];
  const result = await addVisitCounts(favorites, getVisits);
  assert.deepEqual(result.map((f) => f.visitCount), [3, 0, 3]);
  assert.deepEqual(asked, ['https://a.test/', 'https://b.test/']);
  assert.equal(favorites[0].visitCount, undefined);
});
