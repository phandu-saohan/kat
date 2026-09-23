require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('node:path');
const fs = require('node:fs');
const db = require('./db/database');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json({ limit: '25mb' }));
app.use(express.urlencoded({ extended: true, limit: '25mb' }));

// Serve static files
app.use(express.static(path.join(__dirname, 'public')));

// Simple Auth Middleware for Admin APIs
const ADMIN_TOKEN_KEY = process.env.ADMIN_TOKEN_KEY || 'KAT_ADMIN_SESSION_TOKEN_2026';

function adminAuth(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ success: false, message: 'Vui lòng đăng nhập quyền quản trị' });
  }
  const token = authHeader.split(' ')[1];
  if (token !== ADMIN_TOKEN_KEY) {
    return res.status(403).json({ success: false, message: 'Phiên đăng nhập không hợp lệ hoặc đã hết hạn' });
  }
  next();
}

// ==========================================
// PUBLIC CLIENT APIS
// ==========================================

// 1. Register for K.A.T 2026
app.post('/api/register', async (req, res) => {
  try {
    const { full_name, phone, email, organization, specialty, interested_sessions, notes } = req.body;

    if (!full_name || !phone || !email) {
      return res.status(400).json({
        success: false,
        message: 'Vui lòng điền đầy đủ Họ và tên, Số điện thoại và Email.'
      });
    }

    // Basic email check
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        success: false,
        message: 'Địa chỉ email không đúng định dạng.'
      });
    }

    const registration = await db.createRegistration({
      full_name,
      phone,
      email,
      organization,
      specialty,
      interested_sessions,
      notes
    });

    return res.json({
      success: true,
      message: 'Đăng ký tham dự K.A.T 2026 thành công!',
      registration
    });
  } catch (err) {
    console.error('Error in /api/register:', err);
    return res.status(500).json({
      success: false,
      message: 'Có lỗi xảy ra khi lưu thông tin đăng ký. Vui lòng thử lại.'
    });
  }
});

// 2. Newsletter Subscription
app.post('/api/newsletter', async (req, res) => {
  try {
    const { email, source } = req.body;
    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Vui lòng nhập địa chỉ email.'
      });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        success: false,
        message: 'Địa chỉ email không hợp lệ.'
      });
    }

    const result = await db.subscribeNewsletter(email, source);
    if (result.already_subscribed) {
      return res.json({
        success: true,
        message: 'Email này đã có trong danh sách nhận bản tin của KBIT!',
        subscriber: result
      });
    }

    return res.json({
      success: true,
      message: 'Đăng ký nhận thông tin và tài liệu khoa học thành công!',
      subscriber: result
    });
  } catch (err) {
    console.error('Error in /api/newsletter:', err);
    return res.status(500).json({
      success: false,
      message: 'Lỗi khi đăng ký nhận tin. Vui lòng thử lại.'
    });
  }
});

// 3. Online Support Request
app.post('/api/support', async (req, res) => {
  try {
    const { full_name, phone, email, topic, message } = req.body;
    if (!full_name || !email || !message) {
      return res.status(400).json({
        success: false,
        message: 'Vui lòng cung cấp Họ tên, Email và Nội dung cần hỗ trợ.'
      });
    }

    const ticket = await db.createSupportTicket({
      full_name,
      phone,
      email,
      topic,
      message
    });

    return res.json({
      success: true,
      message: 'Yêu cầu hỗ trợ đã được tiếp nhận. Ban tổ chức sẽ phản hồi sớm nhất!',
      ticket
    });
  } catch (err) {
    console.error('Error in /api/support:', err);
    return res.status(500).json({
      success: false,
      message: 'Không thể gửi yêu cầu hỗ trợ lúc này. Vui lòng thử lại hoặc gọi hotline.'
    });
  }
});

