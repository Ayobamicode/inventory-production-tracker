const apiUrl = "/api/inventory";
const orderApiUrl = "/api/orders";
const bomApiUrl = "/api/bom";
const byId = id => document.getElementById(id);
const form = byId("inventory-form");
const orderForm = byId("order-form");
const bomForm = byId("bom-form");
const tableBody = byId("inventory-table-body");
const lowStockTableBody = byId("low-stock-table-body");
const ordersTableBody = byId("orders-table-body");
const bomTableBody = byId("bom-table-body");
const notificationsBody = byId("notifications-body");
const recipesContainer = byId("recipes-container");
const tabs = [...document.querySelectorAll(".tab-bar .tab")];
let inventory = [];
let inventoryState = "loading";
let activeTab = "inventory";
let editingInventoryId = null;
let editingOrder = null;

// A response from an earlier save must not clear a newer draft.
const formRevisions = new WeakMap();
function markDraftChanged(targetForm) {
    formRevisions.set(targetForm, (formRevisions.get(targetForm) || 0) + 1);
}
[form, orderForm, bomForm].forEach(targetForm => {
    formRevisions.set(targetForm, 0);
    targetForm.addEventListener("input", () => markDraftChanged(targetForm));
});

const tabDetails = {
    inventory: ["Inventory overview", "Keep stock organized and production moving."],
    orders: ["Production orders", "Plan production and track every order from start to finish."],
    bom: ["Bill of materials", "Define the materials each product needs."],
    recipes: ["Product recipes", "See the materials behind every product."]
};

// Render values as text so names and locations remain plain text.
function element(tag, text, className) {
    const node = document.createElement(tag);
    if (text !== undefined && text !== null) node.textContent = text;
    if (className) node.className = className;
    return node;
}

function setText(id, value) {
    const node = byId(id);
    if (node) node.textContent = value;
}

function notice(message, tone = "success") {
    const node = byId("status-message");
    node.textContent = message;
    node.dataset.tone = tone;
    node.hidden = false;
}

function tableMessage(body, columns, message, error = false) {
    const row = element("tr");
    const cell = element("td", message, `table-message${error ? " is-error" : ""}`);
    cell.colSpan = columns;
    row.append(cell);
    body.replaceChildren(row);
}

function cells(row, values) {
    values.forEach(value => row.append(element("td", value ?? "")));
}

function actionButton(label, className, action, description) {
    const button = element("button", label, className);
    button.type = "button";
    button.setAttribute("aria-label", description);
    button.addEventListener("click", async () => {
        button.disabled = true;
        try { await action(); } finally { button.disabled = false; }
    });
    return button;
}

function actions(row, label, edit, remove) {
    const cell = element("td", null, "actions");
    cell.append(
        actionButton("Edit", "edit-btn", edit, `Edit ${label}`),
        actionButton("Delete", "delete-btn", remove, `Delete ${label}`)
    );
    row.append(cell);
}

async function request(url, options = {}) {
    const response = await fetch(url, options);
    if (!response.ok) {
        const detail = await response.text();
        let message = detail;
        try { message = JSON.parse(detail).message || ""; } catch { /* Plain text errors are also supported. */ }
        if (typeof message !== "string" || !message || message.length > 240 || message.trim().startsWith("<")) {
            message = `Request failed (${response.status}). Please try again.`;
        }
        throw new Error(message);
    }
    return response;
}

async function readList(url) {
    const response = await request(url);
    const items = await response.json();
    if (!Array.isArray(items)) throw new Error("The server returned an unexpected response.");
    return items;
}

function save(url, method, value) {
    return request(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(value)
    });
}

