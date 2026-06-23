/* ================================================
   DROPLINK — DASHBOARD APP.JS
   Single-page app logic for the DNS dashboard
   ================================================ */

'use strict';

// ─── STATE ────────────────────────────────────────────────────────────────────
const state = {
  user:            null,
  zones:           [],
  selectedZone:    null,
  records:         [],
  allRecords:      [],
  stats:           null,
  activeView:      'overview',
  activeFilter:    'ALL',
  searchQuery:     '',
  addFormOpen:     false,
  editingRecordId: null,
  deleteTarget:    null,
  domainsLoading:  false,
  recordsLoading:  false
};

// ─── API HELPERS ──────────────────────────────────────────────────────────────
const API = {
  async request(method, path, body) {
    const opts = {
      method,
      credentials: 'include',
      headers: {}
    };
    if (body) {
      opts.headers['Content-Type'] = 'application/json';
      opts.body = JSON.stringify(body);
    }
    const res = await fetch(path, opts);
    if (res.status === 401) {
      window.location.href = '/login';
      return;
    }
    const json = await res.json();
    if (!res.ok) throw new Error(json.error || `HTTP ${res.status}`);
    return json;
  },
  get:    (p)    => API.request('GET',    p),
  post:   (p, b) => API.request('POST',   p, b),
  put:    (p, b) => API.request('PUT',    p, b),
  delete: (p)    => API.request('DELETE', p)
};

// ─── UTILS ────────────────────────────────────────────────────────────────────
function formatTTL(ttl) {
  if (ttl === 1)     return 'Auto';
  if (ttl < 60)      return `${ttl}s`;
  if (ttl === 60)    return '1 min';
  if (ttl === 120)   return '2 min';
  if (ttl === 300)   return '5 min';
  if (ttl === 600)   return '10 min';
  if (ttl === 900)   return '15 min';
  if (ttl === 1800)  return '30 min';
  if (ttl === 3600)  return '1 hr';
  if (ttl === 7200)  return '2 hr';
  if (ttl === 43200) return '12 hr';
  if (ttl === 86400) return '1 day';
  return `${ttl}s`;
}

function formatDate(iso) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('en-US', { year:'numeric', month:'short', day:'numeric' });
}

function timeAgo(iso) {
  if (!iso) return '—';
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1)   return 'just now';
  if (mins < 60)  return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24)   return `${hrs}h ago`;
  return formatDate(iso);
}

function escHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function typeBadge(type) {
  const t = (type || '').toUpperCase();
  return `<span class="type-badge type-badge--${t}">${escHtml(t)}</span>`;
}

function proxyBadge(proxied) {
  return proxied
    ? `<span class="proxy-badge proxy-badge--on"><span class="proxy-badge-dot"></span>Proxied</span>`
    : `<span class="proxy-badge proxy-badge--off"><span class="proxy-badge-dot"></span>DNS only</span>`;
}

function avatarUrl(user) {
  if (!user) return '';
  if (user.avatar_url) return user.avatar_url;
  return `https://cdn.discordapp.com/embed/avatars/0.png`;
}

// ─── TOAST ────────────────────────────────────────────────────────────────────
function toast(msg, type = 'info') {
  const area  = document.getElementById('toastArea');
  const el    = document.createElement('div');
  el.className = `toast toast--${type}`;
  el.innerHTML = `<span class="toast-dot"></span><span>${escHtml(msg)}</span>`;
  area.appendChild(el);
  setTimeout(() => {
    el.classList.add('removing');
    el.addEventListener('animationend', () => el.remove(), { once: true });
  }, 3500);
}

// ─── VIEW SWITCHING ───────────────────────────────────────────────────────────
function switchView(viewId) {
  state.activeView = viewId;
  document.querySelectorAll('.view').forEach(v => {
    const isActive = v.id === `view-${viewId}`;
    v.hidden = !isActive;
    if (isActive) v.removeAttribute('hidden');
  });
  document.querySelectorAll('.nav-item').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.view === viewId);
  });
  if (viewId === 'dns' && state.selectedZone) loadRecords();
  if (viewId === 'overview') loadAllRecords();
  if (viewId === 'settings') renderSettings();
  // Close sidebar on mobile
  closeSidebarMobile();
}

