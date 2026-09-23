// K.A.T 2026 Interactive Application Logic

document.addEventListener('DOMContentLoaded', () => {
  initModals();
  initRegisterForms();
  initNewsletterForm();
  initSupportWidget();
  interceptRegisterButtons();
  initMobileBottomNav();
  initPosterCreator();
});

// ==========================================
// TOAST NOTIFICATIONS
// ==========================================
function showToast(message, type = 'info') {
  let container = document.querySelector('.kat-toast-container');
  if (!container) {
    container = document.createElement('div');
    container.className = 'kat-toast-container';
    document.body.appendChild(container);
  }

  const toast = document.createElement('div');
  toast.className = `kat-toast toast-${type}`;

  const iconMap = {
    success: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#00d084" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6L9 17l-5-5"/></svg>`,
    error: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#cf2e2e" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>`,
    info: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#0693e3" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>`
  };

  toast.innerHTML = `
    <div style="flex-shrink: 0; margin-top: 2px;">${iconMap[type] || iconMap.info}</div>
    <div style="flex: 1;">${message}</div>
  `;

  container.appendChild(toast);

  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateX(100%)';
    setTimeout(() => toast.remove(), 300);
  }, 4000);
}

// ==========================================
// MODAL CONTROLS
// ==========================================
function openModal(modalId) {
  const modal = document.getElementById(modalId);
  if (modal) {
    modal.classList.add('active');
    document.body.style.overflow = 'hidden';
  }
}

function closeModal(modalId) {
  const modal = document.getElementById(modalId);
  if (modal) {
    modal.classList.remove('active');
    document.body.style.overflow = '';
  }
}

function initModals() {
  // Close buttons
  document.querySelectorAll('.kat-modal-close, [data-modal-close]').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const modal = e.target.closest('.kat-modal-overlay');
      if (modal) {
        modal.classList.remove('active');
        document.body.style.overflow = '';
      }
    });
  });

  // Click outside backdrop to close
  document.querySelectorAll('.kat-modal-overlay').forEach(modal => {
    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        modal.classList.remove('active');
        document.body.style.overflow = '';
      }
    });
  });
}

// Intercept all register buttons across the page to scroll smoothly and focus the form
function interceptRegisterButtons() {
  const registerSelectors = [
    'a[href*="dang-ky"]',
    'a[href="#dang-ky-kat"]',
    'a.kat-cta',
    'button.kat-cta',
    '[data-action="register"]'
  ];

  document.querySelectorAll(registerSelectors.join(', ')).forEach(btn => {
    // If it's the submit button inside the form, don't intercept!
    if (btn.closest('form')) return;

    btn.addEventListener('click', (e) => {
      e.preventDefault();

      const regSection = document.getElementById('dang-ky-kat');
      const regCard = document.getElementById('katMainRegCard');
      const firstInput = document.getElementById('regFullName') || document.querySelector('#katInlineRegForm input[name="full_name"]');

      if (regSection) {
        // Calculate offset position to leave comfortable breathing room at top
        const rect = regSection.getBoundingClientRect();
        const targetTop = rect.top + window.pageYOffset - 30;

        window.scrollTo({
          top: targetTop,
          behavior: 'smooth'
        });

        // Trigger flash animation
        if (regCard) {
          regCard.classList.remove('kat-form-flash');
          void regCard.offsetWidth; // Force DOM reflow
          regCard.classList.add('kat-form-flash');
        }

        // Focus first field after scroll starts
        setTimeout(() => {
          if (firstInput) {
            firstInput.focus({ preventScroll: true });
          }
        }, 500);
      } else {
        openModal('katRegisterModal');
      }
    });
  });

  // Any explicit modal open trigger
  document.querySelectorAll('[data-open-modal]').forEach(trigger => {
    trigger.addEventListener('click', (e) => {
      e.preventDefault();
      const target = trigger.getAttribute('data-open-modal');
      openModal(target);
    });
  });
}

