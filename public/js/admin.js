// CMS Admin Dashboard Logic - K.A.T 2026

const AUTH_STORAGE_KEY = 'kat_admin_auth_token';
let currentAdminUser = null;
let currentEditingRegId = null;
let currentEditingSupportId = null;

document.addEventListener('DOMContentLoaded', () => {
  initAuth();
  initTabs();
  initEventHandlers();
});

// ==========================================
// AUTHENTICATION
// ==========================================
function getAuthToken() {
  return localStorage.getItem(AUTH_STORAGE_KEY);
}

function setAuthToken(token) {
  localStorage.setItem(AUTH_STORAGE_KEY, token);
}

function clearAuth() {
  localStorage.removeItem(AUTH_STORAGE_KEY);
  localStorage.removeItem('kat_admin_user');
  document.getElementById('authWrapper').style.display = 'flex';
  document.getElementById('adminLayout').style.display = 'none';
}

function initAuth() {
  const token = getAuthToken();
  const savedUser = localStorage.getItem('kat_admin_user');

  if (token) {
    if (savedUser) {
      try {
        currentAdminUser = JSON.parse(savedUser);
        document.getElementById('adminLoggedName').textContent = currentAdminUser.name || 'Ban Quản Trị';
      } catch (e) {}
    }
    showAdminLayout();
    loadAllData();
  } else {
    document.getElementById('authWrapper').style.display = 'flex';
    document.getElementById('adminLayout').style.display = 'none';
  }

  // Login form handler
  const loginForm = document.getElementById('adminLoginForm');
  if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const username = document.getElementById('loginUsername').value.trim();
      const password = document.getElementById('loginPassword').value.trim();

      try {
        const res = await fetch('/api/admin/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ username, password })
        });

        const data = await res.json();
        if (data.success && data.token) {
          setAuthToken(data.token);
          if (data.user) {
            localStorage.setItem('kat_admin_user', JSON.stringify(data.user));
            currentAdminUser = data.user;
            document.getElementById('adminLoggedName').textContent = data.user.name || 'Ban Quản Trị';
          }
          showAdminLayout();
          loadAllData();
        } else {
          alert(data.message || 'Tài khoản hoặc mật khẩu không chính xác.');
        }
      } catch (err) {
        alert('Không thể kết nối máy chủ để đăng nhập.');
      }
    });
  }

  // Logout handler
  const logoutBtn = document.getElementById('adminLogoutBtn');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', () => {
      if (confirm('Bạn có chắc muốn đăng xuất khỏi trang quản trị?')) {
        clearAuth();
      }
    });
  }
}

function showAdminLayout() {
  document.getElementById('authWrapper').style.display = 'none';
  document.getElementById('adminLayout').style.display = 'flex';
}

// Helper fetch with Auth
async function authFetch(url, options = {}) {
  const token = getAuthToken();
  const headers = {
    ...options.headers,
    'Authorization': `Bearer ${token}`
  };

  const response = await fetch(url, { ...options, headers });
  if (response.status === 401 || response.status === 403) {
    clearAuth();
    throw new Error('Hết phiên đăng nhập');
  }
  return response;
}

// ==========================================
// TABS & NAVIGATION
// ==========================================
function initTabs() {
  document.querySelectorAll('.sidebar-nav .nav-item').forEach(item => {
    item.addEventListener('click', () => {
      const tabId = item.getAttribute('data-tab');
      if (tabId) switchTab(tabId);
    });
  });
}

