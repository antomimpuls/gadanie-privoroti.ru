// analytics.js - простая аналитика как в Taplink
(function() {
    'use strict';
    
    console.log('✅ Analytics loaded');
    
    // Хранение данных в localStorage
    const STORAGE_KEY = 'tap_analytics_data';
    
    // Получить текущие данные
    function getAnalyticsData() {
        const data = localStorage.getItem(STORAGE_KEY);
        return data ? JSON.parse(data) : {
            totalViews: 0,
            dailyViews: {},
            whatsappClicks: 0,
            linkClicks: 0,
            conversions: 0,
            lastVisit: null
        };
    }
    
    // Сохранить данные
    function saveAnalyticsData(data) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    }
    
    // Отслеживание просмотра страницы
    function trackPageView() {
        const today = new Date().toDateString();
        const data = getAnalyticsData();
        
        data.totalViews++;
        data.dailyViews[today] = (data.dailyViews[today] || 0) + 1;
        data.lastVisit = new Date().toISOString();
        
        saveAnalyticsData(data);
        updateBadge();
        
        console.log('📊 Page view tracked:', data.totalViews);
    }
    
    // Отслеживание кликов по WhatsApp
    function trackWhatsAppClicks() {
        document.addEventListener('click', function(e) {
            const target = e.target.closest('a[href*="whatsapp"], a[href*="wa.me"]');
            if (target) {
                const data = getAnalyticsData();
                data.whatsappClicks++;
                data.conversions++;
                saveAnalyticsData(data);
                
                console.log('📱 WhatsApp click tracked:', data.whatsappClicks);
                updateBadge();
            }
        });
    }
    
    // Отслеживание кликов по ссылкам
    function trackLinkClicks() {
        document.addEventListener('click', function(e) {
            const target = e.target.closest('a');
            if (target && !target.href.includes('whatsapp') && !target.href.includes('wa.me')) {
                const data = getAnalyticsData();
                data.linkClicks++;
                saveAnalyticsData(data);
                
                console.log('🔗 Link click tracked:', data.linkClicks);
                updateBadge();
            }
        });
    }
    
    // Показать badge с статистикой (для админа)
    function updateBadge() {
        if (isAdmin()) {
            const data = getAnalyticsData();
            const today = new Date().toDateString();
            const todayViews = data.dailyViews[today] || 0;
            
            const badge = document.getElementById('analytics-badge') || createBadge();
            badge.innerHTML = `
                <div style="padding: 10px; background: white; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); font-family: Arial, sans-serif;">
                    <div style="font-weight: bold; margin-bottom: 10px;">📊 Статистика</div>
                    <div>👀 Всего: ${data.totalViews}</div>
                    <div>📅 Сегодня: ${todayViews}</div>
                    <div>📱 WhatsApp: ${data.whatsappClicks}</div>
                    <div>🔗 Ссылки: ${data.linkClicks}</div>
                    <div>💰 Конверсия: ${calculateConversion(data)}%</div>
                </div>
            `;
        }
    }
    
    // Создать badge
    function createBadge() {
        const badge = document.createElement('div');
        badge.id = 'analytics-badge';
        badge.style.position = 'fixed';
        badge.style.top = '10px';
        badge.style.right = '10px';
        badge.style.zIndex = '10000';
        badge.style.fontSize = '12px';
        document.body.appendChild(badge);
        return badge;
    }
    
    // Проверить админ ли это
    function isAdmin() {
        return window.location.search.includes('admin=true') || 
               localStorage.getItem('tap_admin') === 'true';
    }
    
    // Расчет конверсии
    function calculateConversion(data) {
        if (data.totalViews === 0) return 0;
        return ((data.conversions / data.totalViews) * 100).toFixed(1);
    }
    
    // Экспорт данных
    window.exportAnalytics = function() {
        const data = getAnalyticsData();
        const csv = Object.entries(data.dailyViews)
            .map(([date, views]) => `${date},${views}`)
            .join('\n');
        
        const blob = new Blob([csv], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `analytics-${new Date().toISOString().split('T')[0]}.csv`;
        a.click();
    };
    
    // Инициализация
    function init() {
        trackPageView();
        trackWhatsAppClicks();
        trackLinkClicks();
        
        // Для админа показываем статистику
        if (isAdmin()) {
            updateBadge();
            
            // Добавляем кнопку экспорта
            const exportBtn = document.createElement('button');
            exportBtn.textContent = '📊 Экспорт';
            exportBtn.style.position = 'fixed';
            exportBtn.style.top = '150px';
            exportBtn.style.right = '10px';
            exportBtn.style.zIndex = '10000';
            exportBtn.style.padding = '5px 10px';
            exportBtn.style.background = '#007bff';
            exportBtn.style.color = 'white';
            exportBtn.style.border = 'none';
            exportBtn.style.borderRadius = '5px';
            exportBtn.style.cursor = 'pointer';
            exportBtn.onclick = window.exportAnalytics;
            document.body.appendChild(exportBtn);
        }
    }
    
    // Запуск
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
    
})();
