/*
  Seed Script — Run after creating your Supabase project and first user
  Usage: SUPABASE_URL=... SUPABASE_SERVICE_KEY=... USER_ID=... node supabase/seed.js
*/
const { createClient } = require('@supabase/supabase-js');

const url = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;
const userId = process.env.USER_ID;

if (!url || !key || !userId) {
  console.log('Usage: SUPABASE_URL=... SUPABASE_SERVICE_KEY=... USER_ID=... node supabase/seed.js');
  console.log('Get your USER_ID from Supabase Dashboard → Authentication → Users');
  process.exit(1);
}

const sb = createClient(url, key);

async function seed() {
  console.log('Seeding data for user:', userId);

  // Inventory
  const inventory = [
    { user_id: userId, name: 'Wireless Earbuds Pro', sku: 'WEP-100', qty: 142, reorder: 50, price: 49.99, cost: 18.50, category: 'Electronics' },
    { user_id: userId, name: 'USB-C Hub 7-in-1', sku: 'UCH-200', qty: 23, reorder: 30, price: 39.99, cost: 12.00, category: 'Accessories' },
    { user_id: userId, name: 'Bamboo Desk Organizer', sku: 'BDO-300', qty: 89, reorder: 25, price: 34.99, cost: 9.75, category: 'Office' },
    { user_id: userId, name: 'LED Ring Light 12"', sku: 'LRL-400', qty: 7, reorder: 15, price: 29.99, cost: 11.20, category: 'Lighting' },
    { user_id: userId, name: 'Organic Coffee Beans 1lb', sku: 'OCB-500', qty: 312, reorder: 100, price: 18.99, cost: 6.50, category: 'Food & Bev' },
    { user_id: userId, name: 'Ergonomic Mouse Pad', sku: 'EMP-600', qty: 67, reorder: 20, price: 24.99, cost: 5.80, category: 'Office' },
    { user_id: userId, name: 'Smart Water Bottle', sku: 'SWB-700', qty: 185, reorder: 40, price: 44.99, cost: 15.00, category: 'Lifestyle' },
    { user_id: userId, name: 'Phone Case - Clear', sku: 'PCC-010', qty: 0, reorder: 50, price: 14.99, cost: 2.10, category: 'Accessories' },
  ];

  const { error: invErr } = await sb.from('inventory').insert(inventory);
  console.log(invErr ? '✗ Inventory: ' + invErr.message : '✓ Inventory: 8 items');

  // Billing
  const billing = [
    { user_id: userId, name: 'Shopify Plus', amount: 299, prev_amount: 299, category: 'E-commerce', due_date: '2026-03-01', autopay: true },
    { user_id: userId, name: 'Google Workspace', amount: 72, prev_amount: 72, category: 'Productivity', due_date: '2026-03-05', autopay: true },
    { user_id: userId, name: 'Warehouse Lease', amount: 4200, prev_amount: 4200, category: 'Operations', due_date: '2026-03-01', autopay: false },
    { user_id: userId, name: 'Shipstation', amount: 159.90, prev_amount: 129.90, category: 'Shipping', due_date: '2026-03-10', autopay: true },
    { user_id: userId, name: 'Business Insurance', amount: 485, prev_amount: 485, category: 'Insurance', due_date: '2026-03-15', autopay: false },
    { user_id: userId, name: 'QuickBooks Online', amount: 80, prev_amount: 55, category: 'Accounting', due_date: '2026-03-20', autopay: true },
    { user_id: userId, name: 'Adobe Creative Cloud', amount: 89.99, prev_amount: 89.99, category: 'Design', due_date: '2026-03-12', autopay: true },
    { user_id: userId, name: 'AWS Hosting', amount: 1599, prev_amount: 1450, category: 'Infrastructure', due_date: '2026-03-01', autopay: true },
  ];

  const { error: billErr } = await sb.from('billing').insert(billing);
  console.log(billErr ? '✗ Billing: ' + billErr.message : '✓ Billing: 8 bills');

  // Partners
  const partners = [
    { user_id: userId, name: 'TechFlow Solutions', type: 'Agency', contact: 'sarah@techflow.io', url: 'https://techflow.io', referrals: 24 },
    { user_id: userId, name: 'Digital Nomad Co', type: 'Affiliate', contact: 'jake@digitalnomad.co', url: 'https://digitalnomad.co', referrals: 58 },
    { user_id: userId, name: 'Meridian Labs', type: 'Strategic', contact: 'priya@meridian.dev', url: 'https://meridian.dev', referrals: 12 },
    { user_id: userId, name: 'CloudBase Inc', type: 'Integration', contact: 'dan@cloudbase.io', url: 'https://cloudbase.io', referrals: 31 },
    { user_id: userId, name: 'Overcomers RC', type: 'Community', contact: 'pastor@overcomersrc.org', url: 'https://overcomersrc.org', referrals: 6 },
    { user_id: userId, name: 'NovaTech Ventures', type: 'Investor', contact: 'li@novatech.vc', url: 'https://novatech.vc', referrals: 7 },
  ];

  const { error: partErr } = await sb.from('partners').insert(partners);
  console.log(partErr ? '✗ Partners: ' + partErr.message : '✓ Partners: 6 partners');

  // Notifications
  const notifications = [
    { user_id: userId, title: 'Low Stock: USB-C Hub 7-in-1', description: '23 units remaining (reorder point: 30).', type: 'warning' },
    { user_id: userId, title: 'Low Stock: LED Ring Light 12"', description: '7 units remaining (reorder point: 15).', type: 'warning' },
    { user_id: userId, title: 'Out of Stock: Phone Case - Clear', description: 'SKU PCC-010 has zero units.', type: 'critical' },
    { user_id: userId, title: 'Bill Increase: Shipstation', description: 'Up 23% from $129.90 to $159.90/mo.', type: 'warning' },
    { user_id: userId, title: 'Bill Increase: QuickBooks Online', description: 'Up 45% from $55.00 to $80.00/mo.', type: 'warning' },
    { user_id: userId, title: 'Bill Increase: AWS Hosting', description: 'Up 10% from $1,450 to $1,599/mo.', type: 'warning' },
  ];

  const { error: notifErr } = await sb.from('notifications').insert(notifications);
  console.log(notifErr ? '✗ Notifications: ' + notifErr.message : '✓ Notifications: 6 alerts');

  console.log('\n✓ Seed complete!');
}

seed().catch(console.error);
