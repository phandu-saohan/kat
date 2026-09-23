const DOKPLOY_URL = 'http://72.61.123.73:3000';
const API_KEY = 'xrSgwPaflwkCjyqgrzKerILmDpWpGvVOKAbVWiohJhvBAorMHvpNbKsyMPhIaHuS';

async function inspect() {
  const res = await fetch(`${DOKPLOY_URL}/api/trpc/settings.getOpenApiDocument`, {
    headers: { 'x-api-key': API_KEY }
  });
  const json = await res.json();
  const openapi = json.result?.data?.json || json;

  const targets = [
    '/project.create',
    '/application.create',
    '/application.saveGitProvider',
    '/application.saveBuildType',
    '/application.saveEnvironment',
    '/domain.create',
    '/domain.generateDomain',
    '/port.create',
    '/application.deploy',
    '/application.one',
    '/application.readLogs'
  ];

  for (const t of targets) {
    console.log(`\n=== PATH: ${t} ===`);
    const pathObj = openapi.paths?.[t];
    if (!pathObj) {
      console.log('Not found in openapi.paths! Available matching:', Object.keys(openapi.paths || {}).filter(k => k.includes(t.replace('/', ''))));
      continue;
    }
    const method = Object.keys(pathObj)[0];
    const op = pathObj[method];
    console.log(`Method: ${method.toUpperCase()}`);
    if (op.requestBody) {
      const content = op.requestBody.content?.['application/json'];
      console.log('RequestBody Schema:', JSON.stringify(content?.schema, null, 2));
    }
    if (op.parameters) {
      console.log('Parameters:', JSON.stringify(op.parameters, null, 2));
    }
  }
}

inspect().catch(console.error);
