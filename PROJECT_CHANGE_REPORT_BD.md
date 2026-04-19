# Project Change Report (Start -> Current)

Date: 2026-04-19
Scope: Since initial handover of this workspace to current state
Prepared for: Re-implementation in another similar project

## 1) Core Goal Changes Delivered

1. Customer-facing tracking/invoice data accuracy improved.
2. Privacy hardening: internal notes blocked from customer timeline output.
3. Shipment visibility corrected: courier/tracking shown only when shipment truly exists.
4. Pre-order ETA surfaced in customer pages.
5. Product variation display made exact variant-wise.
6. Admin sidebar/submenu behavior standardized across pages.
7. Product catalog default view changed to list/table.
8. Shared reusable admin sidebar component introduced and integrated.

## 2) Files Added

1. core/admin-sidebar.tsx
- New shared sidebar component for admin pages.
- Includes route-aware active state.
- Includes Settings submenu visibility rules (Settings/Team/Profile routes only).
- Supports badge by nav label (e.g., Orders/Products count).
- Includes dark mode toggle and profile card.

## 3) Files Updated (Feature-wise)

### A) Customer Note Privacy + Timeline Logic

1. core/order-lifecycle.ts
- Timeline note source adjusted to public customer note only.
- Internal issue/internal note fallback behavior removed from customer timeline output path.
- Customer timeline remains status-driven for stock/preorder templates.

### B) Shipment/Pathao Tracking Visibility Guard

1. core/tracking-adapter.ts
- Added shipment visibility gate:
  - Courier/tracking shown only when order has consignment ID and shipped-stage status.
- Added preorderEta field to tracking payload.
- Added ETA extraction helper logic from direct field and customer note patterns.

### C) Customer Tracking + Invoice Accuracy

1. customer-tracking.tsx
- Added precise variation formatter (size/color/variant) for item lines.
- Added preorder ETA display section for preorder orders.
- Uses gated courier/tracking display from adapter.

2. customer-invoice.tsx
- Same variation formatter behavior as tracking page.
- Invoice text download uses same exact variation string.
- Added preorder ETA display section for preorder orders.

### D) Route/Access Structure

1. app-shell.tsx
- Public route split ensured:
  - /track and /customer-tracking -> tracking page
  - /invoice and /customer-invoice -> invoice page
- Role-aware protected admin/agent routes retained and aligned.

### E) Admin Sidebar/Submenu Consistency

1. admin-dashboard.tsx
- Migrated to shared AdminSidebar usage.
- Team/Profile no longer treated as always-visible top-level sidebar items.
- Settings submenu behavior aligned to route-aware logic.
- Orders badge wired via shared sidebar props.

2. admin-products.tsx
- Migrated to shared AdminSidebar usage in both main and edit states.
- Default view mode changed to table/list.
- Products badge wired to shared sidebar.
- Removed old duplicated local sidebar block.
- Repaired helper block to keep build healthy after cleanup.

3. admin-settings.tsx
- Migrated from inline sidebar to shared AdminSidebar.
- Settings submenu visibility behavior now centralized.

4. admin-profile.tsx
- Migrated from inline sidebar to shared AdminSidebar.
- Profile highlight support enabled for sidebar profile button.

5. admin-team.tsx
- Migrated from inline sidebar to shared AdminSidebar.

### F) Additional Earlier Consistency Fixes (before shared component finalization)

1. admin-profile.jsx
- Settings submenu visibility rule adjusted to route-aware behavior.

2. admin-team.jsx
- Settings submenu visibility rule adjusted to route-aware behavior.

## 4) Behavior Changes Summary (Before vs After)

1. Customer timeline note visibility
- Before: risk of internal/admin text bleeding into customer timeline note area.
- After: only public customer note appears.

2. Tracking/courier panel visibility
- Before: Pathao tracking could appear before real shipment stage.
- After: shown only if consignment exists and shipped-stage status reached.

3. Pre-order ETA visibility
- Before: often hidden/not surfaced on customer pages.
- After: shown on both tracking and invoice pages for preorder orders.

4. Product item variation details
- Before: variation string could be partial or inconsistent.
- After: normalized exact output with size/color/variant fallback fields.

5. Admin sidebar submenu
- Before: Settings submenu appeared unexpectedly on unrelated routes.
- After: appears only on Settings/Team/Profile routes.

6. Product page default view
- Before: grid by default.
- After: table/list by default.

## 5) Validation and QA Performed

1. Multiple typecheck/build cycles executed successfully after each major refactor phase.
2. Runtime browser checks performed for:
- Dashboard submenu hidden state.
- Settings/Team/Profile submenu visible state.
- Products default table/list view.
- Customer pages showing preorder ETA and variation-wise details.
- Shipment tracking guard behavior.

## 6) Removals / Refactor Cleanups

1. Duplicated inline sidebar implementations removed from TSX pages migrated to shared component.
2. Dead code in admin-products sidebar helper path removed.
3. Centralized route-aware sidebar logic to reduce future drift bugs.

## 7) Replication Checklist For Other Project

1. Copy shared component pattern from core/admin-sidebar.tsx.
2. Migrate all admin pages to use shared sidebar props API.
3. Ensure nav labels map correctly in core/nav-routes.
4. Apply tracking guard logic from core/tracking-adapter.ts.
5. Apply public-note-only timeline rule from core/order-lifecycle.ts.
6. Apply variation formatter in both customer-tracking and customer-invoice.
7. Surface preorder ETA on customer pages.
8. Set products default view mode to table.
9. Run typecheck + build + route-by-route UI checks.

## 8) Important Note About Source of This Report

- This report is built from the implemented workspace state and full change session context.
- If you need commit-by-commit diff history, initialize/use a dedicated git repository in this project root before the next iteration.
