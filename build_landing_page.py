import sys
import re
import os

sys.stdout.reconfigure(encoding='utf-8')
os.makedirs('public', exist_ok=True)

# Read custom.css content
with open('public/css/custom.css', 'r', encoding='utf-8') as f:
    custom_css_content = f.read()

# Read source HTML
with open('kat.html.html', 'r', encoding='utf-8', errors='ignore') as f:
    html = f.read()

# 1. REMOVE SingleFile strict Content-Security-Policy (which blocks styles & scripts)
html = re.sub(r'<meta[^>]*content-security-policy[^>]*>', '', html, flags=re.IGNORECASE)
print('1. Removed CSP meta tag.')

# 2. REMOVE HEADER COMPLETELY ("bỏ header")
html = re.sub(r'<header class=wp-block-template-part>[\s\S]*?</header>', '', html)
print('2. Removed top navigation header.')

# 3. Connect ALL registration links directly to #dang-ky-kat
html = re.sub(
    r'href=["\']?https://kbitassociation\.com/dang-ky/?["\']?',
    'href="#dang-ky-kat"',
    html
)
print('3. Connected all dang-ky links to #dang-ky-kat.')

# 4. Inject Google Fonts & custom styles directly into <head>
embedded_style_tag = f'''
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:ital,wght@0,400;0,500;0,600;0,700;0,800;1,400;1,600&family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet">
<link rel="stylesheet" href="/css/custom.css">
<style id="kat-custom-embedded-css">
{custom_css_content}
</style>
</head>
'''
html = html.replace('</head>', embedded_style_tag, 1)
print('4. Injected Google Fonts & custom styles into head.')