// Only the latest request may render a table after a refresh or tab switch.
const tableRequests = new WeakMap();
async function loadTable(body, columns, url, render, emptyText, onError) {
    const requestId = (tableRequests.get(body) || 0) + 1;
    tableRequests.set(body, requestId);
    body.setAttribute("aria-busy", "true");
    tableMessage(body, columns, "Loading…");
    try {
        const items = await readList(url);
        if (tableRequests.get(body) !== requestId) return null;
        body.replaceChildren();
        render(items);
        if (!items.length) tableMessage(body, columns, emptyText);
        return true;
    } catch (error) {
        if (tableRequests.get(body) !== requestId) return null;
        tableMessage(body, columns, `Unable to load data. ${error.message}`, true);
        if (onError) onError();
        return false;
    } finally {
        if (tableRequests.get(body) === requestId) body.setAttribute("aria-busy", "false");
    }
}

function switchTab(tabName) {
    if (!tabDetails[tabName]) return;
    activeTab = tabName;
    tabs.forEach(tab => {
        const selected = tab.dataset.tab === tabName;
        tab.classList.toggle("active", selected);
        tab.setAttribute("aria-selected", String(selected));
        tab.tabIndex = selected ? 0 : -1;
    });
    document.querySelectorAll(".tab-content").forEach(panel => {
        const selected = panel.id === `tab-${tabName}`;
        panel.classList.toggle("active", selected);
        panel.hidden = !selected;
    });
    setText("page-title", tabDetails[tabName][0]);
    setText("page-description", tabDetails[tabName][1]);
    if (tabName === "inventory") return refreshInventory();
    if (tabName === "orders") return loadOrders();
    if (tabName === "bom") return loadBom();
    return loadRecipes();
}

// Filtering uses cached inventory without changing workspace totals.
function renderInventory() {
    if (inventoryState !== "ready") return;
    const query = (byId("inventory-search")?.value || "").trim().toLocaleLowerCase();
    const lowOnly = byId("inventory-filter")?.value === "low-stock";
    const filtered = inventory.filter(item => {
        const matches = [item.id, item.itemName, item.location]
            .some(value => String(value ?? "").toLocaleLowerCase().includes(query));
        return matches && (!lowOnly || item.quantity < 10);
    });
    setText("inventory-count", `${filtered.length} ${filtered.length === 1 ? "item" : "items"}`);
    tableBody.replaceChildren();
    if (!filtered.length) {
        tableMessage(tableBody, 5, inventory.length ? "No items match your search or filter." : "No inventory yet. Add your first item to get started.");
        return;
    }
    filtered.forEach(item => {
        const row = element("tr");
        row.classList.toggle("low-stock-row", item.quantity < 10);
        cells(row, [item.id, item.itemName, item.quantity, item.location]);
        actions(row, item.itemName, () => editItem(item), () => deleteItem(item.id));
        tableBody.append(row);
    });
}

async function loadInventory() {
    inventoryState = "loading";
    setText("inventory-count", "Loading…");
    return loadTable(tableBody, 5, apiUrl, items => {
        inventory = items;
        inventoryState = "ready";
        setText("metric-items", items.length.toLocaleString());
        setText("metric-units", items.reduce((total, item) => total + Number(item.quantity || 0), 0).toLocaleString());
        renderInventory();
    }, "No inventory yet. Add your first item to get started.", () => {
        inventoryState = "error";
        setText("inventory-count", "Unavailable");
        setText("metric-items", "—");
        setText("metric-units", "—");
    });
}

function loadLowStockItems() {
    return loadTable(lowStockTableBody, 5, `${apiUrl}/low-stock`, items => {
        setText("metric-low-stock", items.length.toLocaleString());
        items.forEach(item => {
            const row = element("tr", null, "low-stock-row");
            cells(row, [item.id, item.itemName, item.quantity, item.location]);
            const status = element("td");
            status.append(element("span", "Reorder needed", "warning-badge"));
            row.append(status);
            lowStockTableBody.append(row);
        });
    }, "Stock levels look good. No items need reordering.", () => setText("metric-low-stock", "—"));
}

function refreshInventory() {
    return Promise.all([loadInventory(), loadLowStockItems(), loadNotifications()]);
}

