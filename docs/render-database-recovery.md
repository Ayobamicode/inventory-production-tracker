# Render deployment and database recovery checklist

This project deploys a Dockerized Spring Boot application with a PostgreSQL database on Render. The `render.yaml` Blueprint currently specifies a free web service and a free database.

## Verify the service

1. In the Render dashboard, inspect both `inventory-production-tracker` (web service) and `inventory-production-tracker-db` (PostgreSQL).
2. Confirm the database exists and is available. A healthy web service does **not** by itself guarantee the database or existing records are healthy.
3. Inspect the latest deployment and runtime logs for database connection errors, startup failures, or out-of-memory errors.
4. After the service starts, request `/health` and open the dashboard. Confirm a known inventory record can be read before making changes.
5. Check Render's current plan limits, suspension notices, and retention/deletion deadlines. Free-tier availability and retention policies can change.

## If the database is suspended or unavailable

1. **Do not assume data is backed up.** Check the database status and backup/export options in Render before deleting or replacing anything.
2. If Render offers reactivation or upgrade, evaluate that option **before** provisioning a fresh database.
3. If the original database is recoverable, restore access to that database first. Preserve any existing export or backup.
4. If the database is permanently deleted, a new empty PostgreSQL instance will not restore historical inventory and production orders. Restore from a verified backup if available.
5. Recheck the web service's database bindings and rerun a read-only verification before resuming production activity.

## Configuration reference

The Blueprint supplies `SPRING_PROFILES_ACTIVE=prod` and binds `DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USER`, and `DB_PASSWORD` from Render PostgreSQL. The production configuration uses these variables in `src/main/resources/application-prod.properties`.

For local development, the default configuration uses an H2 file database in `data/`, **not** the hosted PostgreSQL database. Local data will not automatically appear in production.

Keep database credentials in the hosting environment. Never commit credentials, connection strings containing passwords, exported production data, or backups to Git.

## Before changing the database schema or hosting plan

- Take and verify a database backup using an option available on the current plan.
- Review the impact of `spring.jpa.hibernate.ddl-auto=update` on existing production data; it is not a substitute for versioned migrations or backups.
- Test recovery procedures with non-production data where possible.
- Record the reason, date, and outcome of any hosting or database change.

This checklist documents recovery precautions; it does not indicate that the deployed application or database has been repaired.
