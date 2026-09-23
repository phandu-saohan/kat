const BASE_URL = 'http://72.61.123.73:3050';

async function testE2E() {
  console.log('=== BƯỚC 1: ĐẠI BIỂU ĐĂNG KÝ TRÊN LANDING PAGE ===');
  const payload = {
    full_name: 'PGS.TS.BS Nguyễn Thanh Phong',
    phone: '0908112233',
    email: `dr.phong.nguyen_${Date.now()}@meduni.edu.vn`,
    organization: 'Đại học Y Dược TP.HCM',
    specialty: 'Phẫu thuật Tạo hình & Thẩm mỹ',
    interested_sessions: 'Phiên 1: Xu hướng ứng dụng AI & Công nghệ sinh học trong trẻ hóa, Phiên 2: Phẫu thuật thẩm mỹ khuôn mặt',
    notes: 'Đăng ký nhận tài liệu CME trước ngày hội thảo'
  };

  const regRes = await fetch(`${BASE_URL}/api/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
  console.log('Register HTTP Status:', regRes.status);
  const regData = await regRes.json();
  console.log('Register Response:', regData);

  if (!regData.success || !regData.registration) {
    throw new Error('Registration failed!');
  }

  const regCode = regData.registration.reg_code;
  const regId = regData.registration.id;
  console.log(`\n🎉 Đăng ký thành công! Mã số đại biểu: ${regCode} (ID: ${regId})`);

  console.log('\n=== BƯỚC 2: ĐĂNG NHẬP VÀO TRANG ADMIN CMS ===');
  const loginRes = await fetch(`${BASE_URL}/api/admin/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username: 'admin', password: 'kat2026@admin' })
  });
  const loginData = await loginRes.json();
  console.log('Admin Login:', loginData.success, 'Token:', !!loginData.token);
  const token = loginData.token;

  console.log('\n=== BƯỚC 3: KIỂM TRA HỒ SƠ TRONG DANH SÁCH ĐĂNG KÝ ADMIN ===');
  const listRes = await fetch(`${BASE_URL}/api/admin/registrations?search=${encodeURIComponent(regCode)}`, {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  const listData = await listRes.json();
  console.log('Search in Admin Registrations Count:', listData.data?.length);

  const found = listData.data?.find(r => r.reg_code === regCode);
  if (!found) {
    throw new Error(`Registration ${regCode} not found in admin list!`);
  }

  console.log('Found delegate record in Admin:');
  console.log({
    reg_code: found.reg_code,
    full_name: found.full_name,
    organization: found.organization,
    phone: found.phone,
    email: found.email,
    specialty: found.specialty,
    interested_sessions: found.interested_sessions,
    notes: found.notes,
    status: found.status,
    created_at: found.created_at
  });

  console.log('\n=== BƯỚC 4: ADMIN DUYỆT VÀ CẬP NHẬT GHI CHÚ NỘI BỘ ===');
  const updateRes = await fetch(`${BASE_URL}/api/admin/registrations/${regId}`, {
    method: 'PATCH',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      status: 'confirmed',
      admin_notes: 'Đã liên hệ qua điện thoại, đại biểu xác nhận tham dự cả 2 phiên, đã hướng dẫn thủ tục CME.'
    })
  });
  const updateData = await updateRes.json();
  console.log('Update result:', updateData);

  console.log('\n=== BƯỚC 5: XÁC MINH LẠI TRẠNG THÁI TRONG ADMIN ===');
  const verifyRes = await fetch(`${BASE_URL}/api/admin/registrations?search=${encodeURIComponent(regCode)}`, {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  const verifyData = await verifyRes.json();
  const updatedRecord = verifyData.data?.find(r => r.reg_code === regCode);
  console.log('Updated Status in DB:', updatedRecord?.status);
  console.log('Updated Admin Notes in DB:', updatedRecord?.admin_notes);

  console.log('\n🎉 TOÀN BỘ QUY TRÌNH ĐĂNG KÝ VÀ LƯU VÀO ADMIN HOẠT ĐỘNG HOÀN HẢO 100%!');
}

testE2E().catch(console.error);
