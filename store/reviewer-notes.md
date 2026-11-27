# Notes for certification

Paste the text below into Partner Center's "Notes for certification" field.

---

Favoright checks the user's favorites for broken links and can prefix favorite
folder names with a 📁 glyph. No sign-in, account or test credentials are
needed. There is no remote code, no analytics and no developer server. Source:
https://github.com/stevencohn/Favoright

PERMISSIONS
• bookmarks: reads favorites for the report; renames folders only when the
  user ticks the 📁 preference.
• storage: keeps two local preferences (report scope, glyph on/off).
• Host access to http://*/* and https://*/*: needed to send one GET request to
  each favorite's own address and read the HTTP status code. Favorites can
  point to any site, so no narrower list is possible. Requests are made only
  when the user clicks Generate report, with credentials: 'omit' and
  no-referrer; the response body is cancelled unread.
• history (optional, not requested at install): requested only when the user
  ticks "Show visit counts". Used only for chrome.history.getVisits on each
  favorite's URL to count visits. Unticking removes the permission.

HOW TO TEST
1. Add a few favorites, including one to a page that does not exist (for
   example https://httpbin.org/status/404) and one inside a folder.
2. Click the Favoright toolbar icon. Choose "All favorites (suspect first)"
   and click Generate report. A report tab opens and checks each favorite;
   keep it open until done. The missing page appears under "Suspect favorites"
   with code 404; working pages appear under "Good favorites".
3. Click "Save as HTML file" to download the report.
4. Back in the popup, tick "Show visit counts". Edge asks for history
   permission; allow it, then generate the report again. The Visits column now
   shows numbers.
5. Tick "Prefix folder names with 📁". Folders get the glyph, except those
   directly on the Favorites bar; the popup shows how many were renamed.
   Untick it to remove the glyph again.
