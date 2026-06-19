// API Configuration
const API_URL = window.location.hostname === 'localhost' 
  ? 'http://localhost:3001/api' 
  : 'https://api.dropls.xyz/api';

// API Client
const api = {
  async request(endpoint, options = {}) {
    const token = localStorage.getItem('token');
    const url = `${API_URL}${endpoint}`;

    const config = {
      headers: {
        'Content-Type': 'application/json',
        ...(token && { 'Authorization': `Bearer ${token}` })
      },
      ...options
    };

    if (config.body && typeof config.body === 'object') {
      config.body = JSON.stringify(config.body);
    }

    try {
      const res = await fetch(url, config);
      const data = await res.json().catch(() => null);

      if (!res.ok) {
        throw new Error(data?.error || `HTTP ${res.status}`);
      }
      return data;
    } catch (err) {
      showToast(err.message, 'error');
      throw err;
    }
  },

  get(endpoint) { return this.request(endpoint, { method: 'GET' }); },
  post(endpoint, body) { return this.request(endpoint, { method: 'POST', body }); },
  put(endpoint, body) { return this.request(endpoint, { method: 'PUT', body }); },
  delete(endpoint) { return this.request(endpoint, { method: 'DELETE' }); }
};

// Auth Manager
const Auth = {
  isLoggedIn() { return !!localStorage.getItem('token'); },

  user() {
    try { return JSON.parse(localStorage.getItem('user') || '{}'); }
    catch { return {}; }
  },

  setSession(token, user) {
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(user));
  },

  logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = '/auth/login.html';
  },

  async fetchUser() {
    if (!this.isLoggedIn()) return null;
    try {
      const user = await api.get('/auth/me');
      localStorage.setItem('user', JSON.stringify(user));
      return user;
    } catch {
      this.logout();
      return null;
    }
  },

  requireAuth() {
    if (!this.isLoggedIn()) {
      window.location.href = '/auth/login.html';
      return false;
    }
    return true;
  },

  updateUI() {
    const user = this.user();
    const avatarEl = document.querySelector('.user-avatar');
    if (avatarEl && user.username) {
      avatarEl.textContent = user.username.substring(0, 2).toUpperCase();
    }

    const balanceEl = document.querySelector('.balance-pill');
    if (balanceEl && user.balance !== undefined) {
      const text = balanceEl.childNodes[0];
      if (text) text.textContent = `${user.balance.toFixed(2)}$ `;
    }
  }
};

// Toast System
function showToast(message, type = 'info') {
  let container = document.querySelector('.toast-container');
  if (!container) {
    container = document.createElement('div');
    container.className = 'toast-container';
    document.body.appendChild(container);
  }

  const toast = document.createElement('div');
  toast.className = `toast ${type}`;

  const icons = {
    success: '✓',
    error: '✕',
    warning: '⚠',
    info: 'ℹ'
  };

  toast.innerHTML = `<span style="font-weight:800;font-size:16px;">${icons[type] || 'ℹ'}</span> ${message}`;
  container.appendChild(toast);

  setTimeout(() => {
    toast.style.animation = 'toastSlide 0.3s ease reverse';
    setTimeout(() => toast.remove(), 300);
  }, 3500);
}

// Loading Overlay
function showLoading() {
  const overlay = document.createElement('div');
  overlay.className = 'loading-overlay';
  overlay.id = 'loading-overlay';
  overlay.innerHTML = '<div class="spinner"></div>';
  document.body.appendChild(overlay);
}

function hideLoading() {
  const overlay = document.getElementById('loading-overlay');
  if (overlay) overlay.remove();
}

// Sidebar Active State
function setActiveNav() {
  const path = window.location.pathname;
  document.querySelectorAll('.sidebar-link').forEach(link => {
    link.classList.remove('active');
    const href = link.getAttribute('href');
    if (href && path.includes(href.replace('./', '').replace('../', ''))) {
      link.classList.add('active');
    }
  });
}

// Mobile Sidebar
function toggleSidebar() {
  document.querySelector('.sidebar').classList.toggle('mobile-open');
}

// Format Date
function formatDate(dateStr) {
  if (!dateStr) return '-';
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' });
}

// Format Currency
function formatCurrency(amount) {
  return `$${parseFloat(amount).toFixed(2)}`;
}

// Initialize
document.addEventListener('DOMContentLoaded', () => {
  setActiveNav();
  Auth.updateUI();
});

// Export globals
window.API_URL = API_URL;
window.api = api;
window.Auth = Auth;
window.showToast = showToast;
window.showLoading = showLoading;
window.hideLoading = hideLoading;
window.toggleSidebar = toggleSidebar;
window.formatDate = formatDate;
window.formatCurrency = formatCurrency;