function switchTab(tabId) {
  document.querySelectorAll('.sidebar-nav .nav-item').forEach(el => el.classList.remove('active'));
  const activeNav = document.querySelector(`.sidebar-nav .nav-item[data-tab="${tabId}"]`);
  if (activeNav) activeNav.classList.add('active');

  document.querySelectorAll('.tab-section').forEach(sec => sec.style.display = 'none');
  const targetSec = document.getElementById(tabId);
  if (targetSec) targetSec.style.display = 'block';

  const headingMap = {
    tabOverview: 'Tổng Quan Dữ Liệu',
    tabRegistrations: 'Quản Lý Đăng Ký Tham Dự K.A.T 2026',
    tabNewsletters: 'Quản Lý Nhận Tin Email (Newsletter)',
    tabSupport: 'Quản Lý Yêu Cầu Hỗ Trợ Trực Tuyến'
  };

  const headingEl = document.getElementById('pageHeading');
  if (headingEl) headingEl.textContent = headingMap[tabId] || 'Bảng Quản Trị';

  // Load specific tab data if needed
  if (tabId === 'tabRegistrations') loadRegistrations();
  if (tabId === 'tabNewsletters') loadNewsletters();
  if (tabId === 'tabSupport') loadSupportTickets();
}

// ==========================================
// DATA LOADING
// ==========================================
async function loadAllData() {
  await loadDashboardStats();
  await loadRegistrations();
  await loadNewsletters();
  await loadSupportTickets();
}

// 1. Dashboard Stats
async function loadDashboardStats() {
  try {
    const res = await authFetch('/api/admin/stats');
    const data = await res.json();
    if (data.success && data.stats) {
      const s = data.stats;
      document.getElementById('statTotalReg').textContent = s.totalRegistrations;
      document.getElementById('statPendingReg').textContent = s.pendingRegistrations;
      document.getElementById('statConfirmedReg').textContent = s.confirmedRegistrations;
      document.getElementById('statTotalNewsletter').textContent = s.totalNewsletters;

      document.getElementById('badgePendingCount').textContent = s.pendingRegistrations;
      document.getElementById('badgeSupportNewCount').textContent = s.newSupportTickets;

      // Render Recent Registrations
      const recentRegBody = document.getElementById('overviewRecentRegBody');
      if (s.recentRegistrations && s.recentRegistrations.length > 0) {
        recentRegBody.innerHTML = s.recentRegistrations.map(r => `
          <tr>
            <td><strong style="color:var(--admin-cyan); font-family:monospace;">${r.reg_code}</strong></td>
            <td>
              <div style="font-weight:700;">${escapeHtml(r.full_name)}</div>
              <div style="font-size:0.75rem; color:var(--admin-text-muted);">${r.phone}</div>
            </td>
            <td>${escapeHtml(r.specialty || 'Chưa cập nhật')}</td>
            <td>${renderStatusBadge(r.status)}</td>
          </tr>
        `).join('');
      } else {
        recentRegBody.innerHTML = '<tr><td colspan="4" style="text-align:center; color:var(--admin-text-muted);">Chưa có lượt đăng ký nào</td></tr>';
      }

      // Render Recent Support
      const recentSupportBody = document.getElementById('overviewRecentSupportBody');
      if (s.recentSupport && s.recentSupport.length > 0) {
        recentSupportBody.innerHTML = s.recentSupport.map(t => `
          <tr>
            <td><strong style="color:var(--admin-cyan); font-family:monospace;">${t.ticket_code}</strong></td>
            <td>
              <div style="font-weight:700;">${escapeHtml(t.full_name)}</div>
              <div style="font-size:0.75rem; color:var(--admin-text-muted);">${t.phone || t.email}</div>
            </td>
            <td><span style="font-size:0.8rem; color:#59d7ff;">${escapeHtml(t.topic)}</span></td>
            <td>${renderSupportBadge(t.status)}</td>
          </tr>
        `).join('');
      } else {
        recentSupportBody.innerHTML = '<tr><td colspan="4" style="text-align:center; color:var(--admin-text-muted);">Chưa có yêu cầu hỗ trợ nào</td></tr>';
      }
    }
  } catch (err) {
    console.error('Error loading stats:', err);
  }
}

