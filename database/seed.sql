-- ShopAdmin seed data for schema.sql
-- Run after creating schema.

begin;

insert into app_users (id, email, name, role, avatar, color, is_active) values
  ('11111111-1111-1111-1111-111111111111', 'istiakshaharia77@gmail.com', 'Istiak Shaharia', 'admin', 'IS', '#6366F1', true),
  ('22222222-2222-2222-2222-222222222222', 'rafi.ahmed@gmail.com', 'Rafi Ahmed', 'agent', 'RA', '#059669', true),
  ('33333333-3333-3333-3333-333333333333', 'mitu.akter@gmail.com', 'Mitu Akter', 'agent', 'MA', '#D97706', true),
  ('44444444-4444-4444-4444-444444444444', 'uploader@shopadmin.com', 'Product Uploader', 'product_uploader', 'PU', '#0EA5E9', true)
on conflict (email) do nothing;

insert into categories (id, name, slug, parent_id) values
  ('a0000000-0000-0000-0000-000000000001', 'Bags', 'bags', null),
  ('a0000000-0000-0000-0000-000000000002', 'Shoes', 'shoes', null),
  ('a0000000-0000-0000-0000-000000000003', 'Accessories', 'accessories', null),
  ('a0000000-0000-0000-0000-000000000011', 'Tote Bags', 'bags-tote', 'a0000000-0000-0000-0000-000000000001'),
  ('a0000000-0000-0000-0000-000000000012', 'Shoulder Bags', 'bags-shoulder', 'a0000000-0000-0000-0000-000000000001'),
  ('a0000000-0000-0000-0000-000000000021', 'Sneakers', 'shoes-sneakers', 'a0000000-0000-0000-0000-000000000002'),
  ('a0000000-0000-0000-0000-000000000022', 'Heels', 'shoes-heels', 'a0000000-0000-0000-0000-000000000002'),
  ('a0000000-0000-0000-0000-000000000031', 'Jewelry', 'accessories-jewelry', 'a0000000-0000-0000-0000-000000000003')
on conflict (slug) do nothing;

insert into products (id, sku, name, slug, category_id, status, buy_price, sell_price, created_by, updated_by) values
  ('b0000000-0000-0000-0000-000000000001', 'LTB-001', 'Leather Tote Bag', 'leather-tote-bag', 'a0000000-0000-0000-0000-000000000011', 'active', 1100, 2500, '11111111-1111-1111-1111-111111111111', '11111111-1111-1111-1111-111111111111'),
  ('b0000000-0000-0000-0000-000000000002', 'HAC-002', 'High Ankle Converse', 'high-ankle-converse', 'a0000000-0000-0000-0000-000000000021', 'active', 1400, 3200, '11111111-1111-1111-1111-111111111111', '11111111-1111-1111-1111-111111111111'),
  ('b0000000-0000-0000-0000-000000000003', 'SB-003', 'Silver Bracelet', 'silver-bracelet', 'a0000000-0000-0000-0000-000000000031', 'active', 600, 1800, '44444444-4444-4444-4444-444444444444', '44444444-4444-4444-4444-444444444444')
on conflict (sku) do nothing;

insert into product_variants (id, product_id, size, color, sku, buy_price, sell_price, stock_qty) values
  ('c0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000001', 'M', 'Black', 'LTB-001-M-BLK', 1100, 2500, 8),
  ('c0000000-0000-0000-0000-000000000002', 'b0000000-0000-0000-0000-000000000001', 'L', 'Brown', 'LTB-001-L-BRN', 1100, 2500, 4),
  ('c0000000-0000-0000-0000-000000000003', 'b0000000-0000-0000-0000-000000000002', '38', 'White', 'HAC-002-38-WHT', 1400, 3200, 6),
  ('c0000000-0000-0000-0000-000000000004', 'b0000000-0000-0000-0000-000000000003', 'Free', 'Silver', 'SB-003-FREE-SLV', 600, 1800, 12)
on conflict (sku) do nothing;

insert into customers (id, name, phone, city, zone, address, note) values
  ('d0000000-0000-0000-0000-000000000001', 'Fatima Akter', '01711111111', 'Dhaka', 'Dhanmondi', 'House 12, Road 5, Dhanmondi, Dhaka', ''),
  ('d0000000-0000-0000-0000-000000000002', 'Rahela Khanam', '01722222222', 'Dhaka', 'Uttara', 'Flat 3B, Road 10, Uttara Sector 7, Dhaka', ''),
  ('d0000000-0000-0000-0000-000000000003', 'Sabrina Islam', '01633333333', 'Sylhet', 'Zindabazar', 'Zindabazar Chairman Bari, Sylhet', '')