// ==========================================
// REGISTRATION FORM SUBMISSION
// ==========================================
function initRegisterForms() {
  // Handle both inline form and modal form
  const forms = [document.getElementById('katInlineRegForm'), document.getElementById('katModalRegForm')];

  forms.forEach(form => {
    if (!form) return;

    form.addEventListener('submit', async (e) => {
      e.preventDefault();

      const submitBtn = form.querySelector('button[type="submit"]');
      const originalText = submitBtn ? submitBtn.innerHTML : 'Đăng ký';

      try {
        const formData = new FormData(form);
        const interested_sessions = [];
        form.querySelectorAll('input[name="interested_sessions"]:checked').forEach(cb => {
          interested_sessions.push(cb.value);
        });

        const payload = {
          full_name: formData.get('full_name'),
          phone: formData.get('phone'),
          email: formData.get('email'),
          organization: formData.get('organization') || '',
          specialty: formData.get('specialty') || '',
          interested_sessions,
          notes: formData.get('notes') || ''
        };

        if (!payload.full_name || !payload.phone || !payload.email) {
          showToast('Vui lòng điền Họ tên, Số điện thoại và Email.', 'error');
          return;
        }

        if (submitBtn) {
          submitBtn.disabled = true;
          submitBtn.innerHTML = `
            <svg class="animate-spin" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="display:inline-block; vertical-align:middle; animation: spin 1s linear infinite;"><circle cx="12" cy="12" r="10" stroke-opacity="0.25"/><path d="M12 2a10 10 0 0 1 10 10" stroke-opacity="1"/></svg>
            Đang xử lý đăng ký...
          `;
        }

        const res = await fetch('/api/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });

        const data = await res.json();

        if (data.success && data.registration) {
          if (formData.get('subscribe_newsletter') === 'yes' && payload.email) {
            fetch('/api/newsletter', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ email: payload.email, source: 'registration_optin' })
            }).catch(() => {});
          }
          form.reset();
          closeModal('katRegisterModal');
          
          // Show Success Modal with ticket details
          showSuccessConfirmation(data.registration);
          showToast('Đăng ký tham dự thành công!', 'success');
        } else {
          showToast(data.message || 'Đăng ký không thành công. Vui lòng thử lại.', 'error');
        }
      } catch (err) {
        console.error('Registration error:', err);
        showToast('Không thể kết nối đến máy chủ. Vui lòng thử lại sau.', 'error');
      } finally {
        if (submitBtn) {
          submitBtn.disabled = false;
          submitBtn.innerHTML = originalText;
        }
      }
    });
  });
}

function showSuccessConfirmation(reg) {
  // 1. Populate and open Modal
  const successModal = document.getElementById('katSuccessModal');
  if (successModal) {
    const codeEl = document.getElementById('successRegCode');
    const nameEl = document.getElementById('successRegName');
    const emailEl = document.getElementById('successRegEmail');
    const phoneEl = document.getElementById('successRegPhone');
    const modalSumName = document.getElementById('modalSumName');
    const modalSumPhone = document.getElementById('modalSumPhone');
    const modalSumEmail = document.getElementById('modalSumEmail');
    const modalSumOrg = document.getElementById('modalSumOrg');
    const modalSumSpecialty = document.getElementById('modalSumSpecialty');

    if (codeEl) codeEl.textContent = reg.reg_code || 'KAT-2026';
    if (nameEl) nameEl.textContent = reg.full_name || '';
    if (emailEl) emailEl.textContent = reg.email || '';
    if (phoneEl) phoneEl.textContent = reg.phone || '';
    if (modalSumName) modalSumName.textContent = reg.full_name || '';
    if (modalSumPhone) modalSumPhone.textContent = reg.phone || '';
    if (modalSumEmail) modalSumEmail.textContent = reg.email || '';
    if (modalSumOrg) modalSumOrg.textContent = reg.organization || 'Cá nhân / Tự do';
    if (modalSumSpecialty) modalSumSpecialty.textContent = reg.specialty || 'Chưa cập nhật';

    // Copy button
    const copyBtn = document.getElementById('btnCopyRegCode');
    if (copyBtn) {
      copyBtn.onclick = () => {
        if (navigator.clipboard && reg.reg_code) {
          navigator.clipboard.writeText(reg.reg_code).then(() => {
            showToast(`Đã sao chép mã ${reg.reg_code}`, 'info');
          });
        }
      };
    }

    // Poster CTA in Modal
    const btnOpenPosterFromModal = document.getElementById('btnOpenPosterFromModal');
    if (btnOpenPosterFromModal) {
      btnOpenPosterFromModal.onclick = () => {
        closeModal('katSuccessModal');
        openPosterModalWithDelegate(reg);
      };
    }

    openModal('katSuccessModal');
  }

  // 2. Populate and display Inline Success Summary Card
  const inlineCard = document.getElementById('katInlineSuccessCard');
  const inlineForm = document.getElementById('katInlineRegForm');

  if (inlineCard) {
    const codeEl = document.getElementById('inlineSuccessCode');
    const nameEl = document.getElementById('inlineSuccessName');
    const phoneEl = document.getElementById('inlineSuccessPhone');
    const emailEl = document.getElementById('inlineSuccessEmail');
    const orgEl = document.getElementById('inlineSuccessOrg');
    const specialtyEl = document.getElementById('inlineSuccessSpecialty');
    const sessionsEl = document.getElementById('inlineSuccessSessions');
    const notesRow = document.getElementById('inlineSuccessNotesRow');
    const notesEl = document.getElementById('inlineSuccessNotes');
    const timeEl = document.getElementById('inlineSuccessTime');

    if (codeEl) codeEl.textContent = reg.reg_code || 'KAT-2026';
    if (nameEl) nameEl.textContent = reg.full_name || '';
    if (phoneEl) phoneEl.textContent = reg.phone || '';
    if (emailEl) emailEl.textContent = reg.email || '';
    if (orgEl) orgEl.textContent = reg.organization || 'Cá nhân / Tự do';
    if (specialtyEl) specialtyEl.textContent = reg.specialty || 'Chưa cập nhật';
    if (sessionsEl) sessionsEl.textContent = reg.interested_sessions || 'Tất cả các phiên khoa học';

    if (notesRow && notesEl) {
      if (reg.notes && reg.notes.trim()) {
        notesRow.style.display = 'table-row';
        notesEl.textContent = reg.notes;
      } else {
        notesRow.style.display = 'none';
      }
    }

    if (timeEl) {
      const now = new Date();
      timeEl.textContent = now.toLocaleDateString('vi-VN', {
        hour: '2-digit',
        minute: '2-digit',
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      });
    }

    // Toggle inline views
    if (inlineForm) inlineForm.style.display = 'none';
    inlineCard.style.display = 'block';

    // Handle "Register Another" button
    const btnRegisterAnother = document.getElementById('btnRegisterAnother');
    if (btnRegisterAnother) {
      btnRegisterAnother.onclick = () => {
        inlineCard.style.display = 'none';
        if (inlineForm) {
          inlineForm.reset();
          inlineForm.style.display = 'block';
        }
        const regSection = document.getElementById('dang-ky-kat');
        if (regSection) {
          regSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      };
    }

    // Handle "Tạo Poster" button from inline card
    const btnOpenPosterFromSuccess = document.getElementById('btnOpenPosterFromSuccess');
    if (btnOpenPosterFromSuccess) {
      btnOpenPosterFromSuccess.onclick = () => {
        openPosterModalWithDelegate(reg);
      };
    }

    // Smooth scroll to card
    const regSection = document.getElementById('dang-ky-kat');
    if (regSection) {
      const rect = regSection.getBoundingClientRect();
      const targetTop = rect.top + window.pageYOffset - 30;
      window.scrollTo({ top: targetTop, behavior: 'smooth' });
    }
  }
}

// ==========================================
// NEWSLETTER SUBSCRIPTION
// ==========================================
function initNewsletterForm() {
  const forms = [document.getElementById('katNewsletterForm'), document.getElementById('katNewsletterWidgetForm')];

  forms.forEach(form => {
    if (!form) return;

    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const input = form.querySelector('input[type="email"]');
      const submitBtn = form.querySelector('button[type="submit"]');
      const originalText = submitBtn ? submitBtn.innerHTML : 'Đăng ký';

      const email = input.value.trim();
      if (!email) {
        showToast('Vui lòng nhập địa chỉ email của bạn.', 'error');
        return;
      }

      try {
        if (submitBtn) {
          submitBtn.disabled = true;
          submitBtn.innerHTML = 'Đang gửi...';
        }

        const res = await fetch('/api/newsletter', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, source: 'support_widget' })
        });

        const data = await res.json();
        if (data.success) {
          input.value = '';
          showToast(data.message || 'Đăng ký nhận thông tin thành công!', 'success');
        } else {
          showToast(data.message || 'Không thể đăng ký nhận tin.', 'error');
        }
      } catch (err) {
        showToast('Lỗi gửi email nhận tin. Vui lòng thử lại.', 'error');
      } finally {
        if (submitBtn) {
          submitBtn.disabled = false;
          submitBtn.innerHTML = originalText;
        }
      }
    });
  });
}

