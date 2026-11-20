import { addDays, localISO, placeholderPhoto as ph } from './format.js';

export const TODAY = localISO();

export const ROLES = {
  customer: { label: 'Pelanggan', hint: 'Memilih layanan dan memesan, memantau status, menyetujui jadwal survei serta penawaran & invoice.' },
  admin: { label: 'Admin', hint: 'Meninjau pesanan, membuat jadwal survei, mengirim penawaran & invoice ke pelanggan, mencatat pembayaran, mengelola stok.' },
  manager: { label: 'Manajer', hint: 'Melakukan survei dengan foto, menyusun penawaran: rincian biaya dan kegiatan (jadwal, staf, material).' },
  staff: { label: 'Staf', hint: 'Melihat tugas yang dibooking untuknya, memulai dan menyelesaikan kegiatan dengan laporan & foto.' },
};

// A staff member has two shifts a day; a booking can take one shift or the whole day.
export const SHIFTS = {
  S1: { label: 'Shift 1', short: 'S1', time: '08:00–12:00' },
  S2: { label: 'Shift 2', short: 'S2', time: '13:00–17:00' },
  FD: { label: 'Sehari penuh', short: 'S1+S2', time: '08:00–17:00' },
};

export const SURVEY_TIMES = ['09:00', '10:00', '11:00', '13:00', '14:00', '15:00', '16:00'];

const users = [
  { id: 'c1', role: 'customer', name: 'Putu Ayu Lestari', title: 'Pelanggan perorangan', phone: '0812-3801-2231', address: 'Jl. Tukad Badung No. 12, Renon, Denpasar' },
  { id: 'c2', role: 'customer', name: 'PT Sinar Bali Resort', title: 'Pelanggan korporat · PIC Made Wirawan', phone: '0361-771 220', address: 'Jl. Pantai Mengiat, Nusa Dua, Badung' },
  { id: 'c3', role: 'customer', name: 'Nyoman Sudarsana', title: 'Pelanggan perorangan', phone: '0813-3755-9012', address: 'Jl. Gatot Subroto Timur No. 88, Denpasar' },
  { id: 'a1', role: 'admin', name: 'Admin Kantor', title: 'Admin' },
  { id: 'm1', role: 'manager', name: 'Gede Pradnyana', title: 'Manajer Operasional' },
  { id: 'm2', role: 'manager', name: 'Komang Ari Santika', title: 'Manajer Lapangan' },
  { id: 's1', role: 'staff', name: 'Wayan Sutama', title: 'Teknisi AC', skills: ['AC'] },
  { id: 's2', role: 'staff', name: 'Ketut Arya', title: 'Teknisi AC', skills: ['AC', 'Pipa'] },
  { id: 's3', role: 'staff', name: 'Made Suarta', title: 'Tukang Kebun', skills: ['Taman'] },
  { id: 's4', role: 'staff', name: 'Kadek Dwi Putra', title: 'Tukang Kebun', skills: ['Taman', 'Kolam'] },
  { id: 's5', role: 'staff', name: 'Nengah Putra', title: 'Petugas Kebersihan', skills: ['Kebersihan', 'Kolam'] },
  { id: 's6', role: 'staff', name: 'Ni Luh Sari', title: 'Petugas Kebersihan', skills: ['Kebersihan'] },
];

