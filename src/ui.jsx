import { useEffect, useState } from 'react';
import { initials, compressImage } from './format.js';
import { t } from './i18n.js';

export const cx = (...a) => a.filter(Boolean).join(' ');

const PATHS = {
  dashboard: 'M3 3h7v9H3zM14 3h7v5h-7zM14 12h7v9h-7zM3 16h7v5H3z',
  cases: 'M3 7h18v13H3zM8 7V4h8v3M3 12h18',
  agenda: 'M3 5h18v16H3zM3 10h18M8 3v4M16 3v4',
  approvals: 'M22 11.1V12a10 10 0 1 1-5.9-9.1M22 4 12 14l-3-3',
  team: 'M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM22 21v-2a4 4 0 0 0-3-3.9M16 3.1a4 4 0 0 1 0 7.8',
  reports: 'M4 20V10M10 20V4M16 20v-7M22 20H2',
  settings: 'M4 21v-7M4 10V3M12 21v-9M12 8V3M20 21v-5M20 12V3M1 14h6M9 8h6M17 16h6',
  lock: 'M5 11h14v10H5zM8 11V7a4 4 0 0 1 8 0v4',
  unlock: 'M5 11h14v10H5zM8 11V7a4 4 0 0 1 7.9-1',
  upload: 'M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M17 8l-5-5-5 5M12 3v12',
  file: 'M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8zM14 2v6h6',
  plus: 'M12 5v14M5 12h14',
  chevron: 'M9 18l6-6-6-6',
  back: 'M15 18l-6-6 6-6',
  x: 'M18 6 6 18M6 6l12 12',
  check: 'M20 6 9 17l-5-5',
  download: 'M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3',
  reset: 'M3 12a9 9 0 1 0 3-6.7L3 8M3 3v5h5',
  alert: 'M12 9v4M12 17h.01M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z',
  eye: 'M1 12s4-8 11-8 11 8 11 8-4 8-11 8S1 12 1 12zM12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6z',
  receipt: 'M4 2v20l3-2 3 2 3-2 3 2 3-2 1 .7V2l-3 2-3-2-3 2-3-2-3 2zM8 8h8M8 12h8M8 16h5',
  scale: 'M12 3v18M5 21h14M3 7h18M6 7l-3 7a3 3 0 0 0 6 0zM18 7l-3 7a3 3 0 0 0 6 0z',
  orders: 'M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2M9 5a2 2 0 0 0 2 2h2a2 2 0 0 0 2-2 2 2 0 0 0-2-2h-2a2 2 0 0 0-2 2zM9 12h6M9 16h4',
  services: 'M3 3h7v7H3zM14 3h7v7h-7zM14 14h7v7h-7zM3 14h7v7H3z',
  box: 'M21 8 12 3 3 8v8l9 5 9-5zM3 8l9 5 9-5M12 13v8',
  jobs: 'M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.8-3.8a6 6 0 0 1-7.9 7.9l-6.9 6.9a2.1 2.1 0 0 1-3-3l6.9-6.9a6 6 0 0 1 7.9-7.9z',
  wrench: 'M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.8-3.8a6 6 0 0 1-7.9 7.9l-6.9 6.9a2.1 2.1 0 0 1-3-3l6.9-6.9a6 6 0 0 1 7.9-7.9z',
  snow: 'M12 2v20M4.9 4.9l14.2 14.2M2 12h20M4.9 19.1 19.1 4.9M9 4l3 3 3-3M9 20l3-3 3 3M4 9l3 3-3 3M20 9l-3 3 3 3',
  leaf: 'M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.5 19 2c1 2 2 4.2 2 8 0 5.5-4.8 10-10 10zM2 21c0-3 1.9-5.4 5.1-6.4',
  sparkle: 'M12 3l1.9 5.1L19 10l-5.1 1.9L12 17l-1.9-5.1L5 10l5.1-1.9zM19 15l.9 2.1L22 18l-2.1.9L19 21l-.9-2.1L16 18l2.1-.9zM5 2l.6 1.4L7 4l-1.4.6L5 6l-.6-1.4L3 4l1.4-.6z',
  drop: 'M12 2.7l5.7 5.6a8 8 0 1 1-11.3 0z',
  camera: 'M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2zM12 17a4 4 0 1 0 0-8 4 4 0 0 0 0 8z',
  play: 'M5 3l14 9-14 9z',
  pin: 'M21 10c0 7-9 13-9 13S3 17 3 10a9 9 0 0 1 18 0zM12 13a3 3 0 1 0 0-6 3 3 0 0 0 0 6z',
  clock: 'M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20zM12 6v6l4 2',
  send: 'M22 2 11 13M22 2l-7 20-4-9-9-4z',
  trash: 'M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6',
  bell: 'M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9M13.7 21a2 2 0 0 1-3.4 0',
};

export function Icon({ name, size = 16 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d={PATHS[name]} />
    </svg>
  );
}

const TONE = {
  Submitted: 'amber', WaitingSurvey: 'amber', SurveyScheduled: 'blue', SurveyConfirmed: 'blue', Surveyed: 'blue',
  OfferReady: 'amber', AwaitingApproval: 'violet', OfferRejected: 'red', Approved: 'green', InProgress: 'teal',
  Completed: 'green', Closed: 'gray', Rejected: 'red', Cancelled: 'red',
  Draft: 'gray', Booked: 'blue', Done: 'green', Proposed: 'violet', Confirmed: 'green', RescheduleRequested: 'amber',
  Sent: 'violet', Paid: 'green', In: 'green', Out: 'blue', Adjust: 'amber', consumable: 'teal', tool: 'violet',
};

