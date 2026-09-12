package com.habib.inventorytracker;

import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.config.EnableJpaRepositories;
import org.springframework.stereotype.Repository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.stream.Collectors;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;
import java.util.Comparator;
import java.util.Optional;

@SpringBootApplication
@EnableJpaRepositories(considerNestedRepositories = true)
public class InventoryProductionTrackerApplication {

    public static void main(String[] args) {
        SpringApplication.run(InventoryProductionTrackerApplication.class, args);
    }

    @RestController
    static class HomeController {

        @GetMapping("/")
        public String home() {
            return "Inventory Production Tracker backend is running.";
        }
    }

    @RestController
    @RequestMapping("/api/inventory")
    static class InventoryController {

        private final InventoryService service;

        InventoryController(InventoryService service) {
            this.service = service;
        }

        @GetMapping
        public List<InventoryItem> getInventory() {
            return service.getAllItems();
        }

        @GetMapping("/low-stock")
        public List<InventoryItem> getLowStockItems() {
            return service.getLowStockItems();
        }

        @PostMapping
        public InventoryItem createInventory(@RequestBody InventoryItem item) {
            return service.saveItem(item);
        }

        @PutMapping("/{id}")
        public InventoryItem updateInventory(@PathVariable Long id, @RequestBody InventoryItem item) {
            return service.updateItem(id, item);
        }

        @DeleteMapping("/{id}")
        public String deleteInventory(@PathVariable Long id) {
            service.deleteItem(id);
            return "Inventory item deleted successfully.";
        }
    }

    @RestController
    @RequestMapping("/api/orders")
    static class ProductionOrderController {

        private final ProductionOrderService service;

        ProductionOrderController(ProductionOrderService service) {
            this.service = service;
        }

        @GetMapping
        public List<ProductionOrder> getOrders() {
            return service.getAllOrders();
        }

        @PostMapping
        public ProductionOrder createOrder(@RequestBody ProductionOrder order) {
            return service.saveOrder(order);
        }

        @PutMapping("/{id}")
        public ProductionOrder updateOrder(@PathVariable Long id, @RequestBody ProductionOrder order) {
            return service.updateOrder(id, order);
        }

        @DeleteMapping("/{id}")
        public String deleteOrder(@PathVariable Long id) {
            service.deleteOrder(id);
            return "Production order deleted successfully.";
        }
    }

    @RestController
    @RequestMapping("/api/bom")
    static class BillOfMaterialController {

        private final BillOfMaterialService service;

        BillOfMaterialController(BillOfMaterialService service) {
            this.service = service;
        }

        @GetMapping
        public List<BillOfMaterial> getBomItems() {
            return service.getAllBomItems();
        }

        @PostMapping
        public BillOfMaterial createBomItem(@RequestBody BillOfMaterial billOfMaterial) {
            return service.saveBomItem(billOfMaterial);
        }

        @PutMapping("/{id}")
        public BillOfMaterial updateBomItem(@PathVariable Long id, @RequestBody BillOfMaterial billOfMaterial) {
            return service.updateBomItem(id, billOfMaterial);
        }

        @DeleteMapping("/{id}")
        public String deleteBomItem(@PathVariable Long id) {
            service.deleteBomItem(id);
            return "Bill of material deleted successfully.";
        }
    }

    @RestController
    @RequestMapping("/api/notifications")
    static class NotificationController {

        private final NotificationService service;

        NotificationController(NotificationService service) {
            this.service = service;
        }

        @GetMapping
        public List<NotificationMessage> getNotifications() {
            return service.getAllNotifications();
        }

        @DeleteMapping
        public String clearNotifications() {
            service.clearAll();
            return "Notifications cleared successfully.";
        }
    }

    @Service
    static class InventoryService {

        private final InventoryRepository repository;
        private final NotificationService notificationService;

        InventoryService(InventoryRepository repository, NotificationService notificationService) {
            this.repository = repository;
            this.notificationService = notificationService;
        }

        public List<InventoryItem> getAllItems() {
            return repository.findAll();
        }

        public List<InventoryItem> getLowStockItems() {
            return repository.findAll()
                    .stream()
                    .filter(item -> item.getQuantity() != null && item.getQuantity() < 10)
                    .collect(Collectors.toList());
        }

