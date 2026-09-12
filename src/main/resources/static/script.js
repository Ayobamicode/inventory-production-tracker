// === API URLs ===
const apiUrl = "/api/inventory";
const orderApiUrl = "/api/orders";
const bomApiUrl = "/api/bom";

// === DOM References ===
const form = document.getElementById("inventory-form");
const tableBody = document.getElementById("inventory-table-body");
const lowStockTableBody = document.getElementById("low-stock-table-body");
const orderForm = document.getElementById("order-form");
const ordersTableBody = document.getElementById("orders-table-body");
const bomForm = document.getElementById("bom-form");
const bomTableBody = document.getElementById("bom-table-body");
const recipesContainer = document.getElementById("recipes-container");

// === Tab Switching ===
function switchTab(tabName) {
    document.querySelectorAll(".tab-bar .tab").forEach(tab => {
        tab.classList.remove("active");
    });

    const clickedTab = document.querySelector(`.tab-bar .tab[data-tab="${tabName}"]`);
    if (clickedTab) {
        clickedTab.classList.add("active");
    }

    document.querySelectorAll(".tab-content").forEach(content => {
        content.classList.remove("active");
        content.style.display = "none";
    });

    const targetContent = document.getElementById(`tab-${tabName}`);
    if (targetContent) {
        targetContent.classList.add("active");
        targetContent.style.display = "block";
    }

    if (tabName === "inventory") {
        loadInventory();
        loadLowStockItems();
        loadNotifications();
    } else if (tabName === "orders") {
        loadOrders();
    } else if (tabName === "bom") {
        loadBom();
    } else if (tabName === "recipes") {
        loadRecipes();
    }
}

// === Inventory Functions ===
async function loadInventory() {
    try {
        const response = await fetch(apiUrl);
        const items = await response.json();

        tableBody.innerHTML = "";

        items.forEach(item => {
            const row = document.createElement("tr");

            if (item.quantity < 10) {
                row.classList.add("low-stock-row");
            }

            row.innerHTML = `
                <td>${item.id}</td>
                <td>${item.itemName}</td>
                <td>${item.quantity}</td>
                <td>${item.location}</td>
                <td class="actions">
                    <button class="edit-btn" onclick="editItem(${item.id}, '${item.itemName}', ${item.quantity}, '${item.location}')">Edit</button>
                    <button class="delete-btn" onclick="deleteItem(${item.id})">Delete</button>
                </td>
            `;

            tableBody.appendChild(row);
        });
    } catch (error) {
        console.error("Error loading inventory:", error);
    }
}

async function loadLowStockItems() {
    try {
        const response = await fetch(`${apiUrl}/low-stock`);
        const items = await response.json();

        lowStockTableBody.innerHTML = "";

        items.forEach(item => {
            const row = document.createElement("tr");
            row.classList.add("low-stock-row");

            row.innerHTML = `
                <td>${item.id}</td>
                <td>⚠ ${item.itemName}</td>
                <td>${item.quantity}</td>
                <td>${item.location}</td>
                <td><span class="warning-badge">Reorder Needed</span></td>
            `;

            lowStockTableBody.appendChild(row);
        });
    } catch (error) {
        console.error("Error loading low stock items:", error);
    }
}

async function deleteItem(id) {
    try {
        await fetch(`${apiUrl}/${id}`, {
            method: "DELETE"
        });
        loadInventory();
        loadLowStockItems();
        loadNotifications();
    } catch (error) {
        console.error("Error deleting item:", error);
    }
}

async function editItem(id, itemName, quantity, location) {
    const newItemName = prompt("Enter new item name:", itemName);
    const newQuantity = prompt("Enter new quantity:", quantity);
    const newLocation = prompt("Enter new location:", location);

    if (newItemName === null || newQuantity === null || newLocation === null) {
        return;
    }

    const updatedItem = {
        id,
        itemName: newItemName,
        quantity: Number(newQuantity),
        location: newLocation
    };

    try {
        await fetch(`${apiUrl}/${id}`, {
            method: "PUT",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(updatedItem)
        });

        loadInventory();
        loadLowStockItems();
        loadNotifications();
    } catch (error) {
        console.error("Error updating item:", error);
    }
}

form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const item = {
        id: Number(document.getElementById("id").value),
        itemName: document.getElementById("itemName").value,
        quantity: Number(document.getElementById("quantity").value),
        location: document.getElementById("location").value
    };

    try {
        await fetch(apiUrl, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(item)
        });

        form.reset();
        loadInventory();
        loadLowStockItems();
        loadNotifications();
    } catch (error) {
        console.error("Error adding item:", error);
    }
});

