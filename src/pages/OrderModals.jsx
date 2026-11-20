import { useState } from 'react';
import { useStore, userName, materialById, productOf } from '../store.jsx';
import { Modal, Field, Note, PhotoInput, Icon } from '../ui.jsx';
import { totals } from '../booking.js';
import { rp, addDays, fmtDate } from '../format.js';
import { TODAY, SURVEY_TIMES } from '../data.js';

export function ReasonModal({ title, label, confirmLabel, required = true, danger, onConfirm, onClose, children, placeholder }) {
  const [v, setV] = useState('');
  return (
    <Modal
      title={title}
      onClose={onClose}
      footer={
        <>
          <button className="btn" onClick={onClose}>
            Batal
          </button>
          <button
            className={danger ? 'btn danger' : 'btn primary'}
            disabled={required && !v.trim()}
            onClick={() => {
              onConfirm(v.trim());
              onClose();
            }}
          >
            {confirmLabel}
          </button>
        </>
      }
    >
      {children}
      {label && (
        <Field label={label}>
          <textarea className="input" rows={3} value={v} placeholder={placeholder} onChange={(e) => setV(e.target.value)} autoFocus />
        </Field>
      )}
    </Modal>
  );
}

export function SurveyModal({ o, onClose }) {
  const { state, actions } = useStore();
  const managers = state.users.filter((u) => u.role === 'manager');
  const [f, setF] = useState({ date: o.survey?.date && o.survey.date >= TODAY ? o.survey.date : addDays(TODAY, 1), time: o.survey?.time || '10:00', managerId: o.survey?.managerId || managers[0].id, note: '' });
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });
  const sameDay = (mid) =>
    state.orders.filter((x) => x.id !== o.id && x.survey?.managerId === mid && x.survey.date === f.date && ['SurveyScheduled', 'SurveyConfirmed'].includes(x.status));
  const clash = sameDay(f.managerId).find((x) => x.survey.time === f.time);
  return (
    <Modal
      title={o.survey ? 'Jadwalkan ulang survei' : 'Buat jadwal survei'}
      onClose={onClose}
      footer={
        <>
          <button className="btn" onClick={onClose}>
            Batal
          </button>
          <button
            className="btn primary"
            disabled={!!clash}
            onClick={() => {
              actions.scheduleSurvey(o.id, f);
              onClose();
            }}
          >
            <Icon name="send" size={14} /> Kirim ke pelanggan
          </button>
        </>
      }
    >
      {o.survey?.customerNote && o.survey.status === 'RescheduleRequested' && (
        <Note tone="warn">
          Permintaan pelanggan: <i>“{o.survey.customerNote}”</i>
        </Note>
      )}
      <div className="form-grid" style={{ marginTop: 12 }}>
        <Field label="Tanggal survei">
          <input type="date" className="input" min={TODAY} value={f.date} onChange={set('date')} />
        </Field>
        <Field label="Jam">
          <select className="input" value={f.time} onChange={set('time')}>
            {SURVEY_TIMES.map((t) => (
              <option key={t}>{t}</option>
            ))}
          </select>
        </Field>
        <Field label="Manajer yang survei" span error={clash && `${userName(state, f.managerId)} sudah survei ${clash.no} pada jam ini.`}>
          <select className="input" value={f.managerId} onChange={set('managerId')}>
            {managers.map((m) => {
              const n = sameDay(m.id);
              return (
                <option key={m.id} value={m.id}>
                  {m.name} — {n.length ? `${n.length} survei: ${n.map((x) => x.survey.time).join(', ')}` : 'kosong'} pada {fmtDate(f.date)}
                </option>
              );
            })}
          </select>
        </Field>
        <Field label="Catatan untuk pelanggan (opsional)" span>
          <input className="input" value={f.note} onChange={set('note')} placeholder="mis. mohon siapkan akses ke unit outdoor" />
        </Field>
      </div>
      <Note>Pelanggan akan diminta menyetujui jadwal ini. Jika tidak cocok, pelanggan bisa meminta jadwal lain.</Note>
    </Modal>
  );
}

export function SurveyResultModal({ o, onClose }) {
  const { actions } = useStore();
  const [notes, setNotes] = useState('');
  const [photos, setPhotos] = useState([]);
  const ok = notes.trim() && photos.length > 0;
  return (
    <Modal
      title="Hasil survei"
      onClose={onClose}
      wide
      footer={
        <>
          <button className="btn" onClick={onClose}>
            Batal
          </button>
          <button
            className="btn primary"
            disabled={!ok}
            onClick={() => {
              actions.submitSurvey(o.id, { notes: notes.trim(), photos });
              onClose();
            }}
          >
            Simpan hasil survei
          </button>
        </>
      }
    >
      <div className="stack-sm">
        <Field label="Temuan & rekomendasi" hint="Kondisi, ukuran/jumlah, akses, risiko, perkiraan kebutuhan staf dan alat.">
          <textarea className="input" rows={5} value={notes} onChange={(e) => setNotes(e.target.value)} autoFocus />
        </Field>
        <Field label="Foto survei (minimal 1)">
          <PhotoInput value={photos} onChange={setPhotos} />
        </Field>
      </div>
    </Modal>
  );
}