# 5. PROFESSIONAL, HIGH-CONTRAST & MOBILE-FIRST REGISTRATION FORM (FULL SYSTEM WIDTH, COMPACT PADDING)
pro_registration_html = '''
<!-- ========================================================
     ULTRA-PROFESSIONAL MEDICAL REGISTRATION SECTION (K.A.T 2026)
     Full System Width & Reduced Padding
======================================================== -->
<section class="kat-hero relative overflow-hidden py-16 alignfull" id="dang-ky-kat">
  <div class="kbit-container">
    <div class="kat-inline-reg-wrapper" style="margin: 0 auto;">
      <div class="kat-reg-card" id="katMainRegCard">
        
        <!-- Card Header -->
        <div class="kat-reg-head">
          <div class="kat-reg-badge-top">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
            HỘI THẢO ĐÀO TẠO KỸ NĂNG NÂNG CAO HÀN – VIỆT
          </div>
          <h3>Phiếu Đăng Ký Tham Dự K.A.T 2026</h3>
          <p>Quý Bác sĩ và Đại biểu vui lòng hoàn tất thông tin bên dưới để Ban thư ký chuẩn bị hồ sơ cấp chứng nhận tham dự, hồ sơ CME và gửi tài liệu chính thức.</p>
          
          <div class="kat-reg-meta-bar">
            <div class="kat-reg-meta-item">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
              <span>Chủ Nhật, 04/10/2026</span>
            </div>
            <div class="kat-reg-meta-item">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
              <span>TP. Hồ Chí Minh</span>
            </div>
            <div class="kat-reg-meta-item">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
              <span>Cấp CME & Chứng Nhận</span>
            </div>
            <div class="kat-reg-meta-item">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 14 14"/></svg>
              <span style="color: #59d7ff; font-weight:700;">Xác nhận trong 24h</span>
            </div>
          </div>
        </div>

        <!-- Registration Form -->
        <form id="katInlineRegForm">
          
          <!-- PHẦN 1: THÔNG TIN ĐẠI BIỂU -->
          <div class="kat-form-section-title">
            <span class="kat-step-num">1</span>
            <span>Thông Tin Đại Biểu</span>
          </div>

          <div class="kat-grid-2">
            <div class="kat-input-group">
              <label class="kat-label" for="regFullName">
                <span>Họ và tên Đại biểu <span class="req">*</span></span>
              </label>
              <div class="kat-input-wrap">
                <span class="kat-input-icon">
                  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                </span>
                <input type="text" id="regFullName" name="full_name" class="kat-field" placeholder="Ví dụ: BS.CKII Nguyễn Văn An" required>
              </div>
            </div>

            <div class="kat-input-group">
              <label class="kat-label" for="regPhone">
                <span>Số điện thoại / Zalo <span class="req">*</span></span>
              </label>
              <div class="kat-input-wrap">
                <span class="kat-input-icon">
                  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg>
                </span>
                <input type="tel" id="regPhone" name="phone" class="kat-field" placeholder="Ví dụ: 0912 345 678" required>
              </div>
            </div>
          </div>

          <div class="kat-grid-2">
            <div class="kat-input-group">
              <label class="kat-label" for="regEmail">
                <span>Địa chỉ Email tiếp nhận hồ sơ <span class="req">*</span></span>
              </label>
              <div class="kat-input-wrap">
                <span class="kat-input-icon">
                  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>
                </span>
                <input type="email" id="regEmail" name="email" class="kat-field" placeholder="bacsi.nguyen@benhvien.vn" required>
              </div>
            </div>

            <div class="kat-input-group">
              <label class="kat-label" for="regOrg">
                <span>Đơn vị công tác / Bệnh viện / Cơ sở</span>
              </label>
              <div class="kat-input-wrap">
                <span class="kat-input-icon">
                  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="7" width="20" height="14" rx="2" ry="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/></svg>
                </span>
                <input type="text" id="regOrg" name="organization" class="kat-field" placeholder="Bệnh viện / Phòng khám / Viện thẩm mỹ">
              </div>
            </div>
          </div>

          <!-- PHẦN 2: CHUYÊN KHOA & VỊ TRÍ -->
          <div class="kat-form-section-title">
            <span class="kat-step-num">2</span>
            <span>Chuyên Khoa & Lĩnh Vực Hoạt Động</span>
          </div>

          <div class="kat-input-group" style="margin-bottom: 0.9rem;">
            <label class="kat-label" for="regSpecialty">
              <span>Chọn Chuyên khoa / Vị trí chuyên môn</span>
            </label>
            <div class="kat-input-wrap">
              <span class="kat-input-icon">
                <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4.8 2.3A.3.3 0 1 0 5 2H4a2 2 0 0 0-2 2v5a6 6 0 0 0 6 6v0a6 6 0 0 0 6-6V4a2 2 0 0 0-2-2h-1a.2.2 0 1 0 .3.3"/><path d="M8 15v1a6 6 0 0 0 6 6v0a6 6 0 0 0 6-6v-4"/><circle cx="20" cy="10" r="2"/></svg>
              </span>
              <select id="regSpecialty" name="specialty" class="kat-field kat-field-select">
                <option value="">-- Chọn chuyên khoa phù hợp --</option>
                <option value="Bác sĩ phẫu thuật tạo hình thẩm mỹ">Bác sĩ phẫu thuật tạo hình thẩm mỹ</option>
                <option value="Bác sĩ da liễu & thẩm mỹ nội khoa">Bác sĩ da liễu & thẩm mỹ nội khoa</option>
                <option value="Giám đốc y khoa / Chủ cơ sở thẩm mỹ">Giám đốc y khoa / Chủ cơ sở thẩm mỹ</option>
                <option value="Dược sĩ / Điều dưỡng chuyên khoa">Dược sĩ / Điều dưỡng chuyên khoa</option>
                <option value="Doanh nghiệp thiết bị & dược mỹ phẩm">Doanh nghiệp thiết bị & dược mỹ phẩm</option>
                <option value="Khác">Khác</option>
              </select>
            </div>
          </div>

          <!-- PHẦN 3: PHIÊN HỘI THẢO THAM DỰ -->
          <div class="kat-form-section-title">
            <span class="kat-step-num">3</span>
            <span>Nội Dung Quan Tâm & Tham Dự</span>
          </div>

          <div class="kat-sessions-grid">
            <label class="kat-session-card">
              <input type="checkbox" name="interested_sessions" value="Keynote & Báo cáo khoa học sáng" checked>
              <div class="kat-session-content">
                <div class="kat-session-title">Keynote & Báo cáo khoa học sáng</div>
                <div class="kat-session-sub">
                  <span class="kat-session-badge">08:30 – 12:00</span>
                  <span>Hội trường chính</span>
                </div>
              </div>
            </label>

            <label class="kat-session-card">
              <input type="checkbox" name="interested_sessions" value="Live Clinical (BV Lê Văn Thịnh)">
              <div class="kat-session-content">
                <div class="kat-session-title">Live Clinical Program</div>
                <div class="kat-session-sub">
                  <span class="kat-session-badge">13:30 – 17:00</span>
                  <span>BV Lê Văn Thịnh</span>
                </div>
              </div>
            </label>

            <label class="kat-session-card">
              <input type="checkbox" name="interested_sessions" value="Live Surgery (BV ĐH QT Hồng Bàng)">
              <div class="kat-session-content">
                <div class="kat-session-title">Live Surgery Program</div>
                <div class="kat-session-sub">
                  <span class="kat-session-badge">13:30 – 17:00</span>
                  <span>BV ĐH QT Hồng Bàng</span>
                </div>
              </div>
            </label>

            <label class="kat-session-card">
              <input type="checkbox" name="interested_sessions" value="Tọa đàm & Kết nối chuyên ngành">
              <div class="kat-session-content">
                <div class="kat-session-title">Tọa đàm & Kết nối chuyên ngành</div>
                <div class="kat-session-sub">
                  <span class="kat-session-badge">13:30 – 17:00</span>
                  <span>B2B & Trao đổi</span>
                </div>
              </div>
            </label>
          </div>

          <!-- PHẦN 4: GHI CHÚ & BẢN TIN -->
          <div class="kat-form-section-title">
            <span class="kat-step-num">4</span>
            <span>Ghi Chú & Nhu Cầu Hỗ Trợ</span>
          </div>

          <div class="kat-input-group">
            <div class="kat-input-wrap">
              <span class="kat-input-icon" style="top: 0.9rem; transform: none;">
                <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
              </span>
              <textarea id="regNotes" name="notes" class="kat-textarea" rows="2" placeholder="Ghi chú về nhu cầu cấp chứng nhận đào tạo CME, dịch thuật tiếng Hàn, xuất hóa đơn hoặc câu hỏi cho chuyên gia..."></textarea>
            </div>
          </div>

          <!-- Newsletter Opt-in -->
          <label class="kat-optin-card">
            <input type="checkbox" name="subscribe_newsletter" value="yes" checked>
            <span class="kat-optin-text">
              Đồng thời đăng ký nhận tài liệu khoa học và thông báo các sự kiện y khoa KBIT tiếp theo qua email.
            </span>
          </label>

          <!-- Submit CTA -->
          <div class="kat-submit-wrap">
            <button type="submit" class="kat-submit-btn-pro" id="btnSubmitReg">
              <span>Xác Nhận Đăng Ký Tham Dự K.A.T 2026</span>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14"></path><path d="m12 5 7 7-7 7"></path></svg>
            </button>
          </div>

          <!-- Trust Row -->
          <div class="kat-trust-row">
            <div class="kat-trust-item">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#00d084" stroke-width="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
              <span>Bảo mật thông tin y khoa 100%</span>
            </div>
            <div class="kat-trust-item">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#59d7ff" stroke-width="2"><circle cx="12" cy="8" r="7"/><polyline points="8.21 13.89 7 23 12 20 17 23 15.79 13.88"/></svg>
              <span>Hỗ trợ thủ tục cấp chứng chỉ CME</span>
            </div>
            <div class="kat-trust-item">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#C5A15A" stroke-width="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 14 14"/></svg>
              <span>Ban thư ký liên hệ xác nhận trong 24h</span>
            </div>
          </div>

        </form>

        <!-- ========================================================
             INLINE SUCCESS SUMMARY CARD (HIỂN THỊ TỨC THÌ SAU KHI ĐĂNG KÝ)
        ======================================================== -->
        <div class="kat-success-summary-wrapper" id="katInlineSuccessCard" style="display: none;">
          <div class="kat-success-badge-header">
            <div class="kat-success-icon-large">
              <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#00d084" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
                <polyline points="22 4 12 14.01 9 11.01"/>
              </svg>
            </div>
            <div class="kat-success-head-text">
              <span class="kat-badge-pill-success">ĐĂNG KÝ THÀNH CÔNG</span>
              <h3 class="kat-success-title">Cảm Ơn Quý Đại Biểu Đã Đăng Ký Tham Dự K.A.T 2026</h3>
              <p class="kat-success-sub">Hồ sơ tham dự của Quý vị đã được tiếp nhận và lưu trữ chính thức trên hệ thống Ban tổ chức KBIT Association.</p>
            </div>
          </div>

          <!-- Luxury Ticket Card -->
          <div class="kat-ticket-card">
            <div class="kat-ticket-header">
              <div>
                <div class="kat-ticket-label">MÃ SỐ ĐĂNG KÝ THAM DỰ (E-TICKET)</div>
                <div class="kat-ticket-code" id="inlineSuccessCode">KAT-2026</div>
              </div>
              <div>
                <span class="kat-status-tag-confirmed">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg>
                  Đã Tiếp Nhận Hồ Sơ
                </span>
              </div>
            </div>

            <!-- Summary Table -->
            <div class="kat-summary-table-wrap">
              <table class="kat-summary-table">
                <tbody>
                  <tr>
                    <td class="kat-sum-lbl">Họ và tên Đại biểu:</td>
                    <td class="kat-sum-val" id="inlineSuccessName">--</td>
                  </tr>
                  <tr>
                    <td class="kat-sum-lbl">Số điện thoại / Zalo:</td>
                    <td class="kat-sum-val" id="inlineSuccessPhone">--</td>
                  </tr>
                  <tr>
                    <td class="kat-sum-lbl">Địa chỉ Email:</td>
                    <td class="kat-sum-val" id="inlineSuccessEmail">--</td>
                  </tr>
                  <tr>
                    <td class="kat-sum-lbl">Đơn vị công tác:</td>
                    <td class="kat-sum-val" id="inlineSuccessOrg">--</td>
                  </tr>
                  <tr>
                    <td class="kat-sum-lbl">Chuyên khoa:</td>
                    <td class="kat-sum-val" id="inlineSuccessSpecialty">--</td>
                  </tr>
                  <tr>
                    <td class="kat-sum-lbl">Phiên hội thảo quan tâm:</td>
                    <td class="kat-sum-val" id="inlineSuccessSessions">--</td>
                  </tr>
                  <tr id="inlineSuccessNotesRow" style="display: none;">
                    <td class="kat-sum-lbl">Ghi chú kèm theo:</td>
                    <td class="kat-sum-val" id="inlineSuccessNotes">--</td>
                  </tr>
                  <tr>
                    <td class="kat-sum-lbl">Thời gian ghi nhận:</td>
                    <td class="kat-sum-val" id="inlineSuccessTime">--</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <!-- Next steps & contact -->
            <div class="kat-instructions-box">
              <div class="kat-instruct-title">
                <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="#59d7ff" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>
                <span>Các Bước Tiếp Theo Dành Cho Đại Biểu:</span>
              </div>
              <ul class="kat-instruct-list">
                <li><strong>Xác nhận trong 24h:</strong> Ban thư ký K.A.T 2026 sẽ liên hệ trực tiếp qua SĐT/Zalo của Quý vị để kiểm tra đối soát thông tin.</li>
                <li><strong>Hồ sơ cấp CME:</strong> Quý Bác sĩ vui lòng chuẩn bị ảnh chụp Chứng chỉ hành nghề y khoa để Ban thư ký hoàn thiện hồ sơ CME.</li>
                <li><strong>Tài liệu & Check-in:</strong> Mã QR check-in hội nghị và tài liệu báo cáo sẽ được gửi tới Email đăng ký trước ngày 04/10/2026.</li>
              </ul>
              <div class="kat-hotline-note">
                Tổng đài hỗ trợ: <strong style="color: #59d7ff;">0909 123 456</strong> (Call/Zalo) · Email: <strong style="color: #59d7ff;">kat2026@kbitassociation.com</strong>
              </div>
            </div>

            <!-- Action Buttons -->
            <div class="kat-success-actions">
              <button type="button" onclick="window.print()" class="kat-btn-outline-print">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="6 9 6 2 18 2 18 9"/><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><rect x="6" y="14" width="12" height="8"/></svg>
                In / Lưu Phiếu Đăng Ký (PDF)
              </button>
              <button type="button" id="btnRegisterAnother" class="kat-btn-register-another">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 5v14M5 12h14"/></svg>
                Đăng Ký Thêm Đại Biểu Khác
              </button>
            </div>
          </div>
        </div>

      </div>
    </div>
  </div>
</section>
'''

