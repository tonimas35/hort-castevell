/* ============================================================
   HORT CASTEVELL — Dashboard App
   Reads latest.json + history.json, renders water-drop gauges
   and Chart.js humidity history. Falls back to demo data.
   ============================================================ */

const DATA_URL   = 'data/latest.json';
const HISTORY_URL = 'data/history.json';
const REFRESH_MS  = 60_000;

const THRESHOLD_LOW = 25;  // <25% → critical (red)
const THRESHOLD_MED = 45;  // <45% → warning (orange)

let humidityChart = null;

// ============================================================
//  BOOT
// ============================================================

document.addEventListener('DOMContentLoaded', () => {
  initChart();
  loadData();
  loadHistory(24);
  setInterval(loadData, REFRESH_MS);

  document.querySelectorAll('.btn-period').forEach(btn => {
    btn.addEventListener('click', e => {
      document.querySelectorAll('.btn-period').forEach(b => b.classList.remove('active'));
      e.target.classList.add('active');
      loadHistory(+e.target.dataset.hours);
    });
  });
});

// ============================================================
//  LIVE DATA
// ============================================================

async function loadData() {
  try {
    const r = await fetch(`${DATA_URL}?t=${Date.now()}`);
    if (!r.ok) throw new Error(r.status);
    const d = await r.json();
    if (!d.nodes || d.nodes.length === 0) throw new Error('empty');
    renderDashboard(d);
    setConnected(true);
  } catch {
    setConnected(false);
    renderDashboard(demoData());
    document.getElementById('lastUpdate').textContent = 'DEMO';
  }
}

function renderDashboard(data) {
  // Last update
  if (data.timestamp) {
    const d = new Date(data.timestamp * 1000);
    document.getElementById('lastUpdate').textContent = fmtTime(d);
  }

  // Ambient
  if (data.ambient) {
    setText('ambientTemp', data.ambient.temperature != null ? data.ambient.temperature + '°C' : '—');
    setText('ambientHum',  data.ambient.humidity != null ? data.ambient.humidity + '%' : '—');
    setText('ambientLux',  data.ambient.lux != null ? fmtLux(data.ambient.lux) : '—');
  }

  // Reset all nodes first
  for (let i = 1; i <= 4; i++) resetNode(i);

  // Populate active nodes
  if (data.nodes) data.nodes.forEach(renderNode);
}

// ============================================================
//  NODE RENDERING — Water Drop Gauge
// ============================================================

function renderNode(node) {
  const id = node.id;
  const pct = node.humidity_pct;
  const card = document.getElementById(`node-${id}`);
  if (!card) return;

  // --- Water level (Y position) ---
  // Drop visible area: y=10 (top) to y=125 (bottom), height ~115
  // water-level rect: height=120, so y ranges from 130 (0%) to 10 (100%)
  const waterY = 130 - (pct / 100) * 120;
  const waterEl = document.getElementById(`water-${id}`);
  if (waterEl) waterEl.setAttribute('y', waterY);

  // Wave position follows water
  const waveEl = document.getElementById(`wave-${id}`);
  if (waveEl) waveEl.setAttribute('transform', `translate(0, ${waterY - 4})`);

  // --- Value ---
  setText(`value-${id}`, `${pct}%`);

  // --- Status dot ---
  const dot = document.getElementById(`status-${id}`);
  dot.classList.remove('ok', 'warn', 'critical');
  if (pct < THRESHOLD_LOW) {
    dot.classList.add('critical');
    card.classList.add('alert');
  } else if (pct < THRESHOLD_MED) {
    dot.classList.add('warn');
    card.classList.remove('alert');
  } else {
    dot.classList.add('ok');
    card.classList.remove('alert');
  }

  // --- Battery ---
  if (node.battery_v != null) {
    setText(`battery-${id}`, node.battery_v.toFixed(1) + 'V');
  }

  // --- Last seen ---
  if (node.last_seen_s != null) {
    setText(`seen-${id}`, fmtDuration(node.last_seen_s));
  }
}

function resetNode(id) {
  const card = document.getElementById(`node-${id}`);
  if (!card) return;
  card.classList.remove('alert');

  const dot = document.getElementById(`status-${id}`);
  dot.classList.remove('ok', 'warn', 'critical');

  setText(`value-${id}`, '—');
  setText(`battery-${id}`, '—');
  setText(`seen-${id}`, '—');

  const waterEl = document.getElementById(`water-${id}`);
  if (waterEl) waterEl.setAttribute('y', '130');
}

// ============================================================
//  CHART
// ============================================================

const CHART_COLORS = [
  { border: '#4E7A48', bg: 'rgba(78, 122, 72, 0.08)' },
  { border: '#3B7A8C', bg: 'rgba(59, 122, 140, 0.08)' },
  { border: '#C4673D', bg: 'rgba(196, 103, 61, 0.08)' },
  { border: '#8B6A3E', bg: 'rgba(139, 106, 62, 0.08)' },
];

const CHART_LABELS = [
  'F1 Enciams + Porros',
  'F2 Enciams',
  'F3 Tomàquets',
  'F4 Pebrots + Alb.',
];

