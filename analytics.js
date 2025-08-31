// analytics.js — GitHub Gist + запись через токен
(function () {
  const GIST_ID = '7c53f66e1f8a89f3f0b0519b61e847b9';
  const GIST_URL = `https://gist.githubusercontent.com/antomimpuls/${GIST_ID}/raw/stats.json`;
  const GIST_API = `https://api.github.com/gists/${GIST_ID}`;
  const TOKEN = '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';
  const TODAY = new Date().toISOString().split('T')[0];

  // Показывать только при ?admin=true
  if (new URL(location.href).searchParams.get('admin') !== 'true') return;

  // CSS
  const style = document.createElement('style');
  style.innerHTML = `
    .analytics-badge {
      position: fixed; top: 20px; right: 20px; width: 320px;
      background: linear-gradient(135deg,#2d3748,#4a5568); color: #e2e8f0;
      border-radius: 12px; padding: 20px; box-shadow: 0 8px 20px rgba(0,0,0,.3);
      font-family: system-ui, sans-serif; font-size: 14px; z-index: 9999;
    }
    .analytics-badge .badge-header {
      display: flex; justify-content: space-between; align-items: center;
      margin-bottom: 16px; padding-bottom: 12px; border-bottom: 1px solid #4a5568;
    }
    .analytics-badge .badge-title { font-weight: bold; font-size: 18px; }
    .analytics-badge .close-btn { background: none; border: none; color: #a0aec0; font-size: 24px; cursor: pointer; }
    .analytics-badge .close-btn:hover { color: #fff; }
    .analytics-badge .stat-row { display: flex; justify-content: space-between; margin-bottom: 8px; }
    .analytics-badge .stat-value { font-weight: bold; font-size: 18px; }
    .analytics-badge .last-update { font-size: 12px; color: #a0aec0; text-align: center; }
  `;
  document.head.appendChild(style);

  // HTML
  const badge = document.createElement('div');
  badge.className = 'analytics-badge';
  badge.innerHTML = `
    <div class="badge-header">
      <div class="badge-title">📊 Аналитика</div>
      <button class="close-btn">×</button>
    </div>
    <div class="stat-row"><span>👀 Просмотры:</span><span class="stat-value" id="views-count">0</span></div>
    <div class="stat-row"><span>📱 WhatsApp:</span><span class="stat-value" id="whatsapp-count">0</span></div>
    <div class="last-update" id="last-update">--:--:--</div>
  `;
  document.body.appendChild(badge);

  // Утилиты
  async function fetchStats() {
    try {
      const res = await fetch(GIST_URL + '?t=' + Date.now());
      return await res.json();
    } catch {
      return { [TODAY]: { views: 0, whatsapp: 0 } };
    }
  }

  async function updateStats(type) {
    const data = await fetchStats();
    data[TODAY] = data[TODAY] || { views: 0, whatsapp: 0 };
    data[TODAY][type] += 1;

    await fetch(GIST_API, {
      method: 'PATCH',
      headers: {
        Authorization: `token ${TOKEN}`,
        Accept: 'application/vnd.github.v3+json',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        files: {
          'stats.json': {
            content: JSON.stringify(data, null, 2)
          }
        }
      })
    });
  }

  async function updateUI() {
    const data = await fetchStats();
    const stats = data[TODAY] || { views: 0, whatsapp: 0 };
    document.getElementById('views-count').textContent = stats.views;
    document.getElementById('whatsapp-count').textContent = stats.whatsapp;
    document.getElementById('last-update').textContent = new Date().toLocaleTimeString();
  }

  // Инициализация
  updateStats('views');
  updateUI();
  setInterval(updateUI, 5000);

  // Клик по WhatsApp
  document.addEventListener('click', (e) => {
    if (e.target.closest('a[href*="wa.me"]')) {
      updateStats('whatsapp');
    }
  });
})();