// ==========================================
// SUPPORT WIDGET
// ==========================================
function initSupportWidget() {
  const bubble = document.getElementById('katSupportBubble');
  const windowEl = document.getElementById('katSupportWindow');
  const closeBtn = document.getElementById('katCloseSupport');
  const form = document.getElementById('katSupportForm');

  if (bubble && windowEl) {
    bubble.addEventListener('click', () => {
      windowEl.classList.toggle('active');
    });
  }

  if (closeBtn && windowEl) {
    closeBtn.addEventListener('click', () => {
      windowEl.classList.remove('active');
    });
  }

  // Tab switching inside support window
  const tabs = document.querySelectorAll('.kat-support-tab');
  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      tabs.forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      const targetId = tab.getAttribute('data-tab');
      document.querySelectorAll('.kat-support-panel').forEach(panel => {
        panel.style.display = panel.id === targetId ? 'block' : 'none';
      });
    });
  });

  // Support Form submission
  if (form) {
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const submitBtn = form.querySelector('button[type="submit"]');
      const originalText = submitBtn ? submitBtn.innerHTML : 'Gửi yêu cầu';

      try {
        const formData = new FormData(form);
        const payload = {
          full_name: formData.get('full_name'),
          phone: formData.get('phone'),
          email: formData.get('email'),
          topic: formData.get('topic'),
          message: formData.get('message')
        };

        if (!payload.full_name || !payload.email || !payload.message) {
          showToast('Vui lòng điền Họ tên, Email và Nội dung.', 'error');
          return;
        }

        if (submitBtn) {
          submitBtn.disabled = true;
          submitBtn.innerHTML = 'Đang gửi...';
        }

        const res = await fetch('/api/support', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });

        const data = await res.json();
        if (data.success) {
          form.reset();
          if (windowEl) windowEl.classList.remove('active');
          showToast(`Gửi yêu cầu hỗ trợ thành công! Mã ticket: ${data.ticket.ticket_code}`, 'success');
        } else {
          showToast(data.message || 'Không thể gửi câu hỏi lúc này.', 'error');
        }
      } catch (err) {
        showToast('Lỗi gửi yêu cầu hỗ trợ. Vui lòng thử lại.', 'error');
      } finally {
        if (submitBtn) {
          submitBtn.disabled = false;
          submitBtn.innerHTML = originalText;
        }
      }
    });
  }
}

