import { useState } from 'react';
import { useStore } from '../store.jsx';
import { navigate } from '../router.jsx';
import { PageHead, ProductIcon } from '../components.jsx';
import { Modal, Field, PhotoInput, Badge, Note } from '../ui.jsx';
import { rp, addDays } from '../format.js';
import { TODAY } from '../data.js';

function PlaceOrder({ product, onClose }) {
  const { user, actions } = useStore();
  const [f, setF] = useState({ address: user.address || '', preferredDate: addDays(TODAY, 3), notes: '', attachments: [] });
  const [err, setErr] = useState(null);
  const set = (k) => (e) => setF({ ...f, [k]: e.target ? e.target.value : e });
  const submit = () => {
    if (!f.address.trim() || !f.notes.trim()) return setErr('Alamat dan deskripsi kebutuhan wajib diisi.');
    const id = actions.placeOrder({ productId: product.id, ...f });
    onClose();
    navigate('orders/' + id);
  };
  return (
    <Modal
      title={`Pesan: ${product.name}`}
      onClose={onClose}
      wide
      footer={
        <>
          <button className="btn" onClick={onClose}>
            Batal
          </button>
          <button className="btn primary" onClick={submit}>
            Kirim pesanan
          </button>
        </>
      }
    >
      <div className="form-grid">
        <Field label="Alamat lokasi pekerjaan" span>
          <input className="input" value={f.address} onChange={set('address')} />
        </Field>
        <Field label="Tanggal yang diinginkan" hint="Tanggal pasti ditentukan setelah survei.">
          <input type="date" className="input" min={TODAY} value={f.preferredDate} onChange={set('preferredDate')} />
        </Field>
        <Field label="Perkiraan harga">
          <input className="input" readOnly value={`Mulai ${rp(product.priceFrom)} ${product.unit}`} />
        </Field>
        <Field label="Jelaskan kebutuhan Anda" span hint="Contoh: jumlah unit AC, luas taman, masalah yang terlihat.">
          <textarea className="input" rows={3} value={f.notes} onChange={set('notes')} />
        </Field>
        <Field label="Foto kondisi (opsional)" span>
          <PhotoInput value={f.attachments} onChange={set('attachments')} />
        </Field>
      </div>
      {err && <Note tone="error">{err}</Note>}
      <Note>Setelah pesanan dikirim, admin akan meninjau lalu menjadwalkan survei. Harga final dikirim sebagai penawaran & invoice setelah survei.</Note>
    </Modal>
  );
}

export default function Services() {
  const { state, user, actions } = useStore();
  const [ordering, setOrdering] = useState(null);
  const isAdmin = user.role === 'admin';
  const list = isAdmin ? state.products : state.products.filter((p) => p.active);
  return (
    <div className="page">
      <PageHead title={isAdmin ? 'Katalog layanan' : 'Pilih layanan'} sub={isAdmin ? 'Layanan yang bisa dipesan pelanggan, beserta template biaya dan kegiatan untuk penawaran.' : 'Pilih layanan, ceritakan kebutuhan Anda, dan kami jadwalkan survei.'} />
      <div className="service-grid">
        {list.map((p) => (
          <div key={p.id} className="card service">
            <div className="card-body">
              <div className="service-top">
                <ProductIcon product={p} size={20} />
                {isAdmin && <Badge tone={p.active ? 'green' : 'gray'}>{p.active ? 'Aktif' : 'Nonaktif'}</Badge>}
              </div>
              <h3>{p.name}</h3>
              <p className="muted">{p.desc}</p>
              <div className="service-price">
                Mulai <b>{rp(p.priceFrom)}</b> <span className="muted">{p.unit}</span>
              </div>
              {isAdmin ? (
                <>
                  <div className="small muted template">
                    Template: {p.template.items.map((i) => i.desc).join(', ')} · keahlian staf <b>{p.template.activity.skill}</b>
                  </div>
                  <button className="btn small" onClick={() => actions.toggleProduct(p.id)}>
                    {p.active ? 'Nonaktifkan' : 'Aktifkan'}
                  </button>
                </>
              ) : (
                <button className="btn primary" onClick={() => setOrdering(p)}>
                  Pesan layanan
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
      {ordering && <PlaceOrder product={ordering} onClose={() => setOrdering(null)} />}
    </div>
  );
}
