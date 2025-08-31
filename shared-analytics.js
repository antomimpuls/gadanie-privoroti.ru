// shared-analytics.js - подключите в index.html и панель управления
window.AnalyticsAPI = {
    STORAGE_KEY: 'tap_analytics_data',
    
    getData() {
        try {
            return JSON.parse(localStorage.getItem(this.STORAGE_KEY) || '{}');
        } catch {
            return this.getDefaultData();
        }
    },
    
    getDefaultData() {
        return {
            totalViews: 0,
            dailyViews: {},
            whatsappClicks: 0,
            linkClicks: 0,
            conversions: 0,
            lastVisit: null
        };
    },
    
    updateDisplay() {
        const data = this.getData();
        const today = new Date().toDateString();
        const todayViews = data.dailyViews[today] || 0;
        const conversion = data.totalViews > 0 ? ((data.whatsappClicks / data.totalViews) * 100).toFixed(1) : '0';
        
        // Обновляем бейдж админа
        const badge = document.getElementById('analytics-badge');
        if (badge) {
            badge.innerHTML = `
                <div style="padding: 10px; background: rgba(255, 255, 255, 0.95); border: 1px solid #ddd; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); font-family: Arial, sans-serif; font-size: 12px; color: #333;">
                    <div style="font-weight: bold; margin-bottom: 8px; color: #2c3e50;">📊 Аналитика</div>
                    <div style="margin-bottom: 4px;">👀 Всего: <strong>${data.totalViews}</strong></div>
                    <div style="margin-bottom: 4px;">📅 Сегодня: <strong>${todayViews}</strong></div>
                    <div style="margin-bottom: 4px;">📱 WhatsApp: <strong>${data.whatsappClicks}</strong></div>
                    <div style="margin-bottom: 4px;">🔗 Ссылки: <strong>${data.linkClicks}</strong></div>
                    <div>💰 Конверсия: <strong>${conversion}%</strong></div>
                </div>
            `;
        }
        
        // Обновляем панель управления
        if (document.getElementById('totalViews')) {
            document.getElementById('totalViews').textContent = data.totalViews;
            document.getElementById('todayViews').textContent = todayViews;
            document.getElementById('whatsappClicks').textContent = data.whatsappClicks;
            document.getElementById('conversionRate').textContent = conversion + '%';
        }
    },
    
    forceUpdate() {
        this.updateDisplay();
        // Запускаем обновление каждые 2 секунды
        setInterval(() => this.updateDisplay(), 2000);
    }
};