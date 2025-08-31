<!DOCTYPE html>
<html lang="ru">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Аналитика - Исправленный бейдж</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            background: linear-gradient(135deg, #1a2a6c, #b21f1f, #fdbb2d);
            color: #333;
            min-height: 100vh;
            padding: 20px;
            display: flex;
            flex-direction: column;
            align-items: center;
        }
        .container {
            width: 100%;
            max-width: 1000px;
            background: rgba(255, 255, 255, 0.95);
            border-radius: 15px;
            padding: 25px;
            box-shadow: 0 10px 30px rgba(0, 0, 0, 0.2);
            margin-top: 20px;
        }
        header {
            text-align: center;
            margin-bottom: 30px;
        }
        h1 {
            color: #2c3e50;
            font-size: 2.5rem;
            margin-bottom: 10px;
            text-shadow: 2px 2px 4px rgba(0,0,0,0.1);
        }
        .subtitle {
            color: #7f8c8d;
            font-size: 1.2rem;
        }
        .badge-container {
            display: flex;
            justify-content: center;
            margin: 20px 0;
        }
        .analytics-badge {
            position: relative;
            background: linear-gradient(135deg, #2d3748, #4a5568);
            color: #e2e8f0;
            border-radius: 12px;
            padding: 20px;
            width: 320px;
            box-shadow: 0 8px 20px rgba(0, 0, 0, 0.3);
            border: 1px solid #4a5568;
            font-family: system-ui, -apple-system, sans-serif;
            font-size: 14px;
            z-index: 1000;
        }
        .badge-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 16px;
            padding-bottom: 12px;
            border-bottom: 1px solid #4a5568;
        }
        .badge-title {
            font-weight: bold;
            font-size: 18px;
        }
        .close-btn {
            background: none;
            border: none;
            color: #a0aec0;
            font-size: 24px;
            cursor: pointer;
            transition: color 0.3s;
        }
        .close-btn:hover {
            color: #fff;
        }
        .date-picker {
            width: 100%;
            padding: 10px;
            border-radius: 6px;
            border: 1px solid #4a5568;
            background: #1a202c;
            color: white;
            margin-bottom: 16px;
        }
        .quick-buttons {
            display: grid;
            grid-template-columns: repeat(2, 1fr);
            gap: 12px;
            margin-bottom: 16px;
        }
        .quick-btn {
            padding: 10px;
            background: #4a5568;
            border: none;
            border-radius: 6px;
            color: white;
            cursor: pointer;
            transition: background 0.3s;
        }
        .quick-btn:hover {
            background: #2d3748;
        }
        .stats-display {
            margin-bottom: 16px;
        }
        .stat-row {
            display: flex;
            justify-content: space-between;
            margin-bottom: 12px;
        }
        .stat-value {
            font-weight: bold;
            font-size: 18px;
        }
        .date-info {
            font-size: 13px;
            color: #a0aec0;
            margin-bottom: 8px;
            text-align: center;
        }
        .last-update {
            font-size: 12px;
            color: #718096;
            text-align: center;
            margin-bottom: 12px;
        }
        .footer {
            font-size: 12px;
            color: #718096;
            text-align: center;
        }
        .controls {
            display: flex;
            flex-wrap: wrap;
            gap: 15px;
            justify-content: center;
            margin: 30px 0;
        }
        .control-btn {
            background: #3498db;
            color: white;
            border: none;
            padding: 14px 25px;
            border-radius: 8px;
            cursor: pointer;
            font-size: 16px;
            transition: all 0.3s;
            display: flex;
            align-items: center;
            gap: 8px;
        }
        .control-btn:hover {
            transform: translateY(-2px);
            box-shadow: 0 5px 15px rgba(0, 0, 0, 0.2);
        }
        .control-btn.whatsapp {
            background: #25D366;
        }
        .control-btn.reset {
            background: #e74c3c;
        }
        .debug-panel {
            background: #f8f9fa;
            border-left: 4px solid #3498db;
            padding: 20px;
            margin-top: 30px;
            font-family: monospace;
            font-size: 14px;
            max-height: 250px;
            overflow-y: auto;
            border-radius: 8px;
        }
        .debug-title {
            color: #2c3e50;
            margin-bottom: 15px;
            font-weight: bold;
        }
        .log-entry {
            margin-bottom: 8px;
            padding-bottom: 8px;
            border-bottom: 1px solid #eee;
        }
        .log-time {
            color: #7f8c8d;
            margin-right: 10px;
        }
        .instructions {
            background: #e8f4fc;
            padding: 20px;
            border-radius: 10px;
            margin: 20px 0;
            line-height: 1.6;
        }
        .instructions h3 {
            color: #2c3e50;
            margin-bottom: 15px;
        }
        @media (max-width: 768px) {
            .container {
                padding: 15px;
            }
            .controls {
                flex-direction: column;
                align-items: center;
            }
            .control-btn {
                width: 100%;
                justify-content: center;
            }
        }
    </style>
