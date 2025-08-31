// analytics.js - одно аккуратное окно
const key = 'tap_analytics_data';
const get = () => JSON.parse(localStorage.getItem(key) || '{}');
const save = d => localStorage.setItem(key, JSON.stringify(d));

function format(date) { return date.toISOString().split('T')[0]; }

// ===== ЕДИНОЕ ОКНО =====
function createPanel() {
  if (document.getElementById('analytics-panel')) return;

  const panel = document.createElement('div');
  panel.id = 'analytics-panel';
  panel.style.cssText = `
    position: fixed;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    width: 280px;
    background: #1e1e1e;
    border: 1px solid #3e3e42;
    border-radius: 8px;
    padding: 16px;
    color: #e0e0e0;
    font: 13px/1.4 "Segoe UI", system-ui;
    box-shadow: 0 8px 24px rgba(0,0,0,.6);
    z-index: 10000;
  `;

  panel.innerHTML = `
    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px">
      <b>📊 Аналитика</b>
      <button onclick="closePanel()" style="background:none;border:0;color:#e0e0e0;font-size:16px;cursor:pointer">✖</button>
    </div>

    <label style="display:block;margin-bottom:8px">
      📅 Дата:
      <input type="date" id="datePicker" style="width:100%;background:#252526;border:1px solid #3e3e42;color:#e0e0e0;padding:4px;border-radius:2px">
    </label>

    <div style="margin-bottom:8px">
      👀 Просмотры: <span id="pv">0</span><br>
      📱 WhatsApp: <span id="wa">0</span>
    </div>

    <div style="font-size:11px;color:#9cdcfe;margin-bottom:12px">
      <div>Сегодня: <span id="today">0 / 0</span></div>
      <div>Вчера: <span id="yesterday">0 / 0</span></div>
      <div>Позавчера: <span id="before">0 / 0</span></div>
    </div>

    <button onclick="resetDay()" style="width:100%;background:#d13438;border:0;color:#fff;padding:6px;border-radius:2px;cursor:pointer">
      🗑️ Сбросить день
    </button>
  `;

  document.body.appendChild(panel);
}

// ===== УПРАВЛЕНИЕ =====
function updateStats() {
  const today = new Date();
  const yesterday = new Date(today); yesterday.setDate(today.getDate() - 1);
  const before = new Date(today); before.setDate(today.getDate() - 2);

  const dates = [today, yesterday, before].map(format);
  const data = get();

  // Текущая выбранная дата
  const selected = document.getElementById('datePicker')?.value || format(today);
  const current = data[selected] || { views: 0, whatsapp: 0 };

  document.getElementById('pv').textContent = current.views;
  document.getElementById('wa').textContent = current.whatsapp;

  // Три последних дня
  ['today', 'yesterday', 'before'].forEach((id, i) => {
    const dayData = data[dates[i]] || { views: 0, whatsapp: 0 };
    document.getElementById(id).textContent = `${dayData.views} / ${dayData.whatsapp}`;
  });

  document.getElementById('datePicker') && (document.getElementById('datePicker').value = selected);
}

function resetDay() {
  const date = document.getElementById('datePicker').value;
  const data = get();
  delete data[date];
  save(data);
  updateStats();
}

function closePanel() {
  document.getElementById('analytics-panel')?.remove();
}

// ===== ТРЕКИНГ =====
function track() {
  const today = format(new Date());
  const data = get();
  if (!data[today]) data[today] = { views: 0, whatsapp: 0 };
  data[today].views++;
  save(data);

  document.addEventListener('click', e => {
    const a = e.target.closest('a');
    if (a && (a.href.includes('whatsapp') || a.href.includes('wa.me'))) {
      const date = format(new Date());
      const d = get();
      if (!d[date]) d[date] = { views: 0, whatsapp: 0 };
      d[date].whatsapp++;
      save(data);
      updateStats();
    }
  });
}

// ===== ЗАПУСК =====
(() => {
  track();
  if (location.search.includes('admin=true')) {
    createPanel();
    updateStats();
    document.getElementById('datePicker').addEventListener('change', updateStats);
  }
})();