on conflict (phone) do nothing;

insert into coupons (id, code, title, discount_type, discount_value, min_order_amount, max_uses, used_count, single_use, applies_to, is_active, created_by)
values
  ('e0000000-0000-0000-0000-000000000001', 'WELCOME20', 'Welcome Discount', 'pct', 20, 0, null, 47, false, 'all', true, '11111111-1111-1111-1111-111111111111'),
  ('e0000000-0000-0000-0000-000000000002', 'FLAT100', 'Flat 100 Off', 'flat', 100, 500, 100, 38, false, 'all', true, '11111111-1111-1111-1111-111111111111'),
  ('e0000000-0000-0000-0000-000000000003', 'FREESHIP', 'Free Shipping', 'free_shipping', 0, 2000, null, 12, false, 'all', true, '11111111-1111-1111-1111-111111111111')
on conflict (code) do nothing;

insert into orders (
  id, order_no, customer_id, source_channel, status, is_preorder, assigned_agent_id, placed_by_id,
  payment_method, discount_type, discount_value, discount_amount, delivery_charge, subtotal, total_amount, advance_paid, cod_due, customer_note, internal_note
) values
  (
    'f0000000-0000-0000-0000-000000000001', '#1001', 'd0000000-0000-0000-0000-000000000001', 'facebook', 'confirmed', false,
    '22222222-2222-2222-2222-222222222222', '11111111-1111-1111-1111-111111111111',
    'cod', 'flat', 100, 100, 70, 4300, 4270, 0, 4270, '', ''
  ),
  (
    'f0000000-0000-0000-0000-000000000002', '#1002', 'd0000000-0000-0000-0000-000000000002', 'instagram', 'advance_paid', true,
    '33333333-3333-3333-3333-333333333333', '33333333-3333-3333-3333-333333333333',
    'bkash', 'pct', 10, 320, 110, 3200, 2990, 800, 2190, 'Need urgent delivery', 'Preorder pipeline'
  )
on conflict (order_no) do nothing;

insert into order_items (order_id, product_id, variant_id, product_name, product_sku, size, color, quantity, unit_buy_price, unit_sell_price)
values
  ('f0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000001', 'c0000000-0000-0000-0000-000000000001', 'Leather Tote Bag', 'LTB-001', 'M', 'Black', 1, 1100, 2500),
  ('f0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000003', 'c0000000-0000-0000-0000-000000000004', 'Silver Bracelet', 'SB-003', 'Free', 'Silver', 1, 600, 1800),
  ('f0000000-0000-0000-0000-000000000002', 'b0000000-0000-0000-0000-000000000002', 'c0000000-0000-0000-0000-000000000003', 'High Ankle Converse', 'HAC-002', '38', 'White', 1, 1400, 3200)
on conflict do nothing;

insert into order_timeline (order_id, status, note, actor_id) values
  ('f0000000-0000-0000-0000-000000000001', 'placed', '', '11111111-1111-1111-1111-111111111111'),
  ('f0000000-0000-0000-0000-000000000001', 'confirmed', 'Payment to be collected on delivery', '22222222-2222-2222-2222-222222222222'),
  ('f0000000-0000-0000-0000-000000000002', 'placed', 'Preorder initiated', '33333333-3333-3333-3333-333333333333'),
  ('f0000000-0000-0000-0000-000000000002', 'advance_paid', 'Advance confirmed', '33333333-3333-3333-3333-333333333333');

insert into batches (id, batch_code, batch_name, note, created_by)
values
  ('a1000000-0000-0000-0000-000000000001', 'BATCH-4421', 'Ali Express Restock April W3', 'Urgent pre-orders - source from Ali Express Store #4421', '11111111-1111-1111-1111-111111111111')
on conflict (batch_code) do nothing;

insert into batch_orders (batch_id, order_id)
values
  ('a1000000-0000-0000-0000-000000000001', 'f0000000-0000-0000-0000-000000000001'),
  ('a1000000-0000-0000-0000-000000000001', 'f0000000-0000-0000-0000-000000000002')
on conflict do nothing;

insert into abandoned_carts (id, customer_id, customer_name, phone, source_channel, status, cart_value, abandoned_at)
values
  ('ab000000-0000-0000-0000-000000000001', 'd0000000-0000-0000-0000-000000000001', 'Fatima Akter', '01711111111', 'facebook', 'new', 4300, now() - interval '2 hours')
on conflict do nothing;

insert into notification_preferences (user_id)
values
  ('11111111-1111-1111-1111-111111111111'),
  ('22222222-2222-2222-2222-222222222222'),
  ('33333333-3333-3333-3333-333333333333')
on conflict (user_id) do nothing;

commit;
