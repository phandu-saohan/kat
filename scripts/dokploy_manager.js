const DOKPLOY_URL = 'http://72.61.123.73:3000';
const API_KEY = 'xrSgwPaflwkCjyqgrzKerILmDpWpGvVOKAbVWiohJhvBAorMHvpNbKsyMPhIaHuS';

async function api(endpoint, body = null, method = 'POST') {
  const url = `${DOKPLOY_URL}/api/${endpoint}`;
  const options = {
    method: body ? 'POST' : (method || 'GET'),
    headers: {
      'x-api-key': API_KEY,
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    }
  };
  if (body) {
    options.body = JSON.stringify(body);
  }
  const res = await fetch(url, options);
  const text = await res.text();
  let data;
  try {
    data = JSON.parse(text);
  } catch (e) {
    data = text;
  }
  return { status: res.status, ok: res.ok, data };
}

async function main() {
  console.log('--- Checking Dokploy Projects ---');
  const projects = await api('project.all', null, 'GET');
  console.log('Projects status:', projects.status);
  console.log('Projects result:', JSON.stringify(projects.data, null, 2));
}

main().catch(console.error);
