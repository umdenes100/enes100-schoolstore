This is the Web Based School Store

The password to login is Key$tone

In order to update sections throughout different semesters just go to admin page

In the Admin page, a new feature has been added to automatically sync sections with the umd.io API. This removes the need to manually add and remove sections. Click Sync Sections at the start of a new semester, and the section list will refresh to the current, up-to-date sections. Sections that no longer exist will be deleted, and new sections will be added.

If the umd.io API goes down or is no longer supported, you can still manually add and remove sections like before.

The Remove All Sections button is purely for testing/troubleshooting purposes and should not be used regularly.

To get access to firebase console just slack Josh

Created by Anuraag and Forrest 2024
Updated/Refreshed by Nipun 2026
### Wheel and motor prices

The public website and Firebase menu are separate sources. To preview the planned
wheel and motor price update, run `node scripts/update-wheel-motor-prices.js`.
At rollout, run `node scripts/update-wheel-motor-prices.js --apply` to update and
verify only the listed price fields. The script preserves names, other prices,
team balances, and purchase history. Each wheel price is per wheel; motors are
5 Shells per motor. Coordinate the update with the website release. Existing
refunds use the current menu price, including for items purchased before a change.

Staff can also use **Settings → Edit Menu → Apply these prices** to apply the
reviewed wheel/motor prices. The panel shows current and proposed values before
saving. Use a row's **Edit** button for individual changes, then **Save Item**.
The price label switches to US dollars for wood/acrylic sheets; other items use
Shells. Individual saves update only that item's name and price, preserving
other metadata and menu entries. Prices accept zero and up to two decimal places.
