require('dotenv').config();
const { createClient } = require('@libsql/client');
const path = require('node:path');
const fs = require('node:fs');

async function syncToTurso() {
  const tursoUrl = process.env.TURSO_DATABASE_URL;
  const tursoToken = process.env.TURSO_AUTH_TOKEN;

  if (!tursoUrl || !tursoToken) {
    console.error('❌ LỖI: Vui lòng thiết lập TURSO_DATABASE_URL và TURSO_AUTH_TOKEN trong file .env trước khi đồng bộ.');
    process.exit(1);
  }

  console.log('🔄 Đang kết nối tới Turso Cloud:', tursoUrl);
  const cloudClient = createClient({ url: tursoUrl, authToken: tursoToken });

  const localDbFile = path.join(__dirname, '..', 'data', 'kat.sqlite');
  if (!fs.existsSync(localDbFile)) {
    console.error('❌ LỖI: Không tìm thấy file dữ liệu cục bộ:', localDbFile);
    process.exit(1);
  }

  const localClient = createClient({ url: `file:${localDbFile}` });

  console.log('📦 1. Tạo cấu trúc bảng trên Turso Cloud...');
  await cloudClient.executeMultiple(`
    CREATE TABLE IF NOT EXISTS registrations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      reg_code TEXT UNIQUE NOT NULL,
      full_name TEXT NOT NULL,
      phone TEXT NOT NULL,
      email TEXT NOT NULL,
      organization TEXT,
      specialty TEXT,
      interested_sessions TEXT,
      notes TEXT,
      admin_notes TEXT DEFAULT '',
      status TEXT DEFAULT 'pending',
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS newsletters (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT UNIQUE NOT NULL,
      status TEXT DEFAULT 'active',
      source TEXT DEFAULT 'footer',
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS support_tickets (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      ticket_code TEXT UNIQUE NOT NULL,
      full_name TEXT NOT NULL,
      phone TEXT,
      email TEXT NOT NULL,
      topic TEXT NOT NULL,
      message TEXT NOT NULL,
      admin_notes TEXT DEFAULT '',
      status TEXT DEFAULT 'new',
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS admin_users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      name TEXT NOT NULL,
      role TEXT DEFAULT 'admin',
      created_at TEXT NOT NULL
    );
  `);

  console.log('📤 2. Đang sao chép dữ liệu Admin Users sang Turso...');
  const admins = await localClient.execute('SELECT * FROM admin_users');
  for (const a of admins.rows) {
    await cloudClient.execute({
      sql: `INSERT OR IGNORE INTO admin_users (id, username, password, name, role, created_at)
            VALUES (?, ?, ?, ?, ?, ?)`,
      args: [a.id, a.username, a.password, a.name, a.role, a.created_at]
    });
  }

  console.log('📤 3. Đang sao chép danh sách Đăng ký tham dự sang Turso...');
  const regs = await localClient.execute('SELECT * FROM registrations');
  for (const r of regs.rows) {
    await cloudClient.execute({
      sql: `INSERT OR IGNORE INTO registrations (
        id, reg_code, full_name, phone, email, organization,
        specialty, interested_sessions, notes, admin_notes, status, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      args: [
        r.id, r.reg_code, r.full_name, r.phone, r.email, r.organization,
        r.specialty, r.interested_sessions, r.notes, r.admin_notes, r.status, r.created_at, r.updated_at
      ]
    });
  }

  console.log('📤 4. Đang sao chép danh sách Bản tin sang Turso...');
  const news = await localClient.execute('SELECT * FROM newsletters');
  for (const n of news.rows) {
    await cloudClient.execute({
      sql: `INSERT OR IGNORE INTO newsletters (id, email, status, source, created_at)
            VALUES (?, ?, ?, ?, ?)`,
      args: [n.id, n.email, n.status, n.source, n.created_at]
    });
  }

  console.log('📤 5. Đang sao chép Hỗ trợ trực tuyến sang Turso...');
  const sups = await localClient.execute('SELECT * FROM support_tickets');
  for (const s of sups.rows) {
    await cloudClient.execute({
      sql: `INSERT OR IGNORE INTO support_tickets (
        id, ticket_code, full_name, phone, email, topic, message, admin_notes, status, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      args: [
        s.id, s.ticket_code, s.full_name, s.phone, s.email, s.topic, s.message, s.admin_notes, s.status, s.created_at, s.updated_at
      ]
    });
  }

  console.log(`✅ ĐỒNG BỘ THÀNH CÔNG!`);
  console.log(`- Đăng ký: ${regs.rows.length}`);
  console.log(`- Bản tin: ${news.rows.length}`);
  console.log(`- Hỗ trợ: ${sups.rows.length}`);
  console.log(`- Admin: ${admins.rows.length}`);
  process.exit(0);
}

syncToTurso().catch(err => {
  console.error('❌ Lỗi đồng bộ:', err);
  process.exit(1);
});