export function InvoiceModal({ o, onClose }) {
  const { state, actions } = useStore();
  const prev = o.invoice;
  const [f, setF] = useState({ discount: prev?.discount || 0, taxPct: prev?.taxPct ?? 11, dueDate: prev?.dueDate || addDays(TODAY, 7), note: prev?.note || '' });
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });
  const inv = { ...f, discount: Number(f.discount) || 0, taxPct: Number(f.taxPct) };
  const tt = totals(o.offer.items, inv);
  return (
    <Modal
      title="Kirim penawaran & invoice ke pelanggan"
      onClose={onClose}
      wide
      footer={
        <>
          <button className="btn" onClick={onClose}>
            Batal
          </button>
          <button
            className="btn primary"
            disabled={tt.total <= 0}
            onClick={() => {
              actions.sendInvoice(o.id, inv);
              onClose();
            }}
          >
            <Icon name="send" size={14} /> Kirim ke {userName(state, o.customerId)}
          </button>
        </>
      }
    >
      <p className="muted small">Rincian biaya dari {userName(state, o.offer.by)} (hasil survei). Admin menambahkan diskon, pajak dan jatuh tempo.</p>
      <ItemsTable items={o.offer.items} invoice={inv} />
      <div className="form-grid" style={{ marginTop: 14 }}>
        <Field label="Diskon (Rp)">
          <input type="number" min={0} step={5000} className="input" value={f.discount} onChange={set('discount')} />
        </Field>
        <Field label="PPN">
          <select className="input" value={f.taxPct} onChange={set('taxPct')}>
            <option value={0}>Tanpa PPN</option>
            <option value={11}>PPN 11%</option>
          </select>
        </Field>
        <Field label="Jatuh tempo pembayaran">
          <input type="date" className="input" min={TODAY} value={f.dueDate} onChange={set('dueDate')} />
        </Field>
        <Field label="Catatan untuk pelanggan">
          <input className="input" value={f.note} onChange={set('note')} placeholder="mis. rekening pembayaran, termin" />
        </Field>
      </div>
    </Modal>
  );
}

