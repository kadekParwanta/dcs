import { useStore } from './store.jsx';
import { useRoute, Link } from './router.jsx';
import { ROLES } from './data.js';
import { NAV, HOME, todos } from './perm.js';
import { Icon, Avatar, Restricted, cx } from './ui.jsx';
import Dashboard from './pages/Dashboard.jsx';
import Services from './pages/Services.jsx';
import Orders from './pages/Orders.jsx';
import OrderDetail from './pages/OrderDetail.jsx';
import Jobs from './pages/Jobs.jsx';
import Schedule from './pages/Schedule.jsx';
import Materials from './pages/Materials.jsx';

const PAGES = { dashboard: Dashboard, services: Services, orders: Orders, jobs: Jobs, schedule: Schedule, materials: Materials };

function RoleSwitcher() {
  const { state, user, setUserId } = useStore();
  const inRole = state.users.filter((u) => u.role === user.role);
  const go = (id) => {
    setUserId(id);
    const u = state.users.find((x) => x.id === id);
    if (u.role !== user.role) window.location.hash = '/' + HOME[u.role];
  };
  return (
    <div className="role-switcher">
      <span className="rs-label">Lihat sebagai</span>
      <div className="segmented" role="radiogroup" aria-label="Peran">
        {Object.entries(ROLES).map(([key, r]) => (
          <button key={key} role="radio" aria-checked={user.role === key} className={cx(user.role === key && 'on')} onClick={() => go(state.users.find((u) => u.role === key).id)}>
            {r.label}
          </button>
        ))}
      </div>
      <select className="input rs-user" value={user.id} onChange={(e) => go(e.target.value)} aria-label="Pengguna">
        {inRole.map((u) => (
          <option key={u.id} value={u.id}>
            {u.name}
          </option>
        ))}
      </select>
    </div>
  );
}

export default function App() {
  const { state, user, actions } = useStore();
  const [rawPage, ...rest] = useRoute();
  const page = rawPage || HOME[user.role];
  const nav = NAV.find((n) => n.path === page);
  // Order detail checks its own access (staff may open orders they are booked on)
  const allowed = !nav || nav.roles.includes(user.role) || (page === 'orders' && rest[0]);
  const todoCount = todos(state, user).length;

  let content;
  if (page === 'orders' && rest[0]) content = <OrderDetail id={rest[0]} />;
  else {
    const Page = PAGES[page] || PAGES[HOME[user.role]];
    content = <Page />;
  }

  return (
    <div className="shell">
      <aside className="sidebar">
        <div className="brand">
          <span className="brand-mark">
            <Icon name="jobs" size={18} />
          </span>
          <div>
            <div className="brand-name">Iswara</div>
            <div className="brand-sub">Work Order & Layanan</div>
          </div>
        </div>
        <nav className="nav">
          {NAV.filter((n) => n.roles.includes(user.role)).map((n) => (
            <Link key={n.path} to={n.path} className={cx('nav-item', page === n.path && 'active')}>
              <Icon name={n.icon} />
              <span>{user.role === 'customer' && n.customerLabel ? n.customerLabel : n.label}</span>
              {n.badge && todoCount > 0 && <span className="nav-count">{todoCount}</span>}
            </Link>
          ))}
        </nav>
        <div className="sidebar-foot">
          <div className="me">
            <Avatar name={user.name} size={32} />
            <div>
              <div className="me-name">{user.name}</div>
              <div className="me-role">{user.title}</div>
            </div>
          </div>
          <button
            className="btn ghost small reset"
            onClick={() => {
              if (window.confirm('Kembalikan semua data demo ke kondisi awal?')) actions.reset();
            }}
          >
            <Icon name="reset" size={14} /> Reset data demo
          </button>
        </div>
      </aside>

      <div className="main">
        <header className="topbar">
          <span className="mock-tag">Mockup</span>
          <RoleSwitcher />
        </header>
        <div className="role-hint">
          <Icon name="eye" size={14} />
          <span>
            <b>{ROLES[user.role].label}:</b> {ROLES[user.role].hint}
          </span>
        </div>
        <main className="content">
          {allowed ? (
            content
          ) : (
            <div className="page">
              <Restricted>
                Menu <b>{nav.label}</b> tidak tersedia untuk peran {ROLES[user.role].label}. Ganti peran di bilah atas untuk melihatnya.
              </Restricted>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
