import { getUser, unauthorized, serverError } from '@/lib/auth';

export async function GET(request) {
  const session = await getUser(request);
  if (!session) return unauthorized();

  const uid = session.user.id;
  const sb = session.supabase;

  // Parallel fetch all data
  const [invRes, billRes, partRes, notifRes] = await Promise.all([
    sb.from('inventory').select('*').eq('user_id', uid),
    sb.from('billing').select('*').eq('user_id', uid),
    sb.from('partners').select('*').eq('user_id', uid),
    sb.from('notifications').select('*').eq('user_id', uid).eq('read', false),
  ]);

  const inventory = invRes.data || [];
  const bills = billRes.data || [];
  const partners = partRes.data || [];
  const unreadAlerts = notifRes.data || [];

  // Compute stats
  let totalStock = 0, totalValue = 0, outOfStock = 0, lowStock = 0;
  for (const item of inventory) {
    totalStock += item.qty || 0;
    totalValue += (item.qty || 0) * (item.price || 0);
    if (item.qty === 0) outOfStock++;
    else if (item.qty <= (item.reorder || 0)) lowStock++;
  }

  let monthlyBurn = 0, billAlerts = 0;
  for (const bill of bills) {
    monthlyBurn += bill.amount || 0;
    if (bill.prev_amount > 0 && ((bill.amount - bill.prev_amount) / bill.prev_amount * 100) > 5) {
      billAlerts++;
    }
  }

  let totalReferrals = 0;
  for (const p of partners) totalReferrals += p.referrals || 0;

  return Response.json({
    totalStock,
    totalValue,
    outOfStock,
    lowStock,
    itemCount: inventory.length,
    monthlyBurn,
    billAlerts,
    billCount: bills.length,
    partnerCount: partners.length,
    totalReferrals,
    activeAlerts: unreadAlerts.length,
    // Include recent data for snapshots
    topInventory: inventory.slice(0, 5),
    topBills: bills.slice(0, 5),
    recentAlerts: unreadAlerts.slice(0, 5),
  });
}
