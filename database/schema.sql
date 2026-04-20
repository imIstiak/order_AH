-- ShopAdmin relational schema (PostgreSQL)
-- Created for full project data readiness.

create extension if not exists "pgcrypto";

-- ===== Migration tracking =====
create table if not exists schema_migrations (
  version varchar(128) primary key,
  description text,
  applied_at timestamptz not null default now()
);

-- ===== Enums =====
create type user_role as enum ('admin', 'agent', 'product_uploader', 'viewer');
create type order_status as enum (
  'placed',
  'pending_verify',
  'confirmed',
  'advance_paid',
  'ordered_supplier',
  'in_transit',
  'arrived_bd',
  'packing',
  'shipped',
  'delivered',
  'cancelled',
  'returned',
  'issue_flagged',
  'delayed'
);
create type payment_method as enum ('cod', 'bkash', 'nagad', 'rocket', 'bank', 'other');
create type discount_type as enum ('flat', 'pct', 'free_shipping');
create type remittance_entry_type as enum ('delivery', 'return');
create type auth_provider as enum ('local', 'google', 'facebook');

-- ===== Core identity =====
create table app_users (
  id uuid primary key default gen_random_uuid(),
  email varchar(255) not null unique,
  password_hash text,
  name varchar(150) not null,
  role user_role not null default 'agent',
  avatar varchar(10),
  color varchar(64),
  is_active boolean not null default true,
  provider auth_provider not null default 'local',
  last_login_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table user_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references app_users(id) on delete cascade,
  token_hash text not null,
  ip_address inet,
  user_agent text,
  expires_at timestamptz not null,
  created_at timestamptz not null default now()
);

create index idx_user_sessions_user on user_sessions(user_id);
create index idx_user_sessions_expires on user_sessions(expires_at);

