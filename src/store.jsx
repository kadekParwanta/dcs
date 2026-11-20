import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { seed, TODAY } from './data.js';
import { rp } from './format.js';
import { totals } from './booking.js';
import { t } from './i18n.js';

const KEY = 'iswara-wo-mockup-v1';
const Ctx = createContext(null);

let counter = Date.now();
export const newId = (p) => p + (counter++).toString(36);

const load = () => {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
};

const stamp = () => `${TODAY} ${new Date().toTimeString().slice(0, 5)}`;
const yymm = TODAY.slice(2, 4) + TODAY.slice(5, 7);

function makeActions(set, me) {
  const log = (s, orderId, text) => ({ ...s, log: [{ id: newId('l'), orderId, at: stamp(), by: me.id, text }, ...s.log] });
  const patchOrder = (s, id, fn) => ({ ...s, orders: s.orders.map((o) => (o.id === id ? fn(o) : o)) });
  const status = (s, id, st, text, extra = (o) => o) => log(patchOrder(s, id, (o) => extra({ ...o, status: st })), id, text);
  const name = (s, id) => s.users.find((u) => u.id === id)?.name;

  return {
    reset: () => set(seed()),

    placeOrder: (data) => {
      const id = newId('o');
      set((s) => {
        const no = `WO-${yymm}-${String(s.seq).padStart(3, '0')}`;
        const order = { id, no, customerId: me.id, status: 'Submitted', createdAt: stamp(), survey: null, surveyResult: null, offer: null, invoice: null, review: null, ...data };
        return log({ ...s, seq: s.seq + 1, orders: [order, ...s.orders] }, id, 'membuat pesanan');
      });
      return id;
    },

    cancelOrder: (id, reason) => set((s) => status(s, id, 'Cancelled', `membatalkan pesanan — ${reason}`)),

    reviewOrder: (id, accept, note) =>
      set((s) =>
        status(
          s,
          id,
          accept ? 'WaitingSurvey' : 'Rejected',
          accept ? `menerima pesanan, status menjadi ${t('WaitingSurvey')}${note ? ' — ' + note : ''}` : `menolak pesanan — ${note}`,
          (o) => ({ ...o, review: { by: me.id, at: stamp(), note } }),
        ),
      ),

    scheduleSurvey: (id, { date, time, managerId, note }) =>
      set((s) =>
        status(s, id, 'SurveyScheduled', `menjadwalkan survei ${date} ${time} oleh ${name(s, managerId)}`, (o) => ({
          ...o,
          survey: { date, time, managerId, note, status: 'Proposed', history: o.survey ? [...(o.survey.history || []), o.survey] : [] },
        })),
      ),

    respondSurvey: (id, ok, note) =>
      set((s) =>
        ok
          ? status(s, id, 'SurveyConfirmed', 'menyetujui jadwal survei', (o) => ({ ...o, survey: { ...o.survey, status: 'Confirmed' } }))
          : status(s, id, 'WaitingSurvey', `meminta jadwal survei ulang — ${note}`, (o) => ({ ...o, survey: { ...o.survey, status: 'RescheduleRequested', customerNote: note } })),
      ),

    submitSurvey: (id, { notes, photos }) =>
      set((s) =>
        status(s, id, 'Surveyed', `menyelesaikan survei (${photos.length} foto)`, (o) => ({ ...o, surveyResult: { by: me.id, at: stamp(), notes, photos } })),
      ),

    // Replaces this order's activities. Drafts already hold staff & tools.
    saveOffer: (id, offer, acts) =>
      set((s) => {
        const tot = totals(offer.items).subtotal;
        const others = s.activities.filter((a) => a.orderId !== id);
        const mine = acts.map((a) => ({ status: 'Draft', report: null, ...a, orderId: id }));
        const o = s.orders.find((x) => x.id === id);
        const verb = o.offer ? 'merevisi penawaran' : 'menyusun penawaran';
        return status({ ...s, activities: [...others, ...mine] }, id, 'OfferReady', `${verb} (${rp(tot)}, ${mine.length} kegiatan)`, (x) => ({
          ...x,
          offer: { ...offer, by: me.id, at: stamp(), adminNote: null },
        }));
      }),

    returnOffer: (id, note) =>
      set((s) => status(s, id, 'Surveyed', `mengembalikan penawaran ke manajer — ${note}`, (o) => ({ ...o, offer: { ...o.offer, adminNote: note } }))),

    sendInvoice: (id, inv) =>
      set((s) => {
        const o = s.orders.find((x) => x.id === id);
        const invNo = o.invoice?.no || `INV-${yymm}-${String(s.invSeq).padStart(3, '0')}`;
        const next = { ...s, invSeq: o.invoice ? s.invSeq : s.invSeq + 1 };
        return status(next, id, 'AwaitingApproval', `mengirim penawaran & invoice ${invNo} ke pelanggan (${rp(totals(o.offer.items, inv).total)})`, (x) => ({
          ...x,
          invoice: { ...inv, no: invNo, sentBy: me.id, sentAt: stamp(), status: 'Sent', rejectReason: null },
        }));
      }),

    respondInvoice: (id, ok, reason) =>
      set((s) => {
        if (ok) {
          const next = { ...s, activities: s.activities.map((a) => (a.orderId === id ? { ...a, status: 'Booked' } : a)) };
          return status(next, id, 'Approved', 'menyetujui penawaran & invoice — kegiatan dibooking', (o) => ({ ...o, invoice: { ...o.invoice, status: 'Approved', decidedAt: stamp() } }));
        }
        return status(s, id, 'OfferRejected', `menolak penawaran — ${reason}`, (o) => ({ ...o, invoice: { ...o.invoice, status: 'Rejected', rejectReason: reason, decidedAt: stamp() } }));
      }),

    startActivity: (actId) =>
      set((s) => {
        const a = s.activities.find((x) => x.id === actId);
        const next = { ...s, activities: s.activities.map((x) => (x.id === actId ? { ...x, status: 'InProgress', report: { ...(x.report || {}), startedAt: stamp(), by: me.id } } : x)) };
        return status(next, a.orderId, 'InProgress', `memulai "${a.title}"`);
      }),

    finishActivity: (actId, { notes, photos, usage }) =>
      set((s) => {
        const a = s.activities.find((x) => x.id === actId);
        const o = s.orders.find((x) => x.id === a.orderId);
        const activities = s.activities.map((x) => (x.id === actId ? { ...x, status: 'Done', report: { ...x.report, by: me.id, at: stamp(), notes, photos, usage } } : x));
        const used = usage.filter((u) => u.qty > 0);
        const materials = s.materials.map((m) => {
          const u = used.find((x) => x.materialId === m.id);
          return u ? { ...m, stock: m.stock - u.qty } : m;
        });
        const stockMoves = [...used.map((u) => ({ id: newId('sm'), materialId: u.materialId, date: TODAY, qty: -u.qty, type: 'Out', ref: `${o.no} · ${a.title}`, by: me.id })), ...s.stockMoves];
        const allDone = activities.filter((x) => x.orderId === o.id).every((x) => x.status === 'Done');
        return status(
          { ...s, activities, materials, stockMoves },
          o.id,
          allDone ? 'Completed' : 'InProgress',
          `menyelesaikan "${a.title}"${allDone ? ' — semua kegiatan selesai' : ''}`,
        );
      }),

    closeOrder: (id, payment) =>
      set((s) =>
        status(s, id, 'Closed', `mencatat pembayaran (${payment.method}${payment.ref ? ' · ' + payment.ref : ''}) dan menutup work order`, (o) => ({
          ...o,
          invoice: { ...o.invoice, status: 'Paid', paidAt: stamp(), payment },
        })),
      ),

    moveStock: (materialId, qty, type, ref) =>
      set((s) => ({
        ...s,
        materials: s.materials.map((m) => (m.id === materialId ? { ...m, stock: m.stock + qty } : m)),
        stockMoves: [{ id: newId('sm'), materialId, date: TODAY, qty, type, ref, by: me.id }, ...s.stockMoves],
      })),

    addMaterial: (data) => set((s) => ({ ...s, materials: [...s.materials, { id: newId('mt'), ...data }] })),

    toggleProduct: (id) => set((s) => ({ ...s, products: s.products.map((p) => (p.id === id ? { ...p, active: !p.active } : p)) })),
  };
}

