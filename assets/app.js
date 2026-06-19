// Simple Auth object for demo
const Auth = {
  token: localStorage.getItem('auth_token'),
  
  requireAuth() {
    if (!this.token) {
      window.location.href = '/auth/login.html';
      return false;
    }
    return true;
  },
  
  logout() {
    localStorage.removeItem('auth_token');
    window.location.href = '/';
  },
  
  async fetchUser() {
    if (!this.token) return null;
    try {
      return JSON.parse(atob(this.token.split('.')[1]));
    } catch (e) {
      return null;
    }
  }
};

// Simple API wrapper
const api = {
  baseUrl: '/api',
  
  async get(endpoint) {
    const response = await fetch(this.baseUrl + endpoint, {
      headers: { 'Authorization': 'Bearer ' + Auth.token }
    });
    if (!response.ok) throw new Error('API error');
    return response.json();
  },
  
  async post(endpoint, data) {
    const response = await fetch(this.baseUrl + endpoint, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + Auth.token 
      },
      body: JSON.stringify(data)
    });
    if (!response.ok) throw new Error('API error');
    return response.json();
  }
};

// Toast notifications
function showToast(message, type = 'info') {
  let container = document.getElementById('toast-container');
  if (!container) {
    container = document.createElement('div');
    container.id = 'toast-container';
    container.className = 'toast-container';
    document.body.appendChild(container);
  }
  
  const toast = document.createElement('div');
  toast.className = 'toast ' + type;
  toast.textContent = message;
  container.appendChild(toast);
  
  setTimeout(() => toast.remove(), 3000);
}

function showLoading() {
  let overlay = document.getElementById('loading-overlay');
  if (!overlay) {
    overlay = document.createElement('div');
    overlay.id = 'loading-overlay';
    overlay.className = 'loading-overlay';
    overlay.innerHTML = '<div class="spinner"></div>';
    document.body.appendChild(overlay);
  }
  overlay.classList.add('active');
}

function hideLoading() {
  const overlay = document.getElementById('loading-overlay');
  if (overlay) overlay.classList.remove('active');
}

function formatDate(date) {
  return new Date(date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
}

// Mobile sidebar toggle
function toggleSidebar() {
  const sidebar = document.querySelector('.sidebar');
  if (sidebar) sidebar.classList.toggle('active');
}
