import { getUser, unauthorized, serverError } from '@/lib/auth';

export async function POST(request) {
  const session = await getUser(request);
  if (!session) return unauthorized();

  const uid = session.user.id;
  const sb = session.supabase;

  // Check if user already has data
  const { data: existing } = await sb.from('inventory').select('id').eq('user_id', uid).limit(1);
  if (existing && existing.length > 0) {
    return Response.json({ seeded: false, message: 'Data already exists' });
  }

  // Seed inventory
  await sb.from('inventory').insert([
    { user_id: uid, name: 'Wireless Earbuds Pro', sku: 'WEP-100', qty: 142, reorder: 50, price: 49.99, cost: 18.50, category: 'Electronics' },
    { user_id: uid, name: 'USB-C Hub 7-in-1', sku: 'UCH-200', qty: 23, reorder: 30, price: 39.99, cost: 12.00, category: 'Accessories' },
    { user_id: uid, name: 'Bamboo Desk Organizer', sku: 'BDO-300', qty: 89, reorder: 25, price: 34.99, cost: 9.75, category: 'Office' },
    { user_id: uid, name: 'LED Ring Light 12"', sku: 'LRL-400', qty: 7, reorder: 15, price: 29.99, cost: 11.20, category: 'Lighting' },
    { user_id: uid, name: 'Organic Coffee Beans 1lb', sku: 'OCB-500', qty: 312, reorder: 100, price: 18.99, cost: 6.50, category: 'Food & Bev' },
    { user_id: uid, name: 'Smart Water Bottle', sku: 'SWB-700', qty: 185, reorder: 40, price: 44.99, cost: 15.00, category: 'Lifestyle' },
    { user_id: uid, name: 'Phone Case - Clear', sku: 'PCC-010', qty: 0, reorder: 50, price: 14.99, cost: 2.10, category: 'Accessories' },
  ]);

  // Seed billing
  await sb.from('billing').insert([
    { user_id: uid, name: 'Shopify Plus', amount: 299, prev_amount: 299, category: 'E-commerce', due_date: '2026-03-01', autopay: true },
    { user_id: uid, name: 'Google Workspace', amount: 72, prev_amount: 72, category: 'Productivity', due_date: '2026-03-05', autopay: true },
    { user_id: uid, name: 'Warehouse Lease', amount: 4200, prev_amount: 4200, category: 'Operations', due_date: '2026-03-01', autopay: false },
    { user_id: uid, name: 'Shipstation', amount: 159.90, prev_amount: 129.90, category: 'Shipping', due_date: '2026-03-10', autopay: true },
    { user_id: uid, name: 'Business Insurance', amount: 485, prev_amount: 485, category: 'Insurance', due_date: '2026-03-15', autopay: false },
    { user_id: uid, name: 'QuickBooks Online', amount: 80, prev_amount: 55, category: 'Accounting', due_date: '2026-03-20', autopay: true },
    { user_id: uid, name: 'AWS Hosting', amount: 1599, prev_amount: 1450, category: 'Infrastructure', due_date: '2026-03-01', autopay: true },
  ]);

  // Seed partners
  await sb.from('partners').insert([
    { user_id: uid, name: 'TechFlow Solutions', type: 'Agency', contact: 'sarah@techflow.io', referrals: 24 },
    { user_id: uid, name: 'Digital Nomad Co', type: 'Affiliate', contact: 'jake@digitalnomad.co', referrals: 58 },
    { user_id: uid, name: 'Meridian Labs', type: 'Strategic', contact: 'priya@meridian.dev', referrals: 12 },
    { user_id: uid, name: 'CloudBase Inc', type: 'Integration', contact: 'dan@cloudbase.io', referrals: 31 },
    { user_id: uid, name: 'NovaTech Ventures', type: 'Investor', contact: 'li@novatech.vc', referrals: 7 },
  ]);

  // Seed notifications
  await sb.from('notifications').insert([
    { user_id: uid, title: 'Low Stock: USB-C Hub', description: '23 units remaining (reorder: 30).', type: 'warning' },
    { user_id: uid, title: 'Out of Stock: Phone Case', description: 'SKU PCC-010 has zero units.', type: 'critical' },
    { user_id: uid, title: 'Bill Increase: Shipstation', description: 'Up 23% from $129.90 to $159.90/mo.', type: 'warning' },
    { user_id: uid, title: 'Bill Increase: AWS Hosting', description: 'Up 10% from $1,450 to $1,599/mo.', type: 'warning' },
    { user_id: uid, title: 'Welcome to Cabrera Portal', description: 'Your workspace is ready.', type: 'info' },
  ]);

  return Response.json({ seeded: true, message: 'Demo data loaded' });
}
