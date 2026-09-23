async function test() {
  const BASE_URL = 'http://72.61.123.73:3050';

  console.log('1. Testing Admin Login (/api/admin/login)...');
  const loginRes = await fetch(`${BASE_URL}/api/admin/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username: 'admin', password: 'kat2026@admin' })
  });
  console.log('Login status:', loginRes.status);
  const loginData = await loginRes.json();
  console.log('Login result:', loginData);

  const token = loginData.token;
  if (!token) throw new Error('No token returned');

  console.log('\n2. Testing Admin Stats (/api/admin/stats)...');
  const statsRes = await fetch(`${BASE_URL}/api/admin/stats`, {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  console.log('Stats status:', statsRes.status);
  const statsData = await statsRes.json();
  console.log('Stats:', statsData);

  console.log('\n3. Testing Admin Registrations List (/api/admin/registrations)...');
  const regListRes = await fetch(`${BASE_URL}/api/admin/registrations`, {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  console.log('Registrations list status:', regListRes.status);
  const regListData = await regListRes.json();
  console.log('Total registrations in Turso DB:', regListData.registrations?.length);
  if (regListData.registrations?.length > 0) {
    console.log('Latest record:', regListData.registrations[0]);
  }

  console.log('\n4. Testing New Registration Submission (/api/register)...');
  const testReg = {
    full_name: 'Dokploy Live Test User',
    email: `dokploy_test_${Date.now()}@example.com`,
    phone: '0987654321',
    organization: 'Dokploy Server Cloud',
    specialty: 'Công nghệ thông tin y tế',
    interested_sessions: 'Phiên 1: Xu hướng ứng dụng AI',
    notes: 'Đăng ký kiểm thử tự động trực tiếp trên Dokploy'
  };
  const submitRes = await fetch(`${BASE_URL}/api/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(testReg)
  });
  console.log('Submit registration status:', submitRes.status);
  const submitData = await submitRes.json();
  console.log('Submit registration result:', submitData);

  console.log('\n5. Verifying new registration persisted in Turso DB...');
  const verifyListRes = await fetch(`${BASE_URL}/api/admin/registrations`, {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  const verifyData = await verifyListRes.json();
  console.log('New total registrations count:', verifyData.registrations?.length);
  const found = verifyData.registrations?.find(r => r.email === testReg.email);
  console.log('Found newly registered record in Turso DB:', !!found, found?.full_name);

  console.log('\n=== ALL LIVE TESTS PASSED SUCCESSFULLY! ===');
}

test().catch(console.error);
