import { useState } from 'react';
import { useStore, userName, productOf, orderActivities } from '../store.jsx';
import { Link } from '../router.jsx';
import { PageHead, Stepper, ActivityItem, ProductIcon } from '../components.jsx';
import { Card, Badge, Note, Photos, Restricted, Icon, Avatar, Empty } from '../ui.jsx';
import { canSeeOrder, canCancel } from '../perm.js';
import { CUSTOMER_STATUS } from '../i18n.js';
import { fmtDate, rp } from '../format.js';
import { totals } from '../booking.js';
import OfferBuilder from './OfferBuilder.jsx';
import { ReasonModal, SurveyModal, SurveyResultModal, InvoiceModal, ItemsTable, ApproveInvoiceModal, PaymentModal, ActivityActions } from './OrderModals.jsx';

function NextStep({ o, acts, open }) {
  const { state, user, actions } = useStore();
  const role = user.role;
  const B = ({ m, children, tone = 'primary' }) => (
    <button className={`btn ${tone}`} onClick={() => open(m)}>
      {children}
    </button>
  );
  let msg = null;
  let btns = null;

  if (role === 'customer') {
    msg = CUSTOMER_STATUS[o.status];
    if (o.status === 'SurveyScheduled')
      btns = (
        <>
          <button className="btn approve" onClick={() => actions.respondSurvey(o.id, true)}>
            <Icon name="check" size={14} /> Setujui jadwal survei
          </button>
          <B m="reschedule" tone="">
            Minta jadwal lain
          </B>
        </>
      );
    if (o.status === 'AwaitingApproval')
      btns = (
        <>
          <B m="approveInvoice" tone="approve">
            <Icon name="check" size={14} /> Setujui penawaran & invoice
          </B>
          <B m="rejectInvoice" tone="danger">
            Tolak / minta revisi
          </B>
        </>
      );
  }

  if (role === 'admin') {
    const m = {
      Submitted: ['Tinjau pesanan: terima untuk dijadwalkan survei, atau tolak dengan alasan.', <><B m="accept"><Icon name="check" size={14} /> Terima pesanan</B><B m="reject" tone="danger">Tolak</B></>],
      WaitingSurvey: [o.survey?.status === 'RescheduleRequested' ? 'Pelanggan meminta jadwal survei lain.' : 'Buat jadwal survei dan pilih manajer yang akan datang.', <B m="survey"><Icon name="agenda" size={14} /> {o.survey ? 'Jadwalkan ulang' : 'Buat jadwal survei'}</B>],
      SurveyScheduled: ['Menunggu pelanggan menyetujui jadwal survei.', <B m="survey" tone="">Ubah jadwal</B>],
      SurveyConfirmed: [`Survei terjadwal ${fmtDate(o.survey?.date)} ${o.survey?.time} oleh ${userName(state, o.survey?.managerId)}.`, null],
      Surveyed: [o.offer?.adminNote ? 'Penawaran dikembalikan ke manajer untuk direvisi.' : 'Menunggu manajer menyusun penawaran.', null],
      OfferReady: ['Periksa rincian biaya dari manajer, lalu tambahkan diskon/PPN dan kirim ke pelanggan.', <><B m="invoice"><Icon name="send" size={14} /> Kirim penawaran & invoice</B><B m="returnOffer" tone="">Kembalikan ke manajer</B></>],
      AwaitingApproval: ['Menunggu persetujuan pelanggan.', null],
      OfferRejected: ['Pelanggan menolak penawaran. Menunggu revisi dari manajer.', null],
      Approved: ['Pekerjaan dijadwalkan. Staf akan memulai sesuai jadwal.', null],
      InProgress: ['Pekerjaan sedang berlangsung.', null],
      Completed: ['Semua kegiatan selesai. Catat pembayaran untuk menutup work order.', <B m="payment" tone="approve">Catat pembayaran & tutup</B>],
    }[o.status];
    if (m) [msg, btns] = m;
  }

  if (role === 'manager') {
    const mine = o.survey?.managerId === user.id;
    const who = o.survey ? (mine ? 'Anda' : userName(state, o.survey.managerId)) : null;
    const m = {
      Submitted: ['Menunggu tinjauan admin.', null],
      WaitingSurvey: ['Menunggu admin membuat jadwal survei.', null],
      SurveyScheduled: [`Survei untuk ${who} menunggu persetujuan pelanggan.`, null],
      SurveyConfirmed: [`Survei oleh ${who}: ${fmtDate(o.survey?.date)} ${o.survey?.time}. Catat temuan dan foto setelah survei.`, <B m="surveyResult"><Icon name="camera" size={14} /> Isi hasil survei</B>],
      Surveyed: [o.offer?.adminNote ? 'Admin mengembalikan penawaran — revisi sesuai catatan.' : 'Susun penawaran: rincian biaya dan kegiatan (tanggal, shift, staf, material).', <B m="offer">{o.offer ? 'Revisi penawaran' : 'Buat penawaran'}</B>],
      OfferReady: ['Penawaran sudah dikirim ke admin. Masih bisa diubah sebelum dikirim ke pelanggan.', <B m="offer" tone="">Ubah penawaran</B>],
      OfferRejected: ['Pelanggan menolak penawaran. Revisi lalu kirim lagi ke admin.', <B m="offer">Revisi penawaran</B>],
      AwaitingApproval: ['Menunggu persetujuan pelanggan.', null],
      Approved: ['Disetujui. Staf dan material sudah dibooking.', null],
      InProgress: ['Pekerjaan sedang berlangsung.', null],
      Completed: ['Pekerjaan selesai. Menunggu admin mencatat pembayaran.', null],
    }[o.status];
    if (m) [msg, btns] = m;
  }

  if (role === 'staff') {
    const mine = acts.filter((a) => a.staffIds.includes(user.id));
    msg = `Anda dibooking di ${mine.length} kegiatan pada work order ini. Mulai dan selesaikan dari daftar kegiatan.`;
  }

  if (!msg) msg = { Closed: 'Work order lunas dan ditutup.', Rejected: `Pesanan ditolak — ${o.review?.note || ''}`, Cancelled: 'Pesanan dibatalkan.' }[o.status];

  return (
    <Card title="Langkah berikutnya" className="next-step">
      <div className="ns-status">
        <Badge>{o.status}</Badge>
      </div>
      <p>{msg}</p>
      {btns && <div className="ns-actions">{btns}</div>}
      {role === 'customer' && canCancel(o) && (
        <button className="btn ghost small danger" onClick={() => open('cancel')}>
          Batalkan pesanan
        </button>
      )}
    </Card>
  );
}

