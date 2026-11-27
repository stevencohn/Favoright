/*
 * Copyright (c) 2026 Steven M. Cohn
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

const DEFAULT_SETTINGS = Object.freeze({ includeAll: false, folderGlyph: false });

export function loadSettings() {
  return chrome.storage.local.get({ ...DEFAULT_SETTINGS });
}

export function saveSettings(changes) {
  return chrome.storage.local.set(changes);
}
