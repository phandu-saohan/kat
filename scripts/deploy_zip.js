const fs = require('fs');

const DOKPLOY_URL = 'http://72.61.123.73:3000';
const API_KEY = 'xrSgwPaflwkCjyqgrzKerILmDpWpGvVOKAbVWiohJhvBAorMHvpNbKsyMPhIaHuS';
const APP_ID = '67YoopJGVMObJEWF1OfYm';

async function deployZip() {
  console.log('Deploying kat-deploy.zip via application.dropDeployment...');
  const form = new FormData();
  form.append('applicationId', APP_ID);
  form.append('dropBuildPath', '/');

  const fileBuffer = fs.readFileSync('kat-deploy.zip');
  const blob = new Blob([fileBuffer], { type: 'application/zip' });
  form.append('zip', blob, 'kat-deploy.zip');

  const res = await fetch(`${DOKPLOY_URL}/api/application.dropDeployment`, {
    method: 'POST',
    headers: { 'x-api-key': API_KEY },
    body: form
  });

  console.log('Drop deployment status:', res.status);
  const text = await res.text();
  console.log('Result:', text);
}

deployZip().catch(console.error);