export default function OrderDetail({ id }) {
  const { state, user, actions } = useStore();
  const [modal, setModal] = useState(null);
  const o = state.orders.find((x) => x.id === id);
  const back = (
    <Link to={user.role === 'staff' ? 'jobs' : 'orders'} className="back">
      <Icon name="back" size={14} /> {user.role === 'customer' ? 'Pesanan saya' : user.role === 'staff' ? 'Kembali' : 'Work order'}
    </Link>
  );
  if (!o || !canSeeOrder(state, user, o))
    return (
      <div className="page">
        {back}
        <Restricted>Work order ini tidak tersedia untuk {user.name}.</Restricted>
      </div>
    );

  const p = productOf(state, o);
  const cust = state.users.find((u) => u.id === o.customerId);
  const acts = orderActivities(state, o.id);
  const isCustomer = user.role === 'customer';
  const isStaff = user.role === 'staff';
  const showOffer = o.offer && !isStaff && (!isCustomer || o.invoice);
  const showActs = acts.length > 0 && (!isCustomer || o.invoice);
  const close = () => setModal(null);
  const timeline = state.log.filter((l) => l.orderId === o.id);

  return (
    <div className="page">
      <PageHead
        back={back}
        title={
          <span className="title-with-icon">
            <ProductIcon product={p} size={16} /> {o.no} · {p.name}
          </span>
        }
        sub={`${cust.name} · ${o.address}`}
        actions={<Badge>{o.status}</Badge>}
      />
      <Stepper status={o.status} />
      <div className="ns-mobile">
        <NextStep o={o} acts={acts} open={setModal} />
      </div>

      <div className="grid-2 wide-left">
        <div className="stack">
          <Card title="Detail pesanan">
            <dl className="dl">
              <dt>Layanan</dt>
              <dd>{p.name}</dd>
              <dt>Pelanggan</dt>
              <dd>
                {cust.name}
                {!isStaff && cust.phone && <span className="muted"> · {cust.phone}</span>}
              </dd>
              <dt>Alamat</dt>
              <dd>{o.address}</dd>
              <dt>Diinginkan</dt>
              <dd>{fmtDate(o.preferredDate)}</dd>
              <dt>Dibuat</dt>
              <dd>{o.createdAt}</dd>
              <dt>Kebutuhan</dt>
              <dd>{o.notes}</dd>
            </dl>
            <Photos photos={o.attachments} />
            {o.review?.note && !isCustomer && (
              <Note tone={o.status === 'Rejected' ? 'error' : 'info'}>
                Tinjauan {userName(state, o.review.by)}: {o.review.note}
              </Note>
            )}
          </Card>

          {o.survey && (
            <Card title="Survei" actions={<Badge>{o.survey.status}</Badge>}>
              <div className="survey-line">
                <Avatar name={userName(state, o.survey.managerId)} size={30} />
                <div>
                  <div className="strong">
                    {fmtDate(o.survey.date)} · {o.survey.time}
                  </div>
                  <div className="small muted">oleh {userName(state, o.survey.managerId)}</div>
                </div>
              </div>
              {o.survey.note && <Note>Catatan admin: {o.survey.note}</Note>}
              {o.survey.customerNote && <Note tone="warn">Permintaan pelanggan: {o.survey.customerNote}</Note>}
              {o.surveyResult && (
                <div className="survey-result">
                  <h4>Hasil survei</h4>
                  <p className="small muted">
                    {userName(state, o.surveyResult.by)} · {o.surveyResult.at}
                  </p>
                  <p>{o.surveyResult.notes}</p>
                  <Photos photos={o.surveyResult.photos} />
                </div>
              )}
            </Card>
          )}

          {showOffer && (
            <Card
              title={o.invoice ? `Penawaran & invoice ${o.invoice.no}` : 'Penawaran (draf manajer)'}
              actions={o.invoice ? <Badge>{o.invoice.status}</Badge> : <Badge tone="amber">Belum dikirim</Badge>}
            >
              <ItemsTable items={o.offer.items} invoice={o.invoice} />
              {o.invoice && (
                <dl className="dl" style={{ marginTop: 12 }}>
                  <dt>Jatuh tempo</dt>
                  <dd>{fmtDate(o.invoice.dueDate)}</dd>
                  <dt>Dikirim</dt>
                  <dd>
                    {o.invoice.sentAt} oleh {userName(state, o.invoice.sentBy)}
                  </dd>
                  {o.invoice.note && (
                    <>
                      <dt>Catatan</dt>
                      <dd>{o.invoice.note}</dd>
                    </>
                  )}
                  {o.invoice.payment && (
                    <>
                      <dt>Pembayaran</dt>
                      <dd>
                        {o.invoice.payment.method} {o.invoice.payment.ref} · {o.invoice.paidAt}
                      </dd>
                    </>
                  )}
                </dl>
              )}
              {!isCustomer && o.offer.notes && <Note>Catatan manajer: {o.offer.notes}</Note>}
              {!isCustomer && o.offer.adminNote && <Note tone="warn">Dikembalikan admin: {o.offer.adminNote}</Note>}
              {o.invoice?.rejectReason && <Note tone="error">Ditolak pelanggan: {o.invoice.rejectReason}</Note>}
            </Card>
          )}

          {showActs && (
            <Card title={`Kegiatan (${acts.length})`} pad={false}>
              {acts.some((a) => a.status === 'Draft') && !isCustomer && (
                <p className="pad small muted">Status draf: staf & alat sudah ditahan, menjadi “Dibooking” setelah pelanggan menyetujui.</p>
              )}
              {acts.map((a) => (
                <ActivityItem key={a.id} a={a}>
                  <ActivityActions a={a} o={o} />
                </ActivityItem>
              ))}
            </Card>
          )}
        </div>

        <div className="stack">
          <div className="ns-desktop">
            <NextStep o={o} acts={acts} open={setModal} />
          </div>
          {showOffer && o.invoice && (
            <div className="total-tile">
              <span>Total tagihan</span>
              <b>{rp(totals(o.offer.items, o.invoice).total)}</b>
            </div>
          )}
          <Card title="Riwayat" pad={false}>
            {timeline.length === 0 ? (
              <Empty>Belum ada riwayat.</Empty>
            ) : (
              <ul className="timeline">
                {timeline.map((l) => (
                  <li key={l.id}>
                    <Avatar name={userName(state, l.by)} size={24} />
                    <div>
                      <div>
                        <b>{userName(state, l.by)}</b> {l.text}
                      </div>
                      <div className="small muted">{l.at}</div>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </div>
      </div>

      {modal === 'accept' && <ReasonModal title="Terima pesanan" label="Catatan (opsional)" required={false} confirmLabel="Terima — menunggu survei" onConfirm={(v) => actions.reviewOrder(o.id, true, v)} onClose={close} />}
      {modal === 'reject' && <ReasonModal title="Tolak pesanan" label="Alasan penolakan (dikirim ke pelanggan)" confirmLabel="Tolak pesanan" danger onConfirm={(v) => actions.reviewOrder(o.id, false, v)} onClose={close} />}
      {modal === 'survey' && <SurveyModal o={o} onClose={close} />}
      {modal === 'reschedule' && <ReasonModal title="Minta jadwal survei lain" label="Kapan Anda bisa?" placeholder="mis. Sabtu pagi atau setelah jam 3 sore" confirmLabel="Kirim permintaan" onConfirm={(v) => actions.respondSurvey(o.id, false, v)} onClose={close} />}
      {modal === 'surveyResult' && <SurveyResultModal o={o} onClose={close} />}
      {modal === 'offer' && <OfferBuilder o={o} onClose={close} />}
      {modal === 'returnOffer' && <ReasonModal title="Kembalikan penawaran ke manajer" label="Apa yang perlu direvisi?" confirmLabel="Kembalikan" onConfirm={(v) => actions.returnOffer(o.id, v)} onClose={close} />}
      {modal === 'invoice' && <InvoiceModal o={o} onClose={close} />}
      {modal === 'approveInvoice' && <ApproveInvoiceModal o={o} acts={acts} onClose={close} />}
      {modal === 'rejectInvoice' && <ReasonModal title="Tolak penawaran" label="Alasan / apa yang ingin diubah" confirmLabel="Tolak penawaran" danger onConfirm={(v) => actions.respondInvoice(o.id, false, v)} onClose={close} />}
      {modal === 'payment' && <PaymentModal o={o} onClose={close} />}
      {modal === 'cancel' && <ReasonModal title="Batalkan pesanan" label="Alasan pembatalan" confirmLabel="Batalkan pesanan" danger onConfirm={(v) => actions.cancelOrder(o.id, v)} onClose={close} />}
    </div>
  );
}
