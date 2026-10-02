/* TEDUH prototipe. Tanpa framework dan tanpa proses build.
   Semua data adalah contoh dan hanya hidup di memori browser. Pengukuran luka oleh AI disimulasikan. */
(() => {
'use strict';

const CFG = Object.assign({
  NURSE_PHONE: '', NURSE_NAME: 'Ns. Dewi', FACILITY: 'Puskesmas contoh',
  CAREGIVER: 'Bu Sari', PATIENT: 'Ibu Wati', EMERGENCY_PHONE: '119', REAL_CALLS: false
}, window.TEDUH_CONFIG || {});

const $ = (s, el = document) => el.querySelector(s);
const $$ = (s, el = document) => Array.from(el.querySelectorAll(s));
const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const round1 = n => Math.round(n * 10) / 10;
const fmt1 = n => round1(n).toFixed(1).replace('.', ',');
const MIN = 60000, HOUR = 60 * MIN, DAY = 24 * HOUR;
const cap = s => s.charAt(0).toUpperCase() + s.slice(1);

/* ---------- Ikon ---------- */
const P = {
  home: '<path d="M3 11l9-7 9 7v9a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z"/>',
  cam: '<path d="M4 8h3l2-3h6l2 3h3a1 1 0 0 1 1 1v9a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V9a1 1 0 0 1 1-1z"/><circle cx="12" cy="13" r="3.5"/>',
  book: '<path d="M5 4h11a3 3 0 0 1 3 3v13H8a3 3 0 0 1-3-3z"/><path d="M5 17a3 3 0 0 1 3-3h11"/>',
  leaf: '<path d="M5 19c0-8 5-14 14-14 0 9-6 14-14 14z"/><path d="M5 19l8-8"/>',
  chart: '<path d="M4 20V10M10 20V4M16 20v-8M22 20H2"/>',
  phone: '<path d="M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2z"/>',
  back: '<path d="M15 5l-7 7 7 7"/>',
  check: '<path d="M5 12l4 4 10-10"/>',
  heart: '<path d="M12 21s-7-4.5-7-10a4 4 0 0 1 7-2.5A4 4 0 0 1 19 11c0 5.5-7 10-7 10z"/>',
  play: '<path d="M8 5l11 7-11 7z"/>',
  cal: '<rect x="4" y="5" width="16" height="15" rx="2"/><path d="M4 10h16M9 3v4M15 3v4"/>',
  wind: '<path d="M3 9h11a3 3 0 1 0-3-3M3 15h15a3 3 0 1 1-3 3M3 12h7"/>',
  chat: '<path d="M4 5h16v11H9l-5 4z"/>',
  user: '<circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/>',
  alert: '<path d="M12 3l10 18H2z"/><path d="M12 10v5M12 18v.5"/>',
  shield: '<path d="M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6z"/><path d="M8.5 12l2.5 2.5L16 9.5"/>'
};
const ico = n => `<svg class="icon" viewBox="0 0 24 24" aria-hidden="true">${P[n]}</svg>`;
const LOGO = `<svg viewBox="0 0 24 24" width="64" height="64" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3 11c0-4.5 4-7.5 9-7.5s9 3 9 7.5c-3-1.5-6-2.2-9-2.2S6 9.5 3 11z"/><path d="M12 13c-2 2.5-3 4-3 5.5a3 3 0 0 0 6 0c0-1.5-1-3-3-5.5z"/></svg>`;

/* ---------- Aturan Lampu Waspada (rancangan awal, perlu divalidasi perawat) ---------- */
const QS = [
  { key: 'bau', title: 'Bau', q: 'Seberapa tercium bau luka?', opts: [[0, 'Tidak ada bau'], [1, 'Tercium saat balutan dibuka'], [2, 'Tercium dari dekat walau balutan terpasang'], [3, 'Tercium di seluruh ruangan']] },
  { key: 'cairan', title: 'Cairan', q: 'Berapa lembar kasa basah sejak ganti balutan terakhir?', opts: [[0, 'Hampir kering'], [1, '1 sampai 2 lembar'], [2, '3 sampai 5 lembar'], [3, 'Lebih dari 5 lembar']] },
  { key: 'nyeri', title: 'Nyeri', q: 'Seberapa nyeri luka saat ini?', pain: true },
  { key: 'perd', title: 'Perdarahan', q: 'Bagaimana perdarahan hari ini?', opts: [[0, 'Tidak ada'], [1, 'Sedikit saat ganti balutan'], [2, 'Tidak berhenti setelah ditekan sekitar 5 menit']] },
  { key: 'kulit', title: 'Kulit sekitar luka', q: 'Bagaimana kulit di sekitar luka?', opts: [[0, 'Normal'], [1, 'Kemerahan'], [2, 'Lecet atau basah']], extras: true }
];
const PRESET = {
  hijau: { bau: 0, cairan: 1, nyeri: 2, perd: 0, kulit: 0, area: 19.1 },
  kuning: { bau: 2, cairan: 3, nyeri: 5, perd: 1, kulit: 1, area: 20.9 },
  merah: { bau: 2, cairan: 3, nyeri: 8, perd: 2, kulit: 1, area: 21.3 }
};
const DOM_LABEL = { bau: 'bau dan cairan', cairan: 'bau dan cairan', nyeri: 'nyeri', perdarahan: 'perdarahan', kulit: 'kulit sekitar luka' };
const DOM_TOPIC = { bau: 'bau', cairan: 'cairan', nyeri: 'nyeri', perdarahan: 'perdarahan', kulit: 'kulit' };

function score(a) {
  const nb = a.nyeri >= 8 ? 3 : a.nyeri >= 6 ? 2 : a.nyeri >= 3 ? 1 : 0;
  return a.bau + a.cairan + nb + a.perd + a.kulit;
}
function evaluate(a, ref) {
  const red = [], yel = [], notes = [];
  if (a.perd === 2) red.push('Perdarahan tidak berhenti setelah ditekan sekitar 5 menit');
  if (a.nyeri >= 8) red.push('Nyeri sangat berat (' + a.nyeri + ' dari 10)');
  if (a.demam) red.push('Demam');
  if (a.lemas) red.push('Pasien tampak sangat lemas');
  const growth = ref ? (a.area - ref) / ref : 0;
  if (a.bau >= 2) yel.push(a.bau === 3 ? 'Bau tercium di seluruh ruangan' : 'Bau tercium dari dekat walau balutan terpasang');
  if (a.cairan >= 3) yel.push('Cairan banyak (lebih dari 5 lembar kasa basah)');
  if (a.nyeri >= 5 && a.nyeri < 8) yel.push('Nyeri sedang sampai berat (' + a.nyeri + ' dari 10)');
  if (a.kulit === 1) yel.push('Kulit sekitar luka kemerahan');
  if (a.kulit === 2) yel.push('Kulit sekitar luka lecet atau basah');
  if (growth >= 0.10) yel.push('Luas luka bertambah ' + Math.round(growth * 100) + '% dibanding minggu lalu');
  else if (growth >= 0.05) notes.push('Luas luka bertambah ' + Math.round(growth * 100) + '% dibanding minggu lalu');
  const lamp = red.length ? 'merah' : yel.length ? 'kuning' : 'hijau';
  const reasons = lamp === 'merah' ? red.concat(yel) : lamp === 'kuning' ? yel : [];
  const n = { perdarahan: a.perd / 2, nyeri: a.nyeri / 10, bau: a.bau / 3, cairan: a.cairan / 3, kulit: a.kulit / 2 };
  const dominant = Object.keys(n).sort((x, y) => n[y] - n[x])[0];
  return { lamp, reasons, notes, growth, dominant, score: score(a) };
}

/* ---------- Konten panduan dan ruang tenang ---------- */
const TOPICS = [
  { id: 'perdarahan', label: 'Perdarahan', len: '1:40', steps: [
    { t: 'Basahi balutan lama lebih lama sampai mudah dilepas.' },
    { t: 'Buka balutan perlahan.' },
    { t: 'Jangan menggosok dasar luka yang berwarna merah.' },
    { t: 'Jangan memakai air hangat, karena dapat melebarkan pembuluh darah.' },
    { t: 'Tekan area yang berdarah sekitar 5 menit.' },
    { t: 'Jika darah tidak berhenti, tekan tombol "Butuh bantuan sekarang".' },
    { t: 'Balutan penghenti darah khusus hanya dipasang perawat.', ask: true }
  ] },
  { id: 'bau', label: 'Bau', len: '1:30', steps: [
    { t: 'Bersihkan luka dan kulit sekitarnya dengan cairan yang diarahkan perawat.' },
    { t: 'Ganti balutan sesuai banyaknya cairan.' },
    { t: 'Jaga kebersihan diri pasien setiap hari.' },
    { t: 'Tanyakan ke perawat soal balutan penyerap bau atau obat yang sesuai.', ask: true }
  ] },
  { id: 'cairan', label: 'Cairan', len: '1:20', steps: [
    { t: 'Hitung lembar kasa yang basah sejak ganti balutan terakhir.' },
    { t: 'Pakai balutan penyerap sesuai arahan perawat.', ask: true },
    { t: 'Periksa kulit sekitar luka: kemerahan atau kulit memutih dan lembap.' },
    { t: 'Hati-hati saat memakai plester, tempelkan pada kulit yang utuh.' }
  ] },
  { id: 'nyeri', label: 'Nyeri', len: '1:15', steps: [
    { t: 'Berikan obat nyeri yang diresepkan sekitar 30 sampai 60 menit sebelum ganti balutan.', ask: true },
    { t: 'Pakai cairan pencuci bersuhu ruangan.' },
    { t: 'Siapkan suasana tenang dan posisi yang nyaman bagi pasien.' },
    { t: 'Basahi balutan yang lengket lebih lama sebelum dilepas.' }
  ] },
  { id: 'kulit', label: 'Kulit sekitar luka', len: '1:05', steps: [
    { t: 'Jaga kulit sekitar luka tetap bersih dan kering.' },
    { t: 'Tanyakan jenis plester yang aman untuk kulit pasien.', ask: true },
    { t: 'Catat kemerahan, lecet, atau kulit melepuh dan laporkan lewat cek harian.' }
  ] }
];
const MODS = [
  { id: 'napas', icon: 'wind', title: 'Latihan napas tiga menit', sub: 'Menenangkan diri sebelum ganti balutan' },
  { id: 'bau', icon: 'leaf', title: 'Mengurangi bau di dalam rumah', sub: 'Langkah kecil yang bisa dilakukan hari ini' },
  { id: 'tamu', icon: 'chat', title: 'Menjawab pertanyaan tamu dan tetangga', sub: 'Kalimat yang bisa dipakai' },
  { id: 'diri', icon: 'heart', title: 'Merawat diri sebagai pendamping', sub: 'Berbagi tugas dan istirahat' },
  { id: 'bantuan', icon: 'alert', title: 'Kapan meminta bantuan', sub: 'Tanda yang perlu dilaporkan' }
];
const ARTICLES = {
  bau: ['Bau luka kanker dapat membuat pasien dan keluarga merasa malu. Itu wajar dan bukan kesalahan siapa pun.', ['Buka ventilasi ruangan saat ganti balutan.', 'Ganti kasa kotor segera dan tutup rapat tempat sampah balutan.', 'Tanyakan ke perawat soal balutan penyerap bau. Jangan memakai obat atau cairan tanpa arahan perawat.', 'Catat kapan bau meningkat, TEDUH akan meneruskannya ke perawat.']],
  tamu: ['Anda berhak membatasi tamu demi kenyamanan pasien. Beberapa kalimat yang bisa dipakai:', ['"Ibu sedang menjalani perawatan luka dan kami dibimbing perawat."', '"Terima kasih sudah datang. Kunjungannya kami batasi singkat supaya Ibu bisa istirahat."', '"Doanya saja sudah cukup. Nanti kami kabari kalau Ibu sudah lebih nyaman."']],
  diri: ['Merawat luka setiap hari itu melelahkan, dan pendamping juga perlu dirawat.', ['Bagi tugas dengan keluarga lain, misalnya satu orang menyiapkan alat dan satu orang mencatat.', 'Usahakan makan dan tidur teratur.', 'Jika terasa kewalahan, ceritakan ke perawat paliatif lewat tombol Hubungi perawat.']],
  bantuan: ['Hubungi perawat jika:', ['Bau atau cairan bertambah dibanding hari sebelumnya.', 'Kulit sekitar luka kemerahan atau lecet.', 'Nyeri tidak reda dengan obat yang diresepkan.'], 'Segera cari bantuan jika perdarahan tidak berhenti setelah ditekan sekitar 5 menit, pasien demam, atau pasien sangat lemas.']
};
const MOODS = ['Lelah', 'Cemas', 'Biasa', 'Tenang', 'Lega'];
const PLANS = ['Ganti balutan harian', 'Pakai balutan penyerap bau', 'Jadwalkan kunjungan rumah', 'Rujuk ke dokter onkologi'];

/* ---------- Data awal ---------- */
const state = {};
function initState() {
  const t = Date.now();
  const SEED = [
    [7, { bau: 0, cairan: 1, nyeri: 2, perd: 0, kulit: 0, area: 18.4 }],
    [6, { bau: 0, cairan: 1, nyeri: 2, perd: 0, kulit: 0, area: 18.5 }],
    [5, { bau: 1, cairan: 1, nyeri: 3, perd: 1, kulit: 0, area: 18.7 }],
    [4, { bau: 2, cairan: 2, nyeri: 4, perd: 0, kulit: 1, area: 18.6 }],
    [3, { bau: 1, cairan: 2, nyeri: 3, perd: 0, kulit: 0, area: 18.9 }],
    [2, { bau: 1, cairan: 1, nyeri: 2, perd: 0, kulit: 0, area: 19.0 }],
    [1, { bau: 0, cairan: 1, nyeri: 2, perd: 0, kulit: 0, area: 19.0 }]
  ];
  const checks = SEED.map(([d, a]) => Object.assign({ t: t - d * DAY }, a, evaluate(a, 18.4)));
  const mk = (id, lamp, mins, reasons, dominant, series, age) => ({ id, lamp, createdAt: t - mins * MIN, reasons, dominant, series, age, contacted: false, contactedAt: null, live: false });
  const last = checks[checks.length - 1];
  Object.assign(state, {
    role: state.role || 'keluarga', route: state.route || 'masuk',
    c1: false, c2: false, step: 0, draft: {}, photo: null, scan: 0,
    topic: 'perdarahan', done: {}, mod: null, breathing: false, mood: null,
    selected: null, notes: {}, plan: {}, lastResult: null, fromBantuan: false,
    checks,
    resp: [38, 45, 43, 41],
    queue: [
      Object.assign(mk('P-017', last.lamp, 24 * 60, last.reasons, last.dominant, null, 54), { live: true }),
      mk('P-006', 'merah', 14, ['Perdarahan tidak berhenti setelah ditekan sekitar 5 menit'], 'perdarahan', [12.1, 12.4, 12.2, 12.9, 13.4, 13.6, 14.0], 61),
      mk('P-009', 'kuning', 5 * 60, ['Bau tercium dari dekat walau balutan terpasang', 'Cairan banyak (lebih dari 5 lembar kasa basah)'], 'bau', [8.0, 8.1, 8.1, 8.4, 8.8, 9.0, 9.3], 47),
      mk('P-003', 'kuning', 9 * 60, ['Luas luka bertambah 12% dibanding minggu lalu'], 'cairan', [15.0, 15.3, 15.7, 16.1, 16.4, 16.8, 16.9], 58),
      mk('P-012', 'hijau', 3 * 60, [], 'bau', [6.2, 6.1, 6.0, 6.0, 5.9, 5.8, 5.8], 66),
      mk('P-021', 'hijau', 8 * 60, [], 'cairan', [9.4, 9.4, 9.3, 9.3, 9.2, 9.1, 9.1], 52),
      mk('P-028', 'hijau', 20 * 60, [], 'nyeri', [4.4, 4.4, 4.5, 4.4, 4.3, 4.3, 4.2], 49)
    ]
  });
}
const lastCheck = () => state.checks[state.checks.length - 1];
function refArea(t) {
  const target = t - 7 * DAY;
  let best = null;
  state.checks.forEach(c => { if (t - c.t >= 5 * DAY && (!best || Math.abs(c.t - target) < Math.abs(best.t - target))) best = c; });
  return (best || state.checks[0]).area;
}
function submitCheck(draft, areaOverride) {
  const t = Date.now();
  const lc = lastCheck();
  const a = Object.assign({ demam: false, lemas: false }, draft);
  a.area = areaOverride != null ? areaOverride : round1(lc.area + (score(a) - 4) * 0.06);
  const c = Object.assign({ t }, a, evaluate(a, refArea(t)));
  state.checks.push(c);
  const item = { id: 'P-017', lamp: c.lamp, reasons: c.reasons, dominant: c.dominant, createdAt: t, contacted: false, contactedAt: null, live: true, age: 54, series: null };
  const i = state.queue.findIndex(q => q.id === 'P-017');
  if (i >= 0) state.queue[i] = item; else state.queue.push(item);
  state.lastResult = c;
  return c;
}

/* ---------- Waktu ---------- */
function agoText(t) {
  const m = Math.floor((Date.now() - t) / MIN);
  if (m < 1) return 'baru saja';
  if (m < 60) return m + ' menit lalu';
  const h = Math.floor(m / 60);
  if (h < 24) return h + ' jam lalu';
  const d = Math.floor(h / 24);
  return d === 1 ? 'kemarin' : d + ' hari lalu';
}
function dayLabel(t) {
  const a = new Date(); a.setHours(0, 0, 0, 0);
  const b = new Date(t); b.setHours(0, 0, 0, 0);
  const d = Math.round((a - b) / DAY);
  return d === 0 ? 'Hari ini' : d === 1 ? 'Kemarin' : d + ' hari lalu';
}
const WD = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'];
const limitMin = lamp => lamp === 'merah' ? 60 : lamp === 'kuning' ? 24 * 60 : null;
function limitText(q) {
  const lim = limitMin(q.lamp);
  if (lim == null) return { text: 'Tidak perlu respons', late: false };
  if (q.contacted) return { text: 'Sudah dihubungi', late: false };
  const left = lim - Math.floor((Date.now() - q.createdAt) / MIN);
  if (left < 0) {
    const l = -left;
    return { text: 'Terlambat ' + (l >= 120 ? Math.floor(l / 60) + ' jam' : l + ' menit'), late: true };
  }
  return { text: 'Sisa ' + (left >= 120 ? Math.floor(left / 60) + ' jam' : left + ' menit'), late: false };
}

/* ---------- Grafik ---------- */
function lineChart(pts, aria) {
  const W = 320, H = 140, pl = 32, pr = 12, pt = 12, pb = 26, color = '#1E5A4C';
  const vs = pts.map(p => p.v);
  let lo = Math.min(...vs), hi = Math.max(...vs);
  if (hi - lo < 1) { hi += 0.5; lo -= 0.5; }
  const pad = (hi - lo) * 0.25; lo -= pad; hi += pad;
  const x = i => pl + (pts.length === 1 ? (W - pl - pr) / 2 : i * (W - pl - pr) / (pts.length - 1));
  const y = v => pt + (hi - v) * (H - pt - pb) / (hi - lo);
  const grid = [lo + pad, (lo + hi) / 2, hi - pad].map(v => `<line x1="${pl}" x2="${W - pr}" y1="${y(v).toFixed(1)}" y2="${y(v).toFixed(1)}" stroke="#D3E0D9" stroke-dasharray="3 4"/><text x="${pl - 6}" y="${(y(v) + 3).toFixed(1)}" text-anchor="end">${fmt1(v)}</text>`).join('');
  const d = pts.map((p, i) => `${i ? 'L' : 'M'}${x(i).toFixed(1)} ${y(p.v).toFixed(1)}`).join(' ');
  const dots = pts.map((p, i) => `<circle cx="${x(i).toFixed(1)}" cy="${y(p.v).toFixed(1)}" r="${i === pts.length - 1 ? 5.5 : 3.5}" fill="${i === pts.length - 1 ? color : '#fff'}" stroke="${color}" stroke-width="2"/>`).join('');
  const labels = pts.map((p, i) => (pts.length <= 8 || (pts.length - 1 - i) % 2 === 0) ? `<text x="${x(i).toFixed(1)}" y="${H - 6}" text-anchor="middle">${esc(p.label)}</text>` : '').join('');
  return `<svg viewBox="0 0 ${W} ${H}" role="img" aria-label="${esc(aria)}"><g class="axis">${grid}${labels}</g><path d="${d}" fill="none" stroke="${color}" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>${dots}</svg>`;
}
function spark(series, lamp) {
  const col = lamp === 'merah' ? '#C7433A' : lamp === 'kuning' ? '#D9972B' : '#2F8F63';
  const lo = Math.min(...series), hi = Math.max(...series), r = (hi - lo) || 1;
  const pts = series.map((v, i) => `${(i * 80 / (series.length - 1) + 4).toFixed(1)},${(24 - (v - lo) / r * 18).toFixed(1)}`).join(' ');
  return `<svg viewBox="0 0 88 30" width="88" height="30" aria-hidden="true"><polyline points="${pts}" fill="none" stroke="${col}" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
}
const lampStrip = checks => `<div style="display:flex;gap:6px;flex-wrap:wrap" aria-label="Riwayat lampu">${checks.map(c => `<span class="dot ${c.lamp}" style="width:22px;height:22px" title="${esc(dayLabel(c.t) + ': ' + c.lamp)}"></span>`).join('')}</div>`;

/* ---------- Komponen tampilan ---------- */
const bar = (title, back = true) => `<div class="bar">${back ? `<button class="icon-btn" data-act="back" aria-label="Kembali">${ico('back')}</button>` : ''}<h2>${esc(title)}</h2></div>`;
const navBar = on => `<nav class="nav" aria-label="Menu utama">${[['beranda', 'Beranda', 'home'], ['pindai', 'Cek luka', 'cam'], ['panduan', 'Rawat', 'book'], ['tenang', 'Tenang', 'leaf'], ['laporan', 'Riwayat', 'chart']].map(([id, l, i]) => `<button data-go="${id}" class="${on === id ? 'is-on' : ''}"${on === id ? ' aria-current="page"' : ''}><span class="nv">${ico(i)}</span>${l}</button>`).join('')}</nav>`;
const fab = `<button class="sos-fab" data-go="bantuan">${ico('heart')} Butuh bantuan sekarang</button>`;
const shell = (inner, nav, withFab = true) => `<div class="screen${nav ? ' has-nav' : ''}${nav && withFab ? ' has-fab' : ''}">${inner}</div>${nav ? navBar(nav) : ''}${nav && withFab ? fab : ''}`;

function demoPhoto() {
  let ticks = '';
  for (let i = 0; i <= 10; i++) ticks += `<line x1="${8 + i * 10}" y1="8" x2="${8 + i * 10}" y2="${i % 5 === 0 ? 24 : 17}" stroke="#2A3B35" stroke-width="1.5"/>`;
  return `<svg viewBox="0 0 400 500" preserveAspectRatio="xMidYMid slice" role="img" aria-label="Contoh foto luka berupa gambar abstrak dengan kartu ukur">
    <defs><linearGradient id="sk" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#E9C8B4"/><stop offset="1" stop-color="#D3A68F"/></linearGradient></defs>
    <rect width="400" height="500" fill="url(#sk)"/>
    <ellipse cx="200" cy="230" rx="120" ry="104" fill="#C99882" opacity=".45"/>
    <path d="M128 232c6-40 44-64 82-57 38 7 66 40 57 76-9 36-50 55-86 48-36-7-59-31-53-67z" fill="#B7746A" opacity=".8"/>
    <path d="M155 236c4-24 28-38 52-34 24 5 40 25 34 48-6 22-30 34-52 30-22-5-38-22-34-44z" fill="#D49A8E" opacity=".9"/>
    <g transform="translate(236 336) rotate(-7)">
      <rect width="124" height="86" rx="9" fill="#fff"/>
      ${ticks}
      <rect x="10" y="38" width="22" height="22" rx="4" fill="#C0392B"/><rect x="36" y="38" width="22" height="22" rx="4" fill="#E0B13A"/>
      <rect x="62" y="38" width="22" height="22" rx="4" fill="#3E8E63"/><rect x="88" y="38" width="22" height="22" rx="4" fill="#3B6FB6"/>
      <text x="10" y="78" font-size="11" fill="#2A3B35" font-family="sans-serif">kartu ukur 10 cm</text>
    </g></svg>`;
}

/* ---------- Layar ---------- */
const VIEWS = {
  masuk() {
    return shell(`<div class="welcome">
      <div class="arch-logo">${LOGO}</div>
      <h1 class="h1">TEDUH</h1>
      <p class="lead mt-s">Merawat di rumah, tidak sendirian.</p>
      <div class="field"><label for="hp">Nomor ponsel</label><input id="hp" inputmode="tel" autocomplete="off" value="0812 3456 7890"></div>
      <div class="field"><label for="kode">Kode undangan dari perawat</label><input id="kode" autocomplete="off" value="TDH-4821"></div>
      <div class="mt-l"><button class="btn primary" data-act="login">Masuk</button></div>
      <p class="small mt">Prototipe untuk Lomba Esai WOUNDFEST 2026. Data di sini adalah contoh, bukan data pasien.</p>
    </div>`, null);
  },
  persetujuan() {
    const g = [['Foto luka hanya dilihat perawat yang menangani', 'shield'], ['Foto tidak tersimpan di galeri ponsel', 'shield'], ['TEDUH tidak menggantikan pemeriksaan perawat atau dokter', 'shield']];
    return shell(`${bar('Sebelum mulai')}
      <p class="lead">TEDUH membantu memantau luka dan menghubungkan Anda dengan perawat. Ada tiga jaminan:</p>
      <div class="mt-s">${g.map(([t]) => `<div class="guarantee"><span class="tick">${ico('check')}</span><span>${t}</span></div>`).join('')}</div>
      <div class="stack mt">
        <label class="check${state.c1 ? ' is-on' : ''}"><input type="checkbox" data-chk="c1"${state.c1 ? ' checked' : ''}><span>Saya setuju data dan foto luka diproses untuk pemantauan perawatan.</span></label>
        <label class="check${state.c2 ? ' is-on' : ''}"><input type="checkbox" data-chk="c2"${state.c2 ? ' checked' : ''}><span>Saya setuju perawat menghubungi saya jika hasil cek menunjukkan kondisi mendesak.</span></label>
      </div>
      <div class="mt-l"><button class="btn primary" data-go="beranda"${state.c1 && state.c2 ? '' : ' disabled'}>Setuju dan lanjutkan</button></div>
      <p class="small mt">Anda dapat melihat dan menghapus data kapan saja.</p>`, null);
  },
  beranda() {
    const l = lastCheck();
    const txt = { hijau: 'Hijau, stabil', kuning: 'Kuning, perlu dipantau', merah: 'Merah, perlu bantuan' }[l.lamp];
    return shell(`
      <div class="greet"><h2 class="h2">Selamat pagi, ${esc(CFG.CAREGIVER)}</h2><p class="small">Mendampingi ${esc(CFG.PATIENT)}</p></div>
      <div class="hero"><h1 class="h1">Saatnya cek luka hari ini</h1><p>Sekitar 3 menit</p><button class="btn light" data-act="start">Mulai cek</button></div>
      <div class="mt"><button class="last-lamp" data-go="laporan"><span class="dot ${l.lamp}"></span><span style="flex:1"><strong>Lampu terakhir: ${txt}</strong><br><span class="small">${esc(cap(agoText(l.t)))}</span></span>${ico('back').replace('M15 5l-7 7 7 7', 'M9 5l7 7-7 7')}</button></div>
      <div class="tiles mt">
        <button class="tile" data-go="panduan"><span class="ico">${ico('book')}</span><strong>Panduan rawat</strong></button>
        <button class="tile" data-go="tenang"><span class="ico">${ico('leaf')}</span><strong>Ruang tenang</strong></button>
        <button class="tile" data-act="call-nurse"><span class="ico">${ico('phone')}</span><strong>Hubungi perawat</strong></button>
        <button class="tile" data-go="laporan"><span class="ico">${ico('chart')}</span><strong>Riwayat luka</strong></button>
      </div>
      <div class="nurse-line mt"><span class="avatar">D</span><span><strong>${esc(CFG.NURSE_NAME)} memantau luka ${esc(CFG.PATIENT)}</strong><br><span class="small">${esc(CFG.FACILITY)}</span></span></div>`, 'beranda');
  },
  pindai() {
    const hasPhoto = !!state.photo;
    const img = state.photo === 'demo' ? demoPhoto() : state.photo ? `<img src="${state.photo}" alt="Foto luka yang dipilih">` : '';
    if (state.scan > 0) {
      const steps = ['Mendeteksi kartu ukur', 'Menandai tepi luka', 'Menghitung luas luka'];
      return shell(`${bar('Mengukur luka', false)}
        <div class="finder">${img}<div class="oval"></div><div class="scan"></div></div>
        <div class="steps-ai" aria-live="polite">${steps.map((s, i) => `<div class="step-ai${state.scan > i + 1 ? ' done' : ''}"><span class="tick">${ico('check')}</span>${s}</div>`).join('')}</div>`, 'pindai', false);
    }
    return shell(`${bar('Pindai luka', false)}
      <div class="finder">
        ${hasPhoto ? img : '<svg viewBox="0 0 400 500" aria-hidden="true"><rect width="400" height="500" fill="#2A3B35"/></svg>'}
        <div class="oval"></div>
        <div class="hint">${hasPhoto ? 'Foto siap. Periksa apakah luka dan kartu ukur terlihat jelas.' : 'Letakkan kartu ukur di samping luka. Pastikan cahaya cukup dan jangan pakai lampu kilat.'}</div>
        <div class="badges"><span class="badge${hasPhoto ? ' ok' : ''}"><i></i>Cahaya cukup</span><span class="badge${hasPhoto ? ' ok' : ''}"><i></i>Kartu ukur terdeteksi</span></div>
      </div>
      <div class="stack mt">
        ${hasPhoto
          ? `<button class="btn primary" data-act="use-photo">Gunakan foto ini</button><button class="btn quiet" data-act="retake">Ulangi foto</button>`
          : `<button class="btn primary" data-act="snap">Ambil foto contoh</button>
             <label class="btn quiet file-btn">${ico('cam')} Pakai kamera ponsel<input type="file" accept="image/*" capture="environment" data-file></label>`}
      </div>
      <p class="small mt">Pada prototipe ini foto hanya ditampilkan di perangkat dan tidak diunggah. Pengukuran luka disimulasikan.</p>`, 'pindai');
  },
  gejala() {
    const q = QS[state.step];
    const v = state.draft[q.key];
    const prog = `<div class="progress" aria-label="Langkah ${state.step + 1} dari ${QS.length}">${QS.map((_, i) => `<i class="${i <= state.step ? 'on' : ''}"></i>`).join('')}</div>`;
    let body;
    if (q.pain) {
      body = `<div class="pain">${Array.from({ length: 11 }, (_, i) => `<button data-act="pick" data-key="nyeri" data-val="${i}" class="${v === i ? 'is-on' : ''}" aria-pressed="${v === i}">${i}</button>`).join('')}</div>
        <div class="pain-scale"><span>Tidak nyeri</span><span>Sangat nyeri</span></div>`;
    } else {
      body = `<div class="choices">${q.opts.map(([val, lab]) => `<button class="choice${v === val ? ' is-on' : ''}" data-act="pick" data-key="${q.key}" data-val="${val}" aria-pressed="${v === val}"><span class="rad"></span><span>${lab}</span></button>`).join('')}</div>`;
    }
    if (q.extras) {
      body += `<div class="stack mt"><p class="small">Tambahan, centang jika ada:</p>
        <label class="check${state.draft.demam ? ' is-on' : ''}"><input type="checkbox" data-ex="demam"${state.draft.demam ? ' checked' : ''}><span>Pasien demam</span></label>
        <label class="check${state.draft.lemas ? ' is-on' : ''}"><input type="checkbox" data-ex="lemas"${state.draft.lemas ? ' checked' : ''}><span>Pasien tampak sangat lemas</span></label></div>`;
    }
    const last = state.step === QS.length - 1;
    return shell(`${bar('Cek gejala', false)}${prog}
      <h1 class="h2">${q.q}</h1>${body}
      <div class="row mt-l">
        ${state.step > 0 ? '<button class="btn quiet" data-act="prev">Kembali</button>' : ''}
        <button class="btn primary" data-act="next"${v == null ? ' disabled' : ''}>${last ? 'Lihat hasil' : 'Lanjut'}</button>
      </div>`, 'pindai', false);
  },
  hasil() {
    const c = state.lastResult || lastCheck();
    const ref = refArea(c.t);
    const pct = Math.round((c.area - ref) / ref * 100);
    const copy = {
      hijau: ['Lampu hijau', 'Luka stabil hari ini', 'Tidak ada tanda yang perlu ditindaklanjuti. Lanjutkan perawatan seperti biasa dan cek lagi besok pagi.'],
      kuning: ['Lampu kuning', 'Luka perlu dipantau', CFG.NURSE_NAME + ' sudah diberi tahu dan akan menghubungi paling lambat besok.'],
      merah: ['Lampu merah', 'Luka perlu bantuan segera', 'Hubungi perawat sekarang.']
    }[c.lamp];
    const reasons = c.reasons.length ? `<div class="box ${c.lamp === 'kuning' ? 'soft-warn' : 'soft-alert'} mt"><strong>Yang terdeteksi hari ini</strong><ul class="reasons">${c.reasons.map(r => `<li>${esc(r)}</li>`).join('')}</ul></div>` : '';
    const notes = (c.notes || []).length ? `<p class="small mt-s">${c.notes.map(esc).join('. ')}.</p>` : '';
    const delta = pct === 0 ? 'Sama dengan minggu lalu' : (pct > 0 ? 'Naik ' : 'Turun ') + Math.abs(pct) + '% dibanding minggu lalu';
    const label = DOM_LABEL[c.dominant];
    const cta = c.lamp === 'hijau'
      ? '<button class="btn primary" data-go="panduan">Lihat panduan rawat</button>'
      : `<button class="btn primary" data-act="guide-dom">Lihat panduan ${label}</button><button class="btn quiet" data-act="call-nurse">Hubungi perawat</button>`;
    return shell(`${bar('Hasil cek', false)}
      <div class="lamp-wrap"><div class="lamp ${c.lamp}" role="img" aria-label="${copy[0]}"><span class="glow"></span></div></div>
      <div class="res-title"><span class="pill ${c.lamp}">${copy[0]}</span><h1 class="h1 mt-s">${copy[1]}</h1><p class="lead mt-s">${esc(copy[2])}</p></div>
      ${reasons}
      <div class="box mt"><div class="measure"><div><div class="small">Perkiraan luas luka <span class="sim-tag">Simulasi</span></div><div class="num">${fmt1(c.area)} cm²</div></div><div class="small" style="flex:1">${delta}</div></div></div>
      ${notes}
      <div class="stack mt">${cta}<button class="btn quiet" data-go="beranda">Kembali ke beranda</button></div>`, 'pindai', false);
  },
  panduan() {
    const t = TOPICS.find(x => x.id === state.topic) || TOPICS[0];
    const done = state.done[t.id] || [];
    return shell(`${bar('Panduan rawat', false)}
      <div class="tabs" role="tablist">${TOPICS.map(x => `<button class="tab${x.id === t.id ? ' is-on' : ''}" role="tab" aria-selected="${x.id === t.id}" data-act="topic" data-id="${x.id}">${x.label}</button>`).join('')}</div>
      <button class="video" style="width:100%;border:0" data-act="video" aria-label="Putar video panduan ${t.label}"><span class="play">${ico('play')}</span><span class="len">${t.len}</span></button>
      <div class="todo">${t.steps.map((s, i) => `<div class="todo-item${done.includes(i) ? ' done' : ''}"><span class="no">${done.includes(i) ? ico('check') : i + 1}</span><span class="txt">${esc(s.t)}${s.ask ? '<br><span class="ask">Konsultasikan dengan perawat</span>' : ''}</span><button class="mark" data-act="done" data-id="${t.id}" data-i="${i}" aria-pressed="${done.includes(i)}">${done.includes(i) ? 'Sudah' : 'Tandai'}</button></div>`).join('')}</div>
      <p class="small mt">Perawat dapat melihat langkah yang sudah dijalankan. Konten contoh, perlu divalidasi perawat luka bersertifikat sebelum dipakai.</p>
      <div class="mt"><button class="btn quiet" data-act="call-nurse">${ico('phone')} Tanya perawat</button></div>`, 'panduan');
  },
  tenang() {
    if (state.mod === 'napas') {
      return shell(`<div class="bar"><button class="icon-btn" data-act="mod-close" aria-label="Kembali">${ico('back')}</button><h2>Latihan napas</h2></div>
        <p class="lead">Ikuti lingkaran: tarik napas, tahan sebentar, lalu buang perlahan. Ulangi beberapa kali.</p>
        <div class="breath"><div class="orb" id="orb" aria-live="polite">${state.breathing ? 'Mulai' : 'Siap'}</div></div>
        <div class="mt"><button class="btn primary" data-act="breath">${state.breathing ? 'Berhenti' : 'Mulai latihan'}</button></div>`, 'tenang');
    }
    if (state.mod && ARTICLES[state.mod]) {
      const m = MODS.find(x => x.id === state.mod), a = ARTICLES[state.mod];
      return shell(`<div class="bar"><button class="icon-btn" data-act="mod-close" aria-label="Kembali">${ico('back')}</button><h2>${esc(m.title)}</h2></div>
        <div class="article"><p>${esc(a[0])}</p>${a[1] ? `<ul>${a[1].map(x => `<li>${esc(x)}</li>`).join('')}</ul>` : ''}${a[2] ? `<p>${esc(a[2])}</p>` : ''}</div>
        <p class="small mt">Konten contoh, perlu divalidasi perawat paliatif sebelum dipakai.</p>
        <div class="mt"><button class="btn quiet" data-act="call-nurse">${ico('phone')} Hubungi perawat</button></div>`, 'tenang');
    }
    return shell(`${bar('Ruang tenang', false)}
      <p class="lead">Merawat luka setiap hari itu berat. Ambil jeda beberapa menit untuk diri sendiri.</p>
      <div class="mods mt-s">${MODS.map(m => `<button class="mod" data-act="mod" data-id="${m.id}"><span class="ico">${ico(m.icon)}</span><span><strong>${m.title}</strong><small>${m.sub}</small></span></button>`).join('')}</div>
      <h3 class="h2 mt-l">Bagaimana perasaan Anda hari ini?</h3>
      <div class="moods">${MOODS.map(m => `<button data-act="mood" data-id="${m}" class="${state.mood === m ? 'is-on' : ''}" aria-pressed="${state.mood === m}">${m}</button>`).join('')}</div>
      <div class="mt"><button class="btn quiet" data-act="mood-save"${state.mood ? '' : ' disabled'}>Simpan catatan perasaan</button></div>`, 'tenang');
  },
  laporan() {
    const cs = state.checks.slice(-10);
    const pts = cs.map((c, i) => ({ v: c.area, label: i === cs.length - 1 ? 'Kini' : WD[new Date(c.t).getDay()] }));
    const hist = state.checks.slice(-6).reverse();
    return shell(`${bar('Riwayat luka', false)}
      <div class="chart-box chart"><h3>Luas luka (cm², simulasi)</h3>${lineChart(pts, 'Grafik luas luka dalam sentimeter persegi')}</div>
      <div class="chart-box mt"><h3>Lampu waspada harian</h3><div class="mt-s">${lampStrip(cs)}</div></div>
      <h3 class="h2 mt-l">Catatan terakhir</h3>
      <div class="history">${hist.map(c => `<div class="hist-row"><span class="when">${dayLabel(c.t)}</span><span class="dot ${c.lamp}"></span><span class="what">${esc(c.reasons[0] || 'Stabil')}</span></div>`).join('')}</div>
      <div class="mt"><button class="btn quiet" data-act="export">Siapkan laporan untuk dokter</button></div>`, 'laporan');
  },
  bantuan() {
    const c = state.fromBantuan && state.lastResult && state.lastResult.lamp === 'merah' ? state.lastResult : null;
    return shell(`${bar('Bantuan sekarang', true)}
      <div class="sos">
        ${c ? `<span class="pill merah">Hasil cek hari ini: lampu merah</span>` : ''}
        <h1 class="h1 mt-s">Anda tidak sendirian</h1>
        <p class="mt-s">${c ? 'Ada tanda yang perlu segera dilihat tenaga kesehatan.' : 'Jika merasa tidak aman atau kewalahan, hubungi perawat sekarang. Anda tidak perlu menunggu jadwal.'}</p>
        ${c ? `<ul class="reasons">${c.reasons.map(r => `<li>${esc(r)}</li>`).join('')}</ul>` : ''}
        <div class="stack mt"><button class="btn alert" data-act="call-nurse">${ico('phone')} Hubungi perawat siaga</button><button class="btn quiet" data-act="call-emergency">${ico('phone')} Hubungi ${esc(CFG.EMERGENCY_PHONE)} (darurat)</button></div>
      </div>
      <h3 class="h2 mt-l">Sambil menunggu</h3>
      <ol class="wait-list">
        <li>Tetap bersama pasien dan bantu pasien duduk atau berbaring dengan nyaman.</li>
        <li>Jika ada perdarahan, tekan area itu dengan kain atau kasa bersih sekitar 5 menit. Jangan memakai air hangat.</li>
        <li>Siapkan obat yang sedang dipakai dan catatan terakhir dari TEDUH untuk ditunjukkan ke petugas.</li>
        <li>Jika perawat belum menjawab dalam 15 menit, bawa pasien ke IGD terdekat.</li>
      </ol>
      <div class="stack mt"><button class="btn quiet" data-go="tenang">Latihan napas bersama</button><button class="btn quiet" data-go="beranda">Kondisi sudah aman</button></div>`, null);
  },
  perawat() {
    const order = { merah: 0, kuning: 1, hijau: 2 };
    const qs = state.queue.slice().sort((a, b) => (order[a.lamp] - order[b.lamp]) || (a.contacted - b.contacted) || (a.createdAt - b.createdAt));
    const n = l => state.queue.filter(q => q.lamp === l && !q.contacted).length;
    const avg = Math.round(state.resp.reduce((a, b) => a + b, 0) / state.resp.length);
    return `<div class="screen">
      <div class="bar"><span class="avatar" aria-hidden="true">D</span><h2>Antrean pantauan<br><span class="small" style="font-family:var(--f-body);font-weight:400">${esc(CFG.FACILITY)}</span></h2></div>
      <div class="ntiles">
        <div class="ntile"><b>${state.queue.length}</b><span>Pasien aktif</span></div>
        <div class="ntile merah"><b>${n('merah')}</b><span>Merah</span></div>
        <div class="ntile kuning"><b>${n('kuning')}</b><span>Kuning</span></div>
        <div class="ntile"><b>${avg}</b><span>Menit tanggap</span></div>
      </div>
      <div class="queue">${qs.map(q => {
        const lt = limitText(q);
        const series = q.live ? state.checks.slice(-7).map(c => c.area) : q.series;
        const isNew = q.live && Date.now() - q.createdAt < 60 * MIN && q.lamp !== 'hijau';
        return `<article class="q-item ${q.lamp}">
          <button class="q-head" data-act="open-patient" data-id="${q.id}" aria-label="Buka detail ${q.id}">
            <span><span class="q-code">${q.id}</span>${isNew ? '<span class="new-tag">Baru</span>' : ''}<div class="q-meta">${q.reasons[0] ? esc(q.reasons[0]) : 'Stabil'}</div><div class="q-meta">${esc(cap(agoText(q.createdAt)))}</div></span>
            <span style="text-align:right">${spark(series, q.lamp)}<div class="q-limit${lt.late ? ' late' : ''}">${lt.text}</div></span>
          </button>
          <div class="q-actions"><button class="btn primary" data-act="contact" data-id="${q.id}"${q.contacted ? ' disabled' : ''}>${q.contacted ? 'Sudah dihubungi' : 'Hubungi'}</button><button class="btn quiet" data-act="visit" data-id="${q.id}">Jadwalkan</button></div>
        </article>`;
      }).join('')}</div>
      <p class="small mt">Kode pasien dianonimkan. Nama asli hanya terlihat oleh perawat yang menangani sesuai persetujuan.</p>
    </div>`;
  },
  pasien() {
    const q = state.queue.find(x => x.id === state.selected) || state.queue[0];
    const series = q.live ? state.checks.slice(-7).map(c => c.area) : q.series;
    const pts = series.map((v, i) => ({ v, label: i === series.length - 1 ? 'Kini' : (i + 1) + '' }));
    const lt = limitText(q);
    return `<div class="screen">
      <div class="bar"><button class="icon-btn" data-act="back" aria-label="Kembali">${ico('back')}</button><h2>${q.id}</h2><span class="pill ${q.lamp}">${cap(q.lamp)}</span></div>
      <div class="box"><strong>Gejala dominan: ${esc(DOM_LABEL[q.dominant])}</strong><div class="small mt-s">Usia ${q.age} tahun. ${esc(cap(agoText(q.createdAt)))}. ${lt.text}.</div>
        ${q.reasons.length ? `<ul class="reasons">${q.reasons.map(r => `<li>${esc(r)}</li>`).join('')}</ul>` : ''}</div>
      <div class="chart-box chart mt"><h3>Luas luka 7 pengukuran terakhir (cm²)</h3>${lineChart(pts, 'Tren luas luka')}</div>
      <h3 class="h2 mt-l">Foto terbaru</h3>
      <div class="blur-photos mt-s"><div></div><div></div><div></div></div>
      <p class="small mt-s">Foto diburamkan pada prototipe ini.</p>
      <h3 class="h2 mt-l">Rencana rawat</h3>
      <select class="select mt-s" id="plan" aria-label="Rencana rawat">${PLANS.map(p => `<option${(state.plan[q.id] || PLANS[0]) === p ? ' selected' : ''}>${p}</option>`).join('')}</select>
      <h3 class="h2 mt">Catatan perawat</h3>
      <textarea class="textarea mt-s" id="note" placeholder="Tulis catatan untuk laporan keluarga dan dokter">${esc(state.notes[q.id] || '')}</textarea>
      <div class="stack mt"><button class="btn primary" data-act="save-plan" data-id="${q.id}">Simpan rencana dan catatan</button>
      <div class="row"><button class="btn quiet" data-act="contact" data-id="${q.id}"${q.contacted ? ' disabled' : ''}>${q.contacted ? 'Sudah dihubungi' : 'Hubungi'}</button><button class="btn quiet" data-act="visit" data-id="${q.id}">Jadwalkan kunjungan</button></div></div>
    </div>`;
  }
};

/* ---------- Router dan render ---------- */
const ROLE_OF = { perawat: 'perawat', pasien: 'perawat' };
const BACK = { persetujuan: 'masuk', bantuan: 'beranda', pasien: 'perawat' };
const timers = [];
const clearTimers = () => { while (timers.length) clearTimeout(timers.pop()); };

function go(route) {
  clearTimers();
  state.route = route;
  state.role = ROLE_OF[route] || 'keluarga';
  if (route !== 'pindai') state.scan = 0;
  if (route !== 'tenang') { state.breathing = false; state.mod = null; }
  if (route === 'gejala' && !Object.keys(state.draft).length) state.step = 0;
  state.fromBantuan = false;
  render();
}
function render(keep = false) {
  const app = $('#app');
  const prev = keep ? $('.screen', app) : null;
  const top = prev ? prev.scrollTop : 0;
  app.innerHTML = VIEWS[state.route]();
  const sc = $('.screen', app);
  if (keep && sc) { sc.style.scrollBehavior = 'auto'; sc.scrollTop = top; sc.style.scrollBehavior = ''; }
  syncDemo();
}
function toast(msg) {
  const t = $('#toast');
  t.textContent = msg;
  t.classList.add('show');
  clearTimeout(toast._t);
  toast._t = setTimeout(() => t.classList.remove('show'), 3200);
}
function dial(number, label) {
  if (CFG.REAL_CALLS && number) { location.href = 'tel:' + number; return; }
  toast('Simulasi: memanggil ' + label + '. Isi nomor di js/config.js dan aktifkan REAL_CALLS untuk panggilan nyata.');
}

function beginScan() {
  state.scan = 1;
  render();
  [700, 1400, 2100].forEach((ms, i) => timers.push(setTimeout(() => { if (state.route === 'pindai') { state.scan = i + 2; render(); } }, ms)));
  timers.push(setTimeout(() => {
    if (state.route !== 'pindai') return;
    state.scan = 0; state.draft = {}; state.step = 0;
    go('gejala');
  }, 2800));
}
function finishCheck() {
  const c = submitCheck(state.draft);
  state.draft = {}; state.step = 0; state.photo = null;
  if (c.lamp === 'merah') { go('bantuan'); state.fromBantuan = true; render(); } else go('hasil');
}
function simulate(level) {
  const c = submitCheck(Object.assign({}, PRESET[level]), PRESET[level].area);
  state.draft = {}; state.step = 0; state.photo = null;
  state.c1 = state.c2 = true;
  if (level === 'merah') { go('bantuan'); state.fromBantuan = true; render(); } else go('hasil');
  toast('Hasil ' + level + ' masuk ke dasbor perawat.');
  return c;
}
function breathLoop() {
  const orb = $('#orb');
  if (!orb || !state.breathing || state.route !== 'tenang' || state.mod !== 'napas') return;
  const cycle = [['Tarik napas', true, 4000], ['Tahan', true, 2000], ['Buang perlahan', false, 6000]];
  let i = 0;
  const tick = () => {
    const o = $('#orb');
    if (!o || !state.breathing || state.route !== 'tenang') return;
    const [txt, grow, ms] = cycle[i % 3];
    o.textContent = txt; o.classList.toggle('in', grow);
    i++;
    timers.push(setTimeout(tick, ms));
  };
  tick();
}

/* ---------- Interaksi ---------- */
document.addEventListener('click', e => {
  const goBtn = e.target.closest('[data-go]');
  if (goBtn) { go(goBtn.dataset.go); return; }
  const el = e.target.closest('[data-act]');
  if (!el) return;
  const a = el.dataset.act, id = el.dataset.id;
  switch (a) {
    case 'login': {
      if (!$('#hp').value.trim() || !$('#kode').value.trim()) { toast('Isi nomor ponsel dan kode undangan.'); return; }
      go('persetujuan'); break;
    }
    case 'back': go(BACK[state.route] || 'beranda'); break;
    case 'start': state.photo = null; go('pindai'); break;
    case 'snap': state.photo = 'demo'; render(); break;
    case 'retake': state.photo = null; render(); break;
    case 'use-photo': beginScan(); break;
    case 'pick': {
      state.draft[el.dataset.key] = Number(el.dataset.val);
      render(true); break;
    }
    case 'next': {
      if (state.step < QS.length - 1) { state.step++; render(); } else finishCheck();
      break;
    }
    case 'prev': state.step = Math.max(0, state.step - 1); render(); break;
    case 'guide-dom': {
      const c = state.lastResult || lastCheck();
      state.topic = DOM_TOPIC[c.dominant] || 'perdarahan'; go('panduan'); break;
    }
    case 'topic': state.topic = id; render(); break;
    case 'video': toast('Prototipe: video panduan belum dipasang.'); break;
    case 'done': {
      const arr = state.done[id] || (state.done[id] = []);
      const i = Number(el.dataset.i), k = arr.indexOf(i);
      if (k >= 0) arr.splice(k, 1); else arr.push(i);
      render(true); break;
    }
    case 'mod': state.mod = id; render(); break;
    case 'mod-close': clearTimers(); state.mod = null; state.breathing = false; render(); break;
    case 'breath': {
      state.breathing = !state.breathing; clearTimers(); render();
      if (state.breathing) breathLoop(); break;
    }
    case 'mood': state.mood = id; render(true); break;
    case 'mood-save': toast('Catatan perasaan tersimpan.'); break;
    case 'export': toast('Pada versi lengkap, laporan diekspor ke PDF untuk dokter onkologi.'); break;
    case 'call-nurse': dial(CFG.NURSE_PHONE, CFG.NURSE_NAME); break;
    case 'call-emergency': dial(CFG.EMERGENCY_PHONE, 'layanan darurat ' + CFG.EMERGENCY_PHONE); break;
    case 'open-patient': state.selected = id; go('pasien'); break;
    case 'contact': {
      const q = state.queue.find(x => x.id === id);
      if (!q || q.contacted) return;
      q.contacted = true; q.contactedAt = Date.now();
      if (q.lamp !== 'hijau') state.resp.push(Math.max(1, Math.round((Date.now() - q.createdAt) / MIN)));
      toast('Menghubungi keluarga ' + id + ' (simulasi). Status diperbarui.');
      render(true); break;
    }
    case 'visit': toast('Kunjungan rumah ' + id + ' dijadwalkan besok pagi (contoh).'); break;
    case 'save-plan': {
      state.plan[id] = $('#plan').value; state.notes[id] = $('#note').value;
      toast('Rencana rawat dan catatan disimpan. Keluarga dapat melihatnya di riwayat.'); break;
    }
  }
});
document.addEventListener('change', e => {
  const t = e.target;
  if (t.matches('[data-chk]')) { state[t.dataset.chk] = t.checked; render(true); }
  else if (t.matches('[data-ex]')) { state.draft[t.dataset.ex] = t.checked; render(true); }
  else if (t.matches('[data-file]') && t.files && t.files[0]) { state.photo = URL.createObjectURL(t.files[0]); render(); }
});

/* ---------- Panel demo ---------- */
const JUMPS = [
  ['masuk', 'Masuk'], ['persetujuan', 'Persetujuan'], ['beranda', 'Beranda'], ['pindai', 'Pindai luka'],
  ['gejala', 'Cek gejala'], ['hasil', 'Hasil'], ['panduan', 'Panduan rawat'], ['tenang', 'Ruang tenang'],
  ['laporan', 'Riwayat'], ['bantuan', 'Bantuan'], ['perawat', 'Dasbor perawat'], ['pasien', 'Detail pasien']
];
function openDrawer(open) {
  $('#demoPanel').classList.toggle('open', open);
  $('#scrim').hidden = !open;
  $('#demoToggle').setAttribute('aria-expanded', String(open));
}
function syncDemo() {
  $$('#jumpList button').forEach(b => b.classList.toggle('is-here', b.dataset.to === state.route));
  $$('.seg button').forEach(b => b.classList.toggle('is-on', b.dataset.role === state.role));
}
$('#jumpList').innerHTML = JUMPS.map(([r, l]) => `<button type="button" data-to="${r}">${l}</button>`).join('');
$('#jumpList').addEventListener('click', e => {
  const b = e.target.closest('button'); if (!b) return;
  const r = b.dataset.to;
  if (r === 'gejala') { state.draft = {}; state.step = 0; }
  if (r === 'hasil' && !state.lastResult) { simulate('kuning'); openDrawer(false); return; }
  if (r === 'bantuan') state.fromBantuan = false;
  go(r); openDrawer(false);
});
$('.seg').addEventListener('click', e => {
  const b = e.target.closest('button'); if (!b) return;
  if (b.dataset.role === 'perawat') go('perawat');
  else go(state.role === 'perawat' ? 'beranda' : state.route);
  openDrawer(false);
});
$('.sim').addEventListener('click', e => {
  const b = e.target.closest('button'); if (!b) return;
  simulate(b.dataset.sim); openDrawer(false);
});
$('#resetDemo').addEventListener('click', () => { initState(); go('beranda'); toast('Data demo dikembalikan ke awal.'); openDrawer(false); });
$('#demoToggle').addEventListener('click', () => openDrawer(!$('#demoPanel').classList.contains('open')));
$('#scrim').addEventListener('click', () => openDrawer(false));
document.addEventListener('keydown', e => { if (e.key === 'Escape') openDrawer(false); });

/* ---------- Mulai ---------- */
initState();
render();
if ('serviceWorker' in navigator && location.protocol.indexOf('http') === 0) {
  navigator.serviceWorker.register('sw.js').catch(() => {});
}
})();