// === Orders Functions ===
function getStatusBadgeClass(status) {
    if (status === "PLANNED") return "status-badge status-planned";
    if (status === "IN_PROGRESS") return "status-badge status-in-progress";
    if (status === "COMPLETED") return "status-badge status-completed";
    return "status-badge";
}

async function loadOrders() {
    try {
        const response = await fetch(orderApiUrl);
        const orders = await response.json();

        ordersTableBody.innerHTML = "";

        orders.forEach(order => {
            const row = document.createElement("tr");

            row.innerHTML = `
                <td>${order.id}</td>
                <td>${order.productName}</td>
                <td>${order.quantity}</td>
                <td><span class="${getStatusBadgeClass(order.status)}">${order.status}</span></td>
                <td>${order.createdDate ?? ""}</td>
                <td class="actions">
                    <button class="edit-btn" onclick="editOrder(${order.id}, '${order.productName}', ${order.quantity}, '${order.status}', '${order.createdDate ?? ""}')">Edit</button>
                    <button class="delete-btn" onclick="deleteOrder(${order.id})">Delete</button>
                </td>
            `;

            ordersTableBody.appendChild(row);
        });
    } catch (error) {
        console.error("Error loading orders:", error);
    }
}

async function deleteOrder(id) {
    try {
        await fetch(`${orderApiUrl}/${id}`, {
            method: "DELETE"
        });

        loadOrders();
    } catch (error) {
        console.error("Error deleting order:", error);
    }
}

async function editOrder(id, productName, quantity, status, createdDate) {
    const newProductName = prompt("Enter new product name:", productName);
    const newQuantity = prompt("Enter new quantity:", quantity);
    const newStatus = prompt("Enter new status (PLANNED, IN_PROGRESS, COMPLETED):", status);

    if (newProductName === null || newQuantity === null || newStatus === null) {
        return;
    }

    const updatedOrder = {
        id,
        productName: newProductName,
        quantity: Number(newQuantity),
        status: newStatus,
        createdDate: createdDate || new Date().toISOString().split("T")[0]
    };

    try {
        const response = await fetch(`${orderApiUrl}/${id}`, {
            method: "PUT",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(updatedOrder)
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(errorText || "Failed to update order");
        }

        loadOrders();
        loadInventory();
        loadLowStockItems();
        loadNotifications();
    } catch (error) {
        console.error("Error updating order:", error);
        alert(error.message);
    }
}

orderForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    const order = {
        id: Number(document.getElementById("orderId").value),
        productName: document.getElementById("productName").value,
        quantity: Number(document.getElementById("orderQuantity").value),
        status: document.getElementById("orderStatus").value,
        createdDate: new Date().toISOString().split("T")[0]
    };

    try {
        const response = await fetch(orderApiUrl, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(order)
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(errorText || "Failed to create order");
        }

        orderForm.reset();
        loadOrders();
        loadInventory();
        loadLowStockItems();
        loadNotifications();
    } catch (error) {
        console.error("Error adding order:", error);
        alert(error.message);
    }
});

// === BOM Functions ===
async function loadBom() {
    try {
        const response = await fetch(bomApiUrl);
        const entries = await response.json();

        bomTableBody.innerHTML = "";

        entries.forEach(entry => {
            const row = document.createElement("tr");

            row.innerHTML = `
                <td>${entry.id}</td>
                <td>${entry.productName}</td>
                <td>${entry.inventoryItemName}</td>
                <td>${entry.quantityRequired}</td>
                <td class="actions">
                    <button class="edit-btn" onclick="editBom(${entry.id}, '${entry.productName}', '${entry.inventoryItemName}', ${entry.quantityRequired})">Edit</button>
                    <button class="delete-btn" onclick="deleteBom(${entry.id})">Delete</button>
                </td>
            `;

            bomTableBody.appendChild(row);
        });
    } catch (error) {
        console.error("Error loading BOM:", error);
    }
}

function editBom(id, productName, inventoryItemName, quantityRequired) {
    document.getElementById("bomId").value = id;
    document.getElementById("bomProductName").value = productName;
    document.getElementById("bomInventoryItemName").value = inventoryItemName;
    document.getElementById("bomQuantityRequired").value = quantityRequired;
    document.getElementById("bom-form-title").textContent = "Edit BOM Entry";
    document.getElementById("bom-submit-btn").textContent = "Update";
    document.getElementById("bom-cancel-btn").style.display = "inline-block";
}