// ─── USER ────────────────────────────────────────────────────────────────────
async function loadUser() {
  try {
    const data = await API.get('/auth/me');
    state.user = data.user;
    renderUser();
  } catch {
    window.location.href = '/auth/discord';
  }
}

function renderUser() {
  const u = state.user;
  if (!u) return;
  const av  = avatarUrl(u);
  const name = u.global_name || u.username;
  const tag  = `@${u.username}`;

  // Sidebar
  const sbAv = document.getElementById('sidebarAvatar');
  if (sbAv) { sbAv.src = av; sbAv.alt = name; }
  setText('sidebarName', name);
  setText('sidebarTag', tag);

  // Topbar
  const tbAv = document.getElementById('topbarAvatar');
  if (tbAv) { tbAv.src = av; tbAv.alt = name; }
  setText('topbarName', name);

  // Welcome
  setText('welcomeMsg', `Welcome back, ${name}! Here's your Droplink overview.`);
}

// ─── STATS ────────────────────────────────────────────────────────────────────
async function loadStats() {
  try {
    const data = await API.get('/api/stats');
    state.stats = data;
    renderStats();
  } catch (e) {
    console.warn('Stats load failed:', e.message);
  }
}

function renderStats() {
  const s = state.stats;
  if (!s) return;

  // Overview stat cards
  setText('statUsedVal', `${s.subdomains_used} / ${s.subdomains_max}`);
  setText('statHint', `${s.subdomains_used} of ${s.subdomains_max} slots used`);
  const pct = (s.subdomains_used / s.subdomains_max) * 100;
  setStyle('statProgressFill', 'width', `${pct}%`);
  attr('statProgressBar', 'aria-valuenow', s.subdomains_used);

  setText('statZonesVal', state.zones.length || '—');
  setText('statMemberVal', formatDate(s.member_since));
  setText('statLastLogin', `Last login: ${timeAgo(s.last_login)}`);

  // DNS usage bar
  setText('dnsUsageLabel', `${s.subdomains_used} of ${s.subdomains_max} subdomains used`);
  setStyle('dnsUsageFill', 'width', `${pct}%`);

  // Settings
  setText('settingsSubdomains', `${s.subdomains_used} / ${s.subdomains_max}`);
  setText('settingsMember', formatDate(s.member_since));
}

// ─── DOMAINS ─────────────────────────────────────────────────────────────────
async function loadDomains(showRefreshAnim = false) {
  state.domainsLoading = true;
  const list  = document.getElementById('domainList');
  const rbtn  = document.getElementById('refreshDomainsBtn');

  if (showRefreshAnim && rbtn) rbtn.classList.add('spinning');

  list.innerHTML = `<div class="domain-loading"><div class="spinner"></div> Fetching from Cloudflare…</div>`;

  try {
    const data = await API.get('/api/domains');
    state.zones = data.zones || [];
    renderDomainList();

    // Auto-select: restore last selection or pick first
    const savedId = localStorage.getItem('droplink_zone_id');
    const saved   = state.zones.find(z => z.id === savedId);
    const initial = saved || state.zones[0] || null;
    if (initial) selectZone(initial, false);

    // Update zone count in stats
    setText('statZonesVal', state.zones.length);
  } catch (e) {
    list.innerHTML = `<div class="domain-error">⚠ ${escHtml(e.message)}</div>`;
  } finally {
    state.domainsLoading = false;
    if (rbtn) rbtn.classList.remove('spinning');
  }
}

function renderDomainList() {
  const list = document.getElementById('domainList');
  if (!state.zones.length) {
    list.innerHTML = `<div class="domain-error">No active zones found in your Cloudflare account.</div>`;
    return;
  }
  list.innerHTML = state.zones.map(z => `
    <div class="domain-option${state.selectedZone?.id === z.id ? ' active' : ''}"
         data-zone-id="${escHtml(z.id)}"
         role="option"
         aria-selected="${state.selectedZone?.id === z.id}"
         tabindex="0">
      <span class="domain-option-dot"></span>
      <span class="domain-option-name">${escHtml(z.name)}</span>
      <span class="domain-option-plan">${escHtml(z.plan || 'Free')}</span>
    </div>
  `).join('');

  list.querySelectorAll('.domain-option').forEach(el => {
    el.addEventListener('click',   () => onDomainOptionClick(el));
    el.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') onDomainOptionClick(el); });
  });
}

