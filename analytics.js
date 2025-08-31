// analytics.js - глобальный счётчик статистики
(function() {
  'use strict';

  // Конфигурация
  const CONFIG = {
    GITHUB_TOKEN: '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',
    REPO_OWNER: 'antomimpuls',
    REPO_NAME: 'gadanie-privoroti.ru',
    FILE_PATH: 'global-stats.json',
    BADGE_ID: 'global-stats-badge',
    UPDATE_INTERVAL: 5000,
    RETRY_DELAY: 1000,
    MAX_RETRIES: 3
  };

  // Вспомогательные функции
  const Utils = {
    // Форматирование даты в YYYY-MM-DD
    formatDate: (date = new Date()) => date.toISOString().split('T')[0],
    
    // Добавление дней к дате
    addDays: (date, days) => {
      const result = new Date(date);
      result.setDate(result.getDate() + days);
      return result;
    },
    
    // Получение вчерашней даты
    getYesterday: () => Utils.formatDate(Utils.addDays(new Date(), -1)),
    
    // Безопасное извлечение значения из localStorage
    getLocalStorage: (key) => {
      try {
        return JSON.parse(localStorage.getItem(key));
      } catch {
        return null;
      }
    },
    
    // Безопасная запись в localStorage
    setLocalStorage: (key, value) => {
      try {
        localStorage.setItem(key, JSON.stringify(value));
        return true;
      } catch {
        return false;
      }
    }
  };

  // HTTP клиент для работы с GitHub API
  const HttpClient = {
    async request(url, options = {}) {
      const defaultOptions = {
        headers: {
          'Accept': 'application/vnd.github.v3+json',
          'Content-Type': 'application/json',
          ...options.headers
        }
      };
      
      return fetch(url, { ...defaultOptions, ...options });
    },
    
    async retry(fn, retries = CONFIG.MAX_RETRIES, delay = CONFIG.RETRY_DELAY) {
      try {
        return await fn();
      } catch (error) {
        if (retries === 0) throw error;
        await new Promise(resolve => setTimeout(resolve, delay));
        return this.retry(fn, retries - 1, delay * 1.5);
      }
    }
  };

  // Работа с GitHub
  const GitHubService = {
    getRawUrl() {
      return `https://raw.githubusercontent.com/${CONFIG.REPO_OWNER}/${CONFIG.REPO_NAME}/main/${CONFIG.FILE_PATH}`;
    },
    
    getApiUrl() {
      return `https://api.github.com/repos/${CONFIG.REPO_OWNER}/${CONFIG.REPO_NAME}/contents/${CONFIG.FILE_PATH}`;
    },
    
    async getFile() {
      const response = await HttpClient.request(this.getRawUrl());
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      return response.json();
    },
    
    async getFileSha() {
      try {
        const response = await HttpClient.request(this.getApiUrl(), {
          headers: { 'Authorization': `token ${CONFIG.GITHUB_TOKEN}` }
        });
        
        if (!response.ok) return null;
        
        const data = await response.json();
        return data.sha || null;
      } catch {
        return null;
      }
    },
    
    async updateFile(content, message = 'Update stats') {
      const sha = await this.getFileSha();
      const encodedContent = btoa(unescape(encodeURIComponent(JSON.stringify(content, null, 2))));
      
      const response = await HttpClient.request(this.getApiUrl(), {
        method: 'PUT',
        headers: { 'Authorization': `token ${CONFIG.GITHUB_TOKEN}` },
        body: JSON.stringify({
          message,
          content: encodedContent,
          sha: sha || undefined
        })
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(`Failed to update file: ${errorData.message || response.statusText}`);
      }
      
      return response.json();
    }
  };

  // Статистика
  const StatsManager = {
    getDefaultStats() {
      return {
        metadata: {
          lastUpdated: new Date().toISOString(),
          version: '1.0.0'
        },
        data: {}
      };
    },
    
    async get() {
      try {
        const cacheKey = `stats_cache_${Utils.formatDate()}`;
        const cached = Utils.getLocalStorage(cacheKey);
        
        if (cached && Date.now() - cached.timestamp < 30000) { // 30 секунд кэша
          return cached.data;
        }
        
        const data = await HttpClient.retry(() => GitHubService.getFile());
        Utils.setLocalStorage(cacheKey, { data, timestamp: Date.now() });
        return data;
      } catch (error) {
        console.warn('Failed to fetch stats, using default:', error.message);
        return this.getDefaultStats();
      }
    },
    
    async save(statsData) {
      try {
        const stats = {
          ...this.getDefaultStats(),
          metadata: {
            ...this.getDefaultStats().metadata,
            lastUpdated: new Date().toISOString()
          },
          data: statsData
        };
        
        await HttpClient.retry(() => GitHubService.updateFile(stats));
        
        // Обновляем кэш
        const cacheKey = `stats_cache_${Utils.formatDate()}`;
        Utils.setLocalStorage(cacheKey, { data: stats, timestamp: Date.now() });
        
        return true;
      } catch (error) {
        console.error('Failed to save stats:', error);
        return false;
      }
    },
    
    async increment(type) {
      const today = Utils.formatDate();
      const stats = await this.get();
      
      // Инициализация структуры данных
      if (!stats.data[today]) {
        stats.data[today] = { views: 0, whatsapp: 0 };
      }
      
      // Инициализация вчерашних данных для сравнения
      const yesterday = Utils.getYesterday();
      if (!stats.data[yesterday]) {
        stats.data[yesterday] = { views: 0, whatsapp: 0 };
      }
      
      stats.data[today][type] = (stats.data[today][type] || 0) + 1;
      
      return this.save(stats.data);
    }
  };

  // UI компонент для отображения статистики
  const StatsBadge = {
    element: null,
    
    create() {
      if (this.element) return this.element;
      
      this.element = document.createElement('div');
      this.element.id = CONFIG.BADGE_ID;
      this.element.innerHTML = `
        <div class="stats-header">
          <span class="stats-title">📊 Статистика</span>
          <button class="stats-close" aria-label="Закрыть">×</button>
        </div>
        <div class="stats-content">
          <div class="stats-today">
            <div class="stats-date">Сегодня</div>
            <div class="stats-item">
              <span class="stats-icon">👀</span>
              <span class="stats-value" id="stats-views">0</span>
              <span class="stats-label">просмотров</span>
            </div>
            <div class="stats-item">
              <span class="stats-icon">📱</span>
              <span class="stats-value" id="stats-whatsapp">0</span>
              <span class="stats-label">WhatsApp</span>
            </div>
          </div>
          <div class="stats-yesterday">
            <div class="stats-date">Вчера</div>
            <div class="stats-item">
              <span class="stats-icon">👀</span>
              <span class="stats-value" id="stats-views-yesterday">0</span>
            </div>
            <div class="stats-item">
              <span class="stats-icon">📱</span>
              <span class="stats-value" id="stats-whatsapp-yesterday">0</span>
            </div>
          </div>
        </div>
        <div class="stats-footer">
          <small>🌍 Все устройства</small>
        </div>
      `;
      
      this.applyStyles();
      this.bindEvents();
      
      return this.element;
    },
    
    applyStyles() {
      if (document.getElementById('stats-badge-styles')) return;
      
      const style = document.createElement('style');
      style.id = 'stats-badge-styles';
      style.textContent = `
        #${CONFIG.BADGE_ID} {
          position: fixed;
          top: 20px;
          right: 20px;
          background: #2d3748;
          border: 1px solid #4a5568;
          border-radius: 8px;
          padding: 16px;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          font-size: 14px;
          color: #e2e8f0;
          z-index: 10000;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
          min-width: 200px;
          backdrop-filter: blur(10px);
          background: rgba(45, 55, 72, 0.95);
        }
        
        .stats-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 12px;
        }
        
        .stats-title {
          font-weight: 600;
          font-size: 16px;
        }
        
        .stats-close {
          background: none;
          border: none;
          color: #a0aec0;
          font-size: 20px;
          cursor: pointer;
          padding: 0;
          width: 24px;
          height: 24px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 4px;
        }
        
        .stats-close:hover {
          background: #4a5568;
          color: #fff;
        }
        
        .stats-date {
          font-weight: 600;
          margin: 8px 0 4px;
          color: #cbd5e0;
          font-size: 13px;
        }
        
        .stats-item {
          display: flex;
          align-items: center;
          margin: 6px 0;
          gap: 8px;
        }
        
        .stats-icon {
          width: 20px;
          text-align: center;
        }
        
        .stats-value {
          font-weight: 600;
          min-width: 30px;
          text-align: right;
        }
        
        .stats-label {
          color: #a0aec0;
          font-size: 12px;
        }
        
        .stats-footer {
          margin-top: 12px;
          padding-top: 8px;
          border-top: 1px solid #4a5568;
          text-align: center;
        }
        
        .stats-footer small {
          color: #718096;
        }
      `;
      
      document.head.appendChild(style);
    },
    
    bindEvents() {
      const closeBtn = this.element.querySelector('.stats-close');
      closeBtn?.addEventListener('click', () => {
        this.element.style.display = 'none';
      });
    },
    
    update(statsData) {
      if (!this.element) return;
      
      const today = Utils.formatDate();
      const yesterday = Utils.getYesterday();
      
      const todayStats = statsData[today] || { views: 0, whatsapp: 0 };
      const yesterdayStats = statsData[yesterday] || { views: 0, whatsapp: 0 };
      
      // Обновляем значения
      this.updateElement('stats-views', todayStats.views);
      this.updateElement('stats-whatsapp', todayStats.whatsapp);
      this.updateElement('stats-views-yesterday', yesterdayStats.views);
      this.updateElement('stats-whatsapp-yesterday', yesterdayStats.whatsapp);
    },
    
    updateElement(id, value) {
      const element = document.getElementById(id);
      if (element) {
        element.textContent = value.toLocaleString();
      }
    },
    
    show() {
      if (!this.element) {
        this.create();
        document.body.appendChild(this.element);
      }
      this.element.style.display = 'block';
    },
    
    hide() {
      if (this.element) {
        this.element.style.display = 'none';
      }
    }
  };

  // Основной класс аналитики
  class GlobalAnalytics {
    constructor() {
      this.isAdmin = this.checkAdminMode();
      this.init();
    }
    
    checkAdminMode() {
      return new URLSearchParams(window.location.search).get('admin') === 'true';
    }
    
    async init() {
      try {
        // Отслеживаем просмотр
        await StatsManager.increment('views');
        
        // Инициализируем UI если в режиме администратора
        if (this.isAdmin) {
          this.initAdminUI();
        }
        
        // Устанавливаем обработчики событий
        this.bindEventListeners();
        
      } catch (error) {
        console.error('Analytics initialization failed:', error);
      }
    }
    
    initAdminUI() {
      StatsBadge.show();
      this.updateAdminUI();
      
      // Периодическое обновление
      setInterval(() => {
        this.updateAdminUI();
      }, CONFIG.UPDATE_INTERVAL);
    }
    
    async updateAdminUI() {
      try {
        const stats = await StatsManager.get();
        StatsBadge.update(stats.data);
      } catch (error) {
        console.warn('Failed to update admin UI:', error);
      }
    }
    
    bindEventListeners() {
      // Отслеживание кликов по WhatsApp ссылкам
      document.addEventListener('click', async (event) => {
        const link = event.target.closest('a');
        if (!link) return;
        
        const href = link.href.toLowerCase();
        if (href.includes('whatsapp') || href.includes('wa.me')) {
          event.preventDefault();
          
          try {
            await StatsManager.increment('whatsapp');
            // Открываем ссылку после сохранения статистики
            window.open(link.href, '_blank');
          } catch (error) {
            console.error('Failed to track WhatsApp click:', error);
            // В случае ошибки всё равно открываем ссылку
            window.open(link.href, '_blank');
          }
        }
      }, true);
      
      // Отслеживание видимости страницы
      document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'visible') {
          this.handlePageVisible();
        }
      });
    }
    
    async handlePageVisible() {
      // Можно добавить дополнительную логику при возвращении на страницу
    }
  }

  // Инициализация
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      window.GlobalAnalytics = new GlobalAnalytics();
    });
  } else {
    window.GlobalAnalytics = new GlobalAnalytics();
  }

  // Экспорт для глобального использования
  window.GlobalStats = {
    get: () => StatsManager.get(),
    track: (type) => StatsManager.increment(type),
    updateBadge: (stats) => {
      if (window.GlobalAnalytics?.isAdmin) {
        StatsBadge.update(stats.data || stats);
      }
    }
  };

})();