# 5. REMOVE BOTH SECTIONS REQUESTED BY USER:
# - Section 1: "Chương trình được triển khai với sự tham gia của các đơn vị chuyên môn Việt Nam – Hàn Quốc"
# - Section 2: "Một số câu hỏi trước khi đăng ký"
idx1 = html.find('Chương trình được triển khai với sự tham gia')
idx2 = html.find('Một số câu hỏi trước khi đăng ký')

if idx1 != -1 and idx2 != -1:
    sec1_start = html.rfind('<section', 0, idx1)
    sec2_end = html.find('</section>', idx2) + len('</section>')
    html = html[:sec1_start] + pro_registration_html + html[sec2_end:]
    print('5. Successfully deleted both sections and inserted dedicated registration section!')
else:
    print('Warning: could not find sections to remove by exact string.')

# 6. REMOVE THE BANNER REQUESTED IN PREVIOUS STEP
footer_block_match = re.search(r'<div class="border-y border-white/10 bg-\[#0e1830\]"><div class="kbit-container flex flex-col gap-5 py-8 md:flex-row md:items-center md:justify-between">[\s\S]*?</div></div></div>', html)
if footer_block_match:
    html = html[:footer_block_match.start()] + html[footer_block_match.end():]
    print('6. Removed requested footer banner.')

