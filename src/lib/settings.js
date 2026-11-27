const DEFAULT_SETTINGS = Object.freeze({ includeAll: false, folderGlyph: false });

export function loadSettings() {
  return chrome.storage.local.get({ ...DEFAULT_SETTINGS });
}

export function saveSettings(changes) {
  return chrome.storage.local.set(changes);
}
