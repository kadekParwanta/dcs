import { useState } from 'react';
import { useStore, userName, materialById } from '../store.jsx';
import { Link } from '../router.jsx';
import { PageHead } from '../components.jsx';
import { Card, Badge, Tabs, Modal, Field, Note, Stat, Icon, Empty } from '../ui.jsx';
import { materialSummary, holdingActivities } from '../booking.js';
import { fmtDate, rp } from '../format.js';
import { SHIFTS } from '../data.js';

function MoveModal({ m, mode, onClose }) {
  const { actions } = useStore();
  const [qty, setQty] = useState(mode === 'in' ? 10 : m.stock);
  const [ref, setRef] = useState('');
  const delta = mode === 'in' ? Number(qty) : Number(qty) - m.stock;
  const ok = ref.trim() && (mode === 'in' ? delta > 0 : delta !== 0 && Number(qty) >= 0);
  return (
    <Modal
      title={`${mode === 'in' ? 'Stok masuk' : 'Penyesuaian stok'}: ${m.name}`}
      onClose={onClose}
      footer={
        <>
          <button className="btn" onClick={onClose}>
            Batal
          </button>
          <button
            className="btn primary"
            disabled={!ok}
            onClick={() => {
              actions.moveStock(m.id, delta, mode === 'in' ? 'In' : 'Adjust', ref.trim());
              onClose();
            }}
          >
            Simpan
          </button>
        </>
      }
    >
      <div className="form-grid">
        <Field label={mode === 'in' ? `Jumlah masuk (${m.unit})` : `Stok fisik sekarang (${m.unit})`} hint={`Stok tercatat: ${m.stock} ${m.unit}`}>
          <input type="number" min={0} className="input" value={qty} onChange={(e) => setQty(e.target.value)} autoFocus />
        </Field>
        <Field label={mode === 'in' ? 'No. PO / pemasok' : 'Alasan'}>
          <input className="input" value={ref} onChange={(e) => setRef(e.target.value)} placeholder={mode === 'in' ? 'PO-2210 Toko Kimia Jaya' : 'Stock opname / rusak / hilang'} />
        </Field>
      </div>
      {mode === 'adjust' && delta !== 0 && <Note tone="warn">Selisih {delta > 0 ? '+' : ''}{delta} {m.unit} akan dicatat sebagai penyesuaian.</Note>}
    </Modal>
  );
}

function AddMaterial({ onClose }) {
  const { actions } = useStore();
  const [f, setF] = useState({ code: '', name: '', kind: 'consumable', unit: 'pcs', stock: 0, min: 0, price: 0 });
  const set = (k, num) => (e) => setF({ ...f, [k]: num ? Number(e.target.value) || 0 : e.target.value });
  return (
    <Modal
      title="Tambah material"
      onClose={onClose}
      footer={
        <>
          <button className="btn" onClick={onClose}>
            Batal
          </button>
          <button
            className="btn primary"
            disabled={!f.name.trim() || !f.code.trim()}
            onClick={() => {
              actions.addMaterial(f);
              onClose();
            }}
          >
            Simpan
          </button>
        </>
      }
    >
      <div className="form-grid">
        <Field label="Kode">
          <input className="input" value={f.code} onChange={set('code')} placeholder="CH-008" />
        </Field>
        <Field label="Jenis">
          <select className="input" value={f.kind} onChange={set('kind')}>
            <option value="consumable">Habis pakai (dipotong dari stok)</option>
            <option value="tool">Alat (dibooking per shift)</option>
          </select>
        </Field>
        <Field label="Nama" span>
          <input className="input" value={f.name} onChange={set('name')} />
        </Field>
        <Field label="Satuan">
          <input className="input" value={f.unit} onChange={set('unit')} />
        </Field>
        <Field label={f.kind === 'tool' ? 'Jumlah unit dimiliki' : 'Stok awal'}>
          <input type="number" min={0} className="input" value={f.stock} onChange={set('stock', true)} />
        </Field>
        {f.kind === 'consumable' && (
          <>
            <Field label="Stok minimum">
              <input type="number" min={0} className="input" value={f.min} onChange={set('min', true)} />
            </Field>
            <Field label="Harga per satuan">
              <input type="number" min={0} className="input" value={f.price} onChange={set('price', true)} />
            </Field>
          </>
        )}
      </div>
    </Modal>
  );
}

