const BASE_URL = 'http://72.61.123.73:3050';
const TOKEN = 'KAT_ADMIN_SESSION_TOKEN_2026';

async function testLiveExport() {
  console.log('Testing GET /api/admin/export/registrations on live Dokploy server...');
  const res = await fetch(`${BASE_URL}/api/admin/export/registrations`, {
    headers: { 'Authorization': `Bearer ${TOKEN}` }
  });
  console.log('Export HTTP Status:', res.status);
  console.log('Content-Type:', res.headers.get('content-type'));
  console.log('Content-Disposition:', res.headers.get('content-disposition'));

  const text = await res.text();
  console.log('CSV length:', text.length);
  console.log('First 400 chars of live CSV:\n', text.slice(0, 400));
  console.log('UTF-8 BOM present:', text.startsWith('\uFEFF'));
}

testLiveExport().catch(console.error);
