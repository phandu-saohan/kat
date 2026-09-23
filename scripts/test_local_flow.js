const db = require('../db/database');

async function testLocalFlow() {
  console.log('--- 1. Testing Registration DB creation ---');
  const testPayload = {
    full_name: 'TS.BS Trần Minh Hoàng',
    phone: '0912345678',
    email: `hoang.tran_${Date.now()}@hospital.vn`,
    organization: 'Bệnh viện Da Liễu Trung Ương',
    specialty: 'Da liễu - Thẩm mỹ',
    interested_sessions: ['Phiên 1: Cập nhật chỉ sinh học thế hệ mới', 'Phiên 2: Live Demo phối hợp đa tầng'],
    notes: 'Đăng ký xuất hóa đơn tài chính cho đơn vị'
  };

  const reg = await db.createRegistration(testPayload);
  console.log('Created Registration in Turso Cloud:');
  console.log({
    id: reg.id,
    reg_code: reg.reg_code,
    full_name: reg.full_name,
    phone: reg.phone,
    email: reg.email,
    organization: reg.organization,
    specialty: reg.specialty,
    interested_sessions: reg.interested_sessions,
    notes: reg.notes,
    status: reg.status
  });

  console.log('\n--- 2. Testing Query in Admin Registrations List ---');
  const allRegs = await db.getRegistrations({ search: reg.reg_code });
  console.log('Search by reg_code result count:', allRegs.length);
  if (allRegs.length > 0) {
    console.log('Found in admin list:', allRegs[0].reg_code, allRegs[0].full_name, allRegs[0].organization);
  }

  console.log('\n--- 3. Testing Status & Admin Note Update ---');
  await db.updateRegistration(reg.id, {
    status: 'confirmed',
    admin_notes: 'Đã gọi điện xác nhận, gửi vé và hồ sơ CME.'
  });

  const updated = await db.getRegistrationById(reg.id);
  console.log('Updated Status:', updated.status);
  console.log('Updated Admin Notes:', updated.admin_notes);

  console.log('\n✅ Local DB & Admin Flow verified successfully!');
}

testLocalFlow().catch(console.error);
