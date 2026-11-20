import { useStore } from '../store.jsx';
import { PageHead, ActivityItem } from '../components.jsx';
import { Card, Empty, Stat } from '../ui.jsx';
import { ActivityActions } from './OrderModals.jsx';
import { TODAY } from '../data.js';
import { fmtDateDow } from '../format.js';

export default function Jobs() {
  const { state, user } = useStore();
  const mine = state.activities
    .filter((a) => a.staffIds.includes(user.id) && a.status !== 'Draft')
    .filter((a) => !['Rejected', 'Cancelled'].includes(state.orders.find((o) => o.id === a.orderId).status))
    .sort((a, b) => (a.date + a.shift).localeCompare(b.date + b.shift));
  const open = mine.filter((a) => a.status !== 'Done');
  const today = open.filter((a) => a.date <= TODAY);
  const later = open.filter((a) => a.date > TODAY);
  const done = mine.filter((a) => a.status === 'Done').reverse();
  const laterShifts = later.reduce((n, a) => n + (a.shift === 'FD' ? 2 : 1), 0);

  const Section = ({ title, list, empty }) => (
    <Card title={title} pad={false}>
      {list.length === 0 ? (
        <Empty>{empty}</Empty>
      ) : (
        list.map((a) => (
          <ActivityItem key={a.id} a={a} showOrder>
            <ActivityActions a={a} o={state.orders.find((o) => o.id === a.orderId)} />
          </ActivityItem>
        ))
      )}
    </Card>
  );

  return (
    <div className="page">
      <PageHead title={`Tugas saya`} sub={`${user.name} · ${user.title} · hari ini ${fmtDateDow(TODAY)}`} />
      <div className="stats">
        <Stat label="Hari ini" value={today.length} sub="kegiatan" />
        <Stat label="Akan datang" value={later.length} sub={`${laterShifts} shift terbooking`} />
        <Stat label="Selesai" value={done.length} sub="kegiatan" />
      </div>
      <Section title="Hari ini & tertunda" list={today} empty="Tidak ada tugas untuk hari ini." />
      <Section title="Akan datang" list={later} empty="Belum ada booking berikutnya." />
      <Section title="Riwayat" list={done.slice(0, 10)} empty="Belum ada tugas yang selesai." />
    </div>
  );
}
