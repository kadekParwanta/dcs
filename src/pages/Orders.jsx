import { useState } from 'react';
import { useStore, userName, productOf, orderActivities } from '../store.jsx';
import { navigate, Link } from '../router.jsx';
import { PageHead, ProductIcon } from '../components.jsx';
import { Badge, Card, Empty, Tabs } from '../ui.jsx';
import { visibleOrders, todoFor, ACTIVE, ENDED } from '../perm.js';
import { totals } from '../booking.js';
import { fmtDate, rp } from '../format.js';

export default function Orders() {
  const { state, user } = useStore();
  const [tab, setTab] = useState('todo');
  const [q, setQ] = useState('');
  const isCustomer = user.role === 'customer';
  const all = visibleOrders(state, user).map((o) => ({ o, todo: todoFor(state, user, o) }));
  const groups = {
    todo: all.filter((x) => x.todo),
    active: all.filter((x) => ACTIVE.includes(x.o.status)),
    ended: all.filter((x) => ENDED.includes(x.o.status)),
    all,
  };
  const rows = groups[tab].filter(({ o }) => {
    const s = `${o.no} ${productOf(state, o).name} ${userName(state, o.customerId)} ${o.address}`.toLowerCase();
    return s.includes(q.toLowerCase());
  });

  const nextDate = (o) => {
    const acts = orderActivities(state, o.id).filter((a) => a.status !== 'Done');
    if (acts.length) return { label: 'Kegiatan', date: acts[0].date };
    if (o.survey && ['SurveyScheduled', 'SurveyConfirmed'].includes(o.status)) return { label: 'Survei', date: o.survey.date };
    return null;
  };

  return (
    <div className="page">
      <PageHead
        title={isCustomer ? 'Pesanan saya' : 'Work order'}
        sub={isCustomer ? 'Status setiap pesanan dan hal yang perlu Anda setujui.' : 'Semua pesanan dari pelanggan, dari tinjauan sampai lunas.'}
        actions={
          isCustomer && (
            <Link to="services" className="btn primary">
              Pesan layanan baru
            </Link>
          )
        }
      />
      <div className="toolbar">
        <Tabs
          active={tab}
          onChange={setTab}
          tabs={[
            { key: 'todo', label: 'Perlu tindakan saya', count: groups.todo.length },
            { key: 'active', label: 'Berjalan', count: groups.active.length },
            { key: 'ended', label: 'Selesai / ditutup', count: groups.ended.length },
            { key: 'all', label: 'Semua', count: all.length },
          ]}
        />
        <input className="input search" placeholder="Cari nomor, layanan, pelanggan…" value={q} onChange={(e) => setQ(e.target.value)} />
      </div>
      <Card pad={false}>
        {rows.length === 0 ? (
          <Empty>{tab === 'todo' ? 'Tidak ada yang perlu Anda kerjakan saat ini.' : 'Tidak ada pesanan.'}</Empty>
        ) : (
          <div className="table-scroll">
            <table className="table">
              <thead>
                <tr>
                  <th>Work order</th>
                  {!isCustomer && <th>Pelanggan</th>}
                  <th>Dibuat</th>
                  <th>Jadwal berikutnya</th>
                  <th>Status</th>
                  <th className="num">Total</th>
                </tr>
              </thead>
              <tbody>
                {rows.map(({ o, todo }) => {
                  const p = productOf(state, o);
                  const nd = nextDate(o);
                  const showTotal = o.offer && (!isCustomer || o.invoice);
                  return (
                    <tr key={o.id} className="row-link" onClick={() => navigate('orders/' + o.id)}>
                      <td>
                        <div className="person">
                          <ProductIcon product={p} size={13} />
                          <div>
                            <div className="strong">{o.no}</div>
                            <div className="small muted">{p.name}</div>
                          </div>
                        </div>
                      </td>
                      {!isCustomer && <td>{userName(state, o.customerId)}</td>}
                      <td className="nowrap">{fmtDate(o.createdAt)}</td>
                      <td className="nowrap">{nd ? `${nd.label} · ${fmtDate(nd.date)}` : <span className="muted">—</span>}</td>
                      <td>
                        <Badge>{o.status}</Badge>
                        {todo && <div className="todo-tag">→ {todo}</div>}
                      </td>
                      <td className="num">{showTotal ? rp(totals(o.offer.items, o.invoice).total) : <span className="muted">—</span>}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}
