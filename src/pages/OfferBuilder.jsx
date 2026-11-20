import { useMemo, useState } from 'react';
import { useStore, productOf, orderActivities, materialById, newId } from '../store.jsx';
import { Modal, Field, Note, Icon, Avatar, cx } from '../ui.jsx';
import { holdingActivities, staffConflict, toolInUse, consumableReserved, totals } from '../booking.js';
import { rp, addDays } from '../format.js';
import { TODAY, SHIFTS } from '../data.js';

function initial(state, o) {
  if (o.offer) {
    return {
      items: o.offer.items.map((i) => ({ ...i })),
      acts: orderActivities(state, o.id).map((a) => ({ ...a, staffIds: [...a.staffIds], materials: a.materials.map((m) => ({ ...m })) })),
      notes: o.offer.notes || '',
    };
  }
  const p = productOf(state, o);
  const date = o.preferredDate && o.preferredDate > TODAY ? o.preferredDate : addDays(TODAY, 1);
  return {
    items: p.template.items.map((i) => ({ id: newId('i'), qty: 1, ...i })),
    acts: [{ id: newId('ac'), title: p.template.activity.title, date, shift: 'FD', staffIds: [], materials: p.template.activity.materials.map((m) => ({ ...m })) }],
    notes: '',
  };
}