export function Badge({ children, tone }) {
  const cls = tone || TONE[children] || 'gray';
  return <span className={`badge badge-${cls}`}>{typeof children === 'string' ? t(children) : children}</span>;
}

export function Modal({ title, onClose, children, footer, wide, xl }) {
  useEffect(() => {
    const f = (e) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', f);
    return () => window.removeEventListener('keydown', f);
  }, [onClose]);
  return (
    <div className="modal-backdrop" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className={cx('modal', wide && 'modal-wide', xl && 'modal-xl')} role="dialog" aria-modal="true" aria-label={title}>
        <div className="modal-head">
          <h3>{title}</h3>
          <button className="icon-btn" onClick={onClose} aria-label="Tutup" type="button">
            <Icon name="x" />
          </button>
        </div>
        <div className="modal-body">{children}</div>
        {footer && <div className="modal-foot">{footer}</div>}
      </div>
    </div>
  );
}

export function Field({ label, hint, error, children, span }) {
  return (
    <label className={cx('field', span && 'span-2')}>
      <span className="field-label">{label}</span>
      {children}
      {error ? <span className="field-error">{error}</span> : hint && <span className="field-hint">{hint}</span>}
    </label>
  );
}

export function Stat({ label, value, sub, tone }) {
  return (
    <div className={cx('stat', tone && `stat-${tone}`)}>
      <div className="stat-label">{label}</div>
      <div className="stat-value">{value}</div>
      {sub && <div className="stat-sub">{sub}</div>}
    </div>
  );
}

export function Card({ title, actions, children, className, pad = true }) {
  return (
    <section className={cx('card', className)}>
      {(title || actions) && (
        <div className="card-head">
          <h2>{title}</h2>
          {actions && <div className="card-actions">{actions}</div>}
        </div>
      )}
      <div className={cx(pad && 'card-body')}>{children}</div>
    </section>
  );
}

export function Tabs({ tabs, active, onChange }) {
  return (
    <div className="tabs" role="tablist">
      {tabs.map((t) => (
        <button key={t.key} role="tab" aria-selected={active === t.key} className={cx('tab', active === t.key && 'active')} onClick={() => onChange(t.key)}>
          {t.label}
          {t.count != null && <span className="tab-count">{t.count}</span>}
        </button>
      ))}
    </div>
  );
}

export function Progress({ value, max, label }) {
  const pct = max ? Math.round((value / max) * 100) : 0;
  const tone = pct >= 100 ? 'red' : pct >= 80 ? 'amber' : 'green';
  return (
    <div className="progress-wrap" title={label}>
      <div className="progress">
        <div className={`progress-bar progress-${tone}`} style={{ width: Math.min(pct, 100) + '%' }} />
      </div>
      <span className={`progress-pct text-${tone}`}>{pct}%</span>
    </div>
  );
}

export function Avatar({ name, size = 28 }) {
  let h = 0;
  for (const ch of name) h = (h * 31 + ch.charCodeAt(0)) % 360;
  return (
    <span className="avatar" style={{ width: size, height: size, fontSize: size * 0.38, background: `hsl(${h} 45% 88%)`, color: `hsl(${h} 45% 28%)` }}>
      {initials(name)}
    </span>
  );
}

export function Empty({ children }) {
  return <div className="empty">{children}</div>;
}

export function Restricted({ children }) {
  return (
    <div className="restricted">
      <Icon name="lock" size={18} />
      <div>{children}</div>
    </div>
  );
}

export function Note({ children, tone = 'info' }) {
  return <div className={`note note-${tone}`}>{children}</div>;
}

export function Photos({ photos, onRemove }) {
  const [open, setOpen] = useState(null);
  if (!photos?.length) return null;
  return (
    <>
      <div className="photos">
        {photos.map((p) => (
          <figure key={p.id} className="photo">
            <button type="button" className="photo-btn" onClick={() => setOpen(p)} aria-label={'Lihat ' + p.name}>
              <img src={p.src} alt={p.name} loading="lazy" />
            </button>
            {onRemove && (
              <button type="button" className="photo-x" onClick={() => onRemove(p.id)} aria-label="Hapus foto">
                <Icon name="x" size={12} />
              </button>
            )}
            <figcaption>{p.name}</figcaption>
          </figure>
        ))}
      </div>
      {open && (
        <Modal title={open.name} onClose={() => setOpen(null)} wide>
          <img src={open.src} alt={open.name} style={{ width: '100%', borderRadius: 8 }} />
        </Modal>
      )}
    </>
  );
}

export function PhotoInput({ value, onChange, label = 'Tambah foto' }) {
  const [busy, setBusy] = useState(false);
  const add = async (e) => {
    const files = [...e.target.files];
    e.target.value = '';
    if (!files.length) return;
    setBusy(true);
    const added = [];
    for (const f of files) {
      try {
        added.push({ id: 'ph' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6), name: f.name, src: await compressImage(f) });
      } catch {
        /* skip unreadable file */
      }
    }
    setBusy(false);
    onChange([...value, ...added]);
  };
  return (
    <div className="photo-input">
      <Photos photos={value} onRemove={(id) => onChange(value.filter((p) => p.id !== id))} />
      <label className="btn small">
        <Icon name="camera" size={14} /> {busy ? 'Memproses…' : label}
        <input type="file" accept="image/*" multiple capture="environment" onChange={add} hidden />
      </label>
    </div>
  );
}
