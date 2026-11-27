/*
 * Copyright (c) 2026 Steven M. Cohn
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

import test from 'node:test';
import assert from 'node:assert/strict';
import { addGlyph, applyFolderGlyph, removeGlyph } from '../src/lib/glyph.js';

test('adds the glyph once and leaves prefixed names untouched', () => {
  assert.equal(addGlyph('Work'), '📁 Work');
  assert.equal(addGlyph('📁 Work'), '📁 Work');
  assert.equal(addGlyph('📁Work'), '📁Work');
  assert.equal(addGlyph(''), '📁');
});

test('removes only leading glyphs', () => {
  assert.equal(removeGlyph('📁 Work'), 'Work');
  assert.equal(removeGlyph('📁Work'), 'Work');
  assert.equal(removeGlyph('📁 📁 Work'), 'Work');
  assert.equal(removeGlyph('Work 📁'), 'Work 📁');
  assert.equal(removeGlyph('📂 Open'), '📂 Open');
});

function fakeBookmarks(tree, failId) {
  const updates = [];
  return {
    updates,
    getTree: async () => tree,
    update: async (id, change) => {
      if (id === failId) throw new Error('nope');
      updates.push([id, change.title]);
    },
  };
}

const sampleTree = () => [{ id: '0', title: '', children: [
  { id: '1', parentId: '0', title: 'Favorites bar', folderType: 'bookmarks-bar', children: [
    { id: '10', title: '📁 Top', children: [{ id: '11', title: 'Inside', children: [] }] },
    { id: '12', title: 'A favorite', url: 'https://a.test' },
  ] },
  { id: '2', parentId: '0', title: 'Other favorites', folderType: 'other', children: [
    { id: '20', title: 'Work', children: [{ id: '21', title: '📁 Done', children: [] }] },
    { id: '22', title: 'Locked', children: [] },
  ] },
  { id: '3', parentId: '0', title: 'Managed', unmodifiable: 'managed', children: [{ id: '30', title: 'X', children: [] }] },
] }];

test('adds the glyph below the top level of the Favorites bar, and reports failures', async () => {
  const bookmarks = fakeBookmarks(sampleTree(), '22');
  const result = await applyFolderGlyph(bookmarks, true);
  assert.deepEqual(bookmarks.updates, [['11', '📁 Inside'], ['20', '📁 Work']]);
  assert.equal(result.unchanged, 1);
  assert.deepEqual(result.failed, [{ name: 'Locked', reason: 'nope' }]);
});

test('removes the glyph everywhere, including the top of the Favorites bar', async () => {
  const bookmarks = fakeBookmarks(sampleTree());
  await applyFolderGlyph(bookmarks, false);
  assert.deepEqual(bookmarks.updates, [['10', 'Top'], ['21', 'Done']]);
});

test('finds the Favorites bar by id when folderType is missing', async () => {
  const tree = sampleTree();
  for (const root of tree[0].children) delete root.folderType;
  const bookmarks = fakeBookmarks(tree, '22');
  await applyFolderGlyph(bookmarks, true);
  assert.deepEqual(bookmarks.updates, [['11', '📁 Inside'], ['20', '📁 Work']]);
});