-- ===== Generic app state =====
create table app_state (
  state_key text primary key,
  state_value jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

-- ===== Catalog =====
create table categories (
  id uuid primary key default gen_random_uuid(),
  name varchar(120) not null,
  slug varchar(150) not null unique,
  parent_id uuid references categories(id) on delete set null,
  sort_order int not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_categories_parent on categories(parent_id);

create table products (
  id uuid primary key default gen_random_uuid(),
  sku varchar(64) not null unique,
  name varchar(255) not null,
  slug varchar(300) not null unique,
  category_id uuid references categories(id) on delete set null,
  description text,
  source_url text,
  image_url text,
  status varchar(32) not null default 'active',
  is_preorder boolean not null default false,
  buy_price numeric(12,2) not null default 0,
  sell_price numeric(12,2) not null default 0,
  profit_amount numeric(12,2) generated always as (sell_price - buy_price) stored,
  created_by uuid references app_users(id) on delete set null,
  updated_by uuid references app_users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_products_category on products(category_id);
create index idx_products_status on products(status);

create table product_variants (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references products(id) on delete cascade,
  size varchar(50),
  color varchar(50),
  sku varchar(80) unique,
  buy_price numeric(12,2) not null default 0,
  sell_price numeric(12,2) not null default 0,
  stock_qty int not null default 0,
  reorder_threshold int not null default 2,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(product_id, size, color)
);

create index idx_variants_product on product_variants(product_id);
create index idx_variants_stock on product_variants(stock_qty);

create table inventory_movements (
  id uuid primary key default gen_random_uuid(),
  variant_id uuid not null references product_variants(id) on delete cascade,
  change_qty int not null,
  reason varchar(64) not null,
  ref_type varchar(64),
  ref_id uuid,
  note text,
  changed_by uuid references app_users(id) on delete set null,
  created_at timestamptz not null default now()
);

create index idx_inventory_movements_variant on inventory_movements(variant_id);

-- ===== Customers and addresses =====
create table customers (
  id uuid primary key default gen_random_uuid(),
  name varchar(150) not null,
  phone varchar(30) not null unique,
  email varchar(255),
  city varchar(120),
  zone varchar(120),
  address text,
  note text,
  is_blacklisted boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_customers_city on customers(city);

create table customer_addresses (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid not null references customers(id) on delete cascade,
  label varchar(80),
  city varchar(120),
  zone varchar(120),
  address text not null,
  is_default boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_customer_addresses_customer on customer_addresses(customer_id);

-- ===== Orders =====
create table orders (
  id uuid primary key default gen_random_uuid(),
  order_no varchar(40) not null unique,
  customer_id uuid not null references customers(id) on delete restrict,
  source_channel varchar(60),
  status order_status not null default 'placed',
  is_preorder boolean not null default false,
  assigned_agent_id uuid references app_users(id) on delete set null,
  placed_by_id uuid references app_users(id) on delete set null,
  payment_method payment_method,
  discount_type discount_type,
  discount_value numeric(12,2) not null default 0,
  discount_amount numeric(12,2) not null default 0,
  delivery_charge numeric(12,2) not null default 0,
  subtotal numeric(12,2) not null default 0,
  total_amount numeric(12,2) not null default 0,
  advance_paid numeric(12,2) not null default 0,
  cod_due numeric(12,2) not null default 0,
  customer_note text,
  internal_note text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_orders_status on orders(status);
create index idx_orders_customer on orders(customer_id);
create index idx_orders_agent on orders(assigned_agent_id);
create index idx_orders_created_at on orders(created_at);

create table order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references orders(id) on delete cascade,
  product_id uuid references products(id) on delete set null,
  variant_id uuid references product_variants(id) on delete set null,
  product_name varchar(255) not null,
  product_sku varchar(64),
  size varchar(50),
  color varchar(50),
  quantity int not null check (quantity > 0),
  unit_buy_price numeric(12,2) not null default 0,
  unit_sell_price numeric(12,2) not null default 0,
  line_total numeric(12,2) generated always as (quantity * unit_sell_price) stored,
  created_at timestamptz not null default now()
);

create index idx_order_items_order on order_items(order_id);

create table order_timeline (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references orders(id) on delete cascade,
  status order_status not null,
  note text,
  actor_id uuid references app_users(id) on delete set null,
  created_at timestamptz not null default now()
);

create index idx_order_timeline_order on order_timeline(order_id);

create table order_issues (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references orders(id) on delete cascade,
  title varchar(180) not null,
  details text,
  severity varchar(16) not null default 'medium',
  state varchar(24) not null default 'open',
  created_by uuid references app_users(id) on delete set null,
  resolved_by uuid references app_users(id) on delete set null,
  resolved_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_order_issues_order on order_issues(order_id);

-- ===== Coupons =====
create table coupons (
  id uuid primary key default gen_random_uuid(),
  code varchar(60) not null unique,
  title varchar(180),
  discount_type discount_type not null,
  discount_value numeric(12,2) not null default 0,
  min_order_amount numeric(12,2) not null default 0,
  max_uses int,
  used_count int not null default 0,
  single_use boolean not null default false,
  applies_to varchar(120) not null default 'all',
  starts_at timestamptz,
  expires_at timestamptz,
  is_active boolean not null default true,
  created_by uuid references app_users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table coupon_redemptions (
  id uuid primary key default gen_random_uuid(),
  coupon_id uuid not null references coupons(id) on delete cascade,
  order_id uuid not null references orders(id) on delete cascade,
  customer_id uuid not null references customers(id) on delete cascade,
  amount numeric(12,2) not null,
  created_at timestamptz not null default now(),
  unique(coupon_id, order_id)
);

-- ===== Abandoned cart =====
create table abandoned_carts (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid references customers(id) on delete set null,
  customer_name varchar(150),
  phone varchar(30),
  source_channel varchar(60),
  status varchar(24) not null default 'new',
  cart_value numeric(12,2) not null default 0,
  converted_order_id uuid references orders(id) on delete set null,
  abandoned_at timestamptz not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table abandoned_cart_items (
  id uuid primary key default gen_random_uuid(),
  cart_id uuid not null references abandoned_carts(id) on delete cascade,
  product_id uuid references products(id) on delete set null,
  variant_id uuid references product_variants(id) on delete set null,
  product_name varchar(255) not null,
  size varchar(50),
  color varchar(50),
  quantity int not null default 1,
  unit_price numeric(12,2) not null default 0
);

create table abandoned_cart_reminders (
  id uuid primary key default gen_random_uuid(),
  cart_id uuid not null references abandoned_carts(id) on delete cascade,
  reminder_type varchar(20) not null,
  channel varchar(20) not null,
  status varchar(20) not null default 'delivered',
  sent_by uuid references app_users(id) on delete set null,
  sent_at timestamptz not null default now(),
  message text,
  coupon_code varchar(60)
);

-- ===== Batches / sourcing =====
create table batches (
  id uuid primary key default gen_random_uuid(),
  batch_code varchar(60) not null unique,
  batch_name varchar(255) not null,
  note text,
  created_by uuid references app_users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table batch_orders (
  id uuid primary key default gen_random_uuid(),
  batch_id uuid not null references batches(id) on delete cascade,
  order_id uuid not null references orders(id) on delete cascade,
  unique(batch_id, order_id)
);

-- ===== Delivery / remittance =====
create table delivery_consignment (
  id uuid primary key default gen_random_uuid(),
  order_id uuid references orders(id) on delete set null,
  consignment_id varchar(80) not null unique,
  provider varchar(40) not null default 'pathao',
  entry_type remittance_entry_type not null,
  cod_collected numeric(12,2) not null default 0,
  delivery_charge numeric(12,2) not null default 0,
  delivered_at timestamptz,
  created_at timestamptz not null default now()
);

create table remittance_invoices (
  id uuid primary key default gen_random_uuid(),
  provider varchar(40) not null default 'pathao',
  invoice_no varchar(80) not null unique,
  invoice_date date,
  settled_at timestamptz,
  payment_method payment_method,
  tx_id varchar(120),
  file_name varchar(255),
  gross_cod numeric(12,2) not null default 0,
  total_delivery_charge numeric(12,2) not null default 0,
  total_cod_fee numeric(12,2) not null default 0,
  net_paid_out numeric(12,2) not null default 0,
  created_at timestamptz not null default now()
);

create table remittance_invoice_items (
  id uuid primary key default gen_random_uuid(),
  invoice_id uuid not null references remittance_invoices(id) on delete cascade,
  consignment_id uuid not null references delivery_consignment(id) on delete cascade,
  unique(invoice_id, consignment_id)
);

-- ===== Notification settings =====
create table notification_preferences (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references app_users(id) on delete cascade,
  new_order boolean not null default true,
  order_status_change boolean not null default true,
  payment_verification boolean not null default true,
  order_issue boolean not null default true,
  order_cancelled boolean not null default true,
  low_stock boolean not null default true,
  out_of_stock boolean not null default true,
  preorder_arrived boolean not null default true,
  preorder_delayed boolean not null default true,
  remittance_received boolean not null default true,
  remittance_overdue boolean not null default true,
  updated_at timestamptz not null default now()
);

-- ===== Utility trigger =====
create or replace function set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger trg_app_users_updated before update on app_users for each row execute procedure set_updated_at();
create trigger trg_categories_updated before update on categories for each row execute procedure set_updated_at();
create trigger trg_products_updated before update on products for each row execute procedure set_updated_at();
create trigger trg_product_variants_updated before update on product_variants for each row execute procedure set_updated_at();
create trigger trg_customers_updated before update on customers for each row execute procedure set_updated_at();
create trigger trg_customer_addresses_updated before update on customer_addresses for each row execute procedure set_updated_at();
create trigger trg_orders_updated before update on orders for each row execute procedure set_updated_at();
create trigger trg_order_issues_updated before update on order_issues for each row execute procedure set_updated_at();
create trigger trg_coupons_updated before update on coupons for each row execute procedure set_updated_at();
create trigger trg_abandoned_carts_updated before update on abandoned_carts for each row execute procedure set_updated_at();
create trigger trg_batches_updated before update on batches for each row execute procedure set_updated_at();

-- ===== Optional read models =====
create view v_order_finance as
select
  o.id,
  o.order_no,
  o.status,
  o.subtotal,
  o.discount_amount,
  o.delivery_charge,
  o.total_amount,
  o.advance_paid,
  o.cod_due,
  o.created_at
from orders o;

create view v_low_stock_variants as
select
  pv.id,
  p.name as product_name,
  pv.size,
  pv.color,
  pv.stock_qty,
  pv.reorder_threshold
from product_variants pv
join products p on p.id = pv.product_id
where pv.stock_qty <= pv.reorder_threshold;