        public InventoryItem saveItem(InventoryItem item) {
            InventoryItem savedItem = repository.save(item);
            notificationService.createLowStockNotificationsIfNeeded(savedItem);
            return savedItem;
        }

        public InventoryItem updateItem(Long id, InventoryItem item) {
            InventoryItem existingItem = repository.findById(id)
                    .orElseThrow(() -> new RuntimeException("Inventory item not found."));

            existingItem.setItemName(item.getItemName());
            existingItem.setQuantity(item.getQuantity());
            existingItem.setLocation(item.getLocation());

            InventoryItem savedItem = repository.save(existingItem);
            notificationService.createLowStockNotificationsIfNeeded(savedItem);
            return savedItem;
        }

        public void deleteItem(Long id) {
            repository.deleteById(id);
        }
    }

    @Service
    static class BillOfMaterialService {

        private final BillOfMaterialRepository repository;

        BillOfMaterialService(BillOfMaterialRepository repository) {
            this.repository = repository;
        }

        public List<BillOfMaterial> getAllBomItems() {
            return repository.findAll();
        }

        public BillOfMaterial saveBomItem(BillOfMaterial billOfMaterial) {
            return repository.save(billOfMaterial);
        }

        public BillOfMaterial updateBomItem(Long id, BillOfMaterial billOfMaterial) {
            BillOfMaterial existingBomItem = repository.findById(id)
                    .orElseThrow(() -> new RuntimeException("Bill of material not found."));

            existingBomItem.setProductName(billOfMaterial.getProductName());
            existingBomItem.setInventoryItemName(billOfMaterial.getInventoryItemName());
            existingBomItem.setQuantityRequired(billOfMaterial.getQuantityRequired());

            return repository.save(existingBomItem);
        }

        public void deleteBomItem(Long id) {
            repository.deleteById(id);
        }
    }

    @Service
    static class ProductionOrderService {

        private final ProductionOrderRepository repository;
        private final BillOfMaterialRepository billOfMaterialRepository;
        private final InventoryRepository inventoryRepository;
        private final NotificationService notificationService;

        ProductionOrderService(
                ProductionOrderRepository repository,
                BillOfMaterialRepository billOfMaterialRepository,
                InventoryRepository inventoryRepository,
                NotificationService notificationService
        ) {
            this.repository = repository;
            this.billOfMaterialRepository = billOfMaterialRepository;
            this.inventoryRepository = inventoryRepository;
            this.notificationService = notificationService;
        }

        public List<ProductionOrder> getAllOrders() {
            return repository.findAll();
        }

        @Transactional
        public ProductionOrder saveOrder(ProductionOrder order) {
            if (order.getId() != null && repository.existsById(order.getId())) {
                throw new RuntimeException("Production order with id " + order.getId()
                        + " already exists. Use PUT /api/orders/" + order.getId() + " to update.");
            }

            if (order.getCreatedDate() == null || order.getCreatedDate().isBlank()) {
                order.setCreatedDate(LocalDate.now().toString());
            }

            if ("COMPLETED".equalsIgnoreCase(order.getStatus())) {
                consumeInventoryForOrder(order);
            }

            return repository.save(order);
        }

        @Transactional
        public ProductionOrder updateOrder(Long id, ProductionOrder order) {
            ProductionOrder existingOrder = repository.findById(id)
                    .orElseThrow(() -> new RuntimeException("Production order not found."));

            boolean shouldConsumeInventory =
                    !"COMPLETED".equalsIgnoreCase(existingOrder.getStatus())
                            && "COMPLETED".equalsIgnoreCase(order.getStatus());

            existingOrder.setProductName(order.getProductName());
            existingOrder.setQuantity(order.getQuantity());
            existingOrder.setStatus(order.getStatus());

            if (shouldConsumeInventory) {
                consumeInventoryForOrder(existingOrder);
            }

            return repository.save(existingOrder);
        }

        public void deleteOrder(Long id) {
            repository.deleteById(id);
        }

