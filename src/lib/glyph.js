/*
 * Copyright (c) 2026 Steven M. Cohn
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

export const FOLDER_GLYPH = '\u{1F4C1}';

// One or more leading glyphs, each with optional variation selector and spacing.
const LEADING_GLYPHS = /^(?:\u{1F4C1}\uFE0F?\s*)+/u;

/** Returns the name with the glyph prefixed. Already-prefixed names are unchanged. */
export function addGlyph(name) {
  if (name.startsWith(FOLDER_GLYPH)) return name;
  return name === '' ? FOLDER_GLYPH : `${FOLDER_GLYPH} ${name}`;
}

/** Returns the name with any leading folder glyph removed. */
export function removeGlyph(name) {
  return name.replace(LEADING_GLYPHS, '');
}

/**
 * Lists the folders the user is allowed to rename. The root node and the
 * built-in top-level folders (Favorites bar, Other favorites, ...) cannot be
 * changed through the API, and neither can policy-managed folders. With
 * skipFavoritesBarTop, folders sitting directly on the Favorites bar are left
 * out too.
 */
export function renamableFolders(tree, { skipFavoritesBarTop = false } = {}) {
  const folders = [];

  const walk = (node, depth, parent) => {
    if (node.url !== undefined || node.unmodifiable) return;
    const onBarTop = parent !== undefined && isFavoritesBar(parent, depth - 1);
    if (depth >= 2 && !(skipFavoritesBarTop && onBarTop)) folders.push(node);
    for (const child of node.children ?? []) walk(child, depth + 1, node);
  };

  for (const root of tree) walk(root, 0);
  return folders;
}

// Chromium marks the bar with folderType; older versions only give it id 1.
function isFavoritesBar(node, depth) {
  if (depth !== 1) return false;
  return node.folderType !== undefined ? node.folderType === 'bookmarks-bar' : node.id === '1';
}

/**
 * Adds or removes the glyph on every renamable folder. Folders directly on the
 * Favorites bar never get the glyph, but removal still reaches them so earlier
 * prefixes can be cleared.
 * `bookmarks` is chrome.bookmarks, or a stand-in with getTree() and update().
 */
export async function applyFolderGlyph(bookmarks, enabled) {
  const transform = enabled ? addGlyph : removeGlyph;
  const result = { changed: 0, unchanged: 0, failed: [] };
  const folders = renamableFolders(await bookmarks.getTree(), { skipFavoritesBarTop: enabled });

  for (const folder of folders) {
    const title = transform(folder.title);
    if (title === folder.title) {
      result.unchanged++;
      continue;
    }
    try {
      await bookmarks.update(folder.id, { title });
      result.changed++;
    } catch (error) {
      result.failed.push({ name: folder.title, reason: error.message });
    }
  }
  return result;
}
