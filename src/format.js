export const rp = (n) => (n < 0 ? '− ' : '') + 'Rp ' + Math.abs(Math.round(n || 0)).toLocaleString('id-ID');

// Local calendar date (YYYY-MM-DD), not UTC, so the demo's "today" matches the viewer's clock.
export const localISO = (d = new Date()) => {
  const p = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
};

export const addDays = (d, n) => {
  const dt = new Date(d + 'T00:00:00Z');
  dt.setUTCDate(dt.getUTCDate() + n);
  return dt.toISOString().slice(0, 10);
};

const asDate = (d) => new Date(d.slice(0, 10) + 'T00:00:00');

export const fmtDate = (d) => (d ? asDate(d).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' }) : '—');
export const fmtDateDow = (d) => (d ? asDate(d).toLocaleDateString('id-ID', { weekday: 'short', day: '2-digit', month: 'short' }) : '—');

export const fmtDay = (d) => {
  const dt = asDate(d);
  return { day: dt.getDate(), mon: dt.toLocaleDateString('id-ID', { month: 'short' }), dow: dt.toLocaleDateString('id-ID', { weekday: 'short' }) };
};

// Monday of the week containing d
export const weekStart = (d) => {
  const dow = (asDate(d).getDay() + 6) % 7;
  return addDays(d, -dow);
};

export const initials = (name) =>
  name.split(' ').filter((p) => p && /[A-Za-z]/.test(p[0])).slice(0, 2).map((p) => p[0]).join('').toUpperCase();

// Shrink an uploaded image so dozens of photos still fit in localStorage.
export function compressImage(file, max = 720, quality = 0.7) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = reject;
    reader.onload = () => {
      const img = new Image();
      img.onerror = () => resolve(reader.result);
      img.onload = () => {
        const scale = Math.min(1, max / Math.max(img.width, img.height));
        const c = document.createElement('canvas');
        c.width = Math.round(img.width * scale);
        c.height = Math.round(img.height * scale);
        c.getContext('2d').drawImage(img, 0, 0, c.width, c.height);
        resolve(c.toDataURL('image/jpeg', quality));
      };
      img.src = reader.result;
    };
    reader.readAsDataURL(file);
  });
}

// Placeholder "photo" for seed data
export const placeholderPhoto = (label, hue = 200) =>
  'data:image/svg+xml;utf8,' +
  encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" width="480" height="320" viewBox="0 0 480 320">` +
      `<defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="hsl(${hue},40%,78%)"/><stop offset="1" stop-color="hsl(${hue},35%,58%)"/></linearGradient></defs>` +
      `<rect width="480" height="320" fill="url(#g)"/>` +
      `<g fill="none" stroke="rgba(255,255,255,.75)" stroke-width="6"><rect x="196" y="110" width="88" height="64" rx="10"/><circle cx="240" cy="142" r="18"/></g>` +
      `<text x="240" y="230" text-anchor="middle" font-family="Inter,Arial,sans-serif" font-size="20" font-weight="600" fill="#fff">${label}</text>` +
      `</svg>`,
  );
