import { useStore, materialById } from '../store.jsx';
import { Link } from '../router.jsx';
import { PageHead, OrderLine, ActivityItem } from '../components.jsx';
import { Card, Stat, Empty, Badge } from '../ui.jsx';
import { todos, visibleOrders } from '../perm.js';
import { holdingActivities, materialSummary, totals } from '../booking.js';
import { TODAY } from '../data.js';
import { fmtDateDow, rp } from '../format.js';

export default function Dashboard() {
  const { state, user } = useStore();
  const orders = visibleOrders(state, user);
  const mine = todos(state, user);
  const count = (...st) => orders.filter((o) => st.includes(o.status)).length;
  const today = holdingActivities(state)
    .filter((a) => a.date === TODAY && a.status !== 'Draft')
    .sort((a, b) => a.shift.localeCompare(b.shift));
  const surveysToday = orders.filter((o) => o.survey?.date === TODAY && ['SurveyConfirmed', 'SurveyScheduled'].includes(o.status));
  const low = state.materials.filter((m) => materialSummary(state, m).low);
  const unpaid = orders.filter((o) => o.invoice && ['Approved', 'InProgress', 'Completed'].includes(o.status)).reduce((s, o) => s + totals(o.offer.items, o.invoice).total, 0);

  return (
    <div className="page">
      <PageHead title={`Halo, ${user.name.split(' ')[0]}`} sub={`${fmtDateDow(TODAY)} · ${mine.length} work order menunggu tindakan Anda`} />
      <div className="stats">
        <Stat label="Pesanan baru" value={count('Submitted')} sub="perlu ditinjau" />
        <Stat label="Tahap survei" value={count('WaitingSurvey', 'SurveyScheduled', 'SurveyConfirmed')} />
        <Stat label="Tahap penawaran" value={count('Surveyed', 'OfferReady', 'AwaitingApproval', 'OfferRejected')} />
        <Stat label="Dikerjakan" value={count('Approved', 'InProgress')} />
        <Stat label="Tagihan belum lunas" value={rp(unpaid)} sub={`${count('Completed')} siap ditutup`} />
      </div>
      <div className="grid-2 wide-left">
        <Card title="Perlu tindakan Anda" pad={false} actions={<Link to="orders" className="small">Semua work order</Link>}>
          {mine.length === 0 ? (
            <Empty>Semua beres.</Empty>
          ) : (
            mine.map(({ o, todo }) => <OrderLine key={o.id} o={o} right={<span className="todo-pill">{todo}</span>} />)
          )}
        </Card>
        <div className="stack">
          <Card title="Survei hari ini" pad={false}>
            {surveysToday.length === 0 ? (
              <Empty>Tidak ada survei hari ini.</Empty>
            ) : (
              surveysToday.map((o) => <OrderLine key={o.id} o={o} right={<span className="chip">{o.survey.time}</span>} />)
            )}
          </Card>
          <Card title="Stok menipis" pad={false} actions={<Link to="materials" className="small">Material</Link>}>
            {low.length === 0 ? (
              <Empty>Stok aman.</Empty>
            ) : (
              <ul className="files pad-list">
                {low.map((m) => {
                  const s = materialSummary(state, materialById(state, m.id));
                  return (
                    <li key={m.id}>
                      <div>
                        <div className="file-name">{m.name}</div>
                        <div className="small muted">
                          Stok {m.stock} {m.unit} · dipesan {s.reserved} · min {m.min}
                        </div>
                      </div>
                      <Badge tone="red">{s.available} tersedia</Badge>
                    </li>
                  );
                })}
              </ul>
            )}
          </Card>
        </div>
      </div>
      <Card title={`Kegiatan hari ini (${today.length})`} pad={false} actions={<Link to="schedule" className="small">Jadwal staf & alat</Link>}>
        {today.length === 0 ? <Empty>Tidak ada kegiatan hari ini.</Empty> : today.map((a) => <ActivityItem key={a.id} a={a} showOrder />)}
      </Card>
    </div>
  );
}
