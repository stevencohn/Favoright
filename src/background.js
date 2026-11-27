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
