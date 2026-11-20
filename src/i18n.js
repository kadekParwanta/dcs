// Internal status keys stay in English (used by the logic); this maps them to Indonesian labels.
const LABELS = {
  // Order status
  Submitted: 'Pesanan baru',
  WaitingSurvey: 'Menunggu jadwal survei',
  SurveyScheduled: 'Survei dijadwalkan',
  SurveyConfirmed: 'Survei disetujui',
  Surveyed: 'Survei selesai',
  OfferReady: 'Penawaran siap',
  AwaitingApproval: 'Menunggu persetujuan',
  OfferRejected: 'Penawaran ditolak',
  Approved: 'Disetujui',
  InProgress: 'Dikerjakan',
  Completed: 'Pekerjaan selesai',
  Closed: 'Lunas & ditutup',
  Rejected: 'Ditolak',
  Cancelled: 'Dibatalkan',
  // Activity status
  Draft: 'Draf (ditahan)',
  Booked: 'Dibooking',
  Done: 'Selesai',
  // Survey / invoice
  Proposed: 'Diusulkan',
  Confirmed: 'Disetujui',
  RescheduleRequested: 'Minta jadwal ulang',
  Sent: 'Terkirim',
  Paid: 'Lunas',
  // Materials
  consumable: 'Habis pakai',
  tool: 'Alat (dibooking)',
  In: 'Masuk',
  Out: 'Keluar',
  Adjust: 'Penyesuaian',
};

export const t = (key) => LABELS[key] ?? key;

// Plain-language wording of each status, as seen by the customer
export const CUSTOMER_STATUS = {
  Submitted: 'Pesanan Anda sedang ditinjau admin.',
  WaitingSurvey: 'Pesanan diterima. Admin sedang menyiapkan jadwal survei.',
  SurveyScheduled: 'Jadwal survei sudah diusulkan — mohon disetujui.',
  SurveyConfirmed: 'Survei terjadwal. Manajer kami akan datang sesuai jadwal.',
  Surveyed: 'Survei selesai. Penawaran sedang disusun.',
  OfferReady: 'Penawaran sedang diperiksa admin.',
  AwaitingApproval: 'Penawaran & invoice sudah dikirim — mohon ditinjau dan disetujui.',
  OfferRejected: 'Anda menolak penawaran. Tim kami sedang merevisi.',
  Approved: 'Disetujui. Pekerjaan sudah dijadwalkan.',
  InProgress: 'Pekerjaan sedang berlangsung.',
  Completed: 'Pekerjaan selesai. Menunggu konfirmasi pembayaran.',
  Closed: 'Selesai dan lunas. Terima kasih!',
  Rejected: 'Pesanan tidak dapat kami proses.',
  Cancelled: 'Pesanan dibatalkan.',
};