function resetBomForm() {
    bomForm.reset();
    document.getElementById("bomId").value = "";
    document.getElementById("bom-form-title").textContent = "Add BOM Entry";
    document.getElementById("bom-submit-btn").textContent = "Save";
    document.getElementById("bom-cancel-btn").style.display = "none";
}

async function deleteBom(id) {
    if (!confirm("Delete this BOM entry?")) {
        return;
    }

    try {
        const response = await fetch(`${bomApiUrl}/${id}`, {
            method: "DELETE"
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(errorText || "Failed to delete BOM entry");
        }

        loadBom();
    } catch (error) {
        console.error("Error deleting BOM entry:", error);
        alert(error.message);
    }
}

bomForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    const bomId = document.getElementById("bomId").value;
    const entry = {
        productName: document.getElementById("bomProductName").value,
        inventoryItemName: document.getElementById("bomInventoryItemName").value,
        quantityRequired: Number(document.getElementById("bomQuantityRequired").value)
    };

    try {
        let response;
        if (bomId) {
            response = await fetch(`${bomApiUrl}/${bomId}`, {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify(entry)
            });
        } else {
            response = await fetch(bomApiUrl, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify(entry)
            });
        }

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(errorText || "Failed to save BOM entry");
        }

        resetBomForm();
        loadBom();
    } catch (error) {
        console.error("Error saving BOM entry:", error);
        alert(error.message);
    }
});

// === Recipes Function ===
async function loadRecipes() {
    try {
        const response = await fetch(bomApiUrl);
        const entries = await response.json();

        recipesContainer.innerHTML = "";

        if (entries.length === 0) {
            recipesContainer.innerHTML = '<div class="no-data">No BOM entries yet. Add entries in the BOM tab to see recipes here.</div>';
            return;
        }

        const grouped = {};
        entries.forEach(entry => {
            if (!grouped[entry.productName]) {
                grouped[entry.productName] = [];
            }
            grouped[entry.productName].push(entry);
        });

        Object.keys(grouped).forEach(productName => {
            const materials = grouped[productName];
            const count = materials.length;
            const materialLabel = count === 1 ? "material" : "materials";

            const rows = materials.map(m => `
                <tr>
                    <td>${m.inventoryItemName}</td>
                    <td>${m.quantityRequired} units</td>
                </tr>
            `).join("");

            const card = document.createElement("div");
            card.className = "recipe-card";
            card.innerHTML = `
                <div class="recipe-card-header">
                    <h3>${productName}</h3>
                    <span class="material-count">${count} ${materialLabel}</span>
                </div>
                <table>
                    <tbody>
                        ${rows}
                    </tbody>
                </table>
            `;

            recipesContainer.appendChild(card);
        });
    } catch (error) {
        console.error("Error loading recipes:", error);
    }
}

// === Tab Click Handlers ===
document.querySelectorAll(".tab-bar .tab").forEach(tab => {
    tab.addEventListener("click", () => {
        switchTab(tab.dataset.tab);
    });
});

// === Initial Load ===
switchTab("inventory");
loadNotifications();
setupNotificationActions();

async function loadNotifications() {
    const notificationsBody = document.getElementById("notifications-body");
    if (!notificationsBody) return;

    try {
        const response = await fetch("/api/notifications");
        const notifications = await response.json();

        notificationsBody.innerHTML = "";

        if (!notifications.length) {
            notificationsBody.innerHTML = `
                <tr>
                    <td colspan="6" class="notification-empty">No notifications yet.</td>
                </tr>
            `;
            return;
        }

        notifications.forEach(notification => {
            const row = document.createElement("tr");
            row.innerHTML = `
                <td>${notification.createdAt ?? ""}</td>
                <td>${notification.recipient ?? ""}</td>
                <td>${notification.itemName ?? ""}</td>
                <td>${notification.quantity ?? ""}</td>
                <td>${notification.location ?? ""}</td>
                <td>${notification.message ?? ""}</td>
            `;
            notificationsBody.appendChild(row);
        });
    } catch (error) {
        console.error("Failed to load notifications:", error);
        notificationsBody.innerHTML = `
            <tr>
                <td colspan="6" class="notification-empty">Failed to load notifications.</td>
            </tr>
        `;
    }
}

function setupNotificationActions() {
    const clearButton = document.getElementById("clear-notifications-btn");
    if (!clearButton) return;

    clearButton.addEventListener("click", async () => {
        try {
            const response = await fetch("/api/notifications", {
                method: "DELETE"
            });

            if (!response.ok) {
                throw new Error("Failed to clear notifications");
            }

            await loadNotifications();
        } catch (error) {
            console.error("Failed to clear notifications:", error);
            alert("Unable to clear notifications right now.");
        }
    });
}