function ActivityEditor({ act, index, pool, skill, onChange, onRemove, others }) {
  const { state } = useStore();
  const staff = state.users.filter((u) => u.role === 'staff').sort((a, b) => (b.skills.includes(skill) ? 1 : 0) - (a.skills.includes(skill) ? 1 : 0));
  const set = (k, v) => onChange({ ...act, [k]: v });
  const orderNo = (a) => (a.orderId ? state.orders.find((o) => o.id === a.orderId).no : 'kegiatan lain di penawaran ini');

  const toggleStaff = (id) => set('staffIds', act.staffIds.includes(id) ? act.staffIds.filter((x) => x !== id) : [...act.staffIds, id]);
  const setMat = (i, patch) => set('materials', act.materials.map((m, j) => (j === i ? { ...m, ...patch } : m)));
  const used = act.materials.map((m) => m.materialId);
  const firstFree = state.materials.find((m) => !used.includes(m.id));

  // when date/shift changes, drop staff that are now double-booked
  const setSlot = (patch) => {
    const next = { ...act, ...patch };
    next.staffIds = next.staffIds.filter((id) => !staffConflict(pool, id, next, act.id));
    onChange(next);
  };

  return (
    <div className="act-editor">
      <div className="ae-head">
        <span className="ae-num">{index + 1}</span>
        <input className="input" value={act.title} onChange={(e) => set('title', e.target.value)} placeholder="Nama kegiatan" aria-label="Nama kegiatan" />
        {others > 0 && (
          <button className="icon-btn" onClick={onRemove} aria-label="Hapus kegiatan" type="button">
            <Icon name="trash" />
          </button>
        )}
      </div>
      <div className="ae-grid">
        <Field label="Tanggal">
          <input type="date" className="input" min={TODAY} value={act.date} onChange={(e) => setSlot({ date: e.target.value })} />
        </Field>
        <Field label="Shift">
          <select className="input" value={act.shift} onChange={(e) => setSlot({ shift: e.target.value })}>
            {Object.entries(SHIFTS).map(([k, s]) => (
              <option key={k} value={k}>
                {s.label} ({s.time})
              </option>
            ))}
          </select>
        </Field>
      </div>

      <div className="field-label">Staf yang bertugas</div>
      <div className="staff-pick">
        {staff.map((s) => {
          const c = staffConflict(pool, s.id, act, act.id);
          const on = act.staffIds.includes(s.id);
          return (
            <button
              type="button"
              key={s.id}
              className={cx('sp-item', on && 'on', c && 'busy')}
              disabled={!!c}
              onClick={() => toggleStaff(s.id)}
              title={c ? `Sudah dibooking: ${orderNo(c)} — ${c.title}` : ''}
            >
              <Avatar name={s.name} size={24} />
              <span className="sp-text">
                <span className="sp-name">{s.name}</span>
                <span className="sp-sub">{c ? `Dibooking ${orderNo(c)} · ${SHIFTS[c.shift].short}` : s.skills.join(', ') + (s.skills.includes(skill) ? ' ✓' : '')}</span>
              </span>
              {on && <Icon name="check" size={14} />}
            </button>
          );
        })}
      </div>

      <div className="field-label" style={{ marginTop: 10 }}>
        Material & alat
      </div>
      <table className="table compact boxed">
        <thead>
          <tr>
            <th>Material</th>
            <th className="num">Qty</th>
            <th>Ketersediaan</th>
            <th />
          </tr>
        </thead>
        <tbody>
          {act.materials.map((x, i) => {
            const m = materialById(state, x.materialId);
            let avail;
            let bad = false;
            if (m.kind === 'tool') {
              avail = m.stock - toolInUse(pool, m.id, act, act.id);
              bad = x.qty > avail;
            } else {
              avail = m.stock - consumableReserved(pool, m.id, [act.id]);
              bad = x.qty > avail;
            }
            return (
              <tr key={i}>
                <td>
                  <select className="input" value={x.materialId} onChange={(e) => setMat(i, { materialId: e.target.value })}>
                    {['consumable', 'tool'].map((kind) => (
                      <optgroup key={kind} label={kind === 'tool' ? 'Alat (dibooking per shift)' : 'Habis pakai (stok)'}>
                        {state.materials
                          .filter((mm) => mm.kind === kind && (mm.id === x.materialId || !used.includes(mm.id)))
                          .map((mm) => (
                            <option key={mm.id} value={mm.id}>
                              {mm.name}
                            </option>
                          ))}
                      </optgroup>
                    ))}
                  </select>
                </td>
                <td className="num">
                  <input type="number" min={0} step={m.kind === 'tool' ? 1 : 0.5} className="input qty" value={x.qty} onChange={(e) => setMat(i, { qty: Math.max(0, Number(e.target.value) || 0) })} />
                  <span className="small muted"> {m.unit}</span>
                </td>
                <td className={cx('small', bad ? (m.kind === 'tool' ? 'text-red' : 'text-amber') : 'muted')}>
                  {m.kind === 'tool' ? `${Math.max(avail, 0)} dari ${m.stock} bebas di slot ini` : `${avail} ${m.unit} tersedia (stok ${m.stock})`}
                  {bad && (m.kind === 'tool' ? ' — tidak cukup' : ' — perlu restock')}
                </td>
                <td className="right">
                  <button type="button" className="icon-btn" onClick={() => set('materials', act.materials.filter((_, j) => j !== i))} aria-label="Hapus material">
                    <Icon name="x" size={14} />
                  </button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
      {firstFree && (
        <button type="button" className="btn ghost small" onClick={() => set('materials', [...act.materials, { materialId: firstFree.id, qty: 1 }])}>
          <Icon name="plus" size={14} /> Tambah material
        </button>
      )}
    </div>
  );
}

export default function OfferBuilder({ o, onClose }) {
  const { state, actions } = useStore();
  const p = productOf(state, o);
  const [f, setF] = useState(() => initial(state, o));
  const existing = useMemo(() => holdingActivities(state, o.id), [state, o.id]);
  const tt = totals(f.items);

  const setItem = (id, patch) => setF({ ...f, items: f.items.map((i) => (i.id === id ? { ...i, ...patch } : i)) });
  const setAct = (id, next) => setF({ ...f, acts: f.acts.map((a) => (a.id === id ? next : a)) });

  const addMaterialCosts = () => {
    const sum = {};
    for (const a of f.acts)
      for (const x of a.materials) {
        const m = materialById(state, x.materialId);
        if (m.kind === 'consumable') sum[m.id] = (sum[m.id] || 0) + x.qty;
      }
    const extra = Object.entries(sum)
      .map(([id, qty]) => ({ m: materialById(state, id), qty }))
      .filter(({ m }) => !f.items.some((i) => i.desc === m.name))
      .map(({ m, qty }) => ({ id: newId('i'), desc: m.name, qty, unit: m.unit, price: m.price }));
    setF({ ...f, items: [...f.items, ...extra] });
  };

  const errors = [];
  if (!f.items.some((i) => i.desc && i.qty > 0)) errors.push('Isi minimal satu rincian biaya.');
  f.acts.forEach((a, i) => {
    const pool = [...existing, ...f.acts.filter((x) => x.id !== a.id)];
    if (!a.title.trim()) errors.push(`Kegiatan ${i + 1}: nama belum diisi.`);
    if (!a.staffIds.length) errors.push(`Kegiatan ${i + 1}: pilih minimal satu staf.`);
    if (a.date < TODAY) errors.push(`Kegiatan ${i + 1}: tanggal sudah lewat.`);
    for (const x of a.materials) {
      const m = materialById(state, x.materialId);
      if (m.kind === 'tool' && x.qty > m.stock - toolInUse(pool, m.id, a, a.id)) errors.push(`Kegiatan ${i + 1}: ${m.name} tidak cukup di slot tersebut.`);
    }
  });

  const save = () => {
    actions.saveOffer(o.id, { items: f.items.filter((i) => i.desc && i.qty > 0), notes: f.notes }, f.acts);
    onClose();
  };

  return (
    <Modal
      title={`${o.offer ? 'Revisi' : 'Buat'} penawaran · ${o.no} ${p.name}`}
      onClose={onClose}
      wide
      xl
      footer={
        <>
          <span className="foot-total">
            Subtotal <b>{rp(tt.subtotal)}</b> · {f.acts.length} kegiatan
          </span>
          <button className="btn" onClick={onClose}>
            Batal
          </button>
          <button className="btn primary" disabled={errors.length > 0} onClick={save} title={errors.join('\n')}>
            <Icon name="send" size={14} /> Kirim ke admin
          </button>
        </>
      }
    >
      {o.offer?.adminNote && (
        <Note tone="warn">
          Catatan admin: <i>“{o.offer.adminNote}”</i>
        </Note>
      )}
      {o.invoice?.rejectReason && (
        <Note tone="error">
          Alasan pelanggan menolak: <i>“{o.invoice.rejectReason}”</i>
        </Note>
      )}

      <h4 className="ob-title">1. Rincian biaya</h4>
      <div className="table-scroll">
        <table className="table compact boxed items-edit">
          <thead>
            <tr>
              <th>Uraian</th>
              <th className="num">Qty</th>
              <th>Satuan</th>
              <th className="num">Harga satuan</th>
              <th className="num">Jumlah</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {f.items.map((i) => (
              <tr key={i.id}>
                <td>
                  <input className="input" value={i.desc} onChange={(e) => setItem(i.id, { desc: e.target.value })} aria-label="Uraian" />
                </td>
                <td className="num">
                  <input type="number" min={0} className="input qty" value={i.qty} onChange={(e) => setItem(i.id, { qty: Math.max(0, Number(e.target.value) || 0) })} aria-label="Qty" />
                </td>
                <td>
                  <input className="input unit" value={i.unit} onChange={(e) => setItem(i.id, { unit: e.target.value })} aria-label="Satuan" />
                </td>
                <td className="num">
                  <input type="number" min={0} step={5000} className="input price" value={i.price} onChange={(e) => setItem(i.id, { price: Math.max(0, Number(e.target.value) || 0) })} aria-label="Harga" />
                </td>
                <td className="num">{rp(i.qty * i.price)}</td>
                <td className="right">
                  <button type="button" className="icon-btn" onClick={() => setF({ ...f, items: f.items.filter((x) => x.id !== i.id) })} aria-label="Hapus baris">
                    <Icon name="x" size={14} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr>
              <td colSpan={4}>Subtotal (sebelum diskon & pajak — diatur admin)</td>
              <td className="num">{rp(tt.subtotal)}</td>
              <td />
            </tr>
          </tfoot>
        </table>
      </div>
      <div className="row-actions" style={{ justifyContent: 'flex-start', marginTop: 6 }}>
        <button type="button" className="btn ghost small" onClick={() => setF({ ...f, items: [...f.items, { id: newId('i'), desc: '', qty: 1, unit: 'unit', price: 0 }] })}>
          <Icon name="plus" size={14} /> Tambah baris
        </button>
        <button type="button" className="btn ghost small" onClick={addMaterialCosts}>
          <Icon name="box" size={14} /> Tambah biaya material habis pakai
        </button>
      </div>

      <h4 className="ob-title">2. Kegiatan, staf & material</h4>
      <p className="small muted">Staf yang sudah dibooking di shift yang sama tidak bisa dipilih. Kegiatan di penawaran ini langsung menahan staf dan alat sampai pelanggan memutuskan.</p>
      <div className="stack-sm">
        {f.acts.map((a, i) => (
          <ActivityEditor
            key={a.id}
            act={a}
            index={i}
            skill={p.template.activity.skill}
            pool={[...existing, ...f.acts.filter((x) => x.id !== a.id)]}
            others={f.acts.length - 1}
            onChange={(next) => setAct(a.id, next)}
            onRemove={() => setF({ ...f, acts: f.acts.filter((x) => x.id !== a.id) })}
          />
        ))}
      </div>
      <button
        type="button"
        className="btn small"
        style={{ marginTop: 8 }}
        onClick={() => {
          const last = f.acts[f.acts.length - 1];
          setF({ ...f, acts: [...f.acts, { id: newId('ac'), title: `${p.template.activity.title} (hari ${f.acts.length + 1})`, date: addDays(last?.date || TODAY, 1), shift: last?.shift || 'FD', staffIds: [], materials: (last?.materials || []).map((m) => ({ ...m })) }] });
        }}
      >
        <Icon name="plus" size={14} /> Tambah kegiatan
      </button>

      <h4 className="ob-title">3. Catatan</h4>
      <textarea className="input" rows={2} value={f.notes} onChange={(e) => setF({ ...f, notes: e.target.value })} placeholder="Catatan untuk admin (tidak terlihat oleh pelanggan)" />
      {errors.length > 0 && (
        <Note tone="warn">
          {errors.map((e) => (
            <div key={e}>• {e}</div>
          ))}
        </Note>
      )}
    </Modal>
  );
}