// 2. Registrations List
async function loadRegistrations() {
  const status = document.getElementById('regStatusFilter').value;
  const search = document.getElementById('regSearchInput').value.trim();

  try {
    const params = new URLSearchParams();
    if (status && status !== 'all') params.append('status', status);
    if (search) params.append('search', search);

    const res = await authFetch(`/api/admin/registrations?${params.toString()}`);
    const data = await res.json();
    const tbody = document.getElementById('registrationsTableBody');

    if (data.success && data.data) {
      if (data.data.length === 0) {
        tbody.innerHTML = '<tr><td colspan="8" style="text-align:center; padding: 2rem; color:var(--admin-text-muted);">Không tìm thấy dữ liệu đăng ký phù hợp</td></tr>';
        return;
      }

      tbody.innerHTML = data.data.map(r => `
        <tr>
          <td><strong style="color:var(--admin-cyan); font-family:monospace; font-size:0.9rem;">${r.reg_code}</strong></td>
          <td>
            <div style="font-weight:700; color:#fff;">${escapeHtml(r.full_name)}</div>
            <div style="font-size:0.75rem; color:var(--admin-gold);">${escapeHtml(r.organization || 'Chưa ghi đơn vị')}</div>
          </td>
          <td>
            <div><a href="tel:${r.phone}" style="color:#ffffff; text-decoration:none; font-weight:600;">${r.phone}</a></div>
            <div style="font-size:0.75rem; color:var(--admin-text-muted);">${escapeHtml(r.email)}</div>
          </td>
          <td>
            <div>${escapeHtml(r.specialty || '-')}</div>
          </td>
          <td>
            <div style="font-size:0.75rem; max-width:200px; color:#c6efff;">${escapeHtml(r.interested_sessions || 'Tất cả')}</div>
          </td>
          <td style="font-size:0.75rem; color:var(--admin-text-muted); white-space:nowrap;">
            ${formatDateTime(r.created_at)}
          </td>
          <td>${renderStatusBadge(r.status)}</td>
          <td style="text-align: right; white-space: nowrap;">
            <button class="btn-action" title="Xem chi tiết & Cập nhật" onclick="openRegDetail(${r.id})">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
            </button>
            <button class="btn-action delete" title="Xóa hồ sơ" onclick="deleteReg(${r.id}, '${r.reg_code}')">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
            </button>
          </td>
        </tr>
      `).join('');
    }
  } catch (err) {
    console.error('Error loading registrations:', err);
  }
}

// 3. Newsletters List
async function loadNewsletters() {
  const search = document.getElementById('newsletterSearchInput').value.trim();

  try {
    const params = new URLSearchParams();
    if (search) params.append('search', search);

    const res = await authFetch(`/api/admin/newsletters?${params.toString()}`);
    const data = await res.json();
    const tbody = document.getElementById('newslettersTableBody');

    if (data.success && data.data) {
      if (data.data.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" style="text-align:center; padding: 2rem; color:var(--admin-text-muted);">Chưa có email đăng ký nhận tin</td></tr>';
        return;
      }

      tbody.innerHTML = data.data.map(n => `
        <tr>
          <td><strong style="color:var(--admin-text-muted); font-family:monospace;">#${n.id}</strong></td>
          <td>
            <a href="mailto:${escapeHtml(n.email)}" style="color:#ffffff; font-weight:600; text-decoration:none;">${escapeHtml(n.email)}</a>
          </td>
          <td><span style="font-size:0.8rem; color:#59d7ff;">${escapeHtml(n.source)}</span></td>
          <td>
            <span class="badge ${n.status === 'active' ? 'badge-active' : 'badge-cancelled'}">
              ${n.status === 'active' ? 'Đang hoạt động' : 'Hủy đăng ký'}
            </span>
          </td>
          <td style="font-size:0.8rem; color:var(--admin-text-muted);">${formatDateTime(n.created_at)}</td>
          <td style="text-align: right;">
            <button class="btn-action delete" title="Xóa người nhận tin" onclick="deleteNewsletter(${n.id}, '${escapeHtml(n.email)}')">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
            </button>
          </td>
        </tr>
      `).join('');
    }
  } catch (err) {
    console.error('Error loading newsletters:', err);
  }
}

