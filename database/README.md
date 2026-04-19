# Database Setup (PostgreSQL)

This folder contains a full relational database design for ShopAdmin.

## Included
- schema.sql: Complete schema (users, products, variants, customers, orders, timeline, coupons, abandoned carts, batches, remittance, notifications)
- seed.sql: Starter data matching this project's current mock/local data

## Quick Start (Docker)
1. Start PostgreSQL:

```bash
docker run --name shopadmin-db -e POSTGRES_PASSWORD=postgres -e POSTGRES_DB=shopadmin -p 5432:5432 -d postgres:16
```

2. Apply schema:

```bash
psql -h localhost -U postgres -d shopadmin -f database/schema.sql
```

3. Seed sample data:

```bash
psql -h localhost -U postgres -d shopadmin -f database/seed.sql
```

## Core Tables
- app_users, user_sessions
- categories, products, product_variants, inventory_movements
- customers, customer_addresses
- orders, order_items, order_timeline, order_issues
- coupons, coupon_redemptions
- abandoned_carts, abandoned_cart_items, abandoned_cart_reminders
- batches, batch_orders
- delivery_consignment, remittance_invoices, remittance_invoice_items
- notification_preferences

## Notes
- Existing UI is currently localStorage-based and mock-data based.
- This DB is now ready for backend/API integration.
- If you want, next step is I can create a backend service layer (Node + Express + Prisma/Drizzle) and replace localStorage stores with real API calls.
