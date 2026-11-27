import { loadSettings, saveSettings } from './lib/settings.js';

const glyphBox = document.getElementById('folderGlyph');
const status = document.getElementById('status');
const scopes = document.querySelectorAll('input[name="scope"]');

document.getElementById('version').textContent = chrome.runtime.getManifest().version;

const settings = await loadSettings();
glyphBox.checked = settings.folderGlyph;
for (const radio of scopes) {
  radio.checked = (radio.value === 'all') === settings.includeAll;
  radio.addEventListener('change', () => saveSettings({ includeAll: radio.value === 'all' }));
}

// The checkbox mirrors the optional history permission rather than a stored
// setting, so it stays right even if the popup closes during Edge's prompt.
const HISTORY = { permissions: ['history'] };
const visitBox = document.getElementById('visitCounts');
visitBox.checked = await chrome.permissions.contains(HISTORY);
visitBox.addEventListener('change', async () => {
  try {
    if (visitBox.checked) {
      visitBox.checked = await chrome.permissions.request(HISTORY);
    } else {
      await chrome.permissions.remove(HISTORY);
    }
  } catch (error) {
    status.textContent = `Could not change the history permission: ${error.message}`;
  } finally {
    visitBox.checked = await chrome.permissions.contains(HISTORY);
  }
});

document.getElementById('generate').addEventListener('click', async () => {
  const includeAll = document.querySelector('input[name="scope"]:checked').value === 'all';
  await saveSettings({ includeAll });
  await chrome.tabs.create({ url: chrome.runtime.getURL(`report.html?scope=${includeAll ? 'all' : 'suspect'}`) });
  window.close();
});

glyphBox.addEventListener('change', async () => {
  const enabled = glyphBox.checked;
  glyphBox.disabled = true;
  status.textContent = enabled ? 'Adding 📁 to folder names…' : 'Removing 📁 from folder names…';
  try {
    const result = await chrome.runtime.sendMessage({ type: 'apply-folder-glyph', enabled });
    if (!result.ok) throw new Error(result.error);

    let summary = `${result.changed} folder name(s) changed.`;
    if (result.failed.length) summary += ` ${result.failed.length} could not be changed.`;
    status.textContent = summary;
  } catch (error) {
    status.textContent = `Could not update folders: ${error.message}`;
  } finally {
    glyphBox.disabled = false;
  }
});
