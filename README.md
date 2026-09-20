# Pantry

A small, local-only weekly grocery checklist. No dependencies, accounts, backend, analytics, external fonts, or network requests.

## Run

Open `index.html` directly in a browser, or run `python3 -m http.server 4173` from this directory and open http://localhost:4173. Keep using the same browser and address to retain your list.

## Features

- Add, edit, and remove weekly staples with free-form quantities.
- Check items off as you shop; filter by remaining items or items in your basket.
- Track shopping progress and reset checkmarks.
- Automatically carry items and quantities into each new Monday-starting week, clearing checkmarks. Checks stay visible after finishing a shop until the next week; “Start next week” prepares that week early.
- Save locally with browser localStorage. Works offline after loading; there is no sync between devices. Clearing browser data deletes the list. Private browsing may not persist it.
- Responsive layout, keyboard controls, labeled checkboxes, and reduced-motion support.

The first launch includes an editable example list. Weekly rollover is checked on launch, when the page regains focus, and once a minute while open. Dates use the device’s local timezone. If several weeks pass, the app moves straight to the current week. Starting a future week early preserves its checks until a later week begins.
