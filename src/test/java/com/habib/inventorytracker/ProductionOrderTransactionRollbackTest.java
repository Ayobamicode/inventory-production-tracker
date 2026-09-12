package com.habib.inventorytracker;

import com.habib.inventorytracker.InventoryProductionTrackerApplication.BillOfMaterial;
import com.habib.inventorytracker.InventoryProductionTrackerApplication.BillOfMaterialRepository;
import com.habib.inventorytracker.InventoryProductionTrackerApplication.InventoryItem;
import com.habib.inventorytracker.InventoryProductionTrackerApplication.InventoryRepository;
import com.habib.inventorytracker.InventoryProductionTrackerApplication.NotificationRepository;
import com.habib.inventorytracker.InventoryProductionTrackerApplication.NotificationService;
import com.habib.inventorytracker.InventoryProductionTrackerApplication.ProductionOrder;
import com.habib.inventorytracker.InventoryProductionTrackerApplication.ProductionOrderRepository;
import com.habib.inventorytracker.InventoryProductionTrackerApplication.ProductionOrderService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.context.TestConfiguration;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Import;
import org.springframework.context.annotation.Primary;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;

@SpringBootTest
@Import(ProductionOrderTransactionRollbackTest.ThrowingNotificationConfig.class)
class ProductionOrderTransactionRollbackTest {

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
    void whenNotificationFailsMidConsumption_inventoryDecrementRollsBack() {
        inventoryRepo.save(new InventoryItem(1L, "Steel", 100, "A"));
        bomRepo.save(new BillOfMaterial(null, "Widget", "Steel", 5));

        ProductionOrder order = new ProductionOrder(200L, "Widget", 1, "COMPLETED", null);

        assertThrows(RuntimeException.class, () -> orderService.saveOrder(order),
                "Order save should propagate the notification failure.");

        assertEquals(100, inventoryRepo.findById(1L).orElseThrow().getQuantity(),
                "Inventory decrement must roll back when a downstream step fails inside the same transaction.");
    }

    @TestConfiguration
    static class ThrowingNotificationConfig {

        @Bean
        @Primary
        NotificationService throwingNotificationService(NotificationRepository notificationRepository) {
            return new NotificationService(notificationRepository) {
                @Override
                public void createLowStockNotificationsIfNeeded(InventoryItem item) {
                    throw new RuntimeException("simulated notification failure");
                }
            };
        }
    }
}