function formMode(prefix, editing, title, buttonText) {
    setText(`${prefix}-form-title`, title);
    setText(`${prefix}-submit-btn`, buttonText);
    byId(`${prefix}-cancel-btn`).hidden = !editing;
}

function editItem(item) {
    markDraftChanged(form);
    editingInventoryId = item.id;
    byId("id").value = item.id;
    byId("id").disabled = true;
    byId("itemName").value = item.itemName;
    byId("quantity").value = item.quantity;
    byId("location").value = item.location;
    formMode("inventory", true, "Edit inventory item", "Save changes");
    byId("itemName").focus();
}

function resetInventoryForm() {
    markDraftChanged(form);
    editingInventoryId = null;
    form.reset();
    byId("id").disabled = false;
    formMode("inventory", false, "Add inventory item", "Add item");
}

async function deleteItem(id) {
    try {
        await request(`${apiUrl}/${id}`, { method: "DELETE" });
        if (editingInventoryId === id) resetInventoryForm();
        notice("Inventory item deleted.");
        await refreshInventory();
    } catch (error) { notice(error.message, "error"); }
}

form.addEventListener("submit", async event => {
    event.preventDefault();
    const revision = formRevisions.get(form);
    const editing = editingInventoryId !== null;
    const item = {
        id: editing ? editingInventoryId : Number(byId("id").value),
        itemName: byId("itemName").value,
        quantity: Number(byId("quantity").value),
        location: byId("location").value
    };
    const button = byId("inventory-submit-btn");
    button.disabled = true;
    try {
        await save(editing ? `${apiUrl}/${item.id}` : apiUrl, editing ? "PUT" : "POST", item);
        if (formRevisions.get(form) === revision) resetInventoryForm();
        notice(editing ? "Inventory item updated." : "Inventory item added.");
        await refreshInventory();
    } catch (error) { notice(error.message, "error"); }
    finally { button.disabled = false; }
});

// Orders keep their original creation date when edited.
function getStatusBadgeClass(status) {
    const classes = { PLANNED: "status-planned", IN_PROGRESS: "status-in-progress", COMPLETED: "status-completed" };
    return `status-badge ${classes[status] || ""}`;
}

function loadOrders() {
    return loadTable(ordersTableBody, 6, orderApiUrl, orders => {
        setText("metric-orders", orders.filter(order => order.status !== "COMPLETED").length.toLocaleString());
        orders.forEach(order => {
            const row = element("tr");
            cells(row, [order.id, order.productName, order.quantity]);
            const statusCell = element("td");
            const labels = { PLANNED: "Planned", IN_PROGRESS: "In progress", COMPLETED: "Completed" };
            statusCell.append(element("span", labels[order.status] || order.status, getStatusBadgeClass(order.status)));
            row.append(statusCell);
            cells(row, [order.createdDate]);
            actions(row, order.productName, () => editOrder(order), () => deleteOrder(order.id));
            ordersTableBody.append(row);
        });
    }, "No production orders yet. Create an order to get started.", () => setText("metric-orders", "—"));
}

function editOrder(order) {
    markDraftChanged(orderForm);
    editingOrder = order;
    byId("orderId").value = order.id;
    byId("orderId").disabled = true;
    byId("productName").value = order.productName;
    byId("orderQuantity").value = order.quantity;
    byId("orderStatus").value = order.status;
    formMode("order", true, "Edit production order", "Save changes");
    byId("productName").focus();
}

function resetOrderForm() {
    markDraftChanged(orderForm);
    editingOrder = null;
    orderForm.reset();
    byId("orderId").disabled = false;
    formMode("order", false, "Create production order", "Add order");
}

async function deleteOrder(id) {
    try {
        await request(`${orderApiUrl}/${id}`, { method: "DELETE" });
        if (editingOrder?.id === id) resetOrderForm();
        notice("Production order deleted.");
        await loadOrders();
    } catch (error) { notice(error.message, "error"); }
}

