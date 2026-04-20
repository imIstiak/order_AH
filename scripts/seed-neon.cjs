const fs = require('fs');
const path = require('path');
const { Client } = require('pg');

function readMigrationConnectionString() {
  const raw = process.env.MIGRATION_DATABASE_URL;
  if (!raw || !String(raw).trim()) {
    throw new Error('Missing MIGRATION_DATABASE_URL. Seeding requires migration_user credentials.');
  }

  const connectionString = String(raw).trim().replace(/^['\"]|['\"]$/g, '').replace(/\r?\n/g, '');

  try {
    const username = decodeURIComponent(new URL(connectionString).username || '').toLowerCase();
    if (username === 'app_user') {
      throw new Error('MIGRATION_DATABASE_URL must not use app_user credentials.');
    }
  } catch (error) {
    if (error instanceof Error) {
      throw error;
    }
    throw new Error('MIGRATION_DATABASE_URL is not a valid connection string URL.');
  }

  return connectionString;
}

async function run() {
  const connectionString = readMigrationConnectionString();
  const shouldApplySchema = process.argv.includes('--with-schema');
  const schemaPath = path.join(__dirname, '..', 'database', 'schema.sql');
  const sqlPath = path.join(__dirname, '..', 'database', 'seed.sql');
  const schemaSql = fs.readFileSync(schemaPath, 'utf8');
  const seedSql = fs.readFileSync(sqlPath, 'utf8');

  const client = new Client({
    connectionString,
    ssl: { rejectUnauthorized: false },
  });

  await client.connect();

  if (shouldApplySchema) {
    await client.query(schemaSql);
    console.log('Schema applied successfully.');
  }

  await client.query(seedSql);

  const summary = await client.query(`
    select
      (select count(*) from app_users) as users,
      (select count(*) from categories) as categories,
      (select count(*) from products) as products,
      (select count(*) from product_variants) as variants,
      (select count(*) from customers) as customers,
      (select count(*) from coupons) as coupons,
      (select count(*) from orders) as orders,
      (select count(*) from order_items) as order_items,
      (select count(*) from batches) as batches,
      (select count(*) from abandoned_carts) as abandoned_carts
  `);

  console.log('Seed completed successfully.');
  console.table(summary.rows);

  await client.end();
}

run().catch((error) => {
  console.error('Seed failed:', error.message);
  process.exit(1);
});
