import { flattenFavorites } from './lib/bookmarks.js';
import { checkFavorites, readerModeTarget, skipReason } from './lib/checker.js';
import { buildSections, countByStatus, formatCount, formatDate } from './lib/report-model.js';
import { loadSettings } from './lib/settings.js';
import { addVisitCounts } from './lib/visits.js';

const progressText = document.getElementById('progressText');
const progressBar = document.getElementById('progressBar');
const report = document.getElementById('report');

// All text is set through textContent: names and URLs are untrusted input.
function element(tag, text, className) {
  const node = document.createElement(tag);
  if (text !== undefined) node.textContent = text;
  if (className) node.className = className;
  return node;
}

function urlCell(url) {
  const cell = element('td');
  // A web page cannot open read:// links, so Reader mode favorites link to
  // the page they wrap.
  const readerTarget = readerModeTarget(url);
  const href = readerTarget ?? url;
  if (skipReason(href)) {
    cell.textContent = url; // never make javascript: and similar URLs clickable
  } else {
    const link = element('a', href);
    link.href = href;
    link.target = '_blank';
    link.rel = 'noopener noreferrer';
    cell.append(link);
  }
  if (readerTarget) cell.append(element('span', 'Reader mode favorite', 'note'));
  return cell;
}

function responseCell(row) {
  const cell = element('td');
  cell.append(element('span', row.code === null ? '—' : String(row.code), 'code'));
  if (row.note) cell.append(element('span', row.note, 'note'));
  if (row.redirectedTo) cell.append(element('span', `Redirected to ${row.redirectedTo}`, 'note'));
  return cell;
}

function sectionTable({ status, title, rows }) {
  const section = element('section', undefined, status);
  section.append(element('h2', `${title} (${rows.length})`));
  if (rows.length === 0) {
    section.append(element('p', 'No suspect favorites found.'));
    return section;
  }

  const table = element('table');
  const columns = element('colgroup');
  for (const name of ['location', 'name', 'url', 'response', 'date', 'date', 'visits']) {
    columns.append(element('col', undefined, name));
  }
  const headRow = element('tr');
  for (const heading of ['Location', 'Name', 'URL', 'HTTP response', 'Added', 'Last used', 'Visits']) {
    headRow.append(element('th', heading));
  }
  const head = element('thead');
  head.append(headRow);

  const body = element('tbody');
  for (const row of rows) {
    const tr = element('tr');
    tr.append(
      element('td', row.location),
      element('td', row.name),
      urlCell(row.url),
      responseCell(row),
      element('td', formatDate(row.dateAdded)),
      element('td', formatDate(row.dateLastUsed)),
      element('td', formatCount(row.visitCount), 'number'),
    );
    body.append(tr);
  }

  table.append(columns, head, body);
  const wrap = element('div', undefined, 'table-wrap');
  wrap.append(table);
  section.append(wrap);
  return section;
}

async function saveAsFile() {
  const css = await (await fetch('report.css')).text();
  const html = [
    '<!DOCTYPE html>',
    '<html lang="en"><head><meta charset="utf-8">',
    '<meta name="viewport" content="width=device-width, initial-scale=1">',
    '<title>Favoright report</title>',
    `<style>${css}</style></head>`,
    `<body><header><h1>Favoright report</h1></header><main>${report.innerHTML}</main></body></html>`,
  ].join('\n');

  const link = document.createElement('a');
  link.href = URL.createObjectURL(new Blob([html], { type: 'text/html' }));
  link.download = `favoright-report-${new Date().toISOString().slice(0, 10)}.html`;
  link.click();
  setTimeout(() => URL.revokeObjectURL(link.href), 1000);
}

async function run() {
  const scope = new URLSearchParams(location.search).get('scope');
  const includeAll = scope ? scope === 'all' : (await loadSettings()).includeAll;

  if (!navigator.onLine) throw new Error('This computer appears to be offline.');

  let favorites = flattenFavorites(await chrome.bookmarks.getTree());
  if (await chrome.permissions.contains({ permissions: ['history'] })) {
    progressText.textContent = 'Reading visit counts…';
    favorites = await addVisitCounts(favorites, (details) => chrome.history.getVisits(details));
  }
  progressBar.max = favorites.length || 1;
  const results = await checkFavorites(favorites, {
    onProgress(done, total) {
      progressBar.value = done;
      progressText.textContent = `Checked ${done} of ${total} favorites. Keep this tab open.`;
    },
  });

  const counts = countByStatus(results);
  report.append(
    element(
      'p',
      `Generated ${new Date().toLocaleString()}. ${results.length} favorites: ` +
        `${counts.suspect} suspect, ${counts.good} good, ${counts.skipped} not checked.`,
    ),
    ...buildSections(results, includeAll).map(sectionTable),
  );
  document.getElementById('progress').hidden = true;

  const save = document.getElementById('save');
  save.hidden = false;
  save.addEventListener('click', saveAsFile);
}

run().catch((error) => {
  progressBar.hidden = true;
  progressText.textContent = `Could not create the report: ${error.message}`;
});
