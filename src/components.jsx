import { useStore, userName, materialById, productOf } from './store.jsx';
import { Link } from './router.jsx';
import { Badge, Avatar, Icon, Photos, cx } from './ui.jsx';
import { fmtDay, fmtDateDow } from './format.js';
import { SHIFTS, TODAY } from './data.js';
import { STEPS, stepIndex } from './perm.js';

export function DateChip({ date }) {
  const d = fmtDay(date);
  return (
    <div className={cx('date-chip', date === TODAY && 'today')}>
      <span className="dc-mon">{d.mon}</span>
      <span className="dc-day">{d.day}</span>
    </div>
  );
}

export function PageHead({ title, sub, actions, back }) {
  return (
    <div className="page-head">
      <div>
        {back}
        <h1>{title}</h1>
        {sub && <p className="muted">{sub}</p>}
      </div>
      {actions && <div className="page-actions">{actions}</div>}
    </div>
  );
}

export function ProductIcon({ product, size = 18 }) {
  return (
    <span className={`p-icon p-${product.icon}`} style={{ width: size * 2, height: size * 2 }}>
      <Icon name={product.icon} size={size} />
    </span>
  );
}

export function Stepper({ status }) {
  const idx = stepIndex(status);
  const stopped = ['Rejected', 'Cancelled'].includes(status);
  return (
    <ol className={cx('stepper', stopped && 'stopped')}>
      {STEPS.map((s, i) => (
        <li key={s.key} className={cx(i < idx && 'done', i === idx && 'current')}>
          <span className="st-dot">{i < idx ? <Icon name="check" size={12} /> : i + 1}</span>
          <span className="st-label">{s.label}</span>
        </li>
      ))}
    </ol>
  );
}

export const ShiftChip = ({ shift }) => (
  <span className={`chip shift-${shift}`} title={SHIFTS[shift].time}>
    <Icon name="clock" size={12} /> {SHIFTS[shift].label} · {SHIFTS[shift].time}
  </span>
);

export function People({ ids }) {
  const { state } = useStore();
  return (
    <div className="people">
      {ids.map((id) => (
        <span key={id} className="person-chip">
          <Avatar name={userName(state, id)} size={20} /> {userName(state, id)}
        </span>
      ))}
    </div>
  );
}

export function MaterialChips({ list, usage }) {
  const { state } = useStore();
  return (
    <div className="mat-chips">
      {list.map((x) => {
        const m = materialById(state, x.materialId);
        const used = usage?.find((u) => u.materialId === x.materialId);
        return (
          <span key={x.materialId} className={`chip mat-${m.kind}`} title={m.kind === 'tool' ? 'Alat dibooking' : 'Habis pakai'}>
            {m.kind === 'tool' ? <Icon name="lock" size={11} /> : <Icon name="drop" size={11} />}
            {m.name} · {used ? `${used.qty}/${x.qty}` : x.qty} {m.unit}
          </span>
        );
      })}
    </div>
  );
}

export function ActivityItem({ a, showOrder, children }) {
  const { state, user } = useStore();
  const o = state.orders.find((x) => x.id === a.orderId);
  return (
    <div className={cx('activity', a.status === 'Done' && 'done')}>
      <DateChip date={a.date} />
      <div className="act-main">
        <div className="act-title">
          <span className="strong">{a.title}</span> {user.role === 'customer' && a.status === 'Draft' ? <Badge tone="violet">Usulan jadwal</Badge> : <Badge>{a.status}</Badge>}
        </div>
        {showOrder && (
          <div className="small muted">
            <Link to={`orders/${o.id}`}>{o.no}</Link> · {productOf(state, o).name} · {userName(state, o.customerId)}
          </div>
        )}
        <div className="act-meta">
          <span className="chip">{fmtDateDow(a.date)}</span>
          <ShiftChip shift={a.shift} />
        </div>
        <People ids={a.staffIds} />
        {a.materials.length > 0 && <MaterialChips list={a.materials} usage={a.status === 'Done' ? a.report?.usage : null} />}
        {a.report?.notes && a.status === 'Done' && (
          <div className="act-report">
            <div className="small muted">
              Laporan {userName(state, a.report.by)} · {a.report.at}
            </div>
            <div>{a.report.notes}</div>
            <Photos photos={a.report.photos} />
          </div>
        )}
        {children && <div className="act-actions">{children}</div>}
      </div>
    </div>
  );
}

export function OrderLine({ o, right }) {
  const { state } = useStore();
  const p = productOf(state, o);
  return (
    <Link to={`orders/${o.id}`} className="event-line">
      <ProductIcon product={p} size={15} />
      <div className="el-main">
        <div className="el-title">
          {o.no} · {p.name}
        </div>
        <div className="el-sub">
          {userName(state, o.customerId)} · {o.address}
        </div>
      </div>
      <div className="el-right">{right ?? <Badge>{o.status}</Badge>}</div>
    </Link>
  );
}