// 4. Search Registered Delegates (Public endpoint for poster creation)
app.get('/api/delegates', async (req, res) => {
  try {
    const q = req.query.q || '';
    const delegates = await db.getRegisteredDelegates(q);
    return res.json({
      success: true,
      delegates
    });
  } catch (err) {
    console.error('Error in /api/delegates:', err);
    return res.status(500).json({
      success: false,
      message: 'Không thể tải danh sách đại biểu.'
    });
  }
});

// ==========================================
// ADMIN CMS APIS
// ==========================================

// Admin Login
app.post('/api/admin/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    const admin = await db.verifyAdmin(username, password);

    if (!admin) {
      return res.status(401).json({
        success: false,
        message: 'Tài khoản hoặc mật khẩu không chính xác.'
      });
    }

    return res.json({
      success: true,
      message: 'Đăng nhập thành công!',
      token: ADMIN_TOKEN_KEY,
      user: admin
    });
  } catch (err) {
    console.error('Error in /api/admin/login:', err);
    return res.status(500).json({ success: false, message: 'Lỗi đăng nhập hệ thống.' });
  }
});

// Admin Stats
app.get('/api/admin/stats', adminAuth, async (req, res) => {
  try {
    const stats = await db.getDashboardStats();
    res.json({ success: true, stats });
  } catch (err) {
    console.error('Error in /api/admin/stats:', err);
    res.status(500).json({ success: false, message: 'Lỗi lấy thống kê.' });
  }
});

// Admin Registrations list
app.get('/api/admin/registrations', adminAuth, async (req, res) => {
  try {
    const { status, search } = req.query;
    const list = await db.getRegistrations({ status, search });
    res.json({ success: true, data: list });
  } catch (err) {
    console.error('Error in /api/admin/registrations:', err);
    res.status(500).json({ success: false, message: 'Lỗi tải danh sách đăng ký.' });
  }
});

// Update Registration
app.patch('/api/admin/registrations/:id', adminAuth, async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    const updated = await db.updateRegistration(id, req.body);
    if (!updated) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy thông tin đăng ký.' });
    }
    res.json({ success: true, data: updated });
  } catch (err) {
    console.error('Error in PATCH /api/admin/registrations:', err);
    res.status(500).json({ success: false, message: 'Lỗi cập nhật đăng ký.' });
  }
});

// Delete Registration
app.delete('/api/admin/registrations/:id', adminAuth, async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    await db.deleteRegistration(id);
    res.json({ success: true, message: 'Đã xóa đăng ký thành công.' });
  } catch (err) {
    console.error('Error in DELETE /api/admin/registrations:', err);
    res.status(500).json({ success: false, message: 'Lỗi xóa đăng ký.' });
  }
});