// kind: consumable = stock is used up; tool = units are booked per shift and returned
const materials = [
  { id: 'mt1', code: 'CH-001', name: 'Cairan pembersih AC', kind: 'consumable', unit: 'liter', stock: 24, min: 10, price: 45000 },
  { id: 'mt2', code: 'CH-002', name: 'Freon R32', kind: 'consumable', unit: 'kg', stock: 9, min: 8, price: 180000 },
  { id: 'mt3', code: 'CH-003', name: 'Pupuk NPK', kind: 'consumable', unit: 'kg', stock: 40, min: 15, price: 18000 },
  { id: 'mt4', code: 'CH-004', name: 'Kantong sampah besar', kind: 'consumable', unit: 'pcs', stock: 180, min: 50, price: 2500 },
  { id: 'mt5', code: 'CH-005', name: 'Cairan pembersih lantai', kind: 'consumable', unit: 'liter', stock: 30, min: 10, price: 35000 },
  { id: 'mt6', code: 'CH-006', name: 'Kaporit', kind: 'consumable', unit: 'kg', stock: 6, min: 10, price: 55000 },
  { id: 'mt7', code: 'CH-007', name: 'Lem & seal tape pipa', kind: 'consumable', unit: 'set', stock: 15, min: 5, price: 25000 },
  { id: 'tl1', code: 'TL-001', name: 'Tangga lipat 3 m', kind: 'tool', unit: 'unit', stock: 3, min: 0 },
  { id: 'tl2', code: 'TL-002', name: 'Mesin jet cleaner', kind: 'tool', unit: 'unit', stock: 2, min: 0 },
  { id: 'tl3', code: 'TL-003', name: 'Mesin potong rumput', kind: 'tool', unit: 'unit', stock: 2, min: 0 },
  { id: 'tl4', code: 'TL-004', name: 'Gunting dahan', kind: 'tool', unit: 'unit', stock: 4, min: 0 },
  { id: 'tl5', code: 'TL-005', name: 'Blower daun', kind: 'tool', unit: 'unit', stock: 1, min: 0 },
  { id: 'tl6', code: 'TL-006', name: 'Vacuum industri', kind: 'tool', unit: 'unit', stock: 2, min: 0 },
  { id: 'tl7', code: 'TL-007', name: 'Pompa & sikat kolam', kind: 'tool', unit: 'set', stock: 1, min: 0 },
];

// template: default cost lines and one activity, used to pre-fill the manager's offer
const products = [
  {
    id: 'p1', name: 'Cuci AC', icon: 'snow', category: 'AC', active: true, priceFrom: 85000, unit: 'per unit',
    desc: 'Pembersihan unit indoor & outdoor, cek tekanan freon, dan cek kebocoran.',
    template: {
      items: [{ desc: 'Jasa cuci AC split', unit: 'unit', price: 85000 }, { desc: 'Isi ulang freon (bila perlu)', unit: 'kg', price: 250000 }],
      activity: { title: 'Cuci AC', skill: 'AC', materials: [{ materialId: 'mt1', qty: 2 }, { materialId: 'tl1', qty: 1 }, { materialId: 'tl2', qty: 1 }] },
    },
  },
  {
    id: 'p2', name: 'Perawatan Taman', icon: 'leaf', category: 'Taman', active: true, priceFrom: 350000, unit: 'per kunjungan',
    desc: 'Potong rumput, pangkas tanaman, pemupukan, dan pembersihan sampah taman.',
    template: {
      items: [{ desc: 'Jasa perawatan taman (per shift per orang)', unit: 'shift', price: 175000 }, { desc: 'Angkut sampah taman', unit: 'trip', price: 150000 }],
      activity: { title: 'Perawatan taman', skill: 'Taman', materials: [{ materialId: 'mt3', qty: 5 }, { materialId: 'mt4', qty: 10 }, { materialId: 'tl3', qty: 1 }, { materialId: 'tl4', qty: 2 }] },
    },
  },
  {
    id: 'p3', name: 'Deep Cleaning Rumah', icon: 'sparkle', category: 'Kebersihan', active: true, priceFrom: 600000, unit: 'per rumah',
    desc: 'Pembersihan menyeluruh lantai, kamar mandi, dapur, kaca, dan furnitur.',
    template: {
      items: [{ desc: 'Jasa deep cleaning (per shift per orang)', unit: 'shift', price: 200000 }],
      activity: { title: 'Deep cleaning', skill: 'Kebersihan', materials: [{ materialId: 'mt5', qty: 3 }, { materialId: 'mt4', qty: 5 }, { materialId: 'tl6', qty: 1 }, { materialId: 'tl1', qty: 1 }] },
    },
  },
  {
    id: 'p4', name: 'Perbaikan Pipa & Saluran', icon: 'wrench', category: 'Pipa', active: true, priceFrom: 150000, unit: 'per titik',
    desc: 'Perbaikan kebocoran pipa, saluran mampet, dan penggantian kran.',
    template: {
      items: [{ desc: 'Jasa perbaikan pipa', unit: 'titik', price: 150000 }],
      activity: { title: 'Perbaikan pipa', skill: 'Pipa', materials: [{ materialId: 'mt7', qty: 1 }] },
    },
  },
  {
    id: 'p5', name: 'Pembersihan Kolam Renang', icon: 'drop', category: 'Kolam', active: true, priceFrom: 400000, unit: 'per kunjungan',
    desc: 'Sikat dinding & lantai kolam, vakum, cek dan atur kadar klorin.',
    template: {
      items: [{ desc: 'Jasa pembersihan kolam', unit: 'kunjungan', price: 400000 }],
      activity: { title: 'Pembersihan kolam', skill: 'Kolam', materials: [{ materialId: 'mt6', qty: 2 }, { materialId: 'tl7', qty: 1 }] },
    },
  },
];

