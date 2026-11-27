# Favoright

A Microsoft Edge extension (Manifest V3) that finds broken favorites and makes
favorite folders easier to spot.

## Install for development

1. Open `edge://extensions`.
2. Turn on **Developer mode**.
3. Choose **Load unpacked** and select `C:\Github\Favoright\src`.

After changing code, choose **Reload** on the extension's card.

## Broken favorites report

Choose **Suspect favorites only** or **All favorites**, then **Generate report**.
The report opens in a new tab and can be saved as a standalone HTML file. Keep
the tab open while the check runs.

**Visits** needs **Show visit counts** ticked, which asks for permission to
read your browsing history (Edge words it as "Read and change your browsing
history"; Favoright only reads it). The number is every visit to that exact
URL that history still holds, about the last 90 days, whether or not you
opened it from the favorite. Edge does not let extensions see the visit count
it keeps in its favorites file. Unticking removes the permission; the column
then shows a dash.

| Result | Meaning |
| --- | --- |
| Suspect | No response, timeout, or an HTTP error of 400 or higher (except those below) |
| Good | 2xx or 3xx, or 401, 403, 429, 999 (the site answered but restricted access) |
| Not checked | Not an `http`/`https` address, or the URL contains credentials |

"Suspect" is not proof that a page is gone. Sign-in requirements, VPN or
intranet addresses and temporary outages can all cause it. Review before
deleting anything. A page that returns 200 but says "not found" counts as good.

Reader mode favorites (`read://…?url=…`) are checked, and linked in the
report, through the page they wrap.

Checks send one anonymous `GET` request per unique URL (a second on timeout,
network failure or 5xx), with no cookies or referrer.

## Folder glyph

Ticking **Prefix folder names with 📁** renames every folder except those
directly on the Favorites bar; folders inside them are prefixed. Names that
already start with the glyph are left as they are. Unticking removes leading glyphs from
all folder names, including any you typed yourself.

The built-in top-level folders and policy-managed folders cannot be renamed.
Renames sync to your other devices if favorites sync is on. Folders created
later are not prefixed until you untick and tick the box again.

Consider exporting your favorites (`edge://favorites`) before the first use.

## Tests

Requires Node.js 20 or later. There are no dependencies to install.

    npm test