// Admin Export Registrations CSV
app.get('/api/admin/export/registrations', adminAuth, async (req, res) => {
  try {
    const { status, search } = req.query;
    const list = await db.getRegistrations({ status, search });

    const headers = [
      'STT',
      'Mã Đăng Ký',
      'Họ và Tên',
      'Số Điện Thoại',
      'Email',
      'Đơn Vị Công Tác',
      'Chuyên Khoa',
      'Phiên Tham Dự Quan Tâm',
      'Ghi Chú Đại Biểu',
      'Ghi Chú Ban Thư Ký',
      'Trạng Thái',
      'Thời Gian Đăng Ký'
    ];

    const escapeCsv = (val) => {
      if (val === null || val === undefined) return '""';
      const str = String(val).replace(/"/g, '""');
      return `"${str}"`;
    };

    const statusMap = {
      pending: 'Chờ xử lý',
      contacted: 'Đã liên hệ',
      confirmed: 'Đã xác nhận',
      cancelled: 'Đã hủy'
    };

    const formatTime = (iso) => {
      if (!iso) return '';
      try {
        const d = new Date(iso);
        return `${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')} ${d.getDate().toString().padStart(2, '0')}/${(d.getMonth()+1).toString().padStart(2, '0')}/${d.getFullYear()}`;
      } catch (e) {
        return iso;
      }
    };

    const rows = list.map((r, i) => [
      i + 1,
      escapeCsv(r.reg_code),
      escapeCsv(r.full_name),
      escapeCsv(r.phone),
      escapeCsv(r.email),
      escapeCsv(r.organization || ''),
      escapeCsv(r.specialty || ''),
      escapeCsv(r.interested_sessions || ''),
      escapeCsv(r.notes || ''),
      escapeCsv(r.admin_notes || ''),
      escapeCsv(statusMap[r.status] || r.status),
      escapeCsv(formatTime(r.created_at))
    ].join(','));

    // UTF-8 BOM (\uFEFF) for Excel compatibility
    const csvContent = '\uFEFF' + [headers.join(','), ...rows].join('\r\n');

    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="KAT2026_DanhSachDangKy_${new Date().toISOString().slice(0, 10)}.csv"`);
    res.send(csvContent);
  } catch (err) {
    console.error('Error in /api/admin/export/registrations:', err);
    res.status(500).json({ success: false, message: 'Lỗi xuất file CSV.' });
  }
});

// Admin Newsletters list
app.get('/api/admin/newsletters', adminAuth, async (req, res) => {
  try {
    const { search } = req.query;
    const list = await db.getNewsletters({ search });
    res.json({ success: true, data: list });
  } catch (err) {
    console.error('Error in /api/admin/newsletters:', err);
    res.status(500).json({ success: false, message: 'Lỗi tải danh sách nhận tin.' });
  }
});

// Delete Newsletter
app.delete('/api/admin/newsletters/:id', adminAuth, async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    await db.deleteNewsletter(id);
    res.json({ success: true, message: 'Đã xóa người nhận tin.' });
  } catch (err) {
    console.error('Error in DELETE /api/admin/newsletters:', err);
    res.status(500).json({ success: false, message: 'Lỗi xóa người nhận tin.' });
  }
});

// Admin Support tickets list
app.get('/api/admin/support-tickets', adminAuth, async (req, res) => {
  try {
    const { status, search } = req.query;
    const list = await db.getSupportTickets({ status, search });
    res.json({ success: true, data: list });
  } catch (err) {
    console.error('Error in /api/admin/support-tickets:', err);
    res.status(500).json({ success: false, message: 'Lỗi tải danh sách hỗ trợ.' });
  }
});

// Update Support ticket
app.patch('/api/admin/support-tickets/:id', adminAuth, async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    const updated = await db.updateSupportTicket(id, req.body);
    if (!updated) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy yêu cầu hỗ trợ.' });
    }
    res.json({ success: true, data: updated });
  } catch (err) {
    console.error('Error in PATCH /api/admin/support-tickets:', err);
    res.status(500).json({ success: false, message: 'Lỗi cập nhật hỗ trợ.' });
  }
});

// Delete Support ticket
app.delete('/api/admin/support-tickets/:id', adminAuth, async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    await db.deleteSupportTicket(id);
    res.json({ success: true, message: 'Đã xóa yêu cầu hỗ trợ.' });
  } catch (err) {
    console.error('Error in DELETE /api/admin/support-tickets:', err);
    res.status(500).json({ success: false, message: 'Lỗi xóa yêu cầu hỗ trợ.' });
  }
});

// Export CSV with UTF-8 BOM for Excel
app.get('/api/admin/export/:type', adminAuth, async (req, res) => {
  try {
    const { type } = req.params;
    let csvContent = '\uFEFF'; // UTF-8 BOM for Excel

    if (type === 'registrations') {
      const items = await db.getRegistrations();
      csvContent += 'Mã ĐK,Họ và tên,Số điện thoại,Email,Đơn vị công tác,Chuyên khoa,Phiên quan tâm,Ghi chú khách,Ghi chú nội bộ,Trạng thái,Thời gian đăng ký\n';
      items.forEach(item => {
        const row = [
          `"${item.reg_code || ''}"`,
          `"${(item.full_name || '').replace(/"/g, '""')}"`,
          `"${item.phone || ''}"`,
          `"${item.email || ''}"`,
          `"${(item.organization || '').replace(/"/g, '""')}"`,
          `"${(item.specialty || '').replace(/"/g, '""')}"`,
          `"${(item.interested_sessions || '').replace(/"/g, '""')}"`,
          `"${(item.notes || '').replace(/"/g, '""')}"`,
          `"${(item.admin_notes || '').replace(/"/g, '""')}"`,
          `"${item.status || ''}"`,
          `"${item.created_at || ''}"`
        ];
        csvContent += row.join(',') + '\n';
      });

      res.setHeader('Content-Type', 'text/csv; charset=utf-8');
      res.setHeader('Content-Disposition', `attachment; filename="KAT_Registrations_${Date.now()}.csv"`);
      return res.send(csvContent);
    }

    if (type === 'newsletters') {
      const items = await db.getNewsletters();
      csvContent += 'ID,Email,Nguồn,Trạng thái,Thời gian đăng ký\n';
      items.forEach(item => {
        const row = [
          item.id,
          `"${item.email || ''}"`,
          `"${item.source || ''}"`,
          `"${item.status || ''}"`,
          `"${item.created_at || ''}"`
        ];
        csvContent += row.join(',') + '\n';
      });

      res.setHeader('Content-Type', 'text/csv; charset=utf-8');
      res.setHeader('Content-Disposition', `attachment; filename="KAT_Newsletters_${Date.now()}.csv"`);
      return res.send(csvContent);
    }

    if (type === 'support') {
      const items = await db.getSupportTickets();
      csvContent += 'Mã Ticket,Họ và tên,Số điện thoại,Email,Chủ đề,Nội dung tin nhắn,Ghi chú nội bộ,Trạng thái,Thời gian gửi\n';
      items.forEach(item => {
        const row = [
          `"${item.ticket_code || ''}"`,
          `"${(item.full_name || '').replace(/"/g, '""')}"`,
          `"${item.phone || ''}"`,
          `"${item.email || ''}"`,
          `"${(item.topic || '').replace(/"/g, '""')}"`,
          `"${(item.message || '').replace(/"/g, '""')}"`,
          `"${(item.admin_notes || '').replace(/"/g, '""')}"`,
          `"${item.status || ''}"`,
          `"${item.created_at || ''}"`
        ];
        csvContent += row.join(',') + '\n';
      });

      res.setHeader('Content-Type', 'text/csv; charset=utf-8');
      res.setHeader('Content-Disposition', `attachment; filename="KAT_Support_Tickets_${Date.now()}.csv"`);
      return res.send(csvContent);
    }

    return res.status(400).json({ success: false, message: 'Loại dữ liệu xuất không hợp lệ' });
  } catch (err) {
    console.error('Error exporting CSV:', err);
    res.status(500).json({ success: false, message: 'Lỗi xuất file CSV' });
  }
});

