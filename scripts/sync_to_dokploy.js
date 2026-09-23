const fs = require('fs');
const path = require('path');

const DOKPLOY_URL = 'http://72.61.123.73:3000';
const API_KEY = 'xrSgwPaflwkCjyqgrzKerILmDpWpGvVOKAbVWiohJhvBAorMHvpNbKsyMPhIaHuS';

async function getAppContainerId() {
  const res = await fetch(`${DOKPLOY_URL}/api/docker.getContainers`, {
    headers: { 'x-api-key': API_KEY }
  });
  const containers = await res.json();
  const target = containers.find(c => c.name && c.name.includes('app-transmit-optical-pixel') && c.state === 'running');
  if (!target) throw new Error('Target container not found or not running');
  return target.containerId;
}

async function writeContainerFile(containerId, filePath, content) {
  const res = await fetch(`${DOKPLOY_URL}/api/docker.writeContainerFile`, {
    method: 'POST',
    headers: {
      'x-api-key': API_KEY,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      containerId,
      path: filePath,
      content
    })
  });
  console.log(`writeContainerFile ${filePath}: status ${res.status}`);
}

async function uploadFileToContainer(containerId, localPath, destinationPath) {
  const form = new FormData();
  const buffer = fs.readFileSync(localPath);
  const filename = path.basename(localPath);
  const blob = new Blob([buffer]);
  
  form.append('containerId', containerId);
  form.append('destinationPath', destinationPath);
  form.append('file', blob, filename);

  const res = await fetch(`${DOKPLOY_URL}/api/docker.uploadFileToContainer`, {
    method: 'POST',
    headers: { 'x-api-key': API_KEY },
    body: form
  });

  console.log(`uploadFileToContainer ${localPath} -> ${destinationPath}: status ${res.status}`);
  const text = await res.text();
  console.log('Result:', text.slice(0, 150));
}

async function main() {
  const containerId = await getAppContainerId();
  console.log('Target containerId:', containerId);

  // 1. Sync custom.css
  const customCss = fs.readFileSync('public/css/custom.css', 'utf-8');
  await writeContainerFile(containerId, '/app/public/css/custom.css', customCss);

  // 2. Sync app.js
  const appJs = fs.readFileSync('public/js/app.js', 'utf-8');
  await writeContainerFile(containerId, '/app/public/js/app.js', appJs);

  // 3. Upload index.html
  console.log('Uploading index.html (size:', fs.statSync('public/index.html').size, 'bytes)...');
  await uploadFileToContainer(containerId, 'public/index.html', '/app/public/');

  console.log('Sync completed successfully!');
}

main().catch(console.error);
