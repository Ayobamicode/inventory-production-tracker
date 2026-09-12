package com.habib.inventorytracker;

import com.habib.inventorytracker.InventoryProductionTrackerApplication.BillOfMaterialRepository;
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

@SpringBootTest
class ProductionOrderUpdateTest {

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
    void updateOrder_preservesOriginalCreatedDate_whenClientSendsNull() {
        orderRepo.save(new ProductionOrder(300L, "Widget", 1, "PLANNED", "2026-01-15"));

        ProductionOrder update = new ProductionOrder(300L, "Widget", 2, "IN_PROGRESS", null);
        orderService.updateOrder(300L, update);

        assertEquals("2026-01-15",
                orderRepo.findById(300L).orElseThrow().getCreatedDate(),
                "createdDate is metadata set at creation time; a null on update must not clobber it.");
    }

    @Test
    void updateOrder_preservesOriginalCreatedDate_whenClientSendsDifferentDate() {
        orderRepo.save(new ProductionOrder(301L, "Widget", 1, "PLANNED", "2026-01-15"));

        ProductionOrder update = new ProductionOrder(301L, "Widget", 1, "PLANNED", "2099-12-31");
        orderService.updateOrder(301L, update);

        assertEquals("2026-01-15",
                orderRepo.findById(301L).orElseThrow().getCreatedDate(),
                "createdDate is immutable; clients cannot rewrite history via update.");
    }
}