// ==========================================
// ADMIN: POSTER TEMPLATE MANAGEMENT
// ==========================================

// 1. Get current poster template information
app.get('/api/admin/poster-template-info', adminAuth, (req, res) => {
  try {
    const imagesDir = path.join(__dirname, 'public', 'images');
    const templatePath = path.join(imagesDir, 'poster_template.jpg');
    const defaultPath = path.join(imagesDir, 'poster_template_default.jpg');

    if (!fs.existsSync(templatePath)) {
      return res.status(404).json({ success: false, message: 'Chưa có file mẫu poster' });
    }

    const stats = fs.statSync(templatePath);
    const defaultAvailable = fs.existsSync(defaultPath);

    return res.json({
      success: true,
      url: `/images/poster_template.jpg?t=${stats.mtimeMs}`,
      size: stats.size,
      mtime: stats.mtime,
      defaultAvailable
    });
  } catch (err) {
    console.error('Error getting poster template info:', err);
    return res.status(500).json({ success: false, message: 'Lỗi đọc thông tin mẫu poster' });
  }
});

// 2. Upload / Update poster template image
app.post('/api/admin/poster-template', adminAuth, (req, res) => {
  try {
    const { imageBase64 } = req.body;
    if (!imageBase64 || typeof imageBase64 !== 'string') {
      return res.status(400).json({ success: false, message: 'Dữ liệu hình ảnh không hợp lệ' });
    }

    // Extract raw base64 data if data URL scheme is present
    const matches = imageBase64.match(/^data:image\/([a-zA-Z0-9+]+);base64,(.+)$/);
    let rawData = imageBase64;
    if (matches && matches[2]) {
      rawData = matches[2];
    }

    const buffer = Buffer.from(rawData, 'base64');
    if (buffer.length < 500) {
      return res.status(400).json({ success: false, message: 'Dữ liệu ảnh quá nhỏ hoặc file bị lỗi.' });
    }
    if (buffer.length > 25 * 1024 * 1024) {
      return res.status(400).json({ success: false, message: 'Dung lượng ảnh vượt quá giới hạn 25MB.' });
    }

    const imagesDir = path.join(__dirname, 'public', 'images');
    const templatePath = path.join(imagesDir, 'poster_template.jpg');
    const backupPath = path.join(imagesDir, 'poster_template_backup.jpg');
    const defaultPath = path.join(imagesDir, 'poster_template_default.jpg');

    // Ensure default exists for safe rollback
    if (!fs.existsSync(defaultPath) && fs.existsSync(templatePath)) {
      fs.copyFileSync(templatePath, defaultPath);
    }

    // Backup current before overwrite
    if (fs.existsSync(templatePath)) {
      fs.copyFileSync(templatePath, backupPath);
    }

    // Write new template
    fs.writeFileSync(templatePath, buffer);

    const stats = fs.statSync(templatePath);
    return res.json({
      success: true,
      message: 'Cập nhật mẫu poster thành công!',
      url: `/images/poster_template.jpg?t=${stats.mtimeMs}`,
      size: stats.size,
      mtime: stats.mtime
    });
  } catch (err) {
    console.error('Error saving poster template:', err);
    return res.status(500).json({ success: false, message: 'Lỗi lưu file mẫu poster trên máy chủ' });
  }
});