// 4. Support Tickets List
async function loadSupportTickets() {
  const status = document.getElementById('supportStatusFilter').value;
  const search = document.getElementById('supportSearchInput').value.trim();

  try {
    const params = new URLSearchParams();
    if (status && status !== 'all') params.append('status', status);
    if (search) params.append('search', search);

    const res = await authFetch(`/api/admin/support-tickets?${params.toString()}`);
    const data = await res.json();
    const tbody = document.getElementById('supportTableBody');

    if (data.success && data.data) {
      if (data.data.length === 0) {
        tbody.innerHTML = '<tr><td colspan="8" style="text-align:center; padding: 2rem; color:var(--admin-text-muted);">Không có yêu cầu hỗ trợ nào</td></tr>';
        return;
      }

      tbody.innerHTML = data.data.map(t => `
        <tr>
          <td><strong style="color:var(--admin-cyan); font-family:monospace; font-size:0.9rem;">${t.ticket_code}</strong></td>
          <td>
            <div style="font-weight:700; color:#fff;">${escapeHtml(t.full_name)}</div>
          </td>
          <td>
            <div><a href="tel:${t.phone}" style="color:#ffffff; text-decoration:none; font-weight:600;">${t.phone || '-'}</a></div>
            <div style="font-size:0.75rem; color:var(--admin-text-muted);">${escapeHtml(t.email)}</div>
          </td>
          <td><span style="font-size:0.85rem; color:#59d7ff; font-weight:600;">${escapeHtml(t.topic)}</span></td>
          <td>
            <div style="font-size:0.8rem; max-width:260px; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;" title="${escapeHtml(t.message)}">
              ${escapeHtml(t.message)}
            </div>
          </td>
          <td style="font-size:0.75rem; color:var(--admin-text-muted); white-space:nowrap;">${formatDateTime(t.created_at)}</td>
          <td>${renderSupportBadge(t.status)}</td>
          <td style="text-align: right; white-space: nowrap;">
            <button class="btn-action" title="Xem & Xử lý" onclick="openSupportDetail(${t.id})">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
            </button>
            <button class="btn-action delete" title="Xóa ticket" onclick="deleteSupportTicket(${t.id}, '${t.ticket_code}')">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
            </button>
          </td>
        </tr>
      `).join('');
    }
  } catch (err) {
    console.error('Error loading support tickets:', err);
  }
}

// ==========================================
// DETAIL MODALS & ACTIONS
// ==========================================

// Registration Detail Modal
async function openRegDetail(id) {
  try {
    const res = await authFetch('/api/admin/registrations');
    const data = await res.json();
    const reg = data.data.find(r => r.id === id);
    if (!reg) return;

    currentEditingRegId = id;
    document.getElementById('modalRegCodeBadge').textContent = reg.reg_code;
    document.getElementById('modalRegName').textContent = reg.full_name;
    document.getElementById('modalRegPhone').textContent = reg.phone;
    document.getElementById('modalRegEmail').textContent = reg.email;
    document.getElementById('modalRegDate').textContent = formatDateTime(reg.created_at);
    document.getElementById('modalRegOrg').value = reg.organization || '';
    document.getElementById('modalRegSpecialty').value = reg.specialty || '';
    document.getElementById('modalRegSessions').textContent = reg.interested_sessions || 'Chưa chọn phiên cụ thể';
    document.getElementById('modalRegNotes').textContent = reg.notes || 'Không có ghi chú từ đại biểu';
    document.getElementById('modalRegStatus').value = reg.status || 'pending';
    document.getElementById('modalRegAdminNotes').value = reg.admin_notes || '';

    document.getElementById('regDetailModal').classList.add('active');
  } catch (err) {
    console.error('Error opening reg detail:', err);
  }
}

