// analytics.js - расширенная версия с календарем
const key = 'tap_analytics_data';
const get = () => JSON.parse(localStorage.getItem(key) || '{}');
const save = d => localStorage.setItem(key, JSON.stringify(d));

function formatDate(date) {
  return date.toISOString().split('T')[0];
}

function getDayData(date) {
  const d = get();
  return {
    views: d[date]?.views || 0,
    whatsapp: d[date]?.whatsapp || 0
  };
}

// =============== КАЛЕНДАРЬ ===============
function createCalendar() {
  if (document.getElementById('calendar')) return;
  
  const div = document.createElement('div');
  div.id = 'calendar';
  div.style.cssText = 'position:fixed;top:50px;right:10px;background:#1e1e1e;border:1px solid #3e3e42;padding:12px;border-radius:4px;font-size:12px;color:#e0e0e0;z-index:1000';
  
  div.innerHTML = `
    <div style="display:flex;gap:8px;margin-bottom:8px">
      <input type="date" id="datePicker" style="background:#3c3c3c;border:1px solid #3e3e42;color:#e0e0e0;padding:4px">
      <button onclick="showToday()" style="padding:4px 8px;background:#0e639c;border:0;color:#fff;border-radius:2px">Сегодня</button>
    </div>
    <div id="stats">
      <div>📅 <span id="selectedDate"></span></div>
      <div>👀 Просмотры: <span id="dayViews">0</span></div>
      <div>📱 WhatsApp: <span id="dayWhatsApp">0</span></div>
    </div>
    <button onclick="resetCounter()" style="margin-top:8px;background:#d13438">🗑️ Сбросить</button>
  `;
  
  document.body.appendChild(div);
  
  document.getElementById('datePicker').addEventListener('change', updateDateStats);
}

function updateDateStats() {
  const date = document.getElementById('datePicker').value;
  const data = getDayData(date);
  
  document.getElementById('selectedDate').textContent = date;
  document.getElementById('dayViews').textContent = data.views;
  document.getElementById('dayWhatsApp').textContent = data.whatsapp;
}

function showToday() {
  const today = formatDate(new Date());
  document.getElementById('datePicker').value = today;
  updateDateStats();
}

function resetCounter() {
  if (confirm('🗑️ Сбросить счётчик за выбранный день?')) {
    const date = document.getElementById('datePicker').value;
    const d = get();
    delete d[date];
    save(d);
    updateDateStats();
  }
}

// =============== ТРЕКИНГ ===============
function track() {
  const today = formatDate(new Date());
  const d = get();
  if (!d[today]) d[today] = {views: 0, whatsapp: 0};
  d[today].views++;
  save(d);
  
  document.addEventListener('click', e => {
    const a = e.target.closest('a');
    if (a && (a.href.includes('whatsapp') || a.href.includes('wa.me'))) {
      const date = formatDate(new Date());
      const data = get();
      if (!data[date]) data[date] = {views: 0, whatsapp: 0};
      data[date].whatsapp++;
      save(data);
    }
  });
}

// =============== АДМИН БЕЙДЖ ===============
function updateBadge() {
  if (!location.search.includes('admin=true')) return;
  
  const today = new Date();
  const yesterday = new Date(today); yesterday.setDate(yesterday.getDate() - 1);
  const dayBefore = new Date(today); dayBefore.setDate(dayBefore.getDate() - 2);
  
  const todayData = getDayData(formatDate(today));
  const yesterdayData = getDayData(formatDate(yesterday));
  const dayBeforeData = getDayData(formatDate(dayBefore));
  
  let badge = document.getElementById('analytics-calendar');
  if (!badge) {
    badge = document.createElement('div');
    badge.id = 'analytics-calendar';
    badge.style = 'position:fixed;top:10px;right:10px;background:#1e1e1e;border:1px solid #3e3e42;padding:12px;border-radius:4px;font-size:12px;color:#e0e0e0;z-index:1000';
    document.body.appendChild(badge);
  }
  
  badge.innerHTML = `
    <div style="font-weight:bold;margin-bottom:8px">📊 Аналитика</div>
    <div>📅 Сегодня: ${todayData.views} просмотров, ${todayData.whatsapp} WhatsApp</div>
    <div>📅 Вчера: ${yesterdayData.views} просмотров, ${yesterdayData.whatsapp} WhatsApp</div>
    <div>📅 Позавчера: ${dayBeforeData.views} просмотров, ${dayBeforeData.whatsapp} WhatsApp</div>
  `;
}

// =============== ЗАПУСК ===============
(() => {
  track();
  if (location.search.includes('admin=true')) {
    createCalendar();
    showToday();
    setInterval(updateBadge, 1000);
  }
})();