export function ItemsTable({ items, invoice, compact }) {
  const tt = totals(items, invoice);
  return (
    <div className="table-scroll">
      <table className={compact ? 'table compact' : 'table compact boxed'}>
        <thead>
          <tr>
            <th>Uraian</th>
            <th className="num">Qty</th>
            <th className="num">Harga</th>
            <th className="num">Jumlah</th>
          </tr>
        </thead>
        <tbody>
          {items.map((i) => (
            <tr key={i.id}>
              <td>{i.desc}</td>
              <td className="num">
                {i.qty} {i.unit}
              </td>
              <td className="num">{rp(i.price)}</td>
              <td className="num">{rp(i.qty * i.price)}</td>
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr>
            <td colSpan={3}>Subtotal</td>
            <td className="num">{rp(tt.subtotal)}</td>
          </tr>
          {invoice && tt.discount > 0 && (
            <tr>
              <td colSpan={3}>Diskon</td>
              <td className="num">− {rp(tt.discount)}</td>
            </tr>
          )}
          {invoice && tt.taxPct > 0 && (
            <tr>
              <td colSpan={3}>PPN {tt.taxPct}%</td>
              <td className="num">{rp(tt.tax)}</td>
            </tr>
          )}
          {invoice && (
            <tr className="grand">
              <td colSpan={3}>Total</td>
              <td className="num">{rp(tt.total)}</td>
            </tr>
          )}
        </tfoot>
      </table>
    </div>
  );
}

export function ApproveInvoiceModal({ o, acts, onClose }) {
  const { state, actions } = useStore();
  const tt = totals(o.offer.items, o.invoice);
  return (
    <Modal
      title={`Setujui penawaran ${o.invoice.no}`}
      onClose={onClose}
      footer={
        <>
          <button className="btn" onClick={onClose}>
            Batal
          </button>
          <button
            className="btn approve"
            onClick={() => {
              actions.respondInvoice(o.id, true);
              onClose();
            }}
          >
            <Icon name="check" size={14} /> Setujui {rp(tt.total)}
          </button>
        </>
      }
    >
      <p>
        Dengan menyetujui, Anda menerima biaya <b>{rp(tt.total)}</b> untuk {productOf(state, o).name} dan jadwal pengerjaan berikut:
      </p>
      <ul className="plain-list">
        {acts.map((a) => (
          <li key={a.id}>
            <b>{fmtDate(a.date)}</b> — {a.title}
          </li>
        ))}
      </ul>
      <Note>Pembayaran jatuh tempo {fmtDate(o.invoice.dueDate)}.</Note>
    </Modal>
  );
}

export function PaymentModal({ o, onClose }) {
  const { actions } = useStore();
  const [f, setF] = useState({ method: 'Transfer', ref: '' });
  const tt = totals(o.offer.items, o.invoice);
  return (
    <Modal
      title="Catat pembayaran & tutup work order"
      onClose={onClose}
      footer={
        <>
          <button className="btn" onClick={onClose}>
            Batal
          </button>
          <button
            className="btn approve"
            onClick={() => {
              actions.closeOrder(o.id, f);
              onClose();
            }}
          >
            Tandai lunas & tutup
          </button>
        </>
      }
    >
      <div className="form-grid">
        <Field label="Jumlah">
          <input className="input" readOnly value={rp(tt.total)} />
        </Field>
        <Field label="Metode">
          <select className="input" value={f.method} onChange={(e) => setF({ ...f, method: e.target.value })}>
            <option>Transfer</option>
            <option>QRIS</option>
            <option>Tunai</option>
          </select>
        </Field>
        <Field label="Referensi / no. bukti" span>
          <input className="input" value={f.ref} onChange={(e) => setF({ ...f, ref: e.target.value })} placeholder="mis. BCA 2011-0932" />
        </Field>
      </div>
    </Modal>
  );
}

export function FinishModal({ a, onClose }) {
  const { state, actions } = useStore();
  const consumables = a.materials.filter((m) => materialById(state, m.materialId).kind === 'consumable');
  const tools = a.materials.filter((m) => materialById(state, m.materialId).kind === 'tool');
  const [notes, setNotes] = useState('');
  const [photos, setPhotos] = useState([]);
  const [usage, setUsage] = useState(consumables.map((m) => ({ materialId: m.materialId, qty: m.qty })));
  const setQty = (id, v) => setUsage(usage.map((u) => (u.materialId === id ? { ...u, qty: Math.max(0, Number(v) || 0) } : u)));
  const over = usage.find((u) => u.qty > materialById(state, u.materialId).stock);
  return (
    <Modal
      title={`Selesaikan: ${a.title}`}
      onClose={onClose}
      wide
      footer={
        <>
          <button className="btn" onClick={onClose}>
            Batal
          </button>
          <button
            className="btn approve"
            disabled={!notes.trim() || !!over}
            onClick={() => {
              actions.finishActivity(a.id, { notes: notes.trim(), photos, usage });
              onClose();
            }}
          >
            Selesai & kirim laporan
          </button>
        </>
      }
    >
      <div className="stack-sm">
        <Field label="Laporan pekerjaan">
          <textarea className="input" rows={3} value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Apa yang dikerjakan, temuan, saran untuk pelanggan" autoFocus />
        </Field>
        <Field label="Foto hasil">
          <PhotoInput value={photos} onChange={setPhotos} />
        </Field>
        {consumables.length > 0 && (
          <div>
            <div className="field-label">Pemakaian material habis pakai (dipotong dari stok)</div>
            <table className="table compact boxed" style={{ marginTop: 6 }}>
              <thead>
                <tr>
                  <th>Material</th>
                  <th className="num">Rencana</th>
                  <th className="num">Dipakai</th>
                  <th className="num">Stok</th>
                </tr>
              </thead>
              <tbody>
                {usage.map((u) => {
                  const m = materialById(state, u.materialId);
                  return (
                    <tr key={u.materialId}>
                      <td>{m.name}</td>
                      <td className="num">
                        {consumables.find((c) => c.materialId === u.materialId).qty} {m.unit}
                      </td>
                      <td className="num">
                        <input type="number" min={0} step="0.5" className="input qty" value={u.qty} onChange={(e) => setQty(u.materialId, e.target.value)} />
                      </td>
                      <td className={u.qty > m.stock ? 'num text-red' : 'num'}>{m.stock}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
        {tools.length > 0 && (
          <Note>
            Alat dikembalikan ke gudang: {tools.map((m) => `${materialById(state, m.materialId).name} (${m.qty})`).join(', ')}. Booking alat untuk shift ini otomatis selesai.
          </Note>
        )}
        {over && <Note tone="error">Pemakaian {materialById(state, over.materialId).name} melebihi stok. Hubungi admin untuk penyesuaian stok.</Note>}
      </div>
    </Modal>
  );
}

// Staff's own buttons on an activity
export function ActivityActions({ a, o }) {
  const { user, actions } = useStore();
  const [finish, setFinish] = useState(false);
  if (user.role !== 'staff' || !a.staffIds.includes(user.id) || !['Approved', 'InProgress'].includes(o.status)) return null;
  return (
    <>
      {a.status === 'Booked' && (
        <>
          <button className="btn primary small" onClick={() => actions.startActivity(a.id)}>
            <Icon name="play" size={12} /> Mulai kegiatan
          </button>
          {a.date > TODAY && <span className="small muted">Dijadwalkan {fmtDate(a.date)}</span>}
        </>
      )}
      {a.status === 'InProgress' && (
        <>
          <span className="small text-amber">Dimulai {a.report?.startedAt?.slice(11)}</span>
          <button className="btn approve small" onClick={() => setFinish(true)}>
            <Icon name="check" size={12} /> Selesaikan & lapor
          </button>
        </>
      )}
      {finish && <FinishModal a={a} onClose={() => setFinish(false)} />}
    </>
  );
}
