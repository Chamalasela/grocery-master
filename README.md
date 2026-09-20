# Pantry

A small, local-only weekly grocery checklist. No dependencies, accounts, backend, analytics, external fonts, or network requests.

## Run

Open `index.html` directly in a browser, or run `python3 -m http.server 4173` from this directory and open http://localhost:4173. Keep using the same browser and address to retain your list.

## Features

- Add, edit, and remove weekly staples with a pack / unit (such as a 12-egg box or 250 g pack), number to buy, and optional stock at home.
- Click an item’s “At home” badge to update stock as you use it. Blank means not yet counted; zero means out of stock. Stock is tracked manually, independently of shopping checkmarks, and stays visible across weeks. Existing saved lists retain their quantities and checkmarks, with stock initially unset.
- Check items off as you shop; filter by remaining items or items in your basket.
- Track shopping progress and reset checkmarks.
- Select “Repeat weekly” for each item. Only selected items carry into each Monday-starting week, clearing checkmarks. Occasional items move to Saved items with stock intact, whether bought or not; use “+ This week” to buy them again. This is manual scheduling for occasional purchases, not automatic monthly recurrence. Existing items default to weekly repeat. Checks stay visible after finishing a shop until the next week; “Start next week” prepares that week early.
- Save locally with browser localStorage. Works offline after loading; there is no sync between devices. Clearing browser data deletes the list. Private browsing may not persist it.
- Responsive layout, keyboard controls, labeled checkboxes, and reduced-motion support.

The first launch includes an editable example list. Weekly rollover is checked on launch, when the page regains focus, and once a minute while open. Dates use the device’s local timezone. If several weeks pass, the app moves straight to the current week. Starting a future week early preserves its checks until a later week begins.

## Verify

Run `node --check app.js` and `node tests/weekly-rollover.cjs` to check syntax, calendar rollover, stock retention, and saved-list migration.
