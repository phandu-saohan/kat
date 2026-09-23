const DOKPLOY_URL = 'http://72.61.123.73:3000';
const API_KEY = 'xrSgwPaflwkCjyqgrzKerILmDpWpGvVOKAbVWiohJhvBAorMHvpNbKsyMPhIaHuS';
const APP_ID = '67YoopJGVMObJEWF1OfYm';

async function check() {
  console.log('--- Checking Application Runtime Logs ---');
  const resLogs = await fetch(`${DOKPLOY_URL}/api/application.readLogs?applicationId=${APP_ID}&tail=50`, {
    headers: { 'x-api-key': API_KEY }
  });
  console.log('Runtime logs status:', resLogs.status);
  const logs = await resLogs.text();
  console.log('App Runtime Logs:\n', logs);

  console.log('\n--- Checking HTTP Endpoints ---');
  const urls = [
    'http://kat-app-d2612f-72-61-123-73.sslip.io',
    'http://72.61.123.73:3050',
    'http://kat-app-d2612f-72-61-123-73.sslip.io/admin',
    'http://72.61.123.73:3050/admin'
  ];

  for (const u of urls) {
    try {
      const resp = await fetch(u, { redirect: 'manual' });
      console.log(`GET ${u} -> Status: ${resp.status}`);
      const text = await resp.text();
      console.log(`   Length: ${text.length}, Title/snippet: ${text.substring(0, 120).replace(/\n/g, ' ')}`);
    } catch (e) {
      console.log(`GET ${u} -> ERROR: ${e.message}`);
    }
  }
}

check().catch(console.error);