const DEFAULT_USER = 'a1';

export function StoreProvider({ children }) {
  const [state, setState] = useState(() => load() || seed());
  const [userId, setUserId] = useState(() => {
    // ?as=m1 opens the demo as a specific user (handy for sharing role-specific links)
    const as = new URLSearchParams(window.location.search).get('as');
    if (as) return as;
    try {
      return localStorage.getItem(KEY + ':user') || DEFAULT_USER;
    } catch {
      return DEFAULT_USER;
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(KEY, JSON.stringify(state));
    } catch {
      /* storage full or unavailable: demo still works in memory */
    }
  }, [state]);

  useEffect(() => {
    try {
      localStorage.setItem(KEY + ':user', userId);
    } catch {
      /* ignore */
    }
  }, [userId]);

  const user = state.users.find((u) => u.id === userId) || state.users.find((u) => u.id === DEFAULT_USER);
  const actions = useMemo(() => makeActions(setState, user), [user]);
  const value = useMemo(() => ({ state, user, setUserId, actions }), [state, user, actions]);
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export const useStore = () => useContext(Ctx);

export const userName = (s, id) => s.users.find((u) => u.id === id)?.name || '—';
export const productOf = (s, o) => s.products.find((p) => p.id === o.productId);
export const materialById = (s, id) => s.materials.find((m) => m.id === id);
export const orderActivities = (s, orderId) => s.activities.filter((a) => a.orderId === orderId).sort((a, b) => (a.date + a.shift).localeCompare(b.date + b.shift));