async function saveRegModal() {
  if (!currentEditingRegId) return;

  const status = document.getElementById('modalRegStatus').value;
  const admin_notes = document.getElementById('modalRegAdminNotes').value.trim();
  const organization = document.getElementById('modalRegOrg').value.trim();
  const specialty = document.getElementById('modalRegSpecialty').value.trim();

  try {
    const res = await authFetch(`/api/admin/registrations/${currentEditingRegId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status, admin_notes, organization, specialty })
    });

    const data = await res.json();
    if (data.success) {
      closeAdminModal('regDetailModal');
      loadRegistrations();
      loadDashboardStats();
    }
  } catch (err) {
    alert('Không thể lưu cập nhật đăng ký.');
  }
}

async function deleteReg(id, code) {
  if (!confirm(`Bạn có chắc chắn muốn xóa hồ sơ đăng ký ${code}?`)) return;

  try {
    const res = await authFetch(`/api/admin/registrations/${id}`, { method: 'DELETE' });
    const data = await res.json();
    if (data.success) {
      loadRegistrations();
      loadDashboardStats();
    }
  } catch (err) {
    alert('Không thể xóa hồ sơ.');
  }
}

// Newsletter Actions
async function deleteNewsletter(id, email) {
  if (!confirm(`Xóa email ${email} khỏi danh sách nhận tin?`)) return;

  try {
    const res = await authFetch(`/api/admin/newsletters/${id}`, { method: 'DELETE' });
    const data = await res.json();
    if (data.success) {
      loadNewsletters();
      loadDashboardStats();
    }
  } catch (err) {
    alert('Không thể xóa email.');
  }
}

// Support Ticket Detail Modal
async function openSupportDetail(id) {
  try {
    const res = await authFetch('/api/admin/support-tickets');
    const data = await res.json();
    const ticket = data.data.find(t => t.id === id);
    if (!ticket) return;

    currentEditingSupportId = id;
    document.getElementById('modalSupportCodeBadge').textContent = ticket.ticket_code;
    document.getElementById('modalSupportName').textContent = ticket.full_name;
    document.getElementById('modalSupportPhone').textContent = ticket.phone || 'Không có';
    document.getElementById('modalSupportEmail').textContent = ticket.email;
    document.getElementById('modalSupportDate').textContent = formatDateTime(ticket.created_at);
    document.getElementById('modalSupportTopic').textContent = ticket.topic;
    document.getElementById('modalSupportMessage').textContent = ticket.message;
    document.getElementById('modalSupportStatus').value = ticket.status || 'new';
    document.getElementById('modalSupportAdminNotes').value = ticket.admin_notes || '';

    document.getElementById('supportDetailModal').classList.add('active');
  } catch (err) {
    console.error('Error opening support detail:', err);
  }
}

async function saveSupportModal() {
  if (!currentEditingSupportId) return;

  const status = document.getElementById('modalSupportStatus').value;
  const admin_notes = document.getElementById('modalSupportAdminNotes').value.trim();

  try {
    const res = await authFetch(`/api/admin/support-tickets/${currentEditingSupportId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status, admin_notes })
    });

    const data = await res.json();
    if (data.success) {
      closeAdminModal('supportDetailModal');
      loadSupportTickets();
      loadDashboardStats();
    }
  } catch (err) {
    alert('Không thể lưu cập nhật ticket.');
  }
}

async function deleteSupportTicket(id, code) {
  if (!confirm(`Bạn có chắc chắn muốn xóa yêu cầu hỗ trợ ${code}?`)) return;

  try {
    const res = await authFetch(`/api/admin/support-tickets/${id}`, { method: 'DELETE' });
    const data = await res.json();
    if (data.success) {
      loadSupportTickets();
      loadDashboardStats();
    }
  } catch (err) {
    alert('Không thể xóa ticket.');
  }
}

