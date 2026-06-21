# Inventory Production Tracker

![Java](https://img.shields.io/badge/Java-21-blue)
![Spring Boot](https://img.shields.io/badge/Spring%20Boot-4.0.3-brightgreen)
![Database](https://img.shields.io/badge/Database-H2%20%7C%20PostgreSQL-orange)
![Frontend](https://img.shields.io/badge/Frontend-HTML%20%7C%20CSS%20%7C%20JavaScript-purple)
![Status](https://img.shields.io/badge/Status-In%20Development-yellow)

A full-stack inventory and production tracking system built to support warehouse and manufacturing operations. The application helps track inventory items, production orders, bill of materials, low-stock items, and low-inventory notifications for inventory, management, and purchasing teams.

## Project Overview

The goal of this project is to improve visibility into inventory movement and production readiness. It provides a simple web dashboard backed by a Spring Boot REST API so teams can manage inventory records, create production orders, define bill of materials requirements, and receive alerts when stock levels fall below the threshold.

## Key Features

- Add, edit, view, and delete inventory items
- Track item quantities and storage locations
- Identify low-stock items automatically
- Manage production orders and statuses
- Define bill of materials for products
- Automatically deduct inventory when production orders are completed
- Validate inventory availability before production completion
- Generate low-inventory notifications for:
  - Inventory Team
  - Manager
  - Purchasing Team
- View and clear notifications from the frontend dashboard
- REST API endpoints for inventory, production orders, BOM, and notifications

## Technologies Used

| Layer | Technology |
|---|---|
| Backend | Java, Spring Boot |
| API | Spring Web MVC REST Controllers |
| Database Access | Spring Data JPA |
| Database | H2 for local development, PostgreSQL dependency included |
| Frontend | HTML, CSS, JavaScript |
| Build Tool | Maven |

## Application Modules

### Inventory Management
Users can create and manage inventory records including item ID, item name, quantity, and location.

### Low Stock Monitoring
The system checks inventory levels and displays items with quantity below the low-stock threshold.

### Production Orders
Users can create production orders and mark orders as planned, in progress, or completed.

### Bill of Materials
Users can define which inventory items are required to produce a finished product.

### Inventory Consumption
When a production order is completed, the system automatically subtracts the required inventory based on the bill of materials.

### Notifications
When inventory drops below the threshold, notifications are created for inventory, management, and purchasing teams.

## API Endpoints

### Inventory
| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/inventory` | Get all inventory items |
| GET | `/api/inventory/low-stock` | Get low-stock items |
| POST | `/api/inventory` | Create inventory item |
| PUT | `/api/inventory/{id}` | Update inventory item |
| DELETE | `/api/inventory/{id}` | Delete inventory item |

### Production Orders
| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/orders` | Get all production orders |
| POST | `/api/orders` | Create production order |
| PUT | `/api/orders/{id}` | Update production order |
| DELETE | `/api/orders/{id}` | Delete production order |

### Bill of Materials
| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/bom` | Get all BOM records |
| POST | `/api/bom` | Create BOM record |
| PUT | `/api/bom/{id}` | Update BOM record |
| DELETE | `/api/bom/{id}` | Delete BOM record |

### Notifications
| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/notifications` | Get low-inventory notifications |
| DELETE | `/api/notifications` | Clear all notifications |

## How to Run Locally

### Prerequisites

- Java 21 or later
- Maven or Maven Wrapper
- Git

### Steps

Clone the repository:

```bash
git clone https://github.com/YOUR-USERNAME/inventory-production-tracker.git
cd inventory-production-tracker
```

Run the application:

```bash
./mvnw spring-boot:run
```

On Windows:

```bash
mvnw.cmd spring-boot:run
```

Open the app in your browser:

```text
http://localhost:8080
```

H2 database console:

```text
http://localhost:8080/h2-console
```

Default H2 settings:

```text
JDBC URL: jdbc:h2:file:./data/inventorydb
Username: sa
Password: leave blank
```

## Screenshots

Add screenshots to the `screenshots/` folder and update this section.

Suggested screenshots:

- Dashboard
- Current Inventory
- Low Stock Items
- Low Inventory Notifications
- Production Orders
- Bill of Materials

## Future Improvements

- User login and role-based access
- Email notifications
- SMS alerts
- Supplier management
- Purchase order generation
- Barcode scanning
- Reporting and analytics dashboard
- Deployment to cloud hosting
- Unit and integration tests

## What I Learned

This project helped me practice building a full-stack business application using Java and Spring Boot. I worked with REST APIs, database persistence, frontend integration, production workflow logic, and automated low-stock notification rules.

## Author

**Habib Ayobami Kehinde**  
Application Developer Student  
GitHub Portfolio Project