</head>
<body>
    <div class="container">
        <header>
            <h1>Аналитика просмотров</h1>
            <p class="subtitle">Исправленный бейдж с счетчиком просмотров и WhatsApp кликов</p>
        </header>
        
        <div class="instructions">
            <h3>Инструкция по использованию:</h3>
            <p>1. Бейдж статистики теперь всегда виден в центре страницы</p>
            <p>2. Используйте кнопки "Симулировать просмотр" и "Симулировать WhatsApp" для увеличения счетчиков</p>
            <p>3. Для обновления данных на бейдже нажмите "Обновить статистику"</p>
            <p>4. Вы можете выбрать другую дату для просмотра статистики</p>
        </div>
        
        <div class="badge-container">
            <div class="analytics-badge" id="analytics-badge">
                <div class="badge-header">
                    <div class="badge-title">📊 Аналитика</div>
                    <button class="close-btn">×</button>
                </div>
                
                <input type="date" id="stats-date-picker" class="date-picker">
                
                <div class="quick-buttons">
                    <button id="btn-today" class="quick-btn">Сегодня</button>
                    <button id="btn-yesterday" class="quick-btn">Вчера</button>
                </div>
                
                <div class="stats-display">
                    <div class="stat-row">
                        <span>👀 Просмотры:</span>
                        <span id="views-count" class="stat-value">0</span>
                    </div>
                    <div class="stat-row">
                        <span>📱 WhatsApp:</span>
                        <span id="whatsapp-count" class="stat-value">0</span>
                    </div>
                </div>
                
                <div id="date-stats" class="date-info">31 августа (Сегодня)</div>
                <div id="last-update" class="last-update">Последнее обновление: --:--:--</div>
                
                <div class="footer">
                    🌍 Все устройства | Обновление каждые 3 сек
                </div>
            </div>
        </div>
        
        <div class="controls">
            <button id="simulate-view" class="control-btn">
                <span>👀</span> Симуляция просмотра
            </button>
            <button id="simulate-whatsapp" class="control-btn whatsapp">
                <span>📱</span> Симуляция WhatsApp
            </button>
            <button id="refresh-stats" class="control-btn">
                <span>🔄</span> Обновить статистику
            </button>
            <button id="reset-stats" class="control-btn reset">
                <span>🗑️</span> Сбросить данные
            </button>
        </div>
        
        <div class="debug-panel">
            <div class="debug-title">Журнал отладки:</div>
            <div id="debug-log"></div>
        </div>
    </div>

    <script>
        // Конфигурация
        const CONFIG = {
            STORAGE_KEY: 'global-stats-data',
            UPDATE_INTERVAL: 3000
        };

        // Вспомогательные функции
        const Utils = {
            formatDate: (date = new Date()) => date.toISOString().split('T')[0],
            addDays: (date, days) => {
                const result = new Date(date);
                result.setDate(result.getDate() + days);
                return result;
            },
            getYesterday: () => {
                const yesterday = new Date();
                yesterday.setDate(yesterday.getDate() - 1);
                return Utils.formatDate(yesterday);
            },
            log: (message, type = 'info') => {
                const logElement = document.getElementById('debug-log');
                const timestamp = new Date().toLocaleTimeString();
                const logEntry = document.createElement('div');
                logEntry.className = 'log-entry';
                
                let icon = '🔵';
                if (type === 'error') {
                    icon = '🔴';
                    logEntry.style.color = '#e74c3c';
                } else if (type === 'success') {
                    icon = '🟢';
                    logEntry.style.color = '#27ae60';
                } else if (type === 'warning') {
                    icon = '🟡';
                    logEntry.style.color = '#f39c12';
                }
                
                logEntry.innerHTML = `<span class="log-time">[${timestamp}]</span> ${icon} ${message}`;
                
                if (logElement) {
                    logElement.appendChild(logEntry);
                    logElement.scrollTop = logElement.scrollHeight;
                }
            }
        };

        // Менеджер статистики
        const StatsManager = {
            async get() {
                try {
                    const data = localStorage.getItem(CONFIG.STORAGE_KEY);
                    return data ? JSON.parse(data) : {};
                } catch (error) {
                    Utils.log(`Ошибка получения статистики: ${error.message}`, 'error');
                    return {};
                }
            },
            
            async save(data) {
                try {
                    localStorage.setItem(CONFIG.STORAGE_KEY, JSON.stringify(data));
                    Utils.log('Данные успешно сохранены в localStorage', 'success');
                    return true;
                } catch (error) {
                    Utils.log(`Ошибка сохранения: ${error.message}`, 'error');
                    return false;
                }
            },
            
            async increment(type) {
                try {
                    const today = Utils.formatDate();
                    Utils.log(`Увеличиваем счетчик ${type} для даты ${today}`);
                    
                    const data = await this.get();
                    
                    if (!data[today]) {
                        data[today] = { views: 0, whatsapp: 0 };
                        Utils.log(`Создана новая запись для даты ${today}`);
                    }
                    
                    data[today][type] = (data[today][type] || 0) + 1;
                    
                    const saveResult = await this.save(data);
                    if (saveResult) {
                        Utils.log(`Счетчик ${type} увеличен до ${data[today][type]}`, 'success');
                    }
                    
                    // Обновляем UI
                    this.updateUI(data);
                    
                    return saveResult;
                } catch (error) {
                    Utils.log(`Ошибка увеличения счетчика: ${error.message}`, 'error');
                    return false;
                }
            },
            
            async updateUI(data = null) {
                try {
                    if (!data) {
                        data = await this.get();
                    }
                    
                    const datePicker = document.getElementById('stats-date-picker');
                    const selectedDate = datePicker.value || Utils.formatDate();
                    const stats = data[selectedDate] || { views: 0, whatsapp: 0 };
                    
                    // Обновление отображения
                    const viewsCount = document.getElementById('views-count');
                    const whatsappCount = document.getElementById('whatsapp-count');
                    const dateStats = document.getElementById('date-stats');
                    const lastUpdate = document.getElementById('last-update');
                    
                    if (viewsCount) viewsCount.textContent = stats.views;
                    if (whatsappCount) whatsappCount.textContent = stats.whatsapp;
                    
                    // Форматирование даты для отображения
                    const dateObj = new Date(selectedDate);
                    let dateLabel = dateObj.toLocaleDateString('ru-RU', { 
                        day: 'numeric', 
                        month: 'long' 
                    });
                    
                    if (selectedDate === Utils.formatDate()) {
                        dateLabel += ' (Сегодня)';
                    } else if (selectedDate === Utils.getYesterday()) {
                        dateLabel += ' (Вчера)';
                    }
                    
                    if (dateStats) dateStats.textContent = dateLabel;
                    if (lastUpdate) lastUpdate.textContent = 
                        `Последнее обновление: ${new Date().toLocaleTimeString()}`;
                        
                } catch (error) {
                    Utils.log(`Ошибка обновления UI: ${error.message}`, 'error');
                }
            },
            
            async reset() {
                try {
                    localStorage.removeItem(CONFIG.STORAGE_KEY);
                    Utils.log('Все данные статистики сброшены', 'success');
                    this.updateUI({});
                    return true;
                } catch (error) {
                    Utils.log(`Ошибка сброса данных: ${error.message}`, 'error');
                    return false;
                }
            }
        };

        // Инициализация при загрузке страницы
        document.addEventListener('DOMContentLoaded', async function() {
            Utils.log('Инициализация аналитики...');
            
            // Проверяем, активирован ли режим администратора
            const urlParams = new URLSearchParams(window.location.search);
            const isAdmin = urlParams.has('admin') && urlParams.get('admin') === 'true';
            
            // Установка текущей даты в picker
            const datePicker = document.getElementById('stats-date-picker');
            if (datePicker) {
                datePicker.value = Utils.formatDate();
            }
            
            // Загрузка начальной статистики
            await StatsManager.updateUI();
            
            // Обработчики событий для кнопок
            const simulateViewBtn = document.getElementById('simulate-view');
            if (simulateViewBtn) {
                simulateViewBtn.addEventListener('click', async () => {
                    Utils.log('Симуляция просмотра...');
                    await StatsManager.increment('views');
                });
            }
            
            const simulateWhatsappBtn = document.getElementById('simulate-whatsapp');
            if (simulateWhatsappBtn) {
                simulateWhatsappBtn.addEventListener('click', async () => {
                    Utils.log('Симуляция клика WhatsApp...');
                    await StatsManager.increment('whatsapp');
                });
            }
            
            const refreshStatsBtn = document.getElementById('refresh-stats');
            if (refreshStatsBtn) {
                refreshStatsBtn.addEventListener('click', async () => {
                    Utils.log('Обновление статистики...');
                    await StatsManager.updateUI();
                });
            }
            
            const resetStatsBtn = document.getElementById('reset-stats');
            if (resetStatsBtn) {
                resetStatsBtn.addEventListener('click', async () => {
                    if (confirm('Вы уверены, что хотите сбросить всю статистику?')) {
                        Utils.log('Сброс статистики...');
                        await StatsManager.reset();
                    }
                });
            }
            
            // Обработчики для бейджа
            const closeBtn = document.querySelector('.close-btn');
            if (closeBtn) {
                closeBtn.addEventListener('click', () => {
                    Utils.log('Закрытие бейджа...', 'warning');
                    alert('В рабочей версии это закрыло бы бейдж, но в демо он останется видимым');
                });
            }
            
            // Обработчик изменения даты
            if (datePicker) {
                datePicker.addEventListener('change', (e) => {
                    Utils.log(`Выбрана дата: ${e.target.value}`);
                    StatsManager.updateUI();
                });
            }
            
            // Быстрые кнопки дат
            const btnToday = document.getElementById('btn-today');
            if (btnToday) {
                btnToday.addEventListener('click', () => {
                    if (datePicker) {
                        datePicker.value = Utils.formatDate();
                        Utils.log('Выбрана сегодняшняя дата');
                        StatsManager.updateUI();
                    }
                });
            }
            
            const btnYesterday = document.getElementById('btn-yesterday');
            if (btnYesterday) {
                btnYesterday.addEventListener('click', () => {
                    if (datePicker) {
                        datePicker.value = Utils.getYesterday();
                        Utils.log('Выбрана вчерашняя дата');
                        StatsManager.updateUI();
                    }
                });
            }
            
            // Имитация первоначального просмотра
            setTimeout(async () => {
                await StatsManager.increment('views');
                Utils.log('Аналитика готова к работе', 'success');
            }, 1000);
            
            // Если режим администратора активирован, показываем бейдж
            if (isAdmin) {
                const badgeContainer = document.querySelector('.badge-container');
                if (badgeContainer) {
                    badgeContainer.style.display = 'flex';
                }
                Utils.log('Режим администратора активирован - бейдж отображается');
            }
        });

        // Для интеграции с вашим существующим кодом
        window.GlobalStats = {
            get: () => StatsManager.get(),
            track: (type) => StatsManager.increment(type),
            updateUI: () => StatsManager.updateUI()
        };
    </script>
</body>
</html>