// ==========================================
// MOBILE BOTTOM NAVIGATION (ĐĂNG KÝ, CHƯƠNG TRÌNH, TRỢ GIÚP 24/7)
// ==========================================
function initMobileBottomNav() {
  const btnSchedule = document.getElementById('btnNavSchedule');
  const btnRegister = document.getElementById('btnNavRegister');
  const btnSupport = document.getElementById('btnNavSupport');
  const supportWindow = document.getElementById('katSupportWindow');

  // 1. CHƯƠNG TRÌNH
  if (btnSchedule) {
    btnSchedule.addEventListener('click', (e) => {
      e.preventDefault();
      if (supportWindow) supportWindow.classList.remove('active');

      const target = document.getElementById('kat-agenda') || document.getElementById('chuong-trinh');
      if (target) {
        const top = target.getBoundingClientRect().top + window.pageYOffset - 15;
        window.scrollTo({ top, behavior: 'smooth' });
      }
    });
  }

  // 2. ĐĂNG KÝ
  if (btnRegister) {
    btnRegister.addEventListener('click', (e) => {
      e.preventDefault();
      if (supportWindow) supportWindow.classList.remove('active');

      const regSection = document.getElementById('dang-ky-kat');
      const regCard = document.getElementById('katMainRegCard');
      const firstInput = document.getElementById('regFullName');
      const inlineCard = document.getElementById('katInlineSuccessCard');

      if (regSection) {
        const top = regSection.getBoundingClientRect().top + window.pageYOffset - 15;
        window.scrollTo({ top, behavior: 'smooth' });

        if (regCard) {
          regCard.classList.remove('kat-form-flash');
          void regCard.offsetWidth;
          regCard.classList.add('kat-form-flash');
        }

        setTimeout(() => {
          if (firstInput && (!inlineCard || inlineCard.style.display === 'none')) {
            firstInput.focus({ preventScroll: true });
          }
        }, 500);
      }
    });
  }

  // 3. TRỢ GIÚP 24/7
  if (btnSupport) {
    btnSupport.addEventListener('click', (e) => {
      e.preventDefault();
      if (supportWindow) {
        const isActive = supportWindow.classList.toggle('active');
        if (isActive) {
          const firstField = supportWindow.querySelector('input[name="full_name"]');
          if (firstField) {
            setTimeout(() => firstField.focus(), 300);
          }
        }
      }
    });
  }
}

window.openRegisterModal = () => openModal('katRegisterModal');
window.closeModal = closeModal;
window.openModal = openModal;

// ==========================================
// K.A.T 2026 POSTER CREATOR & SHARING ENGINE
// Pixel-Perfect Canvas Rendering (1024x960)
// ==========================================

function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function roundRectPath(ctx, x, y, width, height, radius) {
  if (typeof ctx.roundRect === 'function') {
    ctx.beginPath();
    ctx.roundRect(x, y, width, height, radius);
  } else {
    ctx.beginPath();
    ctx.moveTo(x + radius, y);
    ctx.lineTo(x + width - radius, y);
    ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
    ctx.lineTo(x + width, y + height - radius);
    ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
    ctx.lineTo(x + radius, y + height);
    ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
    ctx.lineTo(x, y + radius);
    ctx.quadraticCurveTo(x, y, x + radius, y);
    ctx.closePath();
  }
}

let posterTemplateImg = null;
let userPortraitImg = null;
let posterState = {
  fullName: 'MS. THẮM NGUYỄN',
  organization: 'Master Beauty Connect',
  zoom: 1.0,
  panX: 0,
  panY: 0,
  rotation: 0,
  isDragging: false,
  dragStartX: 0,
  dragStartY: 0,
  initialPanX: 0,
  initialPanY: 0
};

// Open poster modal and optionally prefill with a delegate
function openPosterModalWithDelegate(delegate) {
  if (delegate) {
    if (delegate.full_name) {
      posterState.fullName = delegate.full_name;
      const nameInput = document.getElementById('posterFullName');
      if (nameInput) nameInput.value = delegate.full_name;
    }
    if (delegate.organization) {
      posterState.organization = delegate.organization;
      const orgInput = document.getElementById('posterOrg');
      if (orgInput) orgInput.value = delegate.organization;
    }
    const searchInput = document.getElementById('delegateSearchInput');
    if (searchInput) {
      searchInput.value = delegate.full_name + (delegate.reg_code ? ` (${delegate.reg_code})` : '');
      const clearBtn = document.getElementById('btnClearDelegateSearch');
      if (clearBtn) clearBtn.style.display = 'block';
    }
  }
  openModal('katPosterModal');
  renderPosterCanvas();
}
window.openPosterModalWithDelegate = openPosterModalWithDelegate;
window.openPosterModal = () => openPosterModalWithDelegate(null);
window.closePosterModal = () => closeModal('katPosterModal');

