# Favoright privacy policy

Effective 27 November 2026

Favoright is a Microsoft Edge extension that checks your favorites for broken
links and can add a 📁 glyph to folder names. It does not collect, sell or
share your data. The developer runs no server, and the extension contains no
analytics, advertising or tracking.

## What Favoright reads

- **Your favorites** (the `bookmarks` permission): names, addresses, folders,
  date added and date last used, to build the report and to rename folders.
- **Your browsing history**, only if you tick **Show visit counts** (the
  optional `history` permission). For each favorite, Favoright asks Edge how
  many visits history holds for that address and keeps only the number.
  Unticking the box gives the permission back to Edge.

All of this stays on your computer.

## What Favoright sends

When you generate a report, Favoright sends one `GET` request to each
favorite's web address to see whether it still responds, and a second one if
the first times out, fails or gets a server error. For a Reader mode favorite,
the request goes to the page it wraps. Requests carry no cookies and no
referrer. Only the response code is used; the page itself is not read or kept.

Each site you have a favorite for therefore sees an ordinary request from your
computer: your IP address and Edge's user agent, as with any visit. Nothing is
sent anywhere else.

## What Favoright stores and changes

- **Preferences**: your report scope and whether the folder glyph is on, kept
  in the extension's local storage.
- **Folder names**: ticking or unticking the glyph preference renames your
  favorite folders. If favorites sync is on, Edge syncs the new names to your
  other devices, as it does for any rename you make yourself.
- **Reports**: shown in a tab and saved as an HTML file only when you choose
  **Save as HTML file**. They are not kept anywhere else.

Removing the extension deletes its stored preferences. Folder names keep the
glyph until you untick the preference first.

## Changes and contact

Changes to this policy will be published at
https://github.com/stevencohn/Favoright/blob/main/PRIVACY.md with a new
effective date. Questions: open an issue at
https://github.com/stevencohn/Favoright/issues.
