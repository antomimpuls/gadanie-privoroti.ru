// analytics.js — полностью самодостаточный
(function () {
  // CSS стили
  const style = document.createElement('style');
  style.innerHTML = `
    .analytics-badge {
      position: fixed;
      top: 20px;
      right: 20px;
      width: 320px;
      background: linear-gradient(135deg, #2d3748, #4a5568);
      color: #e2e8f0;
      border-radius: 12px;
      padding: 20px;
      box-shadow: 0 8px 20px rgba(0,0,0,.3);
      border: 1px solid #4a5568;
      font-family: system-ui, sans-serif;
      font-size: 14px;
      z-index: 9999;
    }
    .analytics-badge .badge-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 16px;
      padding-bottom: 12px;
      border-bottom: 1px solid #4a5568;
    }
    .analytics-badge .badge-title {
      font-weight: bold;
      font-size: 18px;
    }
    .analytics-badge .close-btn {
      background: none;
      border: none;
      color: #a0aec0;
      font-size: 24px;
      cursor: pointer;
    }
    .analytics-badge .close-btn:hover {
      color: #fff;
    }
    .analytics-badge .date-picker {
      width: 100%;
      padding: 8px;
      border-radius: 6px;
      border: 1px solid #4a5568;
      background: #1a202c;
      color: white;
      margin-bottom: 12px;
    }
    .analytics-badge .quick-buttons {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 8px;
      margin-bottom: 12px;
    }
    .analytics-badge .quick-btn {
      padding: 8px;
      background: #4a5568;
      border: none;
      border-radius: 6px;
      color: white;
      cursor: pointer;
    }
    .analytics-badge .quick-btn:hover {
      background: #2d3748;
    }
    .analytics-badge .stat-row {
      display: flex;
      justify-content: space-between;
      margin-bottom: 8px;
    }
    .analytics-badge .stat-value {
      font-weight: bold;
      font-size: 18px;
    }
    .analytics-badge .date-info,
    .analytics-badge .last-update,
    .analytics-badge .footer {
      font-size: 12px;
      color: #a0aec0;
      text-align: center;
      margin-top: 8px;
    }
  `;
  document.head.appendChild(style);

  // HTML структура
  const badge = document.createElement('div');
  badge.className = 'analytics-badge';
  badge.innerHTML = `
    <div class="badge-header">
      <div class="badge-title">📊 Аналитика</div>
      <button class="close-btn">×</button>
    </div>
    <input type="date" class="date-picker" id="stats-date-picker">
    <div class="quick-buttons">
      <button class="quick-btn" id="btn-today">Сегодня</button>
      <button class="quick-btn" id="btn-yesterday">Вчера</button>
    </div>
    <div class="stat-row">
      <span>👀 Просмотры:</span>
      <span class="stat-value" id="views-count">0</span>
    </div>
    <div class="stat-row">
      <span>📱 WhatsApp:</span>
      <span class="stat-value" id="whatsapp-count">0</span>
    </div>
    <div class="date-info" id="date-stats">Сегодня</div>
    <div class="last-update" id="last-update">--:--:--</div>
    <div class="footer">🌍 Все устройства | Обновление каждые 3 сек</div>
  `;
  document.body.appendChild(badge);

  // Утилиты
  const formatDate = (date = new Date()) => date.toISOString().split('T')[0];
  const getYesterday = () => {
    const d = new Date();
    d.setDate(d.getDate() - 1);
    return formatDate(d);
  };

  // Менеджер статистики
  const STORAGE_KEY = 'global-stats-data';
  async function getStats() {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEY)) || {};
    } catch {
      return {};
    }
  }
  async function saveStats(data) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  }
  async function updateUI() {
    const date = badge.querySelector('#stats-date-picker').value || formatDate();
    const stats = (await getStats())[date] || { views: 0, whatsapp: 0 };
    badge.querySelector('#views-count').textContent = stats.views;
    badge.querySelector('#whatsapp-count').textContent = stats.whatsapp;
    badge.querySelector('#date-stats').textContent = new Date(date).toLocaleDateString('ru-RU', {
      day: 'numeric',
      month: 'long'
    }) + (date === formatDate() ? ' (Сегодня)' : '');
    badge.querySelector('#last-update').textContent = new Date().toLocaleTimeString();
  }
  async function increment(type) {
    const date = formatDate();
    const data = await getStats();
    data[date] = data[date] || { views: 0, whatsapp: 0 };
    data[date][type]++;
    await saveStats(data);
    updateUI();
  }

  // События
  badge.querySelector('#stats-date-picker').value = formatDate();
  badge.querySelector('#stats-date-picker').addEventListener('change', updateUI);
  badge.querySelector('#btn-today').addEventListener('click', () => {
    badge.querySelector('#stats-date-picker').value = formatDate();
    updateUI();
  });
  badge.querySelector('#btn-yesterday').addEventListener('click', () => {
    badge.querySelector('#stats-date-picker').value = getYesterday();
    updateUI();
  });
  badge.querySelector('.close-btn').addEventListener('click', () => badge.remove());

  // Авто-вставка счётчиков
  const url = new URL(location.href);
  if (url.searchParams.get('admin') === 'true') {
    updateUI();
    setInterval(updateUI, 3000);
    // Авто-увеличение просмотров
    increment('views');
  }

  // Глобальный доступ
  window.GlobalStats = {
    track: increment,
    update: updateUI
  };
})();