// Render Canvas
function renderPosterCanvas() {
  const canvas = document.getElementById('katPosterCanvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  // Clear
  ctx.clearRect(0, 0, 1024, 960);

  // 1. Draw Template Background
  if (posterTemplateImg && posterTemplateImg.complete) {
    ctx.drawImage(posterTemplateImg, 0, 0, 1024, 960);
  } else {
    // Gradient placeholder if image is still loading
    const grad = ctx.createLinearGradient(0, 0, 1024, 960);
    grad.addColorStop(0, '#0a1733');
    grad.addColorStop(1, '#050e20');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 1024, 960);
  }

  // 2. Portrait Box coordinates (Pixel-perfect matching Hình 1 & Hình 2)
  const boxX = 757;
  const boxY = 124;
  const boxW = 170;
  const boxH = 204;
  const radius = 14;

  // Draw User Portrait
  if (userPortraitImg && userPortraitImg.complete) {
    ctx.save();
    roundRectPath(ctx, boxX, boxY, boxW, boxH, radius);
    ctx.clip();

    // Dark background for clipping box
    ctx.fillStyle = '#06132b';
    ctx.fillRect(boxX, boxY, boxW, boxH);

    // Center of portrait frame
    const cx = boxX + boxW / 2;
    const cy = boxY + boxH / 2;

    ctx.translate(cx + posterState.panX, cy + posterState.panY);
    ctx.rotate((posterState.rotation * Math.PI) / 180);
    ctx.scale(posterState.zoom, posterState.zoom);

    // Cover scale factor
    const scaleCover = Math.max(boxW / userPortraitImg.width, boxH / userPortraitImg.height);
    const drawW = userPortraitImg.width * scaleCover;
    const drawH = userPortraitImg.height * scaleCover;

    ctx.drawImage(userPortraitImg, -drawW / 2, -drawH / 2, drawW, drawH);
    ctx.restore();

    // Draw Glowing Neon Border
    ctx.save();
    ctx.strokeStyle = '#52e5ff';
    ctx.lineWidth = 2.5;
    ctx.shadowColor = '#00e1ff';
    ctx.shadowBlur = 12;
    roundRectPath(ctx, boxX, boxY, boxW, boxH, radius);
    ctx.stroke();
    ctx.restore();
  }

  // 3. Render Field 1: Họ và tên Đại biểu (Line 1)
  const fullName = (posterState.fullName || '').trim().toUpperCase();
  if (fullName) {
    ctx.save();
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    // Auto font sizing: start at 22px, scale down if long
    let fontSize = 22;
    ctx.font = `bold ${fontSize}px "Plus Jakarta Sans", "Inter", -apple-system, sans-serif`;
    let textWidth = ctx.measureText(fullName).width;
    const maxTextWidth = 265;

    while (textWidth > maxTextWidth && fontSize > 13) {
      fontSize -= 1;
      ctx.font = `bold ${fontSize}px "Plus Jakarta Sans", "Inter", -apple-system, sans-serif`;
      textWidth = ctx.measureText(fullName).width;
    }

    // Shadow & Fill
    ctx.shadowColor = 'rgba(0, 0, 0, 0.95)';
    ctx.shadowBlur = 8;
    ctx.shadowOffsetY = 2;
    ctx.fillStyle = '#FFFFFF';
    ctx.fillText(fullName, 841.5, 372);
    ctx.restore();
  }

  // 4. Render Field 2: Đơn vị công tác (Line 2)
  const org = (posterState.organization || '').trim();
  if (org) {
    ctx.save();
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    // Auto font sizing: start at 15px, scale down if long
    let orgFontSize = 15;
    ctx.font = `600 ${orgFontSize}px "Plus Jakarta Sans", "Inter", -apple-system, sans-serif`;
    let orgWidth = ctx.measureText(org).width;
    const maxOrgWidth = 270;

    while (orgWidth > maxOrgWidth && orgFontSize > 11) {
      orgFontSize -= 1;
      ctx.font = `600 ${orgFontSize}px "Plus Jakarta Sans", "Inter", -apple-system, sans-serif`;
      orgWidth = ctx.measureText(org).width;
    }

    // Cyan glowing text shadow
    ctx.shadowColor = 'rgba(0, 210, 255, 0.6)';
    ctx.shadowBlur = 6;
    ctx.shadowOffsetY = 1;
    ctx.fillStyle = '#8ce8ff';
    ctx.fillText(org, 841.5, 405);
    ctx.restore();
  }
}

