# BOM Frontend Design

## Summary

Add frontend UI for Bill of Materials management and product recipe viewing to the existing Inventory Production Tracker dashboard. The existing single-page layout will be converted to a tabbed navigation pattern with four tabs: Inventory, Orders, BOM, and Recipes.

## Context

The backend already supports full CRUD for BOM entries at `/api/bom` (GET, POST, PUT, DELETE) plus `findByProductName`. The existing frontend (`index.html`, `script.js`, `style.css`) covers Inventory and Production Orders but has no BOM UI. All code lives in `src/main/resources/static/`.

**Existing frontend patterns to note:**
- Inventory/Orders edit uses `prompt()` dialogs (not inline form editing)
- Inventory/Orders delete has no `confirm()` dialog
- The Inventory form's ID field is visible and user-typed; IDs are not auto-generated in the form
- The existing `index.html` has broken nesting (`.container` closes early at line 31, extra `</div>` tags at lines 101-102) — this must be fixed as part of the tab refactor
- There is a Low Stock Items table that needs to be placed within a tab

## Design

### Layout: Tabbed Navigation

Convert the current scrollable single-page dashboard into a tabbed layout:

- **Tab bar** at the top with 4 tabs: Inventory | Orders | BOM | Recipes
- Each tab shows/hides its section via JS (no page reload)
- Existing Inventory and Orders sections move into their respective tabs unchanged
- **Low Stock Items** table stays within the Inventory tab, below the inventory table
- Two new tab sections are added: BOM and Recipes
- Fix the broken HTML nesting in `index.html` as part of the restructuring
- **All tabs reload their data each time they are selected** (not just on page load), ensuring cross-tab consistency

### BOM Tab

**Purpose:** Create and edit BOM entries that define which inventory items are required to produce a product.

**Form (top of tab):**
- Fields: Product Name (text, free-text input), Inventory Item (text, free-text input), Qty Required (number)
- Product Name and Inventory Item are free-text fields with no autocomplete or validation — they match against existing data by string name at the backend level (consistent with how the existing Orders form accepts a free-text `productName`)
- Save button submits POST to `/api/bom` for new entries
- When editing, form pre-fills with existing values and submits PUT to `/api/bom/{id}`
- Hidden ID field tracks whether we're creating or updating — the backend auto-generates IDs, so the hidden field is empty on create and populated on edit
- Cancel button appears during edit mode and resets form to create mode
- **This inline form edit pattern is new** — existing Inventory/Orders use `prompt()` dialogs. The inline pattern is better UX for BOM since entries have 3 fields. We keep the existing `prompt()` pattern for Inventory/Orders to minimize scope.

**Table (below form):**
- Columns: ID, Product, Inventory Item, Qty Required, Actions
- Actions: Edit (green) and Delete (red) buttons per row
- Edit populates the form above with that row's data
- Delete calls DELETE `/api/bom/{id}` after a `confirm()` dialog (existing Inventory/Orders delete immediately without confirmation — BOM adds confirmation as an improvement, but we won't retrofit it to existing tabs in this change)
- Table reloads after any CRUD operation

**Error handling:** Follow the Orders pattern — check `response.ok`, display errors via `alert(error.message)` on failure.

### Recipes Tab

**Purpose:** Read-only grouped view of BOM data showing all materials needed per product.

**Layout:**
- 2-column responsive grid of product cards
- Each card shows: product name, material count badge, table of materials with quantities
- Data sourced from GET `/api/bom`, grouped client-side by `productName`
- No edit actions — users go to BOM tab to modify entries
- The `findByProductName` endpoint is not used here — we fetch all BOM entries and group client-side, which is simpler and avoids N+1 requests

### Files Modified

1. **`src/main/resources/static/index.html`** — Fix broken HTML nesting, add tab bar markup, wrap existing sections in tab containers, add BOM form + table section, add Recipes section
2. **`src/main/resources/static/script.js`** — Add tab switching logic, BOM CRUD functions (`loadBom`, `saveBom`, `editBom`, `deleteBom`), recipe loading/grouping logic (`loadRecipes`), wire up data reload on tab switch for all tabs
3. **`src/main/resources/static/style.css`** — Add tab bar styles, recipe card grid styles, active tab indicator

### No Backend Changes

All required API endpoints already exist:
- `GET /api/bom` — list all BOM entries
- `POST /api/bom` — create BOM entry
- `PUT /api/bom/{id}` — update BOM entry
- `DELETE /api/bom/{id}` — delete BOM entry

### Interaction Details

- **Tab switching:** Click tab → add `active` class, show corresponding section, hide others. Reload that tab's data. Default tab on load: Inventory (preserves current behavior).
- **BOM edit flow:** Click Edit on a row → form scrolls into view, fields populate, Save button text changes to "Update", Cancel button appears. On save/cancel, form resets to create mode.
- **BOM delete flow:** Click Delete → `confirm()` dialog → DELETE request → reload table.
- **Recipes grouping:** Fetch all BOM entries, group by `productName` using a JS object/Map, render a card per product.

### Styling

- Tab bar uses bottom-border indicator for active tab (blue `#2563eb`)
- BOM form and table match existing Inventory/Orders styling (card backgrounds, button colors, table layout)
- Recipe cards: light gray background (`#f8fafc`), rounded corners, material count badge in blue pill
- Responsive: recipe grid collapses to single column on narrow screens