function onDomainOptionClick(el) {
  const zoneId = el.dataset.zoneId;
  const zone   = state.zones.find(z => z.id === zoneId);
  if (zone) selectZone(zone, true);
}

function selectZone(zone, closeDropdown = true) {
  state.selectedZone = zone;
  localStorage.setItem('droplink_zone_id', zone.id);

  setText('selectedDomainLabel', zone.name);
  setText('dnsZoneSub', `Managing DNS records for ${zone.name}`);

  // Highlight active in list
  document.querySelectorAll('.domain-option').forEach(el => {
    el.classList.toggle('active', el.dataset.zoneId === zone.id);
    el.setAttribute('aria-selected', el.dataset.zoneId === zone.id);
  });

  if (closeDropdown) closeDomainDropdown();
  if (state.activeView === 'dns') loadRecords();
  loadAllRecords();
}

// Dropdown open/close
function openDomainDropdown() {
  const sel  = document.getElementById('domainSelector');
  const drop = document.getElementById('domainDropdown');
  sel.classList.add('open');
  sel.setAttribute('aria-expanded', 'true');
  drop.hidden = false;
}
function closeDomainDropdown() {
  const sel  = document.getElementById('domainSelector');
  const drop = document.getElementById('domainDropdown');
  sel.classList.remove('open');
  sel.setAttribute('aria-expanded', 'false');
  drop.hidden = true;
}

// ─── RECORDS ─────────────────────────────────────────────────────────────────
async function loadRecords() {
  if (!state.selectedZone) {
    show('emptyNoDomain');
    hide('recordsTable');
    hide('emptyNoRecords');
    hide('tableLoading');
    return;
  }

  state.recordsLoading = true;
  hide('emptyNoDomain');
  hide('recordsTable');
  hide('emptyNoRecords');
  show('tableLoading');
  state.addFormOpen = false;
  hideAddForm();

  try {
    const data   = await API.get(`/api/records?zone_id=${state.selectedZone.id}`);
    state.records = data.records || [];
    renderRecordsTable();
  } catch (e) {
    toast(e.message, 'error');
    hide('tableLoading');
    show('emptyNoDomain');
  } finally {
    state.recordsLoading = false;
  }
}

async function loadAllRecords() {
  try {
    const data       = await API.get('/api/records/all');
    state.allRecords = data.records || [];
    renderRecentList();
  } catch { /* silent */ }
}

function filteredRecords() {
  return state.records.filter(r => {
    const typeOk   = state.activeFilter === 'ALL' || r.type === state.activeFilter;
    const searchOk = !state.searchQuery ||
      r.name.toLowerCase().includes(state.searchQuery) ||
      r.content.toLowerCase().includes(state.searchQuery);
    return typeOk && searchOk;
  });
}

function renderRecordsTable() {
  hide('tableLoading');
  const records = filteredRecords();

  if (records.length === 0) {
    hide('recordsTable');
    show(state.records.length === 0 ? 'emptyNoRecords' : 'emptyNoDomain');
    // show empty-no-records if we have a zone but no records
    if (state.records.length === 0 && state.selectedZone) {
      show('emptyNoRecords');
      hide('emptyNoDomain');
    }
    return;
  }

  hide('emptyNoDomain');
  hide('emptyNoRecords');
  show('recordsTable');

  const tbody = document.getElementById('recordsTbody');
  tbody.innerHTML = records.map(r => buildRecordRow(r)).join('');
  attachRowListeners();
}