// B1: Searchable Dropdown for registered delegates
function initPosterDelegateSearch() {
  const searchInput = document.getElementById('delegateSearchInput');
  const dropdown = document.getElementById('delegateDropdownMenu');
  const clearBtn = document.getElementById('btnClearDelegateSearch');
  const nameInput = document.getElementById('posterFullName');
  const orgInput = document.getElementById('posterOrg');

  if (!searchInput || !dropdown) return;

  let debounceTimer = null;

  async function searchDelegates(query) {
    try {
      const res = await fetch(`/api/delegates?q=${encodeURIComponent(query)}`);
      const data = await res.json();
      if (data.success && data.delegates && data.delegates.length > 0) {
        dropdown.innerHTML = '';
        data.delegates.forEach(del => {
          const item = document.createElement('div');
          item.className = 'kat-delegate-item';
          item.innerHTML = `
            <div>
              <div class="kat-delegate-item-name">${escapeHtml(del.full_name)}</div>
              <div class="kat-delegate-item-org">${escapeHtml(del.organization || 'Đại biểu')}</div>
            </div>
            <span class="kat-delegate-item-code">${escapeHtml(del.reg_code || 'KAT')}</span>
          `;
          item.addEventListener('click', () => {
            selectDelegate(del);
          });
          dropdown.appendChild(item);
        });
        dropdown.style.display = 'block';
      } else {
        dropdown.innerHTML = `
          <div style="padding: 0.85rem; font-size: 0.82rem; color: #92b8d9; text-align: center;">
            Không tìm thấy đại biểu phù hợp. Bạn có thể nhập tên và đơn vị trực tiếp ở bên dưới.
          </div>
        `;
        dropdown.style.display = 'block';
      }
    } catch (err) {
      console.warn('Delegates search error:', err);
    }
  }

  function selectDelegate(del) {
    if (nameInput) nameInput.value = del.full_name;
    if (orgInput) orgInput.value = del.organization || '';
    posterState.fullName = del.full_name;
    posterState.organization = del.organization || '';
    if (searchInput) searchInput.value = del.full_name + (del.reg_code ? ` (${del.reg_code})` : '');
    dropdown.style.display = 'none';
    if (clearBtn) clearBtn.style.display = 'block';
    renderPosterCanvas();
    showToast(`Đã chọn đại biểu: ${del.full_name}`, 'success');
  }

  searchInput.addEventListener('input', (e) => {
    const val = e.target.value.trim();
    if (clearBtn) clearBtn.style.display = val ? 'block' : 'none';
    clearTimeout(debounceTimer);
    if (!val) {
      dropdown.style.display = 'none';
      return;
    }
    debounceTimer = setTimeout(() => {
      searchDelegates(val);
    }, 250);
  });

  searchInput.addEventListener('focus', () => {
    if (searchInput.value.trim()) {
      searchDelegates(searchInput.value.trim());
    } else {
      searchDelegates(''); // Show recent registered delegates
    }
  });

  if (clearBtn) {
    clearBtn.addEventListener('click', () => {
      searchInput.value = '';
      clearBtn.style.display = 'none';
      dropdown.style.display = 'none';
      searchInput.focus();
    });
  }

  // Close dropdown on outside click
  document.addEventListener('click', (e) => {
    if (!searchInput.contains(e.target) && !dropdown.contains(e.target)) {
      dropdown.style.display = 'none';
    }
  });

  // Direct editing of name and org fields
  if (nameInput) {
    nameInput.addEventListener('input', (e) => {
      posterState.fullName = e.target.value;
      renderPosterCanvas();
    });
  }
  if (orgInput) {
    orgInput.addEventListener('input', (e) => {
      posterState.organization = e.target.value;
      renderPosterCanvas();
    });
  }
}

