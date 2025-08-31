// analytics.js - простая аналитика как в Taplink
(function() {
    'use strict';
    
    console.log('✅ Analytics loaded');
    
    // Ключ для хранения данных в localStorage
    const STORAGE_KEY = 'tap_analytics_data';
    
    // Получить текущие данные из localStorage или вернуть объект по умолчанию
    function getAnalyticsData() {
        try {
            const data = localStorage.getItem(STORAGE_KEY);
            return data ? JSON.parse(data) : getDefaultDataStructure();
        } catch (e) {
            console.error('Ошибка при получении данных аналитики из localStorage:', e);
            return getDefaultDataStructure();
        }
    }
    
    // Вернуть объект структуры данных по умолчанию
    function getDefaultDataStructure() {
        return {
            totalViews: 0,
            dailyViews: {}, // { "Sat Dec 14 2024": 5, ... }
            whatsappClicks: 0,
            linkClicks: 0,
            conversions: 0, // Клики по WhatsApp
            lastVisit: null // ISO строка даты последнего визита
        };
    }
    
    // Сохранить данные в localStorage
    function saveAnalyticsData(data) {
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
        } catch (e) {
            console.error('Ошибка при сохранении данных аналитики в localStorage:', e);
        }
    }
    
    // Отслеживание просмотра страницы
    function trackPageView() {
        const today = new Date().toDateString(); // e.g., "Sat Dec 14 2024"
        const data = getAnalyticsData();
        
        data.totalViews++;
        data.dailyViews[today] = (data.dailyViews[today] || 0) + 1;
        data.lastVisit = new Date().toISOString(); // Сохраняем точное время
        
        saveAnalyticsData(data);
        updateBadge(); // Обновляем админ-панель, если она активна
        
        console.log('📊 Page view tracked:', data.totalViews);
    }
    
    // Отслеживание кликов по WhatsApp
    function trackWhatsAppClicks() {
        // Используем capture: true, чтобы поймать событие до того, как страница может уйти
        document.addEventListener('click', function(e) {
            // Проверяем, кликнули ли мы по ссылке, содержащей whatsapp или wa.me
            const target = e.target.closest('a[href*="whatsapp"], a[href*="wa.me"]');
            if (target) {
                const data = getAnalyticsData();
                data.whatsappClicks++;
                data.conversions++; // conversions идентичны whatsappClicks в этой логике
                saveAnalyticsData(data);
                
                console.log('📱 WhatsApp click tracked:', data.whatsappClicks);
                updateBadge(); // Обновляем админ-панель, если она активна
            }
        }, true); // capture: true
    }
    
    // Отслеживание кликов по другим ссылкам
    function trackOtherLinkClicks() {
        // Используем capture: true
        document.addEventListener('click', function(e) {
            const target = e.target.closest('a');
            // Проверяем, что это ссылка, и она НЕ ведет на whatsapp/wa.me
            if (target && 
                target.href && 
                !target.href.includes('whatsapp') && 
                !target.href.includes('wa.me')) {
                
                const data = getAnalyticsData();
                data.linkClicks++;
                saveAnalyticsData(data);
                
                console.log('🔗 Other link click tracked:', data.linkClicks);
                updateBadge(); // Обновляем админ-панель, если она активна
            }
        }, true); // capture: true
    }
    
    // Показать badge с статистикой (для админа)
    function updateBadge() {
        if (isAdmin()) {
            const data = getAnalyticsData();
            const today = new Date().toDateString();
            const todayViews = data.dailyViews[today] || 0;
            const conversionRate = calculateConversion(data);
            
            let badge = document.getElementById('analytics-badge');
            if (!badge) {
                badge = createBadge();
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
        }
    }
    
    // Создать элемент badge
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
    
    // Проверить, является ли пользователь админом
    function isAdmin() {
        // Проверка параметра URL ?admin=true
        const urlParams = new URLSearchParams(window.location.search);
        if (urlParams.get('admin') === 'true') {
            // Автоматически устанавливаем флаг в localStorage для будущих посещений
            try {
                localStorage.setItem('tap_admin', 'true');
            } catch (e) {
                console.error('Не удалось сохранить флаг админа в localStorage:', e);
            }
            return true;
        }
        // Проверка флага в localStorage
        try {
            return localStorage.getItem('tap_admin') === 'true';
        } catch (e) {
            console.error('Ошибка при проверке флага админа в localStorage:', e);
            return false;
        }
    }
    
    // Расчет конверсии (процент WhatsApp кликов от общих просмотров)
    function calculateConversion(data) {
        if (data.totalViews === 0) return (0).toFixed(1);
        return ((data.whatsappClicks / data.totalViews) * 100).toFixed(1);
    }
    
    // Функция экспорта данных (доступна глобально как window.exportAnalytics)
    window.exportAnalytics = function() {
        try {
            const data = getAnalyticsData();
            let csvContent = "Дата,Просмотры\n"; // Заголовки CSV
            
            // Сортируем даты
            const sortedDates = Object.keys(data.dailyViews).sort((a, b) => new Date(a) - new Date(b));
            
            sortedDates.forEach(date => {
                 // Форматируем дату для CSV как DD.MM.YYYY
                const formattedDate = new Date(date).toLocaleDateString('ru-RU');
                const views = data.dailyViews[date];
                csvContent += `${formattedDate},${views}\n`;
            });
            
            // Добавляем общую статистику в конец CSV
            csvContent += `\nОбщая статистика\n`;
            csvContent += `Всего просмотров,${data.totalViews}\n`;
            csvContent += `Клики WhatsApp,${data.whatsappClicks}\n`;
            csvContent += `Клики по другим ссылкам,${data.linkClicks}\n`;
            csvContent += `Конверсия (%),${calculateConversion(data)}\n`;
            csvContent += `Последний визит,${data.lastVisit ? new Date(data.lastVisit).toLocaleString('ru-RU') : 'Нет данных'}\n`;
            
            // Создаем и скачиваем CSV файл
            const blob = new Blob(["\uFEFF" + csvContent], { type: 'text/csv;charset=utf-8;' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `analytics-export-${new Date().toISOString().split('T')[0]}.csv`;
            document.body.appendChild(a); // Необходимо для Firefox
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url); // Освобождаем память
            
            console.log('📤 Analytics data exported');
        } catch (e) {
            console.error('Ошибка при экспорте данных:', e);
            alert('Произошла ошибка при экспорте данных.');
        }
    };
    
    // Инициализация аналитики
    function init() {
        trackPageView();
        trackWhatsAppClicks();
        trackOtherLinkClicks();
        
        // Для админа показываем статистику и кнопку экспорта
        if (isAdmin()) {
            updateBadge();
            
            // Добавляем кнопку экспорта
            let exportBtn = document.getElementById('analytics-export-btn');
            if (!exportBtn) {
                exportBtn = document.createElement('button');
                exportBtn.id = 'analytics-export-btn';
                exportBtn.textContent = '📤 Экспорт';
                exportBtn.style.position = 'fixed';
                exportBtn.style.top = '180px'; // Ниже бейджа
                exportBtn.style.right = '10px';
                exportBtn.style.zIndex = '10000';
                exportBtn.style.padding = '6px 12px';
                exportBtn.style.background = '#007bff';
                exportBtn.style.color = 'white';
                exportBtn.style.border = 'none';
                exportBtn.style.borderRadius = '4px';
                exportBtn.style.cursor = 'pointer';
                exportBtn.style.fontSize = '12px';
                exportBtn.style.boxShadow = '0 2px 5px rgba(0,0,0,0.2)';
                exportBtn.onclick = window.exportAnalytics;
                document.body.appendChild(exportBtn);
            }
        }
    }
    
    // Запуск после полной загрузки DOM
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
    
})();