function buildRecordRow(r) {
  return `
    <tr data-record-id="${escHtml(r.id)}" id="row-${escHtml(r.id)}">
      <td>${typeBadge(r.type)}</td>
      <td><div class="record-name-cell" title="${escHtml(r.name)}">${escHtml(r.name)}</div></td>
      <td><div class="record-content-cell" title="${escHtml(r.content)}">${escHtml(r.content)}</div></td>
      <td class="record-ttl-cell">${escHtml(formatTTL(r.ttl))}</td>
      <td>${proxyBadge(r.proxied)}</td>
      <td>
        <div class="row-actions">
          <button class="icon-btn edit-btn" data-id="${escHtml(r.id)}" title="Edit record" aria-label="Edit ${escHtml(r.name)}">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
          </button>
          <button class="icon-btn danger delete-btn" data-id="${escHtml(r.id)}" data-name="${escHtml(r.name)}" title="Delete record" aria-label="Delete ${escHtml(r.name)}">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6m4-6v6"/></svg>
          </button>
        </div>
      </td>
    </tr>
  `;
}

function buildEditRow(r) {
  return `
    <tr class="editing-row" id="edit-row-${escHtml(r.id)}">
      <td colspan="6">
        <div class="edit-row-form">
          <select class="form-select" id="er-type-${escHtml(r.id)}">
            ${['A','AAAA','CNAME','MX','TXT'].map(t =>
              `<option value="${t}"${r.type===t?' selected':''}>${t}</option>`
            ).join('')}
          </select>
          <input class="form-input" id="er-name-${escHtml(r.id)}" value="${escHtml(r.name)}" placeholder="Name" />
          <input class="form-input" id="er-content-${escHtml(r.id)}" value="${escHtml(r.content)}" placeholder="Content" />
          <select class="form-select" id="er-ttl-${escHtml(r.id)}">
            ${[[1,'Auto'],[60,'1 min'],[300,'5 min'],[600,'10 min'],[1800,'30 min'],[3600,'1 hr'],[86400,'1 day']]
              .map(([v,l]) => `<option value="${v}"${r.ttl===v?' selected':''}>${l}</option>`).join('')}
          </select>
          <label class="proxy-toggle" style="flex-shrink:0">
            <input type="checkbox" id="er-proxy-${escHtml(r.id)}" ${r.proxied?' checked':''} />
            <div class="proxy-track"><div class="proxy-thumb"></div></div>
            <span class="proxy-label" style="font-size:0.78rem">Proxy</span>
          </label>
          <div class="edit-row-actions">
            <button class="btn btn-save save-edit-btn" data-id="${escHtml(r.id)}">Save</button>
            <button class="btn btn-cancel-sm cancel-edit-btn" data-id="${escHtml(r.id)}">Cancel</button>
          </div>
        </div>
      </td>
    </tr>
  `;
}

function attachRowListeners() {
  document.querySelectorAll('.edit-btn').forEach(btn => {
    btn.addEventListener('click', () => startEditRow(btn.dataset.id));
  });
  document.querySelectorAll('.delete-btn').forEach(btn => {
    btn.addEventListener('click', () => openDeleteModal(btn.dataset.id, btn.dataset.name));
  });
}

function startEditRow(recordId) {
  // Close any other open edit
  if (state.editingRecordId && state.editingRecordId !== recordId) {
    cancelEditRow(state.editingRecordId);
  }
  state.editingRecordId = recordId;
  const record = state.records.find(r => r.id === recordId);
  if (!record) return;

  const origRow = document.getElementById(`row-${recordId}`);
  if (!origRow) return;

  origRow.style.display = 'none';

  // Insert edit row after original
  const editHtml = buildEditRow(record);
  origRow.insertAdjacentHTML('afterend', editHtml);

  const editRow = document.getElementById(`edit-row-${recordId}`);
  editRow.querySelector('.save-edit-btn').addEventListener('click', () => saveEditRow(recordId));
  editRow.querySelector('.cancel-edit-btn').addEventListener('click', () => cancelEditRow(recordId));
}

function cancelEditRow(recordId) {
  const editRow = document.getElementById(`edit-row-${recordId}`);
  const origRow = document.getElementById(`row-${recordId}`);
  if (editRow) editRow.remove();
  if (origRow) origRow.style.display = '';
  if (state.editingRecordId === recordId) state.editingRecordId = null;
}

