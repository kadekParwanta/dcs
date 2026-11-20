// Booking rules for staff (per shift) and materials (tools per shift, consumables from stock).
export const slotsOf = (shift) => (shift === 'FD' ? ['S1', 'S2'] : [shift]);
export const overlaps = (a, b) => a.date === b.date && slotsOf(a.shift).some((x) => slotsOf(b.shift).includes(x));

const RELEASED = ['Rejected', 'Cancelled'];

// Every activity that holds staff and tools: drafts in an offer hold too, so two managers can't plan the same person.
export function holdingActivities(state, excludeOrderId) {
  const live = new Set(state.orders.filter((o) => !RELEASED.includes(o.status) && o.id !== excludeOrderId).map((o) => o.id));
  return state.activities.filter((a) => live.has(a.orderId));
}

export const staffConflict = (acts, staffId, slot, selfId) =>
  acts.find((a) => a.id !== selfId && a.staffIds.includes(staffId) && overlaps(a, slot));

// Units of a tool already booked in the same date/shift
export function toolInUse(acts, materialId, slot, selfId) {
  let max = 0;
  for (const s of slotsOf(slot.shift)) {
    const used = acts
      .filter((a) => a.id !== selfId && a.date === slot.date && slotsOf(a.shift).includes(s))
      .reduce((sum, a) => sum + (a.materials.find((m) => m.materialId === materialId)?.qty || 0), 0);
    max = Math.max(max, used);
  }
  return max;
}

// Consumables reserved by activities that haven't been done yet
export const consumableReserved = (acts, materialId, selfIds = []) =>
  acts
    .filter((a) => a.status !== 'Done' && !selfIds.includes(a.id))
    .reduce((sum, a) => sum + (a.materials.find((m) => m.materialId === materialId)?.qty || 0), 0);

export function materialSummary(state, m) {
  const acts = holdingActivities(state);
  if (m.kind === 'consumable') {
    const reserved = consumableReserved(acts, m.id);
    return { reserved, available: m.stock - reserved, low: m.stock - reserved < m.min };
  }
  const upcoming = acts.filter((a) => a.status !== 'Done' && a.materials.some((x) => x.materialId === m.id));
  return { reserved: upcoming.length, available: m.stock, low: false };
}

export const totals = (items = [], invoice) => {
  const subtotal = items.reduce((s, i) => s + (Number(i.qty) || 0) * (Number(i.price) || 0), 0);
  const discount = Number(invoice?.discount) || 0;
  const taxPct = Number(invoice?.taxPct) || 0;
  const tax = Math.round(((subtotal - discount) * taxPct) / 100);
  return { subtotal, discount, taxPct, tax, total: subtotal - discount + tax };
};
