const fs = require('fs');

const DOKPLOY_URL = 'http://72.61.123.73:3000';
const API_KEY = 'xrSgwPaflwkCjyqgrzKerILmDpWpGvVOKAbVWiohJhvBAorMHvpNbKsyMPhIaHuS';

async function updateAdminJs() {
  const content = fs.readFileSync('public/js/admin.js', 'utf-8');
  console.log('Local admin.js length:', content.length);

  const resContainers = await fetch(`${DOKPLOY_URL}/api/docker.getContainers`, { headers: { 'x-api-key': API_KEY } });
  const containers = await resContainers.json();
  const c = containers.find(x => x.name && x.name.includes('app-transmit-optical-pixel') && x.state === 'running');
  if (!c) throw new Error('No running container found');
  console.log('Target container:', c.containerId, c.name);

  const res = await fetch(`${DOKPLOY_URL}/api/docker.writeContainerFile`, {
    method: 'POST',
    headers: { 'x-api-key': API_KEY, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      containerId: c.containerId,
      path: '/app/public/js/admin.js',
      content
    })
  });
  console.log('writeContainerFile status:', res.status);
  const text = await res.text();
  console.log('Result:', text);
}

updateAdminJs().catch(console.error);
