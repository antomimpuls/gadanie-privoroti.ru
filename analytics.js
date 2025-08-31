<!DOCTYPE html>
<html lang="ru">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Аналитика - Исправленный счетчик</title>
    <style>
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            max-width: 800px;
            margin: 0 auto;
            padding: 20px;
            background-color: #f5f8fa;
            color: #333;
        }
        .container {
            background: white;
            border-radius: 10px;
            padding: 25px;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
        }
        h1 {
            color: #2c3e50;
            text-align: center;
            margin-bottom: 30px;
        }
        .stats-panel {
            background: #2d3748;
            color: #e2e8f0;
            border-radius: 8px;
            padding: 20px;
            margin-bottom: 25px;
        }
        .button {
            background: #3498db;
            color: white;
            border: none;
            padding: 12px 20px;
            border-radius: 5px;
            cursor: pointer;
            font-size: 16px;
            margin: 10px 5px;
            transition: background 0.3s;
        }
        .button:hover {
            background: #2980b9;
        }
        .button.whatsapp {
            background: #25D366;
        }
        .button.whatsapp:hover {
            background: #128C7E;
        }
        .debug-panel {
            background: #f8f9fa;
            border-left: 4px solid #3498db;
            padding: 15px;
            margin-top: 25px;
            font-family: monospace;
            font-size: 14px;
            max-height: 200px;
            overflow-y: auto;
        }
        .stat-value {
            font-weight: bold;
            font-size: 18px;
            color: #2c3e50;
        }
        .instructions {
            background: #e8f4fc;
            padding: 15px;
            border-radius: 5px;
            margin: 20px 0;
        }
    </style>
</head>
<body>
    <div class="container">
        <h1>Аналитика - Исправленный счетчик</h1>
        
        <div class="instructions">
            <p><strong>Инструкция:</strong> Для тестирования нажмите кнопку "Симулировать просмотр" или "Симулировать WhatsApp". 
            Затем нажмите "Обновить статистику" для отображения актуальных данных.</p>
            <p>Для администрирования добавьте <code>?admin=true</code> к URL в адресной строке.</p>
        </div>
        
        <div class="stats-panel">
            <h2 style="color: #e2e8f0; margin-top: 0;">📊 Панель статистики</h2>
            <div style="display: flex; justify-content: space-between; margin-bottom: 15px;">
                <div>
                    <span>👀 Просмотры:</span>
                    <span id="views-count" class="stat-value">0</span>
                </div>
                <div>
                    <span>📱 WhatsApp:</span>
                    <span id="whatsapp-count" class="stat-value">0</span>
                </div>
            </div>
            <div id="date-stats" style="font-size: 14px; color: #a0aec0; margin-bottom: 10px;">
                31 августа (Сегодня)
            </div>
            <div id="last-update" style="font-size: 12px; color: #718096;">
                Последнее обновление: --
            </div>
        </div>
        
        <div style="text-align: center;">
            <button id="simulate-view" class="button">Симулировать просмотр</button>
            <button id="simulate-whatsapp" class="button whatsapp">Симулировать WhatsApp</button>
            <button id="refresh-stats" class="button">Обновить статистику</button>
            <button id="reset-stats" class="button" style="background: #e74c3c;">Сбросить данные</button>
        </div>
        
        <div class="debug-panel">
            <h3>Журнал отладки:</h3>
            <div id="debug-log"></div>
        </div>
    </div>

    <script>
        // Конфигурация
        const CONFIG = {
            // В реальном приложении токен должен храниться безопасно
            // Для демонстрации используем localStorage
            STORAGE_KEY: 'global-stats-data',
            UPDATE_INTERVAL: 3000,
            BADGE_ID: 'global-stats-badge'
        };

        // Вспомогательные функции
        const Utils = {
            formatDate: (date = new Date()) => date.toISOString().split('T')[0],
            addDays: (date, days) => {
                const result = new Date(date);
                result.setDate(result.getDate() + days);
                return result;
            },
            getYesterday: () => Utils.formatDate(Utils.addDays(new Date(), -1)),
            log: (message, type = 'info') => {
                const logElement = document.getElementById('debug-log');
                const timestamp = new Date().toLocaleTimeString();
                const logEntry = document.createElement('div');
                logEntry.innerHTML = `<span style="color: #777;">[${timestamp}]</span> ${message}`;
                
                if (type === 'error') {
                    logEntry.style.color = '#e74c3c';
                } else if (type === 'success') {
                    logEntry.style.color = '#27ae60';
                }
                
                logElement.appendChild(logEntry);
                logElement.scrollTop = logElement.scrollHeight;
            }
        };

        // Менеджер статистики (использует localStorage для демонстрации)
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
                    Utils.log('Данные успешно сохранены', 'success');
                    return true;
                } catch (error) {
                    Utils.log(`Ошибка сохранения: ${error.message}`, 'error');
                    return false;
                }
            },
            
            async increment(type) {
                try {
                    const today = Utils.formatDate();
                    Utils.log(`Увеличиваем ${type} для даты ${today}`);
                    
                    const data = await this.get();
                    
                    if (!data[today]) {
                        data[today] = { views: 0, whatsapp: 0 };
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
                    
                    const today = Utils.formatDate();
                    const stats = data[today] || { views: 0, whatsapp: 0 };
                    
                    // Обновление отображения
                    document.getElementById('views-count').textContent = stats.views;
                    document.getElementById('whatsapp-count').textContent = stats.whatsapp;
                    
                    // Форматирование даты для отображения
                    const dateObj = new Date();
                    let dateLabel = dateObj.toLocaleDateString('ru-RU', { 
                        day: 'numeric', 
                        month: 'long' 
                    }) + ' (Сегодня)';
                    
                    document.getElementById('date-stats').textContent = dateLabel;
                    document.getElementById('last-update').textContent = 
                        `Последнее обновление: ${dateObj.toLocaleTimeString()}`;
                        
                } catch (error) {
                    Utils.log(`Ошибка обновления UI: ${error.message}`, 'error');
                }
            },
            
            async reset() {
                try {
                    localStorage.removeItem(CONFIG.STORAGE_KEY);
                    Utils.log('Данные статистики сброшены', 'success');
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
            
            // Загрузка начальной статистики
            await StatsManager.updateUI();
            
            // Обработчики событий для кнопок
            document.getElementById('simulate-view').addEventListener('click', async () => {
                Utils.log('Симуляция просмотра...');
                await StatsManager.increment('views');
            });
            
            document.getElementById('simulate-whatsapp').addEventListener('click', async () => {
                Utils.log('Симуляция клика WhatsApp...');
                await StatsManager.increment('whatsapp');
            });
            
            document.getElementById('refresh-stats').addEventListener('click', async () => {
                Utils.log('Обновление статистики...');
                await StatsManager.updateUI();
            });
            
            document.getElementById('reset-stats').addEventListener('click', async () => {
                Utils.log('Сброс статистики...');
                await StatsManager.reset();
            });
            
            // Имитация первоначального просмотра
            await StatsManager.increment('views');
            
            Utils.log('Аналитика готова к работе');
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