orderForm.addEventListener("submit", async event => {
    event.preventDefault();
    const revision = formRevisions.get(orderForm);
    const editing = editingOrder !== null;
    const order = {
        id: editing ? editingOrder.id : Number(byId("orderId").value),
        productName: byId("productName").value,
        quantity: Number(byId("orderQuantity").value),
        status: byId("orderStatus").value,
        createdDate: editingOrder?.createdDate || new Date().toISOString().split("T")[0]
    };
    const button = byId("order-submit-btn");
    button.disabled = true;
    try {
        await save(editing ? `${orderApiUrl}/${order.id}` : orderApiUrl, editing ? "PUT" : "POST", order);
        if (formRevisions.get(orderForm) === revision) resetOrderForm();
        notice(editing ? "Production order updated." : "Production order added.");
        await Promise.all([loadOrders(), refreshInventory()]);
    } catch (error) { notice(error.message, "error"); }
    finally { button.disabled = false; }
});

// Bill of materials and recipes use the same source data.
function loadBom() {
    return loadTable(bomTableBody, 5, bomApiUrl, entries => {
        entries.forEach(entry => {
            const row = element("tr");
            cells(row, [entry.id, entry.productName, entry.inventoryItemName, entry.quantityRequired]);
            actions(row, `${entry.productName} material`, () => editBom(entry), () => deleteBom(entry.id));
            bomTableBody.append(row);
        });
    }, "No materials defined yet. Add a BOM entry to build a recipe.");
}

function editBom(entry) {
    markDraftChanged(bomForm);
    byId("bomId").value = entry.id;
    byId("bomProductName").value = entry.productName;
    byId("bomInventoryItemName").value = entry.inventoryItemName;
    byId("bomQuantityRequired").value = entry.quantityRequired;
    formMode("bom", true, "Edit BOM entry", "Save changes");
    byId("bomProductName").focus();
}

function resetBomForm() {
    markDraftChanged(bomForm);
    bomForm.reset();
    byId("bomId").value = "";
    formMode("bom", false, "Add BOM entry", "Save entry");
}

async function deleteBom(id) {
    if (!confirm("Delete this BOM entry?")) return;
    try {
        await request(`${bomApiUrl}/${id}`, { method: "DELETE" });
        if (byId("bomId").value === String(id)) resetBomForm();
        notice("BOM entry deleted.");
        await loadBom();
    } catch (error) { notice(error.message, "error"); }
}

bomForm.addEventListener("submit", async event => {
    event.preventDefault();
    const revision = formRevisions.get(bomForm);
    const id = byId("bomId").value;
    const entry = {
        productName: byId("bomProductName").value,
        inventoryItemName: byId("bomInventoryItemName").value,
        quantityRequired: Number(byId("bomQuantityRequired").value)
    };
    const button = byId("bom-submit-btn");
    button.disabled = true;
    try {
        await save(id ? `${bomApiUrl}/${id}` : bomApiUrl, id ? "PUT" : "POST", entry);
        if (formRevisions.get(bomForm) === revision) resetBomForm();
        notice(id ? "BOM entry updated." : "BOM entry added.");
        await loadBom();
    } catch (error) { notice(error.message, "error"); }
    finally { button.disabled = false; }
});