        private void consumeInventoryForOrder(ProductionOrder order) {
            List<BillOfMaterial> bomItems = billOfMaterialRepository.findByProductName(order.getProductName());

            if (bomItems.isEmpty()) {
                throw new RuntimeException("No bill of materials found for product: " + order.getProductName());
            }

            Map<String, InventoryItem> inventoryMap = new HashMap<>();
            for (InventoryItem inventoryItem : inventoryRepository.findAll()) {
                inventoryMap.put(inventoryItem.getItemName(), inventoryItem);
            }

            for (BillOfMaterial bomItem : bomItems) {
                InventoryItem inventoryItem = inventoryMap.get(bomItem.getInventoryItemName());

                if (inventoryItem == null) {
                    throw new RuntimeException("Inventory item not found: " + bomItem.getInventoryItemName());
                }

                int requiredQuantity = bomItem.getQuantityRequired() * order.getQuantity();
                Integer currentQuantity = inventoryItem.getQuantity();

                if (currentQuantity == null || currentQuantity < requiredQuantity) {
                    throw new RuntimeException("Not enough inventory for " + bomItem.getInventoryItemName());
                }
            }

            for (BillOfMaterial bomItem : bomItems) {
                InventoryItem inventoryItem = inventoryMap.get(bomItem.getInventoryItemName());
                int requiredQuantity = bomItem.getQuantityRequired() * order.getQuantity();
                inventoryItem.setQuantity(inventoryItem.getQuantity() - requiredQuantity);
                InventoryItem savedInventoryItem = inventoryRepository.save(inventoryItem);
                notificationService.createLowStockNotificationsIfNeeded(savedInventoryItem);
            }
        }
    }

    @Service
    static class NotificationService {

        private static final int LOW_STOCK_THRESHOLD = 10;

        private final NotificationRepository repository;

        NotificationService(NotificationRepository repository) {
            this.repository = repository;
        }

        public List<NotificationMessage> getAllNotifications() {
            return repository.findAll()
                    .stream()
                    .sorted(Comparator.comparing(NotificationMessage::getCreatedAt).reversed())
                    .collect(Collectors.toList());
        }

        public void clearAll() {
            repository.deleteAll();
        }

        public void createLowStockNotificationsIfNeeded(InventoryItem item) {
            if (item == null || item.getQuantity() == null || item.getQuantity() >= LOW_STOCK_THRESHOLD) {
                return;
            }

            List<String> recipients = List.of(
                    "Inventory Team",
                    "Manager",
                    "Purchasing Team"
            );

            for (String recipient : recipients) {
                if (notificationAlreadyExists(item.getItemName(), recipient, item.getQuantity())) {
                    continue;
                }

                NotificationMessage notification = new NotificationMessage();
                notification.setRecipient(recipient);
                notification.setItemName(item.getItemName());
                notification.setQuantity(item.getQuantity());
                notification.setLocation(item.getLocation());
                notification.setMessage(buildLowStockMessage(item, recipient));
                notification.setCreatedAt(LocalDateTime.now().toString());
                repository.save(notification);
            }
        }

        private boolean notificationAlreadyExists(String itemName, String recipient, Integer quantity) {
            Optional<NotificationMessage> existingNotification = repository
                    .findTopByItemNameAndRecipientOrderByCreatedAtDesc(itemName, recipient);

            return existingNotification
                    .map(notification -> quantity.equals(notification.getQuantity()))
                    .orElse(false);
        }

        private String buildLowStockMessage(InventoryItem item, String recipient) {
            String location = item.getLocation() == null || item.getLocation().isBlank()
                    ? "Unknown location"
                    : item.getLocation();

            return "Low inventory alert for " + recipient + ": item '" + item.getItemName()
                    + "' is below threshold with quantity " + item.getQuantity()
                    + " at " + location + ".";
        }
    }

    @Entity
    static class InventoryItem {

        @Id
        private Long id;
        private String itemName;
        private Integer quantity;
        private String location;

        public InventoryItem() {
        }

        public InventoryItem(Long id, String itemName, Integer quantity, String location) {
            this.id = id;
            this.itemName = itemName;
            this.quantity = quantity;
            this.location = location;
        }

        public Long getId() {
            return id;
        }

        public void setId(Long id) {
            this.id = id;
        }

        public String getItemName() {
            return itemName;
        }

        public void setItemName(String itemName) {
            this.itemName = itemName;
        }