async function saveEditRow(recordId) {
  const editRow = document.getElementById(`edit-row-${recordId}`);
  if (!editRow) return;

  const saveBtn = editRow.querySelector('.save-edit-btn');
  saveBtn.disabled = true;
  saveBtn.textContent = 'Saving…';

  const payload = {
    type:    document.getElementById(`er-type-${recordId}`)?.value,
    name:    document.getElementById(`er-name-${recordId}`)?.value?.trim(),
    content: document.getElementById(`er-content-${recordId}`)?.value?.trim(),
    ttl:     Number(document.getElementById(`er-ttl-${recordId}`)?.value),
    proxied: document.getElementById(`er-proxy-${recordId}`)?.checked
  };

  if (!payload.name || !payload.content) {
    toast('Name and Content are required.', 'error');
    saveBtn.disabled = false;
    saveBtn.textContent = 'Save';
    return;
  }

  try {
    await API.put(`/api/records/${recordId}`, payload);
    toast('Record updated!', 'success');
    cancelEditRow(recordId);
    await loadRecords();
    await loadStats();
  } catch (e) {
    toast(e.message, 'error');
    saveBtn.disabled = false;
    saveBtn.textContent = 'Save';
  }
}

// ─── RECENT LIST (overview) ───────────────────────────────────────────────────
function renderRecentList() {
  const container = document.getElementById('recentList');
  const empty     = document.getElementById('recentEmpty');
  if (!state.allRecords.length) {
    if (empty) empty.hidden = false;
    return;
  }
  if (empty) empty.hidden = true;

  container.innerHTML = state.allRecords.map(r => `
    <div class="recent-record-row">
      <span class="recent-type-badge">${typeBadge(r.record_type)}</span>
      <span class="recent-name">${escHtml(r.record_name)}</span>
      <span class="recent-content">${escHtml(r.content)}</span>
      <span class="recent-zone">${escHtml(r.zone_name)}</span>
    </div>
  `).join('');
}

// ─── ADD RECORD FORM ──────────────────────────────────────────────────────────
function showAddForm() {
  state.addFormOpen = true;
  const form = document.getElementById('addRecordForm');
  form.hidden = false;
  document.getElementById('fName').focus();
  document.getElementById('addRecordBtn').setAttribute('aria-expanded', 'true');
  updateFormForType();
}

function hideAddForm() {
  state.addFormOpen = false;
  const form = document.getElementById('addRecordForm');
  if (form) form.hidden = true;
  const btn = document.getElementById('addRecordBtn');
  if (btn) btn.setAttribute('aria-expanded', 'false');
  hideFormError();
  resetAddForm();
}

function resetAddForm() {
  const ids = ['fType','fName','fContent','fTTL','fPriority'];
  ids.forEach(id => {
    const el = document.getElementById(id);
    if (el) el.value = el.tagName === 'SELECT' ? el.options[0]?.value : '';
  });
  const proxy = document.getElementById('fProxied');
  if (proxy) proxy.checked = false;
  updateProxyLabel();
}

function showFormError(msg) {
  const el = document.getElementById('formError');
  if (!el) return;
  el.textContent = msg;
  el.hidden = false;
}
function hideFormError() {
  const el = document.getElementById('formError');
  if (el) el.hidden = true;
}

function updateFormForType() {
  const type     = document.getElementById('fType')?.value || 'A';
  const label    = document.getElementById('fContentLabel');
  const proxyWrap= document.getElementById('fProxyWrap');
  const priWrap  = document.getElementById('fPriorityWrap');
  const suffix   = document.getElementById('fNameSuffix');

  const labels = { A:'IPv4 Address', AAAA:'IPv6 Address', CNAME:'Target (Hostname)', MX:'Mail Server', TXT:'Content (Text)' };
  if (label)     label.textContent     = labels[type] || 'Content';
  if (proxyWrap) proxyWrap.hidden      = (type === 'MX' || type === 'TXT');
  if (priWrap)   priWrap.hidden        = (type !== 'MX');
  if (suffix && state.selectedZone)    suffix.textContent = `.${state.selectedZone.name}`;
}

