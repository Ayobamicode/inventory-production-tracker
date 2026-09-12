package com.habib.inventorytracker;

import com.habib.inventorytracker.InventoryProductionTrackerApplication.BillOfMaterial;
import com.habib.inventorytracker.InventoryProductionTrackerApplication.BillOfMaterialRepository;
import com.habib.inventorytracker.InventoryProductionTrackerApplication.InventoryItem;
import com.habib.inventorytracker.InventoryProductionTrackerApplication.InventoryRepository;
import com.habib.inventorytracker.InventoryProductionTrackerApplication.NotificationRepository;
import com.habib.inventorytracker.InventoryProductionTrackerApplication.ProductionOrder;
import com.habib.inventorytracker.InventoryProductionTrackerApplication.ProductionOrderRepository;
import com.habib.inventorytracker.InventoryProductionTrackerApplication.ProductionOrderService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;

@SpringBootTest
class ProductionOrderDoubleSpendTest {

    @Autowired InventoryRepository inventoryRepo;
    @Autowired BillOfMaterialRepository bomRepo;
    @Autowired ProductionOrderRepository orderRepo;
    @Autowired NotificationRepository notificationRepo;
    @Autowired ProductionOrderService orderService;

    @BeforeEach
    void cleanDb() {
        orderRepo.deleteAll();
        bomRepo.deleteAll();
        inventoryRepo.deleteAll();
        notificationRepo.deleteAll();
    }

    @Test
    void postingSameCompletedOrderTwice_rejectsSecond_andDoesNotDoubleConsume() {
        inventoryRepo.save(new InventoryItem(1L, "Steel", 100, "A"));
        bomRepo.save(new BillOfMaterial(null, "Widget", "Steel", 5));

        ProductionOrder first = new ProductionOrder(100L, "Widget", 1, "COMPLETED", null);
        orderService.saveOrder(first);

        assertEquals(95, inventoryRepo.findById(1L).orElseThrow().getQuantity(),
                "First POST should decrement Steel by 5 (BOM 5 * order qty 1).");

        ProductionOrder duplicate = new ProductionOrder(100L, "Widget", 1, "COMPLETED", null);

        assertThrows(RuntimeException.class, () -> orderService.saveOrder(duplicate),
                "Second POST with the same ID must be rejected.");

        assertEquals(95, inventoryRepo.findById(1L).orElseThrow().getQuantity(),
                "Inventory must NOT be decremented a second time.");
    }
}
