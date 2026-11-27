# Favoright

Microsoft Edge extension, Manifest V3, plain JavaScript ES modules. No build
step and no dependencies. Load `src/` unpacked. Run `npm test` after changes.

## Requirements (from the owner)

1. Generate an HTML report of suspected broken favorites (URLs no longer
   reachable) showing location (Favorites bar or folder hierarchy), name, URL,
   HTTP response code, date added, date last used and visit count.
2. The user chooses all favorites or suspect ones only. With all, suspect items
   come first, followed by good ones.
3. A preference checkbox prefixes every folder name with the 📁 glyph (Edge's
   own folder icon is hard to see). Already-prefixed names are left untouched.
   Folders directly on the Favorites bar are not prefixed.
   Unticking removes the glyph from all folder names.

## Layout

- `src/popup.*`: report scope, visit-count permission, glyph preference
- `src/background.js`: applies the glyph, one request at a time
- `src/report.*`: runs the scan in its own tab, renders and saves the report
- `src/lib/`: logic; everything except `settings.js` is testable in Node
- `tests/`: `node --test`

## Decisions

- The scan runs in the report tab, not the service worker, which Edge can stop
  during long work.
- Use `chrome.bookmarks`; never edit the profile's `Bookmarks` file.
- Visit counts come from `chrome.history.getVisits` under the optional
  `history` permission. Edge's `Bookmarks` file has `visit_count`, but the
  bookmarks API does not expose it (checked in Edge, 2026-11-27). The popup
  checkbox mirrors the permission itself, not a stored setting.
- 401, 403, 429 and 999 count as reachable (`REACHABLE_BUT_RESTRICTED`).
- Bookmark names and URLs are untrusted: render with `textContent`, and only
  link `http`/`https` URLs.

## Open items

- Network failures have no detail (DNS vs. certificate vs. refused). The
  `webRequest` API could supply it, at the cost of another permission.
- Optionally prefix newly created folders automatically.