export default function Materials() {
  const { state, user } = useStore();
  const [tab, setTab] = useState('stock');
  const [modal, setModal] = useState(null);
  const canEdit = user.role === 'admin';
  const rows = state.materials.map((m) => ({ m, ...materialSummary(state, m) }));
  const low = rows.filter((r) => r.low);
  const upcoming = holdingActivities(state)
    .filter((a) => a.status !== 'Done' && a.materials.length)
    .sort((a, b) => (a.date + a.shift).localeCompare(b.date + b.shift));

  const table = (kind) => (
    <div className="table-scroll">
      <table className="table">
        <thead>
          <tr>
            <th>Kode</th>
            <th>Nama</th>
            {kind === 'consumable' ? (
              <>
                <th className="num">Stok fisik</th>
                <th className="num">Dipesan kegiatan</th>
                <th className="num">Tersedia</th>
                <th className="num">Min.</th>
                <th className="num">Harga</th>
              </>
            ) : (
              <>
                <th className="num">Unit dimiliki</th>
                <th className="num">Booking mendatang</th>
              </>
            )}
            {canEdit && <th />}
          </tr>
        </thead>
        <tbody>
          {rows
            .filter((r) => r.m.kind === kind)
            .map(({ m, reserved, available, low }) => (
              <tr key={m.id}>
                <td className="mono small">{m.code}</td>
                <td>
                  {m.name} {low && <Badge tone="red">Stok menipis</Badge>}
                </td>
                {kind === 'consumable' ? (
                  <>
                    <td className="num">
                      {m.stock} {m.unit}
                    </td>
                    <td className="num">{reserved || '—'}</td>
                    <td className={low ? 'num text-red strong' : 'num strong'}>{available}</td>
                    <td className="num muted">{m.min}</td>
                    <td className="num">{rp(m.price)}</td>
                  </>
                ) : (
                  <>
                    <td className="num">
                      {m.stock} {m.unit}
                    </td>
                    <td className="num">{reserved ? `${reserved} kegiatan` : '—'}</td>
                  </>
                )}
                {canEdit && (
                  <td className="right">
                    <div className="row-actions">
                      {kind === 'consumable' && (
                        <button className="btn small" onClick={() => setModal({ m, mode: 'in' })}>
                          Stok masuk
                        </button>
                      )}
                      <button className="btn small ghost" onClick={() => setModal({ m, mode: 'adjust' })}>
                        Penyesuaian
                      </button>
                    </div>
                  </td>
                )}
              </tr>
            ))}
        </tbody>
      </table>
    </div>
  );

  return (
    <div className="page">
      <PageHead
        title="Material & stok"
        sub="Habis pakai: stok dipesan saat penawaran dibuat dan dipotong saat kegiatan selesai. Alat: dibooking per shift lalu kembali ke gudang."
        actions={
          canEdit && (
            <button className="btn primary" onClick={() => setModal({ add: true })}>
              <Icon name="plus" size={14} /> Tambah material
            </button>
          )
        }
      />
      <div className="stats">
        <Stat label="Material habis pakai" value={rows.filter((r) => r.m.kind === 'consumable').length} />
        <Stat label="Jenis alat" value={rows.filter((r) => r.m.kind === 'tool').length} />
        <Stat label="Stok menipis" value={low.length} sub={low.map((r) => r.m.name).join(', ') || 'Aman'} tone={low.length ? 'amber' : undefined} />
        <Stat label="Kegiatan memakai material" value={upcoming.length} sub="belum selesai" />
      </div>
      <Tabs
        active={tab}
        onChange={setTab}
        tabs={[
          { key: 'stock', label: 'Stok' },
          { key: 'plan', label: 'Kebutuhan terjadwal', count: upcoming.length },
          { key: 'moves', label: 'Mutasi stok', count: state.stockMoves.length },
        ]}
      />
      {tab === 'stock' && (
        <>
          <Card title="Habis pakai" pad={false}>
            {table('consumable')}
          </Card>
          <Card title="Alat (non habis pakai)" pad={false}>
            {table('tool')}
          </Card>
        </>
      )}
      {tab === 'plan' && (
        <Card pad={false}>
          {upcoming.length === 0 ? (
            <Empty>Tidak ada kebutuhan material terjadwal.</Empty>
          ) : (
            <div className="table-scroll">
              <table className="table">
                <thead>
                  <tr>
                    <th>Tanggal</th>
                    <th>Work order · kegiatan</th>
                    <th>Material</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {upcoming.map((a) => {
                    const o = state.orders.find((x) => x.id === a.orderId);
                    return (
                      <tr key={a.id}>
                        <td className="nowrap">
                          {fmtDate(a.date)}
                          <div className="small muted">{SHIFTS[a.shift].label}</div>
                        </td>
                        <td>
                          <Link to={'orders/' + o.id}>{o.no}</Link> · {a.title}
                        </td>
                        <td className="small">
                          {a.materials.map((x) => {
                            const m = materialById(state, x.materialId);
                            return (
                              <div key={x.materialId}>
                                {m.name}: {x.qty} {m.unit} {m.kind === 'tool' && <span className="muted">(booking)</span>}
                              </div>
                            );
                          })}
                        </td>
                        <td>
                          <Badge>{a.status}</Badge>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      )}
      {tab === 'moves' && (
        <Card pad={false}>
          <div className="table-scroll">
            <table className="table">
              <thead>
                <tr>
                  <th>Tanggal</th>
                  <th>Material</th>
                  <th>Jenis</th>
                  <th className="num">Qty</th>
                  <th>Referensi</th>
                  <th>Oleh</th>
                </tr>
              </thead>
              <tbody>
                {state.stockMoves.map((s) => {
                  const m = materialById(state, s.materialId);
                  return (
                    <tr key={s.id}>
                      <td className="nowrap">{fmtDate(s.date)}</td>
                      <td>{m.name}</td>
                      <td>
                        <Badge>{s.type}</Badge>
                      </td>
                      <td className={s.qty < 0 ? 'num text-red' : 'num text-green'}>
                        {s.qty > 0 ? '+' : ''}
                        {s.qty} {m.unit}
                      </td>
                      <td>{s.ref}</td>
                      <td>{userName(state, s.by)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>
      )}
      {modal?.add && <AddMaterial onClose={() => setModal(null)} />}
      {modal?.m && <MoveModal m={modal.m} mode={modal.mode} onClose={() => setModal(null)} />}
    </div>
  );
}