function closeAdminModal(modalId) {
  const modal = document.getElementById(modalId);
  if (modal) modal.classList.remove('active');
}

// ==========================================
// EXPORT CSV HANDLERS
// ==========================================
function downloadExport(type) {
  const token = getAuthToken();
  const url = `/api/admin/export/${type}`;

  fetch(url, {
    headers: { 'Authorization': `Bearer ${token}` }
  })
  .then(res => res.blob())
  .then(blob => {
    const downloadUrl = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = downloadUrl;
    a.download = `KAT_${type}_${new Date().toISOString().slice(0,10)}.csv`;
    document.body.appendChild(a);
    a.click();
    a.remove();
  })
  .catch(err => {
    alert('Lỗi khi tải file xuất dữ liệu.');
  });
}

// ==========================================
// UTILITIES & EVENT HANDLERS
// ==========================================
function initEventHandlers() {
  // Refresh data button
  document.getElementById('btnRefreshData')?.addEventListener('click', () => {
    loadAllData();
  });

  // Filters & search listeners
  let regDebounceTimer;
  document.getElementById('regSearchInput')?.addEventListener('input', () => {
    clearTimeout(regDebounceTimer);
    regDebounceTimer = setTimeout(loadRegistrations, 300);
  });
  document.getElementById('regStatusFilter')?.addEventListener('change', loadRegistrations);

  let newsDebounceTimer;
  document.getElementById('newsletterSearchInput')?.addEventListener('input', () => {
    clearTimeout(newsDebounceTimer);
    newsDebounceTimer = setTimeout(loadNewsletters, 300);
  });

  let suppDebounceTimer;
  document.getElementById('supportSearchInput')?.addEventListener('input', () => {
    clearTimeout(suppDebounceTimer);
    suppDebounceTimer = setTimeout(loadSupportTickets, 300);
  });
  document.getElementById('supportStatusFilter')?.addEventListener('change', loadSupportTickets);

  // Export buttons
  document.getElementById('btnExportRegistrations')?.addEventListener('click', () => downloadExport('registrations'));
  document.getElementById('btnExportNewsletters')?.addEventListener('click', () => downloadExport('newsletters'));
  document.getElementById('btnExportSupport')?.addEventListener('click', () => downloadExport('support'));

  // Save modal buttons
  document.getElementById('btnSaveRegModal')?.addEventListener('click', saveRegModal);
  document.getElementById('btnSaveSupportModal')?.addEventListener('click', saveSupportModal);
}

function renderStatusBadge(status) {
  const map = {
    pending: '<span class="badge badge-pending">Chờ xử lý</span>',
    contacted: '<span class="badge badge-contacted">Đã liên hệ</span>',
    confirmed: '<span class="badge badge-confirmed">Đã xác nhận</span>',
    cancelled: '<span class="badge badge-cancelled">Đã hủy</span>'
  };
  return map[status] || `<span class="badge">${status}</span>`;
}

function renderSupportBadge(status) {
  const map = {
    new: '<span class="badge badge-new">Mới</span>',
    processing: '<span class="badge badge-processing">Đang xử lý</span>',
    resolved: '<span class="badge badge-resolved">Đã giải quyết</span>'
  };
  return map[status] || `<span class="badge">${status}</span>`;
}

function formatDateTime(isoString) {
  if (!isoString) return '';
  const d = new Date(isoString);
  const pad = (n) => String(n).padStart(2, '0');
  return `${pad(d.getHours())}:${pad(d.getMinutes())} - ${pad(d.getDate())}/${pad(d.getMonth()+1)}/${d.getFullYear()}`;
}

function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

window.switchTab = switchTab;
window.openRegDetail = openRegDetail;
window.openSupportDetail = openSupportDetail;
window.closeAdminModal = closeAdminModal;
window.deleteReg = deleteReg;
window.deleteNewsletter = deleteNewsletter;
window.deleteSupportTicket = deleteSupportTicket;
