const express = require('express');

async function testExportLocal() {
  console.log('Testing CSV export logic...');
  const db = require('../db/database');
  const list = await db.getRegistrations();
  console.log(`Fetched ${list.length} registrations from Turso Cloud.`);

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
    escapeCsv(r.created_at)
  ].join(','));

  const csvContent = '\uFEFF' + [headers.join(','), ...rows].join('\r\n');
  console.log('Generated CSV content preview (first 400 chars):');
  console.log(csvContent.slice(0, 400));
  console.log('\nTotal CSV bytes:', Buffer.from(csvContent).length);
  console.log('UTF-8 BOM present:', csvContent.startsWith('\uFEFF'));
}

testExportLocal().catch(console.error);