let recipeRequestId = 0;
async function loadRecipes() {
    const requestId = ++recipeRequestId;
    recipesContainer.setAttribute("aria-busy", "true");
    recipesContainer.replaceChildren(element("div", "Loading recipes…", "no-data"));
    try {
        const entries = await readList(bomApiUrl);
        if (requestId !== recipeRequestId) return null;
        recipesContainer.replaceChildren();
        if (!entries.length) {
            recipesContainer.append(element("div", "No recipes yet. Add materials in the BOM tab to get started.", "no-data"));
        }
        const grouped = new Map();
        entries.forEach(entry => {
            if (!grouped.has(entry.productName)) grouped.set(entry.productName, []);
            grouped.get(entry.productName).push(entry);
        });
        grouped.forEach((materials, productName) => {
            const card = element("article", null, "recipe-card");
            const header = element("div", null, "recipe-card-header");
            header.append(element("h3", productName), element("span", `${materials.length} ${materials.length === 1 ? "material" : "materials"}`, "material-count"));
            const table = element("table");
            table.setAttribute("aria-label", `Materials for ${productName}`);
            const body = element("tbody");
            materials.forEach(material => {
                const row = element("tr");
                cells(row, [material.inventoryItemName, `${material.quantityRequired} units`]);
                body.append(row);
            });
            table.append(body);
            card.append(header, table);
            recipesContainer.append(card);
        });
        return true;
    } catch (error) {
        if (requestId !== recipeRequestId) return null;
        recipesContainer.replaceChildren(element("div", `Unable to load recipes. ${error.message}`, "no-data is-error"));
        return false;
    } finally {
        if (requestId === recipeRequestId) recipesContainer.setAttribute("aria-busy", "false");
    }
}

function loadNotifications() {
    return loadTable(notificationsBody, 6, "/api/notifications", notifications => {
        notifications.forEach(notification => {
            const row = element("tr");
            cells(row, [notification.createdAt, notification.recipient, notification.itemName, notification.quantity, notification.location, notification.message]);
            notificationsBody.append(row);
        });
    }, "You’re all caught up. No inventory notifications.");
}

byId("clear-notifications-btn").addEventListener("click", async event => {
    const button = event.currentTarget;
    button.disabled = true;
    try {
        await request("/api/notifications", { method: "DELETE" });
        notice("Notifications cleared.");
        await loadNotifications();
    } catch (error) { notice(error.message, "error"); }
    finally { button.disabled = false; }
});

// Tabs follow the ARIA keyboard pattern, including wrapping and Home/End.
const tabBar = document.querySelector(".tab-bar");
const compactNavigation = window.matchMedia("(max-width: 760px)");
function updateTabOrientation() {
    tabBar.setAttribute("aria-orientation", compactNavigation.matches ? "horizontal" : "vertical");
}
updateTabOrientation();
compactNavigation.addEventListener("change", updateTabOrientation);
tabs.forEach((tab, index) => {
    tab.addEventListener("click", () => switchTab(tab.dataset.tab));
    tab.addEventListener("keydown", event => {
        let next;
        const forward = compactNavigation.matches ? "ArrowRight" : "ArrowDown";
        const backward = compactNavigation.matches ? "ArrowLeft" : "ArrowUp";
        if (event.key === forward) next = (index + 1) % tabs.length;
        if (event.key === backward) next = (index - 1 + tabs.length) % tabs.length;
        if (event.key === "Home") next = 0;
        if (event.key === "End") next = tabs.length - 1;
        if (next === undefined) return;
        event.preventDefault();
        tabs[next].focus();
        switchTab(tabs[next].dataset.tab);
    });
});

byId("inventory-search").addEventListener("input", renderInventory);
byId("inventory-filter").addEventListener("change", renderInventory);
byId("inventory-cancel-btn").addEventListener("click", resetInventoryForm);
byId("order-cancel-btn").addEventListener("click", resetOrderForm);
byId("bom-cancel-btn").addEventListener("click", resetBomForm);
byId("refresh-btn").addEventListener("click", async event => {
    const button = event.currentTarget;
    button.disabled = true;
    button.setAttribute("aria-busy", "true");
    byId("status-message").hidden = true;
    try {
        const jobs = [loadInventory(), loadLowStockItems(), loadNotifications(), loadOrders()];
        if (activeTab === "bom") jobs.push(loadBom());
        if (activeTab === "recipes") jobs.push(loadRecipes());
        const results = await Promise.all(jobs);
        if (results.includes(false)) {
            notice("Some data could not be refreshed. Please try again.", "error");
        } else if (results.every(result => result === true)) {
            notice("Dashboard refreshed.");
        }
    } finally {
        button.disabled = false;
        button.setAttribute("aria-busy", "false");
    }
});

switchTab("inventory");
loadOrders();
