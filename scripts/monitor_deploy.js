const DOKPLOY_URL = 'http://72.61.123.73:3000';
const API_KEY = 'xrSgwPaflwkCjyqgrzKerILmDpWpGvVOKAbVWiohJhvBAorMHvpNbKsyMPhIaHuS';
const APP_ID = '67YoopJGVMObJEWF1OfYm';

async function monitor() {
  const res = await fetch(`${DOKPLOY_URL}/api/deployment.all?applicationId=${APP_ID}`, {
    headers: { 'x-api-key': API_KEY }
  });
  const deployments = await res.json();
  if (deployments && deployments.length > 0) {
    const latest = deployments[0];
    console.log(`Latest Deployment ID: ${latest.deploymentId}, Status: ${latest.status}, Created: ${latest.createdAt}`);

    const logRes = await fetch(`${DOKPLOY_URL}/api/deployment.readLogs?deploymentId=${latest.deploymentId}&tail=25`, {
      headers: { 'x-api-key': API_KEY }
    });
    const logs = await logRes.text();
    console.log('Logs tail:\n', logs);
  }
}

monitor().catch(console.error);
