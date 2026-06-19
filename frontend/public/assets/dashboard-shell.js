import { clearToken } from '/assets/api.js';

export function mountShell(activePath) {
  const user = JSON.parse(localStorage.getItem('authUser') || 'null');
  const username = user?.username || 'You';
  const email = user?.email || '';
  const items = [
    { href: '/dashboard',     label: 'Servers', icon: 'server' },
    { href: '/dashboard/dns', label: 'DNS',     icon: 'globe' },
  ];
  const nav = items.map(i => `
    <a href="${i.href}" class="side-link ${i.href===activePath?'active':''}">
      <i data-lucide="${i.icon}" style="width:16px;height:16px"></i>${i.label}
    </a>`).join('');

  const aside = document.createElement('aside');
  aside.className = 'sidebar';
  aside.innerHTML = `
    <a class="brand" href="/"><span class="brand-mark">D</span>Droplink</a>
    <nav class="side-nav">${nav}</nav>
    <div class="side-user">
      <div>
        <div style="font-size:.78rem;color:var(--muted);text-transform:uppercase;letter-spacing:.06em">Signed in</div>
        <div style="font-weight:600;margin-top:2px">${username}</div>
        ${email ? `<div class="muted" style="font-size:.8125rem">${email}</div>` : ''}
      </div>
      <button id="logoutBtn" class="btn btn-secondary" style="justify-content:center;padding:.5rem .75rem;font-size:.85rem">
        <i data-lucide="log-out" style="width:14px;height:14px"></i> Sign out
      </button>
    </div>`;
  document.getElementById('app').prepend(aside);
  document.getElementById('logoutBtn').addEventListener('click', () => {
    clearToken(); localStorage.removeItem('authUser'); location.href = '/auth/login';
  });
  lucide.createIcons();
}
