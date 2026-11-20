import { TODAY } from './data.js';

export const STEPS = [
  { key: 'order', label: 'Pesanan', statuses: ['Submitted'] },
  { key: 'survey', label: 'Survei', statuses: ['WaitingSurvey', 'SurveyScheduled', 'SurveyConfirmed'] },
  { key: 'offer', label: 'Penawaran', statuses: ['Surveyed', 'OfferReady', 'OfferRejected'] },
  { key: 'approval', label: 'Persetujuan', statuses: ['AwaitingApproval'] },
  { key: 'work', label: 'Pengerjaan', statuses: ['Approved', 'InProgress'] },
  { key: 'pay', label: 'Pembayaran', statuses: ['Completed'] },
  { key: 'closed', label: 'Selesai', statuses: ['Closed'] },
];
export const stepIndex = (status) => STEPS.findIndex((s) => s.statuses.includes(status));

export const ACTIVE = ['Submitted', 'WaitingSurvey', 'SurveyScheduled', 'SurveyConfirmed', 'Surveyed', 'OfferReady', 'AwaitingApproval', 'OfferRejected', 'Approved', 'InProgress', 'Completed'];
export const ENDED = ['Closed', 'Rejected', 'Cancelled'];

// Customer can see prices once admin has sent the invoice
export const offerVisibleToCustomer = (o) => !!o.invoice;
export const canCancel = (o) => ['Submitted', 'WaitingSurvey', 'SurveyScheduled', 'SurveyConfirmed', 'Surveyed', 'OfferReady', 'AwaitingApproval', 'OfferRejected'].includes(o.status);

const assignedManager = (o) => o.survey?.managerId;

export function canSeeOrder(state, u, o) {
  if (u.role === 'admin' || u.role === 'manager') return true;
  if (u.role === 'customer') return o.customerId === u.id;
  return state.activities.some((a) => a.orderId === o.id && a.staffIds.includes(u.id) && a.status !== 'Draft');
}

export const visibleOrders = (state, u) => state.orders.filter((o) => canSeeOrder(state, u, o));

// What this user has to do on this order, or null
export function todoFor(state, u, o) {
  switch (u.role) {
    case 'admin':
      return {
        Submitted: 'Tinjau pesanan',
        WaitingSurvey: o.survey?.status === 'RescheduleRequested' ? 'Jadwalkan ulang survei' : 'Buat jadwal survei',
        OfferReady: 'Kirim penawaran & invoice',
        Completed: 'Catat pembayaran & tutup',
      }[o.status] || null;
    case 'manager':
      if (assignedManager(o) !== u.id) return null;
      return { SurveyConfirmed: 'Lakukan survei', Surveyed: o.offer?.adminNote ? 'Revisi penawaran' : 'Buat penawaran', OfferRejected: 'Revisi penawaran' }[o.status] || null;
    case 'customer':
      if (o.customerId !== u.id) return null;
      return { SurveyScheduled: 'Setujui jadwal survei', AwaitingApproval: 'Setujui penawaran & invoice' }[o.status] || null;
    case 'staff': {
      const mine = state.activities.filter((a) => a.orderId === o.id && a.staffIds.includes(u.id) && ['Booked', 'InProgress'].includes(a.status) && a.date <= TODAY);
      return mine.length ? 'Kerjakan kegiatan' : null;
    }
    default:
      return null;
  }
}

export const todos = (state, u) =>
  visibleOrders(state, u)
    .map((o) => ({ o, todo: todoFor(state, u, o) }))
    .filter((x) => x.todo);

export const NAV = [
  { path: 'dashboard', label: 'Dasbor', icon: 'dashboard', roles: ['admin', 'manager'] },
  { path: 'services', label: 'Layanan', icon: 'services', roles: ['customer', 'admin'] },
  { path: 'orders', label: 'Work order', customerLabel: 'Pesanan saya', icon: 'orders', roles: ['customer', 'admin', 'manager'], badge: true },
  { path: 'jobs', label: 'Tugas saya', icon: 'jobs', roles: ['staff'], badge: true },
  { path: 'schedule', label: 'Jadwal staf & alat', icon: 'agenda', roles: ['admin', 'manager', 'staff'] },
  { path: 'materials', label: 'Material & stok', icon: 'box', roles: ['admin', 'manager'] },
];

export const HOME = { customer: 'orders', admin: 'dashboard', manager: 'dashboard', staff: 'jobs' };
