const DOKPLOY_URL = 'http://72.61.123.73:3000';
const API_KEY = 'xrSgwPaflwkCjyqgrzKerILmDpWpGvVOKAbVWiohJhvBAorMHvpNbKsyMPhIaHuS';

async function restart() {
  const res = await fetch(`${DOKPLOY_URL}/api/docker.getContainers`, { headers: { 'x-api-key': API_KEY } });
  const containers = await res.json();
  const c = containers.find(x => x.name && x.name.includes('app-transmit-optical-pixel') && x.state === 'running');
  if (c) {
    console.log('Restarting container:', c.containerId, c.name);
    const restartRes = await fetch(`${DOKPLOY_URL}/api/docker.restartContainer`, {
      method: 'POST',
      headers: { 'x-api-key': API_KEY, 'Content-Type': 'application/json' },
      body: JSON.stringify({ containerId: c.containerId })
    });
    console.log('Restart response status:', restartRes.status);
  } else {
    console.log('No running app container found!');
  }
}

restart().catch(console.error);
