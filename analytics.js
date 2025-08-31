// analytics.js - синхронизированная аналитика с моментальным обновлением
(function() {
    'use strict';
    
    console.log('✅ Analytics loaded (sync version)');
    
    // ===== ОБЩИЙ API ДЛЯ ВСЕХ КОМПОНЕНТОВ =====
    window.AnalyticsAPI = {
        STORAGE_KEY: 'tap_analytics_data',
        
        getData() {
            try {
                const data = localStorage.getItem(this.STORAGE_KEY);
                return data ? JSON.parse(data) : this.getDefaultData();
            } catch (e) {
                console.error('Analytics error:', e);
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
        
        saveData(data) {
            try {
                localStorage.setItem(this.STORAGE_KEY, JSON.stringify(data));
                this.broadcastUpdate(); // Уведомляем все компоненты
            } catch (e) {
                console.error('Analytics save error:', e);
            }
        },
        
        // Моментальное обновление всех компонентов
        broadcastUpdate() {
            const data = this.getData();
            const today = new Date().toDateString();
            const todayViews = data.dailyViews[today] || 0;
            const conversionRate = this.calculateConversion(data);
            
            // Обновляем бейдж админа
            this.updateAdminBadge(data, todayViews, conversionRate);
            
            // Обновляем панель управления (если открыта)
            this.updateAdminPanel(data, todayViews, conversionRate);
            
            // Триггер события для других компонентов
            window.dispatchEvent(new CustomEvent('analyticsUpdated', { 
                detail: { data, todayViews, conversionRate } 
            }));
        },
        
        updateAdminBadge(data, todayViews, conversionRate) {
            if (!window.location.search.includes('admin=true') && 
                localStorage.getItem('tap_admin') !== 'true') return;
                
            let badge = document.getElementById('analytics-badge');
            if (!badge) {
                badge = this.createBadge();
            }
            
            badge.innerHTML = `
                <div style="padding: 10px; background: rgba(255, 255, 255, 0.95); border: 1px solid #ddd; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); font-family: Arial, sans-serif; font-size: 12px; color: #333;">
                    <div style="font-weight: bold; margin-bottom: 8px; color: #2c3e50;">📊 Аналитика</div>
                    <div style="margin-bottom: 4px;">👀 Всего: <strong>${data.totalViews}</strong></div>
                    <div style="margin-bottom: 4px;">📅 Сегодня: <strong>${todayViews}</strong></div>
                    <div style="margin-bottom: 4px;">📱 WhatsApp: <strong>${data.whatsappClicks}</strong></div>
                    <div style="margin-bottom: 4px;">🔗 Ссылки: <strong>${data.linkClicks}</strong></div>
                    <div>💰 Конверсия: <strong>${conversionRate}%</strong></div>
                </div>
            `;
        },
        
        updateAdminPanel(data, todayViews, conversionRate) {
            // Обновление панели управления
            const totalViewsEl = document.getElementById('totalViews');
            if (totalViewsEl) {
                totalViewsEl.textContent = data.totalViews;
                document.getElementById('todayViews').textContent = todayViews;
                document.getElementById('whatsappClicks').textContent = data.whatsappClicks;
                document.getElementById('conversionRate').textContent = conversionRate + '%';
            }
        },
        
        createBadge() {
            const badge = document.createElement('div');
            badge.id = 'analytics-badge';
            badge.style.cssText = 'position: fixed; top: 10px; right: 10px; z-index: 10000; font-size: 12px;';
            document.body.appendChild(badge);
            return badge;
        },
        
        calculateConversion(data) {
            return data.totalViews === 0 ? '0.0' : ((data.whatsappClicks / data.totalViews) * 100).toFixed(1);
        },
        
        // Для экспорта
        exportData() {
            const data = this.getData();
            let csv = 'Дата,Просмотры\n';
            const sortedDates = Object.keys(data.dailyViews).sort();
            
            sortedDates.forEach(date => {
                const formattedDate = new Date(date).toLocaleDateString('ru-RU');
                csv += `${formattedDate},${data.dailyViews[date]}\n`;
            });
            
            csv += `\nОбщая статистика:\n`;
            csv += `Всего просмотров,${data.totalViews}\n`;
            csv += `Клики WhatsApp,${data.whatsappClicks}\n`;
            csv += `Клики по ссылкам,${data.linkClicks}\n`;
            csv += `Конверсия (%),${this.calculateConversion(data)}\n`;
            
            const blob = new Blob(["\uFEFF" + csv], { type: 'text/csv;charset=utf-8;' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `analytics-${new Date().toISOString().split('T')[0]}.csv`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        }
    };
    
    // ===== ОСНОВНЫЕ ФУНКЦИИ =====
    
    function trackPageView() {
        const today = new Date().toDateString();
        const data = window.AnalyticsAPI.getData();
        
        data.totalViews++;
        data.dailyViews[today] = (data.dailyViews[today] || 0) + 1;
        data.lastVisit = new Date().toISOString();
        
        window.AnalyticsAPI.saveData(data);
        console.log('📊 Page view tracked:', data.totalViews);
    }
    
    function trackWhatsAppClicks() {
        document.addEventListener('click', function(e) {
            const target = e.target.closest('a[href*="whatsapp"], a[href*="wa.me"]');
            if (target) {
                const data = window.AnalyticsAPI.getData();
                data.whatsappClicks++;
                data.conversions++;
                window.AnalyticsAPI.saveData(data);
                console.log('📱 WhatsApp click tracked:', data.whatsappClicks);
            }
        }, true);
    }
    
    function trackOtherLinkClicks() {
        document.addEventListener('click', function(e) {
            const target = e.target.closest('a');
            if (target && target.href && !target.href.includes('whatsapp') && !target.href.includes('wa.me')) {
                const data = window.AnalyticsAPI.getData();
                data.linkClicks++;
                window.AnalyticsAPI.saveData(data);
                console.log('🔗 Link click tracked:', data.linkClicks);
            }
        }, true);
    }
    
    // ===== АВТОМАТИЧЕСКОЕ ОБНОВЛЕНИЕ =====
    
    function init() {
        trackPageView();
        trackWhatsAppClicks();
        trackOtherLinkClicks();
        
        // Моментальное обновление при загрузке
        window.AnalyticsAPI.broadcastUpdate();
        
        // Обновление каждые 2 секунды для админа
        if (window.location.search.includes('admin=true') || 
            localStorage.getItem('tap_admin') === 'true') {
            setInterval(() => window.AnalyticsAPI.broadcastUpdate(), 2000);
        }
    }
    
    // ===== ЗАПУСК =====
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
    
})();
