// K.A.T 2026 Interactive Application Logic

document.addEventListener('DOMContentLoaded', () => {
  initModals();
  initRegisterForms();
  initNewsletterForm();
  initSupportWidget();
  interceptRegisterButtons();
  initMobileBottomNav();
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