# 7. Add CMS Admin link to copyright bar
copyright_search = '<p>© 2026 KBIT Association. Bảo lưu mọi quyền.</p>'
copyright_replace = '''<p>© 2026 KBIT Association. Bảo lưu mọi quyền. · <a href="/admin" style="color: rgba(89,215,255,0.7); text-decoration: none; font-weight: 600;">CMS Quản trị</a></p>'''
if copyright_search in html:
    html = html.replace(copyright_search, copyright_replace, 1)

# 8. Modals, Support Widget & App Script
modal_and_support_html = '''
<!-- ========================================================
     MODAL: XÁC NHẬN ĐĂNG KÝ THÀNH CÔNG & TÓM TẮT HỒ SƠ
======================================================== -->
<div class="kat-modal-overlay" id="katSuccessModal">
  <div class="kat-modal-card" style="max-width: 620px; padding: 0;">
    <button class="kat-modal-close" style="position: absolute; top: 1rem; right: 1rem; z-index: 10;" onclick="closeModal('katSuccessModal')">&times;</button>
    <div class="kat-success-card" style="padding: 2rem 1.5rem;">
      <div class="kat-success-icon" style="width: 64px; height: 64px; margin: 0 auto 1rem;">
        <svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="#00d084" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
      </div>
      <span class="kat-badge-pill-success" style="margin-bottom: 0.5rem;">ĐĂNG KÝ THÀNH CÔNG</span>
      <h3 style="font-size: 1.45rem; font-weight: 800; color: #ffffff; margin: 0 0 0.4rem 0;">Cảm Ơn Quý Đại Biểu!</h3>
      <p style="color: #c6efff; font-size: 0.92rem; margin: 0; line-height: 1.5;">
        Cảm ơn Quý Bác sĩ / Đại biểu <strong id="successRegName" style="color:#ffffff;"></strong> đã hoàn tất đăng ký tham dự Hội thảo K.A.T 2026.
      </p>

      <div style="margin: 1.15rem 0;">
        <div style="font-size: 0.75rem; text-transform: uppercase; letter-spacing: 0.12em; color: #59d7ff; font-weight: 700;">Mã số đăng ký chính thức:</div>
        <div style="display: flex; align-items: center; justify-content: center; gap: 0.5rem; margin-top: 0.35rem;">
          <span class="kat-reg-code-badge" id="successRegCode" style="margin: 0;">KAT-2026</span>
          <button type="button" id="btnCopyRegCode" title="Sao chép mã" style="background: rgba(255,255,255,0.1); border: 1px solid rgba(89,215,255,0.3); color: #59d7ff; padding: 0.45rem 0.75rem; border-radius: 0.5rem; cursor: pointer; font-size: 0.8rem; font-weight: 600;">
            📋 Chép mã
          </button>
        </div>
      </div>

      <!-- Modal Summary Table -->
      <div style="background: rgba(13, 27, 56, 0.85); border: 1.5px solid rgba(89,215,255,0.25); border-radius: 0.85rem; padding: 1rem 1.15rem; font-size: 0.86rem; text-align: left; color: #c6efff; line-height: 1.6; margin-bottom: 1rem;">
        <div style="display: flex; justify-content: space-between; border-bottom: 1px solid rgba(255,255,255,0.08); padding-bottom: 0.4rem;">
          <span style="color:#92b8d9;">Họ và tên:</span>
          <strong style="color:#fff;" id="modalSumName">--</strong>
        </div>
        <div style="display: flex; justify-content: space-between; border-bottom: 1px solid rgba(255,255,255,0.08); padding: 0.4rem 0;">
          <span style="color:#92b8d9;">Số điện thoại:</span>
          <strong style="color:#fff;" id="modalSumPhone">--</strong>
        </div>
        <div style="display: flex; justify-content: space-between; border-bottom: 1px solid rgba(255,255,255,0.08); padding: 0.4rem 0;">
          <span style="color:#92b8d9;">Email:</span>
          <strong style="color:#fff;" id="modalSumEmail">--</strong>
        </div>
        <div style="display: flex; justify-content: space-between; border-bottom: 1px solid rgba(255,255,255,0.08); padding: 0.4rem 0;">
          <span style="color:#92b8d9;">Đơn vị:</span>
          <strong style="color:#fff;" id="modalSumOrg">--</strong>
        </div>
        <div style="display: flex; justify-content: space-between; padding-top: 0.4rem;">
          <span style="color:#92b8d9;">Chuyên khoa:</span>
          <strong style="color:#fff;" id="modalSumSpecialty">--</strong>
        </div>
      </div>

      <div style="background: rgba(89, 215, 255, 0.08); border-radius: 0.65rem; padding: 0.75rem 1rem; font-size: 0.8rem; color: #c6efff; line-height: 1.5; text-align: left; margin-bottom: 1.25rem;">
        Ban thư ký sẽ liên hệ qua điện thoại/Zalo trong vòng 24 giờ để hoàn tất thủ tục và gửi tài liệu chính thức. Hotline: <strong style="color: #59d7ff;">0909 123 456</strong>
      </div>

      <div style="display: flex; gap: 0.75rem;">
        <button onclick="window.print()" class="kat-btn-outline-print" style="flex: 1; height: 44px; font-size: 0.9rem;">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="6 9 6 2 18 2 18 9"/><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><rect x="6" y="14" width="12" height="8"/></svg>
          In tóm tắt
        </button>
        <button onclick="closeModal('katSuccessModal')" class="kat-submit-btn-pro" style="flex: 1; height: 44px; font-size: 0.9rem; max-width: none;">
          Đã hiểu & Đóng
        </button>
      </div>
    </div>
  </div>
</div>

<!-- ========================================================
     FLOATING ONLINE SUPPORT & NEWSLETTER WIDGET
======================================================== -->
<div class="kat-support-bubble" id="katSupportBubble" title="Tư vấn & Hỗ trợ trực tuyến">
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
  <span style="font-weight: 700; font-size: 0.85rem;">Tư vấn & Hỗ trợ</span>
</div>

<div class="kat-support-window" id="katSupportWindow">
  <div class="kat-support-header">
    <div style="display: flex; align-items: center; gap: 0.6rem;">
      <div style="width: 10px; height: 10px; border-radius: 50%; background: #00d084; box-shadow: 0 0 8px #00d084;"></div>
      <div>
        <h4 style="margin: 0; font-size: 0.95rem; font-weight: 800; color: #ffffff;">Ban Thư Ký K.A.T 2026</h4>
        <span style="font-size: 0.75rem; color: #59d7ff;">Hỗ trợ trực tuyến 24/7</span>
      </div>
    </div>
    <button id="katCloseSupport" style="background: none; border: none; color: rgba(255,255,255,0.7); font-size: 1.25rem; cursor: pointer;">&times;</button>
  </div>

  <div class="kat-support-tabs">
    <button class="kat-support-tab active" data-tab="supportPanelForm">Gửi câu hỏi</button>
    <button class="kat-support-tab" data-tab="supportPanelNewsletter">Nhận bản tin</button>
    <button class="kat-support-tab" data-tab="supportPanelDirect">Kênh trực tiếp</button>
  </div>

  <div class="kat-support-content">
    <div id="supportPanelForm" class="kat-support-panel">
      <form id="katSupportForm">
        <div class="kat-input-group" style="margin-bottom: 0.8rem;">
          <label class="kat-label" style="font-size: 0.75rem;">Họ và tên <span class="req">*</span></label>
          <input type="text" name="full_name" class="kat-field" style="height: 42px; padding: 0 0.85rem; font-size: 14px;" placeholder="Bác sĩ / Quý khách" required>
        </div>

        <div class="kat-input-group" style="margin-bottom: 0.8rem;">
          <label class="kat-label" style="font-size: 0.75rem;">Số điện thoại / Zalo</label>
          <input type="tel" name="phone" class="kat-field" style="height: 42px; padding: 0 0.85rem; font-size: 14px;" placeholder="09xx xxx xxx">
        </div>

        <div class="kat-input-group" style="margin-bottom: 0.8rem;">
          <label class="kat-label" style="font-size: 0.75rem;">Email liên hệ <span class="req">*</span></label>
          <input type="email" name="email" class="kat-field" style="height: 42px; padding: 0 0.85rem; font-size: 14px;" placeholder="email@domain.com" required>
        </div>

        <div class="kat-input-group" style="margin-bottom: 0.8rem;">
          <label class="kat-label" style="font-size: 0.75rem;">Chủ đề cần tư vấn</label>
          <select name="topic" class="kat-field kat-field-select" style="height: 42px; padding: 0 0.85rem; font-size: 14px;">
            <option value="Chứng nhận & Đào tạo CME">Chứng nhận & Đào tạo CME</option>
            <option value="Nội dung 2 cầu truyền hình lâm sàng">Nội dung 2 cầu truyền hình lâm sàng</option>
            <option value="Thủ tục & Chi phí đăng ký">Thủ tục & Chi phí đăng ký</option>
            <option value="Hợp tác chuyên ngành / Tài trợ">Hợp tác chuyên ngành / Tài trợ</option>
            <option value="Khác">Khác</option>
          </select>
        </div>

        <div class="kat-input-group" style="margin-bottom: 1rem;">
          <label class="kat-label" style="font-size: 0.75rem;">Nội dung câu hỏi <span class="req">*</span></label>
          <textarea name="message" class="kat-textarea" rows="2" style="padding: 0.65rem 0.85rem; font-size: 14px; min-height: 70px;" placeholder="Nhập câu hỏi hoặc vấn đề cần hỗ trợ..." required></textarea>
        </div>

        <button type="submit" class="kat-submit-btn-pro" style="height: 44px; font-size: 0.9rem; max-width: none;">
          Gửi Yêu Cầu Hỗ Trợ
        </button>
      </form>
    </div>

    <div id="supportPanelNewsletter" class="kat-support-panel" style="display: none;">
      <p style="font-size: 0.85rem; color: #c6efff; margin-bottom: 1rem; line-height: 1.5;">
        Đăng ký để nhận tài liệu khoa học, thông báo diễn giả và thông tin các hội thảo thẩm mỹ quốc tế tiếp theo từ KBIT.
      </p>
      <form id="katNewsletterWidgetForm">
        <div class="kat-input-group">
          <label class="kat-label" style="font-size: 0.75rem;">Địa chỉ Email <span class="req">*</span></label>
          <input type="email" name="email" class="kat-field" style="height: 42px; padding: 0 0.85rem;" placeholder="bacsi@benhvien.vn" required>
        </div>
        <button type="submit" class="kat-submit-btn-pro" style="height: 44px; font-size: 0.9rem; max-width: none; margin-top: 0.75rem;">
          Đăng Ký Nhận Bản Tin
        </button>
      </form>
    </div>

    <div id="supportPanelDirect" class="kat-support-panel" style="display: none;">
      <div style="display: flex; flex-direction: column; gap: 0.8rem; font-size: 0.85rem; color: #c6efff;">
        <div style="background: rgba(255,255,255,0.05); padding: 0.8rem; border-radius: 0.5rem; border: 1px solid rgba(89,215,255,0.15);">
          <strong style="color: #59d7ff; display: block; margin-bottom: 0.2rem;">Hotline Ban Tổ Chức:</strong>
          <a href="tel:0909123456" style="color: #ffffff; font-size: 1rem; font-weight: 700; text-decoration: none;">0909 123 456</a> (Zalo / Call)
        </div>

        <div style="background: rgba(255,255,255,0.05); padding: 0.8rem; border-radius: 0.5rem; border: 1px solid rgba(89,215,255,0.15);">
          <strong style="color: #59d7ff; display: block; margin-bottom: 0.2rem;">Email Thư Ký Hội Nghị:</strong>
          <a href="mailto:kat2026@kbitassociation.com" style="color: #ffffff; text-decoration: none;">kat2026@kbitassociation.com</a>
        </div>

        <div style="background: rgba(255,255,255,0.05); padding: 0.8rem; border-radius: 0.5rem; border: 1px solid rgba(89,215,255,0.15);">
          <strong style="color: #59d7ff; display: block; margin-bottom: 0.2rem;">Kênh Messenger Facebook:</strong>
          <a href="https://m.me/706948069159452" target="_blank" rel="noopener" style="color: #0082FF; font-weight: 600; text-decoration: none; display: inline-flex; align-items: center; gap: 4px; margin-top: 0.2rem;">
            Nhắn tin qua Fanpage <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>
          </a>
        </div>

        <div style="font-size: 0.75rem; color: rgba(198,239,255,0.6); margin-top: 0.5rem; text-align: center;">
          Thời gian làm việc: 08:30 – 18:00 (Thứ 2 – Thứ 7)
        </div>
      </div>
    </div>
  </div>
</div>

<!-- App Script -->
<script src="/js/app.js"></script>
'''

# Safe append for HTML without </body> tag
if '</body>' in html:
    html = html.replace('</body>', modal_and_support_html + '\n</body>', 1)
else:
    html = html + '\n' + modal_and_support_html + '\n</body></html>'

# Write output to public/index.html
with open('public/index.html', 'w', encoding='utf-8') as f:
    f.write(html)

print('8. Generated public/index.html successfully! Size:', len(html))
