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
    UPDATE_INTERVAL: 5000
  };

  // Вспомогательные функции
  const Utils = {
    formatDate: (date = new Date()) => date.toISOString().split('T')[0],
    getYesterday: () => {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      return yesterday.toISOString().split('T')[0];
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
      try {
        const response = await fetch(this.getRawUrl());
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        return await response.json();
      } catch (error) {
        console.warn('Failed to fetch stats:', error);
        return { data: {} };
      }
    },
    
    async getFileSha() {
      try {
        const response = await fetch(this.getApiUrl(), {
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
      try {
        const sha = await this.getFileSha();
        const encodedContent = btoa(JSON.stringify(content));
        
        const response = await fetch(this.getApiUrl(), {
          method: 'PUT',
          headers: { 
            'Authorization': `token ${CONFIG.GITHUB_TOKEN}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            message,
            content: encodedContent,
            sha: sha || undefined
          })
        });
        
        return response.ok;
      } catch (error) {
        console.error('Failed to update file:', error);
        return false;
      }
    }
  };

  // Статистика
  const StatsManager = {
    getDefaultData() {
      return {};
    },
    
    async get() {
      try {
        const result = await GitHubService.getFile();
        return result.data || this.getDefaultData();
      } catch {
        return this.getDefaultData();
      }
    },
    
    async save(data) {
      try {
        return await GitHubService.updateFile({ data });
      } catch {
        return false;
      }
    },
    
    async increment(type) {
      const today = Utils.formatDate();
      const data = await this.get();
      
      if (!data[today]) {
        data[today] = { views: 0, whatsapp: 0 };
      }
      
      data[today][type] = (data[today][type] || 0) + 1;
      
      return this.save(data);
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
        <div style="font-weight: bold; margin-bottom: 8px;">📊 Статистика</div>
        <div id="stats-today">Сегодня: 0 просмотров, 0 WhatsApp</div>
        <div id="stats-yesterday">Вчера: 0 просмотров, 0 WhatsApp</div>
        <div style="margin-top: 8px; font-size: 12px; opacity: 0.8;">🌍 Все устройства</div>
      `;
      
      this.element.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: #2d3748;
        border: 1px solid #4a5568;
        border-radius: 8px;
        padding: 16px;
        font-family: system-ui, -apple-system, sans-serif;
        font-size: 14px;
        color: #e2e8f0;
        z-index: 10000;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
        min-width: 250px;
      `;
      
      return this.element;
    },
    
    update(data) {
      if (!this.element) return;
      
      const today = Utils.formatDate();
      const yesterday = Utils.getYesterday();
      
      const todayStats = data[today] || { views: 0, whatsapp: 0 };
      const yesterdayStats = data[yesterday] || { views: 0, whatsapp: 0 };
      
      const todayEl = this.element.querySelector('#stats-today');
      const yesterdayEl = this.element.querySelector('#stats-yesterday');
      
      if (todayEl) {
        todayEl.textContent = `Сегодня: ${todayStats.views} просмотров, ${todayStats.whatsapp} WhatsApp`;
      }
      
      if (yesterdayEl) {
        yesterdayEl.textContent = `Вчера: ${yesterdayStats.views} просмотров, ${yesterdayStats.whatsapp} WhatsApp`;
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
      this.isAdmin = new URLSearchParams(window.location.search).get('admin') === 'true';
      this.init();
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
        const data = await StatsManager.get();
        StatsBadge.update(data);
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
          await StatsManager.increment('whatsapp');
          window.open(link.href, '_blank');
        }
      }, true);
    }
  }

  // Инициализация после загрузки DOM
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
    updateBadge: (data) => {
      if (new URLSearchParams(window.location.search).get('admin') === 'true') {
        StatsBadge.update(data);
      }
    }
  };

})();