// B2: Portrait Photo Tools (Upload, Zoom, Pan, Rotate)
function initPosterPhotoTools() {
  const photoInput = document.getElementById('posterPhotoInput');
  const uploadBtn = document.getElementById('btnUploadPhoto');
  const uploadText = document.getElementById('btnUploadPhotoText');
  const changeBtn = document.getElementById('btnChangePosterPhoto');
  const zoomSlider = document.getElementById('posterZoom');
  const zoomVal = document.getElementById('zoomVal');
  const panXSlider = document.getElementById('posterPanX');
  const panYSlider = document.getElementById('posterPanY');
  const btnZoomIn = document.getElementById('btnZoomIn');
  const btnZoomOut = document.getElementById('btnZoomOut');
  const btnRotate = document.getElementById('btnRotatePoster');
  const btnReset = document.getElementById('btnResetPoster');
  const canvas = document.getElementById('katPosterCanvas');
  const canvasContainer = document.getElementById('katCanvasContainer');

  function handlePhotoFile(file) {
    if (!file || !file.type.startsWith('image/')) {
      showToast('Vui lòng chọn file hình ảnh hợp lệ (JPG, PNG, WEBP).', 'error');
      return;
    }
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        userPortraitImg = img;
        posterState.zoom = 1.0;
        posterState.panX = 0;
        posterState.panY = 0;
        posterState.rotation = 0;

        if (zoomSlider) zoomSlider.value = 1.0;
        if (zoomVal) zoomVal.textContent = '1.0x';
        if (panXSlider) panXSlider.value = 0;
        if (panYSlider) panYSlider.value = 0;
        if (uploadText) uploadText.textContent = '✅ Đã tải ảnh: ' + (file.name.length > 20 ? file.name.substring(0, 18) + '...' : file.name);

        renderPosterCanvas();
        showToast('Tải ảnh thành công! Bạn có thể kéo thả để căn góc đẹp nhất.', 'success');
      };
      img.src = e.target.result;
    };
    reader.readAsDataURL(file);
  }

  if (uploadBtn && photoInput) {
    uploadBtn.addEventListener('click', () => photoInput.click());
  }
  if (changeBtn && photoInput) {
    changeBtn.addEventListener('click', () => photoInput.click());
  }
  if (photoInput) {
    photoInput.addEventListener('change', (e) => {
      if (e.target.files && e.target.files[0]) {
        handlePhotoFile(e.target.files[0]);
      }
    });
  }

  // Sliders
  if (zoomSlider) {
    zoomSlider.addEventListener('input', (e) => {
      posterState.zoom = parseFloat(e.target.value);
      if (zoomVal) zoomVal.textContent = posterState.zoom.toFixed(2) + 'x';
      renderPosterCanvas();
    });
  }
  if (btnZoomIn && zoomSlider) {
    btnZoomIn.addEventListener('click', () => {
      let val = Math.min(3.5, Math.round((posterState.zoom + 0.1) * 100) / 100);
      posterState.zoom = val;
      zoomSlider.value = val;
      if (zoomVal) zoomVal.textContent = val.toFixed(2) + 'x';
      renderPosterCanvas();
    });
  }
  if (btnZoomOut && zoomSlider) {
    btnZoomOut.addEventListener('click', () => {
      let val = Math.max(0.4, Math.round((posterState.zoom - 0.1) * 100) / 100);
      posterState.zoom = val;
      zoomSlider.value = val;
      if (zoomVal) zoomVal.textContent = val.toFixed(2) + 'x';
      renderPosterCanvas();
    });
  }
  if (panXSlider) {
    panXSlider.addEventListener('input', (e) => {
      posterState.panX = parseFloat(e.target.value);
      renderPosterCanvas();
    });
  }
  if (panYSlider) {
    panYSlider.addEventListener('input', (e) => {
      posterState.panY = parseFloat(e.target.value);
      renderPosterCanvas();
    });
  }
  if (btnRotate) {
    btnRotate.addEventListener('click', () => {
      posterState.rotation = (posterState.rotation + 90) % 360;
      renderPosterCanvas();
      showToast(`Đã xoay ảnh ${posterState.rotation}°`, 'info');
    });
  }
  if (btnReset) {
    btnReset.addEventListener('click', () => {
      posterState.zoom = 1.0;
      posterState.panX = 0;
      posterState.panY = 0;
      posterState.rotation = 0;
      if (zoomSlider) zoomSlider.value = 1.0;
      if (zoomVal) zoomVal.textContent = '1.0x';
      if (panXSlider) panXSlider.value = 0;
      if (panYSlider) panYSlider.value = 0;
      renderPosterCanvas();
      showToast('Đã đặt lại vị trí căn giữa', 'info');
    });
  }

  // Interactive Drag on Canvas (Mouse & Touch)
  if (canvas && canvasContainer) {
    function startDrag(clientX, clientY) {
      if (!userPortraitImg) return;
      posterState.isDragging = true;
      posterState.dragStartX = clientX;
      posterState.dragStartY = clientY;
      posterState.initialPanX = posterState.panX;
      posterState.initialPanY = posterState.panY;
      canvasContainer.classList.add('dragging');
    }

    function doDrag(clientX, clientY) {
      if (!posterState.isDragging || !userPortraitImg) return;
      const rect = canvas.getBoundingClientRect();
      const scale = 1024 / rect.width;
      const dx = (clientX - posterState.dragStartX) * scale;
      const dy = (clientY - posterState.dragStartY) * scale;

      let newPanX = Math.round(posterState.initialPanX + dx);
      let newPanY = Math.round(posterState.initialPanY + dy);
      newPanX = Math.max(-180, Math.min(180, newPanX));
      newPanY = Math.max(-180, Math.min(180, newPanY));

      posterState.panX = newPanX;
      posterState.panY = newPanY;

      if (panXSlider) panXSlider.value = newPanX;
      if (panYSlider) panYSlider.value = newPanY;

      renderPosterCanvas();
    }

    function endDrag() {
      if (posterState.isDragging) {
        posterState.isDragging = false;
        canvasContainer.classList.remove('dragging');
      }
    }

    canvas.addEventListener('mousedown', (e) => {
      startDrag(e.clientX, e.clientY);
    });
    window.addEventListener('mousemove', (e) => {
      doDrag(e.clientX, e.clientY);
    });
    window.addEventListener('mouseup', endDrag);

    canvas.addEventListener('touchstart', (e) => {
      if (e.touches.length === 1) {
        startDrag(e.touches[0].clientX, e.touches[0].clientY);
      }
    }, { passive: true });
    window.addEventListener('touchmove', (e) => {
      if (e.touches && e.touches.length === 1) {
        doDrag(e.touches[0].clientX, e.touches[0].clientY);
      }
    }, { passive: true });
    window.addEventListener('touchend', endDrag);
  }
}

