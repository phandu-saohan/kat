require('dotenv').config();
const { createClient } = require('@libsql/client');
const path = require('node:path');
const fs = require('node:fs');

// Environment Detection
const isVercel = process.env.VERCEL === '1' || !!process.env.AWS_LAMBDA_FUNCTION_NAME;
const dataDir = isVercel ? path.join('/tmp', 'kat-data') : path.join(__dirname, '..', 'data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

// Turso Cloud or Local SQLite Fallback
const isTurso = !!process.env.TURSO_DATABASE_URL;
let dbUrl = process.env.TURSO_DATABASE_URL;
let dbAuthToken = process.env.TURSO_AUTH_TOKEN;

if (!isTurso) {
  const localDbFile = path.join(dataDir, 'kat.sqlite');
  if (isVercel && !fs.existsSync(localDbFile)) {
    const seedDb = path.join(__dirname, '..', 'data', 'kat.sqlite');
    if (fs.existsSync(seedDb)) {
      try {
        fs.copyFileSync(seedDb, localDbFile);
      } catch (e) {
        console.warn('Seed database copy failed:', e.message);
      }
    }
  }
  dbUrl = `file:${localDbFile}`;
}

console.log(`[DB] Connecting to database (${isTurso ? 'Turso Cloud Serverless' : 'Local SQLite: ' + dbUrl})`);

const client = createClient({
  url: dbUrl,
  authToken: dbAuthToken
});

// Database schema initialization
let isInitialized = false;
async function initDb() {
  if (isInitialized) return;

  await client.executeMultiple(`
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

  // Ensure default superadmin exists
  const checkAdmin = await client.execute({
    sql: 'SELECT id FROM admin_users WHERE username = ?',
    args: ['admin']
  });

  if (checkAdmin.rows.length === 0) {
    await client.execute({
      sql: `INSERT INTO admin_users (username, password, name, role, created_at)
            VALUES (?, ?, ?, ?, ?)`,
      args: ['admin', 'kat2026@admin', 'Ban Tổ Chức K.A.T', 'superadmin', new Date().toISOString()]
    });
  }

  isInitialized = true;
}

// Automatically trigger initialization in background
initDb().catch(err => {
  console.error('[DB] Schema initialization error:', err);
});

// Helper functions for Registrations
function generateRegCode() {
  const randomNum = Math.floor(1000 + Math.random() * 9000);
  return `KAT-${randomNum}`;
}

async function createRegistration(data) {
  await initDb();
  let regCode = generateRegCode();
  while (true) {
    const existing = await client.execute({
      sql: 'SELECT id FROM registrations WHERE reg_code = ?',
      args: [regCode]
    });
    if (existing.rows.length === 0) break;
    regCode = generateRegCode();
  }

  const now = new Date().toISOString();
  await client.execute({
    sql: `INSERT INTO registrations (
      reg_code, full_name, phone, email, organization,
      specialty, interested_sessions, notes, admin_notes,
      status, created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    args: [
      regCode,
      data.full_name?.trim() || '',
      data.phone?.trim() || '',
      data.email?.trim().toLowerCase() || '',
      data.organization?.trim() || '',
      data.specialty?.trim() || '',
      Array.isArray(data.interested_sessions) ? data.interested_sessions.join(', ') : (data.interested_sessions?.trim() || ''),
      data.notes?.trim() || '',
      '',
      'pending',
      now,
      now
    ]
  });

  const res = await client.execute({
    sql: 'SELECT * FROM registrations WHERE reg_code = ?',
    args: [regCode]
  });
  return res.rows[0];
}

async function getRegistrations(filters = {}) {
  await initDb();
  let query = 'SELECT * FROM registrations WHERE 1=1';
  const params = [];

  if (filters.status && filters.status !== 'all') {
    query += ' AND status = ?';
    params.push(filters.status);
  }

  if (filters.search) {
    query += ' AND (full_name LIKE ? OR phone LIKE ? OR email LIKE ? OR organization LIKE ? OR reg_code LIKE ?)';
    const searchPattern = `%${filters.search}%`;
    params.push(searchPattern, searchPattern, searchPattern, searchPattern, searchPattern);
  }

  query += ' ORDER BY id DESC';
  const res = await client.execute({ sql: query, args: params });
  return res.rows;
}

async function getRegistrationById(id) {
  await initDb();
  const res = await client.execute({
    sql: 'SELECT * FROM registrations WHERE id = ?',
    args: [Number(id)]
  });
  return res.rows[0] || null;
}

async function updateRegistration(id, data) {
  await initDb();
  const now = new Date().toISOString();
  const fields = [];
  const params = [];

  if (data.status !== undefined) {
    fields.push('status = ?');
    params.push(data.status);
  }
  if (data.admin_notes !== undefined) {
    fields.push('admin_notes = ?');
    params.push(data.admin_notes);
  }
  if (data.organization !== undefined) {
    fields.push('organization = ?');
    params.push(data.organization);
  }
  if (data.specialty !== undefined) {
    fields.push('specialty = ?');
    params.push(data.specialty);
  }

  if (fields.length === 0) return null;

  fields.push('updated_at = ?');
  params.push(now);
  params.push(Number(id));

  const query = `UPDATE registrations SET ${fields.join(', ')} WHERE id = ?`;
  await client.execute({ sql: query, args: params });

  return getRegistrationById(id);
}

async function deleteRegistration(id) {
  await initDb();
  return client.execute({
    sql: 'DELETE FROM registrations WHERE id = ?',
    args: [Number(id)]
  });
}

// Helper functions for Newsletter
async function subscribeNewsletter(email, source = 'footer') {
  await initDb();
  const cleanEmail = email.trim().toLowerCase();
  const existing = await client.execute({
    sql: 'SELECT * FROM newsletters WHERE email = ?',
    args: [cleanEmail]
  });

  if (existing.rows.length > 0) {
    const item = existing.rows[0];
    if (item.status === 'unsubscribed') {
      await client.execute({
        sql: "UPDATE newsletters SET status = 'active' WHERE id = ?",
        args: [item.id]
      });
      return { ...item, status: 'active', re_subscribed: true };
    }
    return { ...item, already_subscribed: true };
  }

  const now = new Date().toISOString();
  const res = await client.execute({
    sql: 'INSERT INTO newsletters (email, status, source, created_at) VALUES (?, ?, ?, ?)',
    args: [cleanEmail, 'active', source, now]
  });

  const inserted = await client.execute({
    sql: 'SELECT * FROM newsletters WHERE id = ?',
    args: [Number(res.lastInsertRowid)]
  });
  return inserted.rows[0];
}

async function getNewsletters(filters = {}) {
  await initDb();
  let query = 'SELECT * FROM newsletters WHERE 1=1';
  const params = [];

  if (filters.search) {
    query += ' AND email LIKE ?';
    params.push(`%${filters.search}%`);
  }

  query += ' ORDER BY id DESC';
  const res = await client.execute({ sql: query, args: params });
  return res.rows;
}

async function deleteNewsletter(id) {
  await initDb();
  return client.execute({
    sql: 'DELETE FROM newsletters WHERE id = ?',
    args: [Number(id)]
  });
}

// Helper functions for Support Tickets
function generateTicketCode() {
  const randomNum = Math.floor(1000 + Math.random() * 9000);
  return `SUP-${randomNum}`;
}

async function createSupportTicket(data) {
  await initDb();
  let code = generateTicketCode();
  while (true) {
    const existing = await client.execute({
      sql: 'SELECT id FROM support_tickets WHERE ticket_code = ?',
      args: [code]
    });
    if (existing.rows.length === 0) break;
    code = generateTicketCode();
  }

  const now = new Date().toISOString();
  await client.execute({
    sql: `INSERT INTO support_tickets (
      ticket_code, full_name, phone, email, topic,
      message, admin_notes, status, created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    args: [
      code,
      data.full_name?.trim() || '',
      data.phone?.trim() || '',
      data.email?.trim().toLowerCase() || '',
      data.topic?.trim() || 'Hỏi đáp chung',
      data.message?.trim() || '',
      '',
      'new',
      now,
      now
    ]
  });

  const res = await client.execute({
    sql: 'SELECT * FROM support_tickets WHERE ticket_code = ?',
    args: [code]
  });
  return res.rows[0];
}

async function getSupportTickets(filters = {}) {
  await initDb();
  let query = 'SELECT * FROM support_tickets WHERE 1=1';
  const params = [];

  if (filters.status && filters.status !== 'all') {
    query += ' AND status = ?';
    params.push(filters.status);
  }

  if (filters.search) {
    query += ' AND (full_name LIKE ? OR phone LIKE ? OR email LIKE ? OR ticket_code LIKE ? OR message LIKE ?)';
    const searchPattern = `%${filters.search}%`;
    params.push(searchPattern, searchPattern, searchPattern, searchPattern, searchPattern);
  }

  query += ' ORDER BY id DESC';
  const res = await client.execute({ sql: query, args: params });
  return res.rows;
}

async function getSupportTicketById(id) {
  await initDb();
  const res = await client.execute({
    sql: 'SELECT * FROM support_tickets WHERE id = ?',
    args: [Number(id)]
  });
  return res.rows[0] || null;
}

async function updateSupportTicket(id, data) {
  await initDb();
  const now = new Date().toISOString();
  const fields = [];
  const params = [];

  if (data.status !== undefined) {
    fields.push('status = ?');
    params.push(data.status);
  }
  if (data.admin_notes !== undefined) {
    fields.push('admin_notes = ?');
    params.push(data.admin_notes);
  }

  if (fields.length === 0) return null;

  fields.push('updated_at = ?');
  params.push(now);
  params.push(Number(id));

  const query = `UPDATE support_tickets SET ${fields.join(', ')} WHERE id = ?`;
  await client.execute({ sql: query, args: params });

  return getSupportTicketById(id);
}

async function deleteSupportTicket(id) {
  await initDb();
  return client.execute({
    sql: 'DELETE FROM support_tickets WHERE id = ?',
    args: [Number(id)]
  });
}

// Statistics
async function getDashboardStats() {
  await initDb();
  const [
    regTotal,
    regPending,
    regConfirmed,
    newsTotal,
    supTotal,
    supNew,
    recentRegs,
    recentSups
  ] = await Promise.all([
    client.execute('SELECT COUNT(*) as count FROM registrations'),
    client.execute("SELECT COUNT(*) as count FROM registrations WHERE status = 'pending'"),
    client.execute("SELECT COUNT(*) as count FROM registrations WHERE status = 'confirmed'"),
    client.execute("SELECT COUNT(*) as count FROM newsletters WHERE status = 'active'"),
    client.execute('SELECT COUNT(*) as count FROM support_tickets'),
    client.execute("SELECT COUNT(*) as count FROM support_tickets WHERE status = 'new'"),
    client.execute('SELECT * FROM registrations ORDER BY id DESC LIMIT 5'),
    client.execute('SELECT * FROM support_tickets ORDER BY id DESC LIMIT 5')
  ]);

  return {
    totalRegistrations: Number(regTotal.rows[0].count),
    pendingRegistrations: Number(regPending.rows[0].count),
    confirmedRegistrations: Number(regConfirmed.rows[0].count),
    totalNewsletters: Number(newsTotal.rows[0].count),
    totalSupportTickets: Number(supTotal.rows[0].count),
    newSupportTickets: Number(supNew.rows[0].count),
    recentRegistrations: recentRegs.rows,
    recentSupport: recentSups.rows
  };
}

// Admin Auth
async function verifyAdmin(username, password) {
  await initDb();
  const res = await client.execute({
    sql: 'SELECT * FROM admin_users WHERE username = ?',
    args: [username]
  });
  const user = res.rows[0];
  if (user && user.password === password) {
    return {
      id: user.id,
      username: user.username,
      name: user.name,
      role: user.role
    };
  }
  return null;
}

// Public delegates search for poster creation
async function getRegisteredDelegates(query = '') {
  await initDb();
  const cleanQ = (query || '').trim();
  if (cleanQ) {
    const res = await client.execute({
      sql: `SELECT id, full_name, organization, reg_code 
            FROM registrations 
            WHERE full_name LIKE ? OR organization LIKE ? OR reg_code LIKE ?
            ORDER BY id DESC 
            LIMIT 50`,
      args: [`%${cleanQ}%`, `%${cleanQ}%`, `%${cleanQ}%`]
    });
    return res.rows;
  } else {
    const res = await client.execute({
      sql: `SELECT id, full_name, organization, reg_code 
            FROM registrations 
            ORDER BY id DESC 
            LIMIT 50`
    });
    return res.rows;
  }
}

module.exports = {
  client,
  initDb,
  createRegistration,
  getRegistrations,
  getRegistrationById,
  updateRegistration,
  deleteRegistration,
  getRegisteredDelegates,
  subscribeNewsletter,
  getNewsletters,
  deleteNewsletter,
  createSupportTicket,
  getSupportTickets,
  getSupportTicketById,
  updateSupportTicket,
  deleteSupportTicket,
  getDashboardStats,
  verifyAdmin
};

