/*
 * Copyright (c) 2026 Steven M. Cohn
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

// Folder renaming runs here so it finishes even if the popup is closed.
import { applyFolderGlyph } from './lib/glyph.js';
import { saveSettings } from './lib/settings.js';

let queue = Promise.resolve();

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message?.type !== 'apply-folder-glyph') return false;

  // Run requests one at a time so quick tick/untick clicks cannot overlap.
  queue = queue.then(async () => {
    try {
      await saveSettings({ folderGlyph: message.enabled });
      sendResponse({ ok: true, ...(await applyFolderGlyph(chrome.bookmarks, message.enabled)) });
    } catch (error) {
      sendResponse({ ok: false, error: error.message });
    }
  });
  return true; // The response is sent asynchronously.
});