const T = TODAY;
const d = (n) => addDays(T, n);
const at = (n, time) => `${d(n)} ${time}`;

const yymm = T.slice(2, 4) + T.slice(5, 7);
const no = (n) => `WO-${yymm}-${String(n).padStart(3, '0')}`;

export function seed() {
  const orders = [];
  const activities = [];
  const log = [];
  const L = (orderId, n, time, by, text) => log.push({ id: `l${log.length + 1}`, orderId, at: at(n, time), by, text });

  const O = (o) => {
    orders.push({ survey: null, surveyResult: null, offer: null, invoice: null, review: null, attachments: [], ...o });
    return o.id;
  };
  const A = (a) => activities.push({ status: 'Draft', report: null, ...a });

  // 1. New order — admin to review
  O({ id: 'o1', no: no(12), customerId: 'c1', productId: 'p1', status: 'Submitted', createdAt: at(0, '08:12'), preferredDate: d(4), address: users[0].address, notes: '3 unit AC split 1 PK di kamar tidur, satu unit menetes.' });
  L('o1', 0, '08:12', 'c1', 'membuat pesanan');

  // 2. Accepted, waiting for admin to schedule survey
  O({ id: 'o2', no: no(11), customerId: 'c2', productId: 'p2', status: 'WaitingSurvey', createdAt: at(-1, '10:20'), preferredDate: d(7), address: users[1].address, notes: 'Taman area lobi dan villa blok B, sekitar 800 m². Kontrak bulanan bila cocok.', review: { by: 'a1', at: at(-1, '13:05'), note: 'Area layanan Nusa Dua OK.' } });
  L('o2', -1, '10:20', 'c2', 'membuat pesanan');
  L('o2', -1, '13:05', 'a1', 'menerima pesanan, status menjadi Menunggu survei');

  // 3. Survey proposed, waiting for customer
  O({ id: 'o3', no: no(10), customerId: 'c3', productId: 'p3', status: 'SurveyScheduled', createdAt: at(-2, '15:40'), preferredDate: d(5), address: users[2].address, notes: 'Rumah 2 lantai, 4 kamar. Persiapan upacara keluarga.', review: { by: 'a1', at: at(-1, '09:00') }, survey: { date: d(1), time: '10:00', managerId: 'm2', status: 'Proposed', note: 'Mohon ada yang di rumah untuk membukakan pintu.' } });
  L('o3', -2, '15:40', 'c3', 'membuat pesanan');
  L('o3', -1, '09:00', 'a1', 'menerima pesanan, status menjadi Menunggu survei');
  L('o3', -1, '09:15', 'a1', `menjadwalkan survei ${d(1)} 10:00 oleh Komang Ari Santika`);

  // 4. Survey confirmed — manager to survey today
  O({ id: 'o4', no: no(9), customerId: 'c1', productId: 'p4', status: 'SurveyConfirmed', createdAt: at(-3, '19:02'), preferredDate: d(2), address: users[0].address, notes: 'Saluran wastafel dapur mampet, pipa di bawah kamar mandi bocor.', review: { by: 'a1', at: at(-2, '08:30') }, survey: { date: d(0), time: '14:00', managerId: 'm1', status: 'Confirmed' } });
  L('o4', -3, '19:02', 'c1', 'membuat pesanan');
  L('o4', -2, '08:30', 'a1', 'menerima pesanan, status menjadi Menunggu survei');
  L('o4', -2, '08:40', 'a1', `menjadwalkan survei ${d(0)} 14:00 oleh Gede Pradnyana`);
  L('o4', -2, '11:10', 'c1', 'menyetujui jadwal survei');

  // 5. Surveyed — manager to make offer
  O({
    id: 'o5', no: no(8), customerId: 'c2', productId: 'p1', status: 'Surveyed', createdAt: at(-5, '09:00'), preferredDate: d(6), address: users[1].address, notes: 'Cuci AC kamar villa blok A (12 unit) sebelum high season.', review: { by: 'a1', at: at(-5, '10:00') },
    survey: { date: d(-1), time: '09:00', managerId: 'm1', status: 'Confirmed' },
    surveyResult: { by: 'm1', at: at(-1, '11:20'), notes: '12 unit AC split 1–1,5 PK. 2 unit tekanan freon rendah (villa A3, A7). Akses outdoor unit di atap, perlu tangga 3 m. Disarankan 2 hari kerja, 2 teknisi.', photos: [{ id: 'ph1', name: 'Indoor A3.jpg', src: ph('Indoor unit A3', 205) }, { id: 'ph2', name: 'Outdoor atap.jpg', src: ph('Outdoor unit — atap', 25) }, { id: 'ph3', name: 'Tekanan freon.jpg', src: ph('Cek tekanan freon', 160) }] },
  });
  L('o5', -5, '09:00', 'c2', 'membuat pesanan');
  L('o5', -5, '10:00', 'a1', 'menerima pesanan, status menjadi Menunggu survei');
  L('o5', -4, '08:00', 'a1', `menjadwalkan survei ${d(-1)} 09:00 oleh Gede Pradnyana`);
  L('o5', -4, '09:30', 'c2', 'menyetujui jadwal survei');
  L('o5', -1, '11:20', 'm1', 'menyelesaikan survei (3 foto)');

  // 6. Offer ready — admin to send invoice
  O({
    id: 'o6', no: no(7), customerId: 'c3', productId: 'p1', status: 'OfferReady', createdAt: at(-6, '12:00'), preferredDate: d(3), address: users[2].address, notes: '2 unit AC kamar, kurang dingin.', review: { by: 'a1', at: at(-6, '13:00') },
    survey: { date: d(-3), time: '13:00', managerId: 'm2', status: 'Confirmed' },
    surveyResult: { by: 'm2', at: at(-3, '14:10'), notes: '2 unit 1 PK, filter sangat kotor, 1 unit perlu tambah freon ±1 kg.', photos: [{ id: 'ph4', name: 'Filter kotor.jpg', src: ph('Filter kotor', 40) }] },
    offer: { by: 'm2', at: at(-2, '10:00'), notes: 'Pengerjaan 1 shift, 1 teknisi.', items: [{ id: 'i1', desc: 'Jasa cuci AC split', qty: 2, unit: 'unit', price: 85000 }, { id: 'i2', desc: 'Isi ulang freon R32', qty: 1, unit: 'kg', price: 250000 }] },
  });
  A({ id: 'ac1', orderId: 'o6', title: 'Cuci AC 2 unit + isi freon', date: d(3), shift: 'S1', staffIds: ['s1'], materials: [{ materialId: 'mt1', qty: 1 }, { materialId: 'mt2', qty: 1 }, { materialId: 'tl1', qty: 1 }, { materialId: 'tl2', qty: 1 }] });
  L('o6', -6, '12:00', 'c3', 'membuat pesanan');
  L('o6', -6, '13:00', 'a1', 'menerima pesanan, status menjadi Menunggu survei');
  L('o6', -3, '14:10', 'm2', 'menyelesaikan survei (1 foto)');
  L('o6', -2, '10:00', 'm2', 'menyusun penawaran (Rp 420.000, 1 kegiatan)');

  // 7. Invoice sent — customer to approve
  O({
    id: 'o7', no: no(6), customerId: 'c1', productId: 'p2', status: 'AwaitingApproval', createdAt: at(-8, '07:30'), preferredDate: d(4), address: users[0].address, notes: 'Taman depan dan belakang, rumput sudah tinggi.', review: { by: 'a1', at: at(-8, '09:00') },
    survey: { date: d(-6), time: '10:00', managerId: 'm2', status: 'Confirmed' },
    surveyResult: { by: 'm2', at: at(-6, '11:00'), notes: 'Luas ±150 m². Pagar tanaman perlu dipangkas, 2 pohon kamboja perlu dirapikan.', photos: [{ id: 'ph5', name: 'Taman depan.jpg', src: ph('Taman depan', 110) }, { id: 'ph6', name: 'Taman belakang.jpg', src: ph('Taman belakang', 95) }] },
    offer: { by: 'm2', at: at(-5, '09:00'), notes: '', items: [{ id: 'i1', desc: 'Jasa perawatan taman (per shift per orang)', qty: 4, unit: 'shift', price: 175000 }, { id: 'i2', desc: 'Angkut sampah taman', qty: 1, unit: 'trip', price: 150000 }, { id: 'i3', desc: 'Pupuk NPK', qty: 5, unit: 'kg', price: 18000 }] },
    invoice: { no: `INV-${yymm}-006`, discount: 40000, taxPct: 11, dueDate: d(3), note: 'Pembayaran via transfer BCA. Jadwal dipastikan setelah persetujuan.', sentBy: 'a1', sentAt: at(-4, '10:00'), status: 'Sent' },
  });
  A({ id: 'ac2', orderId: 'o7', title: 'Potong rumput & pangkas pagar tanaman', date: d(4), shift: 'FD', staffIds: ['s3', 's4'], materials: [{ materialId: 'mt3', qty: 5 }, { materialId: 'mt4', qty: 10 }, { materialId: 'tl3', qty: 1 }, { materialId: 'tl4', qty: 2 }, { materialId: 'tl5', qty: 1 }] });
  L('o7', -8, '07:30', 'c1', 'membuat pesanan');
  L('o7', -6, '11:00', 'm2', 'menyelesaikan survei (2 foto)');
  L('o7', -5, '09:00', 'm2', 'menyusun penawaran');
  L('o7', -4, '10:00', 'a1', `mengirim penawaran & invoice INV-${yymm}-006 ke pelanggan`);

  // 8. Approved — work booked (today + later)
  O({
    id: 'o8', no: no(5), customerId: 'c2', productId: 'p5', status: 'Approved', createdAt: at(-10, '09:00'), preferredDate: d(0), address: users[1].address, notes: 'Kolam utama resort, 2 kali kunjungan minggu ini.', review: { by: 'a1', at: at(-10, '10:00') },
    survey: { date: d(-8), time: '09:00', managerId: 'm1', status: 'Confirmed' },
    surveyResult: { by: 'm1', at: at(-8, '10:30'), notes: 'Kolam 12×6 m, air agak hijau, kadar klorin rendah.', photos: [{ id: 'ph7', name: 'Kolam utama.jpg', src: ph('Kolam utama', 190) }] },
    offer: { by: 'm1', at: at(-7, '09:00'), items: [{ id: 'i1', desc: 'Jasa pembersihan kolam', qty: 2, unit: 'kunjungan', price: 400000 }, { id: 'i2', desc: 'Kaporit', qty: 4, unit: 'kg', price: 55000 }] },
    invoice: { no: `INV-${yymm}-005`, discount: 0, taxPct: 11, dueDate: d(5), note: 'Termin 14 hari.', sentBy: 'a1', sentAt: at(-6, '09:00'), status: 'Approved', decidedAt: at(-5, '16:00') },
  });
  A({ id: 'ac3', orderId: 'o8', title: 'Pembersihan kolam — kunjungan 1', date: d(0), shift: 'S1', staffIds: ['s5'], status: 'Booked', materials: [{ materialId: 'mt6', qty: 2 }, { materialId: 'tl7', qty: 1 }] });
  A({ id: 'ac4', orderId: 'o8', title: 'Pembersihan kolam — kunjungan 2', date: d(3), shift: 'S1', staffIds: ['s5'], status: 'Booked', materials: [{ materialId: 'mt6', qty: 2 }, { materialId: 'tl7', qty: 1 }] });
  L('o8', -6, '09:00', 'a1', `mengirim penawaran & invoice INV-${yymm}-005 ke pelanggan`);
  L('o8', -5, '16:00', 'c2', 'menyetujui penawaran & invoice — kegiatan dibooking');

  // 9. In progress — one activity done, one today
  O({
    id: 'o9', no: no(4), customerId: 'c2', productId: 'p1', status: 'InProgress', createdAt: at(-12, '09:00'), preferredDate: d(-1), address: users[1].address, notes: 'AC lobi & restoran (6 unit cassette).', review: { by: 'a1', at: at(-12, '10:00') },
    survey: { date: d(-10), time: '14:00', managerId: 'm1', status: 'Confirmed' },
    surveyResult: { by: 'm1', at: at(-10, '15:00'), notes: '6 unit cassette 2 PK, plafon tinggi 3,2 m.', photos: [{ id: 'ph8', name: 'Cassette lobi.jpg', src: ph('Cassette lobi', 220) }] },
    offer: { by: 'm1', at: at(-9, '09:00'), items: [{ id: 'i1', desc: 'Jasa cuci AC cassette', qty: 6, unit: 'unit', price: 150000 }] },
    invoice: { no: `INV-${yymm}-004`, discount: 50000, taxPct: 11, dueDate: d(2), note: '', sentBy: 'a1', sentAt: at(-8, '10:00'), status: 'Approved', decidedAt: at(-7, '11:00') },
  });
  A({
    id: 'ac5', orderId: 'o9', title: 'Cuci AC lobi (3 unit)', date: d(-1), shift: 'FD', staffIds: ['s1', 's2'], status: 'Done', materials: [{ materialId: 'mt1', qty: 3 }, { materialId: 'tl1', qty: 2 }, { materialId: 'tl2', qty: 1 }],
    report: { by: 's1', at: at(-1, '16:40'), startedAt: at(-1, '08:05'), notes: '3 unit selesai, drain pipe 1 unit dibersihkan.', usage: [{ materialId: 'mt1', qty: 3 }], photos: [{ id: 'ph9', name: 'Setelah dicuci.jpg', src: ph('Setelah dicuci', 150) }] },
  });
  A({ id: 'ac6', orderId: 'o9', title: 'Cuci AC restoran (3 unit)', date: d(0), shift: 'S2', staffIds: ['s1', 's2'], status: 'Booked', materials: [{ materialId: 'mt1', qty: 3 }, { materialId: 'tl1', qty: 2 }, { materialId: 'tl2', qty: 1 }] });
  L('o9', -7, '11:00', 'c2', 'menyetujui penawaran & invoice — kegiatan dibooking');
  L('o9', -1, '08:05', 's1', 'memulai "Cuci AC lobi (3 unit)"');
  L('o9', -1, '16:40', 's1', 'menyelesaikan "Cuci AC lobi (3 unit)"');

  // 10. Completed — admin to record payment & close
  O({
    id: 'o10', no: no(3), customerId: 'c3', productId: 'p2', status: 'Completed', createdAt: at(-14, '09:00'), preferredDate: d(-3), address: users[2].address, notes: 'Taman belakang.', review: { by: 'a1', at: at(-14, '10:00') },
    survey: { date: d(-12), time: '10:00', managerId: 'm2', status: 'Confirmed' },
    surveyResult: { by: 'm2', at: at(-12, '11:00'), notes: 'Area kecil ±60 m².', photos: [] },
    offer: { by: 'm2', at: at(-11, '09:00'), items: [{ id: 'i1', desc: 'Jasa perawatan taman (per shift per orang)', qty: 1, unit: 'shift', price: 175000 }, { id: 'i2', desc: 'Angkut sampah taman', qty: 1, unit: 'trip', price: 150000 }] },
    invoice: { no: `INV-${yymm}-003`, discount: 0, taxPct: 0, dueDate: d(1), note: '', sentBy: 'a1', sentAt: at(-10, '10:00'), status: 'Approved', decidedAt: at(-10, '18:00') },
  });
  A({ id: 'ac7', orderId: 'o10', title: 'Perawatan taman belakang', date: d(-3), shift: 'S1', staffIds: ['s3'], status: 'Done', materials: [{ materialId: 'mt4', qty: 4 }, { materialId: 'tl3', qty: 1 }], report: { by: 's3', at: at(-3, '11:50'), startedAt: at(-3, '08:10'), notes: 'Selesai, sampah diangkut.', usage: [{ materialId: 'mt4', qty: 5 }], photos: [{ id: 'ph10', name: 'Hasil.jpg', src: ph('Taman — hasil', 100) }] } });
  L('o10', -3, '11:50', 's3', 'menyelesaikan "Perawatan taman belakang" — semua kegiatan selesai');

  // 11. Closed
  O({
    id: 'o11', no: no(2), customerId: 'c1', productId: 'p1', status: 'Closed', createdAt: at(-20, '09:00'), preferredDate: d(-15), address: users[0].address, notes: '1 unit AC ruang tamu.', review: { by: 'a1', at: at(-20, '10:00') },
    survey: { date: d(-18), time: '10:00', managerId: 'm1', status: 'Confirmed' },
    surveyResult: { by: 'm1', at: at(-18, '10:40'), notes: '1 unit 1,5 PK.', photos: [] },
    offer: { by: 'm1', at: at(-17, '09:00'), items: [{ id: 'i1', desc: 'Jasa cuci AC split', qty: 1, unit: 'unit', price: 85000 }] },
    invoice: { no: `INV-${yymm}-002`, discount: 0, taxPct: 0, dueDate: d(-10), note: '', sentBy: 'a1', sentAt: at(-17, '10:00'), status: 'Paid', decidedAt: at(-17, '12:00'), paidAt: at(-14, '10:00'), payment: { method: 'Transfer', ref: 'BCA 1411' } },
  });
  A({ id: 'ac8', orderId: 'o11', title: 'Cuci AC ruang tamu', date: d(-15), shift: 'S1', staffIds: ['s2'], status: 'Done', materials: [{ materialId: 'mt1', qty: 1 }, { materialId: 'tl1', qty: 1 }], report: { by: 's2', at: at(-15, '10:00'), startedAt: at(-15, '08:30'), notes: 'OK.', usage: [{ materialId: 'mt1', qty: 1 }], photos: [] } });

  // 12. Rejected by admin
  O({ id: 'o12', no: no(1), customerId: 'c3', productId: 'p3', status: 'Rejected', createdAt: at(-9, '20:00'), preferredDate: d(-7), address: 'Jl. Raya Singaraja – Gilimanuk, Buleleng', notes: 'Villa di Buleleng.', review: { by: 'a1', at: at(-8, '09:00'), note: 'Lokasi di luar area layanan (Denpasar, Badung, Gianyar).' } });
  L('o12', -8, '09:00', 'a1', 'menolak pesanan — Lokasi di luar area layanan');

  const stockMoves = [
    { id: 'sm1', materialId: 'mt1', date: d(-15), qty: -1, type: 'Out', ref: no(2), by: 's2' },
    { id: 'sm2', materialId: 'mt4', date: d(-3), qty: -5, type: 'Out', ref: no(3), by: 's3' },
    { id: 'sm3', materialId: 'mt1', date: d(-1), qty: -3, type: 'Out', ref: no(4), by: 's1' },
    { id: 'sm4', materialId: 'mt6', date: d(-2), qty: 6, type: 'In', ref: 'PO-2207 Toko Kimia Jaya', by: 'a1' },
  ];

  return { users, products, materials, orders, activities, log: log.reverse(), stockMoves, seq: 13, invSeq: 7 };
}
