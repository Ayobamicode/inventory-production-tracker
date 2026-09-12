# BOM Frontend Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add tabbed navigation with BOM CRUD and product recipes view to the existing inventory dashboard.

**Architecture:** Convert the single-page scrollable layout to 4-tab navigation (Inventory, Orders, BOM, Recipes). Add BOM form + table with inline editing and recipe cards grouped by product. All data from existing `/api/bom` endpoints — no backend changes.

**Tech Stack:** Vanilla HTML/CSS/JS (matches existing frontend), Spring Boot static resources

**Spec:** `docs/superpowers/specs/2026-03-12-bom-frontend-design.md`

**Security note:** The existing codebase uses `innerHTML` for rendering API data. This plan follows the same pattern. All data originates from our own backend API. If XSS hardening is desired later, consider migrating to `textContent` + DOM construction or a sanitizer.

---

## File Structure

| File | Action | Responsibility |
|------|--------|---------------|
| `src/main/resources/static/index.html` | Modify | Fix broken nesting, add tab bar, wrap sections in tab containers, add BOM and Recipes sections |
| `src/main/resources/static/script.js` | Modify | Add tab switching, BOM CRUD functions, recipes grouping logic, reload-on-tab-switch |
| `src/main/resources/static/style.css` | Modify | Add tab bar styles, BOM form cancel button, recipe card grid |

---

## Chunk 1: Tab Navigation + HTML Restructuring

### Task 1: Restructure index.html with tab navigation

The existing HTML has broken nesting: `.container` closes at line 31, and there are two extra `</div>` at lines 101-102. We fix this while adding tabs.

**Files:**
- Modify: `src/main/resources/static/index.html` (full rewrite of body content)

- [ ] **Step 1: Replace the full body content of index.html**

Replace everything between `<body>` and `</body>` with properly nested HTML that adds a tab bar and wraps existing sections in tab containers.

**Structure:**
- `div.container` wraps everything
- `h1` title
- `div.tab-bar` with 4 `button.tab` elements (data-tab attributes: inventory, orders, bom, recipes)
- `div#tab-inventory.tab-content.active` containing: inventory form, inventory table card, low stock table card
- `div#tab-orders.tab-content` (hidden) containing: order form, orders table card
- `div#tab-bom.tab-content` (hidden) containing: BOM form with hidden `bomId` input, BOM table card
- `div#tab-recipes.tab-content` (hidden) containing: recipes card with `div#recipes-container.recipes-grid`

**BOM form specifics:**
- Hidden input `id="bomId"` for tracking create vs edit
- Text inputs: `bomProductName`, `bomInventoryItemName`
- Number input: `bomQuantityRequired` (min=1)
- `h2#bom-form-title` toggles between "Add BOM Entry" / "Edit BOM Entry"
- `button#bom-submit-btn` toggles between "Save" / "Update"
- `button#bom-cancel-btn.cancel-btn` (hidden by default) calls `resetBomForm()`
- Buttons wrapped in `div.form-actions` for side-by-side layout

**All existing form IDs and table body IDs remain identical** so existing JS still works.

- [ ] **Step 2: Verify the page loads in browser**

Open `http://localhost:8080` and confirm:
- Tab bar visible with 4 tabs
- Inventory tab active by default
- Existing data still loads

- [ ] **Step 3: Commit**

```bash
git add src/main/resources/static/index.html
git commit -m "feat: restructure HTML with tab navigation and BOM/Recipes sections"
```

---

### Task 2: Add tab bar and recipe card styles to CSS

**Files:**
- Modify: `src/main/resources/static/style.css` (append new styles)

- [ ] **Step 1: Append new styles to end of style.css**

Add the following CSS blocks:

**Tab Navigation:**
- `.tab-bar` — flex container, bottom border `#e5e7eb`
- `.tab-bar .tab` — no background, gray text, transparent bottom border, no border-radius
- `.tab-bar .tab:hover` — blue text, no background change
- `.tab-bar .tab.active` — blue text `#2563eb`, blue bottom border, font-weight 600
- `.tab-content` — `display: none`
- `.tab-content.active` — `display: block`

**BOM Form:**
- `.form-actions` — flex with 10px gap
- `.cancel-btn` — gray background `#6b7280`, darker on hover

**Recipe Cards:**
- `.recipes-grid` — 2-column CSS grid, 16px gap
- `.recipe-card` — light bg `#f8fafc`, border `#e2e8f0`, rounded 8px, 16px padding
- `.recipe-card-header` — flex space-between, centered
- `.material-count` — blue pill badge (`#dbeafe` bg, `#2563eb` text)
- `.recipe-card table` — full width, 14px font
- `.recipe-card td:last-child` — right-aligned, bold