// B3: Download & Social Share (Zalo, Facebook)
function initPosterSharing() {
  const btnDownload = document.getElementById('btnDownloadPoster');
  const btnZalo = document.getElementById('btnShareZalo');
  const btnFB = document.getElementById('btnShareFB');
  const shareToast = document.getElementById('posterShareAlert');
  const canvas = document.getElementById('katPosterCanvas');

  function showShareAlert(msg, type = 'success') {
    if (!shareToast) return;
    shareToast.style.display = 'block';
    shareToast.style.borderColor = type === 'success' ? '#00d084' : '#59d7ff';
    shareToast.style.color = type === 'success' ? '#bbf7d0' : '#c6efff';
    shareToast.innerHTML = msg;
    setTimeout(() => {
      shareToast.style.display = 'none';
    }, 8000);
  }

  function getCleanFileName() {
    const raw = (posterState.fullName || 'DaiBieu')
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-zA-Z0-9]/g, '_')
      .replace(/_+/g, '_');
    return `KAT2026_Poster_${raw}.png`;
  }

  // 1. TẢI POSTER VỀ MÁY (PNG NÉT CAO)
  if (btnDownload && canvas) {
    btnDownload.addEventListener('click', () => {
      canvas.toBlob((blob) => {
        if (!blob) {
          showToast('Lỗi khi xuất ảnh poster.', 'error');
          return;
        }
        const fileName = getCleanFileName();
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = fileName;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);

        showToast('Đã tải poster thành công!', 'success');
        showShareAlert(`✅ Đã tải file <strong>${fileName}</strong> về thiết bị thành công! Bạn có thể dùng ảnh để đăng lên mạng xã hội.`);
      }, 'image/png');
    });
  }

  // 2. CHIA SẺ QUA ZALO
  if (btnZalo && canvas) {
    btnZalo.addEventListener('click', () => {
      canvas.toBlob(async (blob) => {
        if (!blob) return;
        const fileName = getCleanFileName();
        const file = new File([blob], fileName, { type: 'image/png' });

        // Native Web Share API (Mobile: Zalo, FB, etc.)
        if (navigator.canShare && navigator.canShare({ files: [file] })) {
          try {
            await navigator.share({
              title: 'Poster Khách Mời K.A.T 2026',
              text: `Tôi sẽ tham dự Hội thảo khoa học quốc tế K.A.T 2026 (04/10/2026 tại TP.HCM)!`,
              files: [file]
            });
            showToast('Đã mở menu chia sẻ!', 'success');
            return;
          } catch (e) {
            if (e.name !== 'AbortError') console.warn('Share error:', e);
          }
        }

        // Desktop / Fallback: Copy Image to Clipboard & Open Zalo
        let copied = false;
        if (navigator.clipboard && window.ClipboardItem) {
          try {
            await navigator.clipboard.write([
              new ClipboardItem({ 'image/png': blob })
            ]);
            copied = true;
          } catch (clipErr) {
            console.warn('Clipboard write image failed:', clipErr);
          }
        }

        // Trigger file download
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = fileName;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);

        if (copied) {
          showShareAlert(`
            🎉 <strong>Đã sao chép poster vào bộ nhớ tạm!</strong><br>
            File ảnh cũng đã được tải về máy. Hãy mở Zalo và nhấn <kbd style="background:#222;padding:2px 5px;border-radius:3px;color:#fff;">Ctrl + V</kbd> (Dán) để gửi ngay trong tin nhắn hoặc đăng Nhật ký Zalo!
          `);
        } else {
          showShareAlert(`
            📥 <strong>Ảnh poster đã tải về máy!</strong><br>
            Vui lòng mở Zalo và chọn gửi file ảnh vừa tải về.
          `);
        }

        setTimeout(() => {
          window.open('https://chat.zalo.me', '_blank');
        }, 1200);
      }, 'image/png');
    });
  }

  // 3. CHIA SẺ QUA FACEBOOK
  if (btnFB && canvas) {
    btnFB.addEventListener('click', () => {
      canvas.toBlob(async (blob) => {
        if (!blob) return;
        const fileName = getCleanFileName();
        const file = new File([blob], fileName, { type: 'image/png' });

        if (navigator.canShare && navigator.canShare({ files: [file] })) {
          try {
            await navigator.share({
              title: 'Poster Khách Mời K.A.T 2026',
              text: `Tôi sẽ tham dự Hội thảo khoa học quốc tế K.A.T 2026 (04/10/2026 tại TP.HCM)!`,
              files: [file]
            });
            showToast('Đã mở menu chia sẻ!', 'success');
            return;
          } catch (e) {
            if (e.name !== 'AbortError') console.warn('FB share error:', e);
          }
        }

        // Trigger file download
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = fileName;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);

        showShareAlert(`
          📥 <strong>Đã tải poster về máy!</strong><br>
          Đang mở Facebook... Bạn hãy tải ảnh này lên bài viết hoặc Story để chia sẻ cùng bạn bè!
        `);

        setTimeout(() => {
          const shareUrl = encodeURIComponent(window.location.origin);
          window.open(`https://www.facebook.com/sharer/sharer.php?u=${shareUrl}`, '_blank');
        }, 1200);
      }, 'image/png');
    });
  }
}

// Master Poster Initializer
function initPosterCreator() {
  // Load template image
  const img = new Image();
  img.src = '/images/poster_template.jpg';
  img.onload = () => {
    posterTemplateImg = img;
    renderPosterCanvas();
  };
  img.onerror = () => {
    console.warn('Could not load /images/poster_template.jpg');
  };

  // Close modal button
  const closeBtn = document.getElementById('btnClosePosterModal');
  if (closeBtn) {
    closeBtn.addEventListener('click', () => {
      closeModal('katPosterModal');
    });
  }

  // Floating bubble button
  const floatingBubble = document.getElementById('katPosterFloatingBubble');
  if (floatingBubble) {
    floatingBubble.addEventListener('click', () => {
      openPosterModalWithDelegate(null);
    });
  }

  initPosterDelegateSearch();
  initPosterPhotoTools();
  initPosterSharing();
}