// 3. Restore default poster template
app.post('/api/admin/poster-template/restore', adminAuth, (req, res) => {
  try {
    const imagesDir = path.join(__dirname, 'public', 'images');
    const templatePath = path.join(imagesDir, 'poster_template.jpg');
    const defaultPath = path.join(imagesDir, 'poster_template_default.jpg');

    if (!fs.existsSync(defaultPath)) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy file mẫu poster gốc mặc định' });
    }

    fs.copyFileSync(defaultPath, templatePath);
    const stats = fs.statSync(templatePath);

    return res.json({
      success: true,
      message: 'Đã khôi phục về mẫu poster gốc ban đầu thành công!',
      url: `/images/poster_template.jpg?t=${stats.mtimeMs}`,
      size: stats.size,
      mtime: stats.mtime
    });
  } catch (err) {
    console.error('Error restoring poster template:', err);
    return res.status(500).json({ success: false, message: 'Lỗi khôi phục mẫu poster' });
  }
});

// Admin Route (handles /admin, /admin/, /admin.html)
app.get(['/admin', '/admin/', '/admin.html'], (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'admin.html'));
});

// Fallback to index.html for root
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Export app for Vercel / serverless functions
module.exports = app;

// Start Server in local/standalone environment
if (!process.env.VERCEL) {
  app.listen(PORT, () => {
    console.log(`====================================================`);
    console.log(`  K.A.T 2026 Server & CMS running on port ${PORT}`);
    console.log(`  - Landing Page: http://localhost:${PORT}`);
    console.log(`  - CMS Dashboard: http://localhost:${PORT}/admin`);
    console.log(`  - Default Admin Account: admin / kat2026@admin`);
    console.log(`====================================================`);
  });
}
