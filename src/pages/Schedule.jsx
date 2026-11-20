import { useState } from 'react';
import { useStore } from '../store.jsx';
import { navigate } from '../router.jsx';
import { PageHead } from '../components.jsx';
import { Card, Avatar, Icon, cx } from '../ui.jsx';
import { holdingActivities, slotsOf, toolInUse } from '../booking.js';
import { canSeeOrder } from '../perm.js';
import { addDays, fmtDay, weekStart } from '../format.js';
import { TODAY, SHIFTS } from '../data.js';

const hue = (s) => {
  let h = 0;
  for (const ch of s) h = (h * 37 + ch.charCodeAt(0)) % 360;
  return h;
};

export default function Schedule() {
  const { state, user } = useStore();
  const [start, setStart] = useState(weekStart(TODAY));
  const [view, setView] = useState('staff');
  const days = Array.from({ length: 7 }, (_, i) => addDays(start, i));
  const acts = holdingActivities(state);
  const orderOf = (a) => state.orders.find((o) => o.id === a.orderId);

  const Block = ({ a, span }) => {
    const o = orderOf(a);
    const can = canSeeOrder(state, user, o);
    const h = hue(o.no);
    return (
      <td colSpan={span} className="sch-cell">
        <button
          type="button"
          className={cx('sch-block', a.status === 'Draft' && 'draft', a.status === 'Done' && 'done')}
          style={{ background: `hsl(${h} 60% 93%)`, borderColor: `hsl(${h} 45% 70%)`, color: `hsl(${h} 50% 25%)` }}
          onClick={() => can && navigate('orders/' + o.id)}
          title={`${o.no} · ${a.title} · ${SHIFTS[a.shift].time}${a.status === 'Draft' ? ' (draf, ditahan)' : ''}`}
        >
          <span className="sb-no">{o.no.slice(-3)}</span>
          <span className="sb-title">{a.title}</span>
        </button>
      </td>
    );
  };

  const staff = state.users.filter((u) => u.role === 'staff');
  const tools = state.materials.filter((m) => m.kind === 'tool');

  const staffCells = (s, d) => {
    const mine = acts.filter((a) => a.date === d && a.staffIds.includes(s.id));
    const fd = mine.find((a) => a.shift === 'FD');
    if (fd) return <Block key={d} a={fd} span={2} />;
    return ['S1', 'S2'].map((sh) => {
      const a = mine.find((x) => slotsOf(x.shift).includes(sh));
      return a ? <Block key={d + sh} a={a} /> : <td key={d + sh} className={cx('sch-cell empty', d < TODAY && 'past')} />;
    });
  };

  const toolCells = (m, d) =>
    ['S1', 'S2'].map((sh) => {
      const used = toolInUse(acts, m.id, { date: d, shift: sh });
      const list = acts.filter((a) => a.date === d && slotsOf(a.shift).includes(sh) && a.materials.some((x) => x.materialId === m.id));
      const tone = used === 0 ? '' : used >= m.stock ? 'full' : 'part';
      return (
        <td key={d + sh} className={cx('sch-cell tool', tone, d < TODAY && 'past')} title={list.map((a) => `${orderOf(a).no} · ${a.title}`).join('\n')}>
          {used > 0 && (
            <span className="tool-use">
              {used}/{m.stock}
            </span>
          )}
        </td>
      );
    });

  return (
    <div className="page wide">
      <PageHead
        title="Jadwal staf & alat"
        sub="Setiap staf punya 2 shift per hari (S1 08:00–12:00, S2 13:00–17:00). Staf atau alat yang sudah dibooking di satu shift tidak bisa dipakai kegiatan lain."
        actions={
          <div className="row-actions">
            <div className="segmented">
              <button className={cx(view === 'staff' && 'on')} onClick={() => setView('staff')}>
                Staf
              </button>
              <button className={cx(view === 'tools' && 'on')} onClick={() => setView('tools')}>
                Alat
              </button>
            </div>
            <button className="btn small" onClick={() => setStart(addDays(start, -7))} aria-label="Minggu sebelumnya">
              <Icon name="back" size={14} />
            </button>
            <button className="btn small" onClick={() => setStart(weekStart(TODAY))}>
              Minggu ini
            </button>
            <button className="btn small" onClick={() => setStart(addDays(start, 7))} aria-label="Minggu berikutnya">
              <Icon name="chevron" size={14} />
            </button>
          </div>
        }
      />
      <Card pad={false}>
        <div className="table-scroll">
          <table className="schedule">
            <colgroup>
              <col className="c-name" />
              {days.map((d) => ['S1', 'S2'].map((sh) => <col key={d + sh} />))}
            </colgroup>
            <thead>
              <tr>
                <th rowSpan={2} className="sch-name">
                  {view === 'staff' ? 'Staf' : 'Alat'}
                </th>
                {days.map((d) => {
                  const f = fmtDay(d);
                  return (
                    <th key={d} colSpan={2} className={cx('sch-day', d === TODAY && 'today')}>
                      {f.dow} {f.day} {f.mon}
                    </th>
                  );
                })}
              </tr>
              <tr>
                {days.map((d) => ['S1', 'S2'].map((sh) => <th key={d + sh} className={cx('sch-shift', d === TODAY && 'today')}>{sh}</th>))}
              </tr>
            </thead>
            <tbody>
              {view === 'staff'
                ? staff.map((s) => (
                    <tr key={s.id} className={cx(s.id === user.id && 'me-row')}>
                      <th className="sch-name">
                        <div className="person">
                          <Avatar name={s.name} size={24} />
                          <div>
                            <div className="strong">{s.name}</div>
                            <div className="small muted">{s.skills.join(', ')}</div>
                          </div>
                        </div>
                      </th>
                      {days.map((d) => staffCells(s, d))}
                    </tr>
                  ))
                : tools.map((m) => (
                    <tr key={m.id}>
                      <th className="sch-name">
                        <div className="strong">{m.name}</div>
                        <div className="small muted">
                          {m.code} · {m.stock} {m.unit}
                        </div>
                      </th>
                      {days.map((d) => toolCells(m, d))}
                    </tr>
                  ))}
            </tbody>
          </table>
        </div>
      </Card>
      <div className="legend small muted">
        <span>
          <i className="lg lg-booked" /> Dibooking
        </span>
        <span>
          <i className="lg lg-draft" /> Draf penawaran (ditahan)
        </span>
        <span>
          <i className="lg lg-done" /> Selesai
        </span>
        {view === 'tools' && (
          <span>
            <i className="lg lg-full" /> Alat habis terpakai di shift itu
          </span>
        )}
      </div>
    </div>
  );
}