        public Integer getQuantity() {
            return quantity;
        }

        public void setQuantity(Integer quantity) {
            this.quantity = quantity;
        }

        public String getLocation() {
            return location;
        }

        public void setLocation(String location) {
            this.location = location;
        }
    }

    @Entity
    static class ProductionOrder {

        @Id
        private Long id;
        private String productName;
        private Integer quantity;
        private String status;
        private String createdDate;

        public ProductionOrder() {
        }

        public ProductionOrder(Long id, String productName, Integer quantity, String status, String createdDate) {
            this.id = id;
            this.productName = productName;
            this.quantity = quantity;
            this.status = status;
            this.createdDate = createdDate;
        }

        public Long getId() {
            return id;
        }

        public void setId(Long id) {
            this.id = id;
        }

        public String getProductName() {
            return productName;
        }

        public void setProductName(String productName) {
            this.productName = productName;
        }

        public Integer getQuantity() {
            return quantity;
        }

        public void setQuantity(Integer quantity) {
            this.quantity = quantity;
        }

        public String getStatus() {
            return status;
        }

        public void setStatus(String status) {
            this.status = status;
        }

        public String getCreatedDate() {
            return createdDate;
        }

        public void setCreatedDate(String createdDate) {
            this.createdDate = createdDate;
        }
    }

    @Entity
    static class BillOfMaterial {

        @Id
        @GeneratedValue(strategy = GenerationType.IDENTITY)
        private Long id;
        private String productName;
        private String inventoryItemName;
        private Integer quantityRequired;

        public BillOfMaterial() {
        }

        public BillOfMaterial(Long id, String productName, String inventoryItemName, Integer quantityRequired) {
            this.id = id;
            this.productName = productName;
            this.inventoryItemName = inventoryItemName;
            this.quantityRequired = quantityRequired;
        }

        public Long getId() {
            return id;
        }

        public void setId(Long id) {
            this.id = id;
        }

        public String getProductName() {
            return productName;
        }

        public void setProductName(String productName) {
            this.productName = productName;
        }

        public String getInventoryItemName() {
            return inventoryItemName;
        }

        public void setInventoryItemName(String inventoryItemName) {
            this.inventoryItemName = inventoryItemName;
        }

        public Integer getQuantityRequired() {
            return quantityRequired;
        }

        public void setQuantityRequired(Integer quantityRequired) {
            this.quantityRequired = quantityRequired;
        }
    }

    @Repository
    public interface InventoryRepository extends JpaRepository<InventoryItem, Long> {
    }


    @Repository
    public interface ProductionOrderRepository extends JpaRepository<ProductionOrder, Long> {
    }

    @Repository
    public interface BillOfMaterialRepository extends JpaRepository<BillOfMaterial, Long> {
        List<BillOfMaterial> findByProductName(String productName);
    }


    @Entity
    static class NotificationMessage {

        @Id
        @GeneratedValue(strategy = GenerationType.IDENTITY)
        private Long id;
        private String recipient;
        private String itemName;
        private Integer quantity;
        private String location;
        private String message;
        private String createdAt;

        public NotificationMessage() {
        }

        public Long getId() {
            return id;
        }

        public void setId(Long id) {
            this.id = id;
        }

        public String getRecipient() {
            return recipient;
        }

        public void setRecipient(String recipient) {
            this.recipient = recipient;
        }

        public String getItemName() {
            return itemName;
        }

        public void setItemName(String itemName) {
            this.itemName = itemName;
        }

        public Integer getQuantity() {
            return quantity;
        }

        public void setQuantity(Integer quantity) {
            this.quantity = quantity;
        }

        public String getLocation() {
            return location;
        }

        public void setLocation(String location) {
            this.location = location;
        }

        public String getMessage() {
            return message;
        }

        public void setMessage(String message) {
            this.message = message;
        }

        public String getCreatedAt() {
            return createdAt;
        }

        public void setCreatedAt(String createdAt) {
            this.createdAt = createdAt;
        }
    }


    @Repository
    public interface NotificationRepository extends JpaRepository<NotificationMessage, Long> {
        Optional<NotificationMessage> findTopByItemNameAndRecipientOrderByCreatedAtDesc(String itemName, String recipient);
    }
}