async function submitAddRecord() {
  if (!state.selectedZone) {
    showFormError('Please select a domain first.');
    return;
  }

  const type    = document.getElementById('fType').value;
  const name    = document.getElementById('fName').value.trim();
  const content = document.getElementById('fContent').value.trim();
  const ttl     = Number(document.getElementById('fTTL').value);
  const proxied = document.getElementById('fProxied').checked;
  const priority= document.getElementById('fPriority').value;

  if (!name)    { showFormError('Name is required.'); return; }
  if (!content) { showFormError('Content is required.'); return; }
  hideFormError();

  const saveBtn     = document.getElementById('saveRecordBtn');
  const saveTxt     = document.getElementById('saveBtnText');
  const saveSpinner = document.getElementById('saveBtnSpinner');
  saveBtn.disabled  = true;
  saveTxt.hidden    = true;
  saveSpinner.hidden= false;

  try {
    await API.post('/api/records', {
      zone_id:  state.selectedZone.id,
      zone_name:state.selectedZone.name,
      type, name, content, ttl, proxied,
      priority: type === 'MX' ? Number(priority) : undefined
    });
    toast('Record created successfully!', 'success');
    hideAddForm();
    await loadRecords();
    await loadStats();
    await loadAllRecords();
  } catch (e) {
    showFormError(e.message);
  } finally {
    saveBtn.disabled  = false;
    saveTxt.hidden    = false;
    saveSpinner.hidden= true;
  }
}

// ─── DELETE MODAL ─────────────────────────────────────────────────────────────
function openDeleteModal(recordId, recordName) {
  state.deleteTarget = recordId;
  setText('deleteModalBody', `Are you sure you want to permanently delete "${recordName}"? This will remove it from Cloudflare immediately.`);
  document.getElementById('deleteModalBackdrop').hidden = false;
  document.getElementById('confirmDeleteBtn').focus();
}

function closeDeleteModal() {
  state.deleteTarget = null;
  document.getElementById('deleteModalBackdrop').hidden = true;
  setBtnLoading('confirmDeleteBtn', 'deleteBtnText', 'deleteBtnSpinner', false, 'Delete');
}

async function confirmDelete() {
  if (!state.deleteTarget) return;
  setBtnLoading('confirmDeleteBtn', 'deleteBtnText', 'deleteBtnSpinner', true);
  try {
    await API.delete(`/api/records/${state.deleteTarget}`);
    toast('Record deleted.', 'info');
    closeDeleteModal();
    await loadRecords();
    await loadStats();
    await loadAllRecords();
  } catch (e) {
    toast(e.message, 'error');
    closeDeleteModal();
  }
}

// ─── SETTINGS RENDER ─────────────────────────────────────────────────────────
function renderSettings() {
  const u = state.user;
  if (!u) return;
  const av = avatarUrl(u);
  const el = document.getElementById('settingsAvatar');
  if (el) { el.src = av; el.alt = u.global_name || u.username; }
  setText('settingsName', u.global_name || u.username);
  setText('settingsTag', `@${u.username}#${u.discriminator !== '0' ? u.discriminator : '0'}`);
  setText('settingsId', u.id);
  if (state.stats) setText('settingsMember', formatDate(state.stats.member_since));
}

// ─── DOM HELPERS ──────────────────────────────────────────────────────────────
function $(id)              { return document.getElementById(id); }
function setText(id, val)   { const el = $(id); if (el) el.textContent = val; }
function setStyle(id, p, v) { const el = $(id); if (el) el.style[p] = v; }
function attr(id, a, v)     { const el = $(id); if (el) el.setAttribute(a, v); }
function show(id)           { const el = $(id); if (el) el.hidden = false; }
function hide(id)           { const el = $(id); if (el) el.hidden = true; }

function setBtnLoading(btnId, textId, spinnerId, loading, resetText = '') {
  const btn = $(btnId), txt = $(textId), sp = $(spinnerId);
  if (btn) btn.disabled = loading;
  if (txt) txt.hidden   = loading;
  if (sp)  sp.hidden    = !loading;
  if (!loading && resetText && txt) txt.textContent = resetText;
}