function initChart() {
  const ctx = document.getElementById('humidityChart').getContext('2d');

  // Gradient for first dataset
  const grad = ctx.createLinearGradient(0, 0, 0, 280);
  grad.addColorStop(0, 'rgba(78, 122, 72, 0.18)');
  grad.addColorStop(1, 'rgba(78, 122, 72, 0.0)');

  humidityChart = new Chart(ctx, {
    type: 'line',
    data: {
      labels: [],
      datasets: CHART_COLORS.map((c, i) => ({
        label: CHART_LABELS[i],
        borderColor: c.border,
        backgroundColor: i === 0 ? grad : c.bg,
        data: [],
        tension: 0.4,
        pointRadius: 0,
        pointHitRadius: 12,
        pointHoverRadius: 4,
        pointHoverBackgroundColor: c.border,
        borderWidth: 2,
        fill: i === 0,
      })),
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      interaction: { mode: 'index', intersect: false },
      plugins: {
        legend: {
          position: 'bottom',
          labels: {
            usePointStyle: true,
            pointStyle: 'circle',
            boxWidth: 6,
            padding: 16,
            font: { family: "'Outfit', sans-serif", size: 11, weight: '500' },
            color: '#7A6F5E',
          },
        },
        tooltip: {
          backgroundColor: '#3A3225',
          titleFont: { family: "'Outfit', sans-serif", size: 12 },
          bodyFont: { family: "'Outfit', sans-serif", size: 12 },
          cornerRadius: 8,
          padding: 10,
          callbacks: {
            label: ctx => ` ${ctx.dataset.label}: ${ctx.parsed.y}%`,
          },
        },
      },
      scales: {
        y: {
          min: 0,
          max: 100,
          ticks: {
            callback: v => v + '%',
            font: { family: "'Outfit', sans-serif", size: 10 },
            color: '#A69C89',
            maxTicksLimit: 6,
          },
          grid: { color: 'rgba(0,0,0,0.04)', drawBorder: false },
          border: { display: false },
        },
        x: {
          ticks: {
            maxTicksLimit: 8,
            font: { family: "'Outfit', sans-serif", size: 10 },
            color: '#A69C89',
          },
          grid: { display: false },
          border: { display: false },
        },
      },
    },
  });
}

async function loadHistory(hours) {
  try {
    const r = await fetch(`${HISTORY_URL}?t=${Date.now()}`);
    if (!r.ok) throw new Error(r.status);
    const hist = await r.json();
    if (!hist.length) throw new Error('empty');
    const cutoff = Date.now() / 1000 - hours * 3600;
    applyHistory(hist.filter(d => d.timestamp > cutoff));
  } catch {
    applyHistory(demoHistory());
  }
}

function applyHistory(entries) {
  const labels = entries.map(d => fmtTime(new Date(d.timestamp * 1000)));
  const sets = [[], [], [], []];

  entries.forEach(d => {
    for (let i = 0; i < 4; i++) {
      const n = d.nodes?.find(n => n.id === i + 1);
      sets[i].push(n ? n.humidity_pct : null);
    }
  });

  humidityChart.data.labels = labels;
  sets.forEach((s, i) => { humidityChart.data.datasets[i].data = s; });
  humidityChart.update('none');
}

// ============================================================
//  DEMO DATA
// ============================================================

function demoData() {
  return {
    timestamp: Math.floor(Date.now() / 1000),
    ambient: { temperature: 24.2, humidity: 55, lux: 48000 },
    nodes: [
      { id: 1, humidity_pct: 64, humidity_raw: 2100, battery_v: 3.92, last_seen_s: 180 },
      { id: 2, humidity_pct: 58, humidity_raw: 2250, battery_v: 4.01, last_seen_s: 210 },
      { id: 3, humidity_pct: 37, humidity_raw: 2680, battery_v: 3.78, last_seen_s: 150 },
      { id: 4, humidity_pct: 21, humidity_raw: 2980, battery_v: 3.65, last_seen_s: 300 },
    ],
  };
}

function demoHistory() {
  const now = Math.floor(Date.now() / 1000);
  const out = [];
  for (let i = 48; i >= 0; i--) {
    const t = now - i * 1800;
    const hour = new Date(t * 1000).getHours();
    // Simulate: humidity drops during midday heat, rises at night/watering
    const dayEffect = Math.sin((hour - 6) * Math.PI / 12) * 15;
    out.push({
      timestamp: t,
      nodes: [
        { id: 1, humidity_pct: clamp(62 - dayEffect + rnd(4)) },
        { id: 2, humidity_pct: clamp(56 - dayEffect + rnd(5)) },
        { id: 3, humidity_pct: clamp(40 - dayEffect * 0.8 + rnd(4)) },
        { id: 4, humidity_pct: clamp(25 - dayEffect * 0.6 + rnd(3)) },
      ],
    });
  }
  return out;
}

// ============================================================
//  UTILS
// ============================================================

function setText(id, val) {
  const el = document.getElementById(id);
  if (el) el.textContent = val;
}

function setConnected(on) {
  const el = document.getElementById('connectionStatus');
  el.classList.toggle('online', on);
  el.classList.toggle('offline', !on);
  el.querySelector('.conn-text').textContent = on ? 'Connectat' : 'Desconnectat';
}

function fmtTime(d) {
  return d.toLocaleTimeString('ca-ES', { hour: '2-digit', minute: '2-digit' });
}

function fmtDuration(s) {
  if (s < 60) return 'Ara';
  if (s < 3600) return Math.floor(s / 60) + ' min';
  if (s < 86400) return Math.floor(s / 3600) + 'h';
  return Math.floor(s / 86400) + 'd';
}

function fmtLux(lux) {
  return lux >= 10000 ? (lux / 1000).toFixed(0) + 'k lux' : Math.round(lux) + ' lux';
}

function clamp(v) { return Math.round(Math.max(0, Math.min(100, v))); }
function rnd(n) { return (Math.random() - 0.5) * 2 * n; }
