# Inventory Production Tracker

A full-stack inventory and manufacturing dashboard built with Spring Boot, Java, JPA, HTML, CSS, and JavaScript.

The application tracks stock, production orders, bills of materials, product recipes, and low-stock notifications. Completing a production order automatically consumes the required inventory in a single transaction.

## Live application

- Dashboard: [inventory-production-tracker.onrender.com](https://inventory-production-tracker.onrender.com)
- Health check: [inventory-production-tracker.onrender.com/health](https://inventory-production-tracker.onrender.com/health)

The free Render service may take about a minute to wake after a period of inactivity.

## Features

- Create, update, view, and delete inventory items
- Highlight inventory below the low-stock threshold
- Create and manage production orders
- Define bills of materials for finished products
- View BOM entries grouped as product recipes
- Consume inventory when an order first becomes `COMPLETED`
- Reject duplicate completed orders so inventory is not consumed twice
- Roll back inventory changes when order processing fails
- Preserve each production order's original creation date
- Generate and clear low-stock notifications

## Requirements

- Java 21 or later
- No separate Maven installation is required; the project includes the Maven wrapper

## Run locally

On macOS or Linux:

```bash
./mvnw spring-boot:run
```

On Windows:

```powershell
mvnw.cmd spring-boot:run
```

Open [http://localhost:8080](http://localhost:8080) after the application starts.

Local development uses an H2 database stored under `data/`. The directory is intentionally excluded from Git.

## Run the tests

```bash
./mvnw test
```

The regression suite covers application startup, duplicate-order protection, transactional rollback, and immutable order creation dates. GitHub Actions runs the same suite automatically for pushes and pull requests.

## API

| Area | Endpoints |
| --- | --- |
| Inventory | `GET/POST /api/inventory`, `PUT/DELETE /api/inventory/{id}`, `GET /api/inventory/low-stock` |
| Orders | `GET/POST /api/orders`, `PUT/DELETE /api/orders/{id}` |
| Bill of materials | `GET/POST /api/bom`, `PUT/DELETE /api/bom/{id}` |
| Notifications | `GET/DELETE /api/notifications` |
| Health check | `GET /health` |

## Production deployment

The repository includes a multi-stage `Dockerfile` and a `render.yaml` Blueprint. The production profile uses PostgreSQL, disables the H2 console, and reads all database credentials from the hosting environment.

## Project structure

```text
src/main/java/                 Spring Boot application and REST API
src/main/resources/static/     Browser dashboard
src/test/                      Automated regression tests
docs/                          Design and implementation notes
```