function updateProxyLabel() {
  const checked = document.getElementById('fProxied')?.checked;
  const label   = document.getElementById('proxyLabel');
  if (label) label.textContent = checked ? 'Proxied' : 'DNS Only';
}

// ─── MOBILE SIDEBAR ───────────────────────────────────────────────────────────
function openSidebarMobile() {
  document.getElementById('sidebar').classList.add('open');
  let overlay = document.querySelector('.sidebar-overlay');
  if (!overlay) {
    overlay = document.createElement('div');
    overlay.className = 'sidebar-overlay';
    document.body.appendChild(overlay);
    overlay.addEventListener('click', closeSidebarMobile);
  }
  overlay.classList.add('visible');
}
function closeSidebarMobile() {
  document.getElementById('sidebar').classList.remove('open');
  const overlay = document.querySelector('.sidebar-overlay');
  if (overlay) overlay.classList.remove('visible');
}

// ─── EVENT LISTENERS ──────────────────────────────────────────────────────────
function bindEvents() {
  // Sidebar nav
  document.querySelectorAll('.nav-item[data-view]').forEach(btn => {
    btn.addEventListener('click', () => switchView(btn.dataset.view));
  });

  // Mobile menu
  $('mobileMenuBtn')?.addEventListener('click', openSidebarMobile);

  // Domain selector toggle
  $('domainSelector')?.addEventListener('click', () => {
    const drop = $('domainDropdown');
    drop.hidden ? openDomainDropdown() : closeDomainDropdown();
  });
  $('domainSelector')?.addEventListener('keydown', e => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      const drop = $('domainDropdown');
      drop.hidden ? openDomainDropdown() : closeDomainDropdown();
    }
  });

  // Close domain dropdown on outside click
  document.addEventListener('click', e => {
    const wrap = $('domainSelectorWrap');
    if (wrap && !wrap.contains(e.target)) closeDomainDropdown();
  });

  // Refresh domains
  $('refreshDomainsBtn')?.addEventListener('click', e => {
    e.stopPropagation();
    loadDomains(true);
  });

  // Add record buttons
  $('addRecordBtn')?.addEventListener('click', () => {
    if (!state.selectedZone) { toast('Select a domain first.', 'error'); return; }
    state.addFormOpen ? hideAddForm() : showAddForm();
  });
  $('overviewAddBtn')?.addEventListener('click', () => {
    switchView('dns');
    setTimeout(() => {
      if (state.selectedZone) showAddForm();
    }, 80);
  });

  // Form type change
  $('fType')?.addEventListener('change', updateFormForType);

  // Proxy checkbox label
  $('fProxied')?.addEventListener('change', updateProxyLabel);

  // Form submit / cancel
  $('saveRecordBtn')?.addEventListener('click', submitAddRecord);
  $('cancelFormBtn')?.addEventListener('click', hideAddForm);

  // Type filter chips
  document.querySelectorAll('.type-filter').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.type-filter').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      state.activeFilter = btn.dataset.type;
      renderRecordsTable();
    });
  });

  // Search
  $('recordSearch')?.addEventListener('input', e => {
    state.searchQuery = e.target.value.toLowerCase().trim();
    renderRecordsTable();
  });

  // Delete modal
  $('confirmDeleteBtn')?.addEventListener('click', confirmDelete);
  $('cancelDeleteBtn')?.addEventListener('click', closeDeleteModal);
  $('deleteModalBackdrop')?.addEventListener('click', e => {
    if (e.target === $('deleteModalBackdrop')) closeDeleteModal();
  });

  // Keyboard: Escape closes modals/forms
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape') {
      if (!$('deleteModalBackdrop').hidden) closeDeleteModal();
      else if (state.addFormOpen) hideAddForm();
      else if (state.editingRecordId) cancelEditRow(state.editingRecordId);
    }
  });
}

// ─── INIT ─────────────────────────────────────────────────────────────────────
async function init() {
  bindEvents();
  await loadUser();
  await Promise.all([loadStats(), loadDomains()]);
  // Load overview data
  await loadAllRecords();
}

document.addEventListener('DOMContentLoaded', init);