**Utilities:**
- `.subtitle-text` — gray `#64748b`, 14px
- `.no-data` — centered gray text with 40px padding

**Responsive:**
- `@media (max-width: 640px)` — `.recipes-grid` to single column

- [ ] **Step 2: Verify styling in browser**

Confirm tab bar renders with underline indicator on active tab.

- [ ] **Step 3: Commit**

```bash
git add src/main/resources/static/style.css
git commit -m "feat: add tab bar, BOM form, and recipe card styles"
```

---

## Chunk 2: Tab Switching + BOM CRUD + Recipes Logic

### Task 3: Rewrite script.js with tab switching, BOM CRUD, and recipes

**Files:**
- Modify: `src/main/resources/static/script.js` (full rewrite)

- [ ] **Step 1: Replace script.js content**

The new file has these sections:

**API URLs:** Add `bomApiUrl = "/api/bom"` alongside existing URLs.

**DOM References:** Add references for `bomForm`, `bomTableBody`, `recipesContainer`.

**`switchTab(tabName)` function:**
- Remove `active` class from all `.tab-bar .tab` elements
- Add `active` to clicked tab
- Hide all `.tab-content` divs (remove class + set `display:none`)
- Show target `#tab-{tabName}` (add class + set `display:block`)
- Call data loaders: inventory → `loadInventory()` + `loadLowStockItems()`, orders → `loadOrders()`, bom → `loadBom()`, recipes → `loadRecipes()`

**Existing Inventory functions (preserved exactly):**
- `loadInventory()`, `loadLowStockItems()`, `deleteItem()`, `editItem()`, form submit handler

**Existing Orders functions (preserved exactly):**
- `getStatusBadgeClass()`, `loadOrders()`, `deleteOrder()`, `editOrder()`, form submit handler

**New BOM functions:**
- `loadBom()` — GET `/api/bom`, render table rows with Edit/Delete buttons
- `editBom(id, productName, inventoryItemName, quantityRequired)` — populate form fields, change title to "Edit BOM Entry", button to "Update", show Cancel button
- `resetBomForm()` — clear form, reset title/button text, hide Cancel
- `deleteBom(id)` — `confirm()` dialog, then DELETE `/api/bom/{id}`, check `response.ok`, `alert()` on error
- `bomForm` submit handler — read hidden `bomId` to decide POST vs PUT, check `response.ok`, `alert()` on error, call `resetBomForm()` + `loadBom()` on success

**New Recipes function:**
- `loadRecipes()` — GET `/api/bom`, group by `productName` into object, render `div.recipe-card` per product with header (name + material count badge) and material table. Show `.no-data` message if empty.

**Initial load:** Call `loadInventory()` and `loadLowStockItems()` (default tab is Inventory).

- [ ] **Step 2: Test tab switching**

Open `http://localhost:8080`:
- Click each tab — only that tab's content visible
- Data reloads on each switch

- [ ] **Step 3: Test BOM create**

BOM tab → enter Product: "Widget", Item: "Steel", Qty: 2 → Save → row appears in table.

- [ ] **Step 4: Test BOM edit**

Click Edit on row → form populates, title says "Edit BOM Entry", Update button → change qty to 3 → Update → table reflects change. Click Cancel → form resets.

- [ ] **Step 5: Test BOM delete**

Click Delete → confirm dialog → OK → row gone. Click Delete → Cancel → row stays.

- [ ] **Step 6: Test Recipes**

Switch to Recipes tab → "Widget" card with materials listed. Add more BOM entries for a different product → switch to Recipes → new card appears.

- [ ] **Step 7: Commit**

```bash
git add src/main/resources/static/script.js
git commit -m "feat: add tab switching, BOM CRUD, and product recipes view"
```

---

### Task 4: Final integration verification

- [ ] **Step 1: Full flow test**

1. Inventory tab: add, edit, delete items — all work
2. Orders tab: create, edit, delete orders — all work
3. BOM tab: create, edit (inline form), delete (with confirm) — all work
4. Recipes tab: shows grouped product cards from BOM data
5. Tab switching reloads fresh data each time
6. Low stock items visible within Inventory tab

- [ ] **Step 2: Commit if any fixes were needed**

```bash
git add src/main/resources/static/
git commit -m "feat: complete BOM frontend with tabbed navigation and recipes view"
```
