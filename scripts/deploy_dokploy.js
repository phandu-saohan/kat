const DOKPLOY_URL = 'http://72.61.123.73:3000';
const API_KEY = 'xrSgwPaflwkCjyqgrzKerILmDpWpGvVOKAbVWiohJhvBAorMHvpNbKsyMPhIaHuS';

const TURSO_DATABASE_URL = 'libsql://kat-phandu.aws-ap-northeast-1.turso.io';
const TURSO_AUTH_TOKEN = 'eyJhbGciOiJFZERTQSIsInR5cCI6IkpXVCJ9.eyJhIjoicnciLCJpYXQiOjE3OTAwNTI3MTAsImlkIjoiMDFhMGM3NzMtMzYwMS03N2IwLWE4NjctZjNjN2EwMmQwN2QzIiwia2lkIjoiRjVYWHA3bHotMkFzeTJqaWtlcWZfOWlsQ2g1ckJnMGEzVzBrbTdmVURsMCIsInJpZCI6ImYyMzkzYjA1LTdjOWQtNDc0OS05NzJiLTBlMDA0YTg4M2UxYiJ9.siF0y_Q3Yp5_2KsvxABoo_CrhMWpVSXkfgXxDWbR-N-hY2TjFK70AIZdk5Jn0_8gQgs7YTVKyiloCmGf0hpFBA';
const ADMIN_TOKEN_KEY = 'KAT_ADMIN_SESSION_TOKEN_2026';

async function request(endpoint, body = null, method = 'POST') {
  const url = `${DOKPLOY_URL}/api/${endpoint}`;
  const options = {
    method: body ? 'POST' : method,
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
  let json;
  try {
    json = JSON.parse(text);
  } catch (e) {
    json = text;
  }
  return { status: res.status, ok: res.ok, data: json };
}

async function sleep(ms) {
  return new Promise(r => setTimeout(r, ms));
}

async function run() {
  console.log('=== STEP 1: Check or Create Project ===');
  const allProjects = await request('project.all', null, 'GET');
  if (!allProjects.ok) {
    throw new Error(`Failed to list projects: ${JSON.stringify(allProjects.data)}`);
  }

  let project = allProjects.data.find(p => p.name === 'kat');
  if (!project) {
    console.log('Creating project "kat"...');
    const createProj = await request('project.create', {
      name: 'kat',
      description: '2nd K.A.T 2026 Conference'
    });
    console.log('Project create response:', createProj.status, createProj.data);
    if (!createProj.ok) throw new Error(`Project creation failed: ${JSON.stringify(createProj.data)}`);
    // re-fetch projects
    const refreshed = await request('project.all', null, 'GET');
    project = refreshed.data.find(p => p.name === 'kat');
  } else {
    console.log('Found existing project "kat":', project.projectId);
  }

  const defaultEnv = project.environments?.find(e => e.isDefault) || project.environments?.[0];
  if (!defaultEnv) throw new Error('No default environment found for project kat');
  const environmentId = defaultEnv.environmentId;
  console.log('Using Environment ID:', environmentId);

  console.log('\n=== STEP 2: Check or Create Application ===');
  let app = defaultEnv.applications?.find(a => a.name === 'kat-app');
  let applicationId = app?.applicationId;

  if (!applicationId) {
    console.log('Creating application "kat-app"...');
    const createApp = await request('application.create', {
      name: 'kat-app',
      environmentId: environmentId,
      sourceType: 'git'
    });
    console.log('Application create response:', createApp.status, createApp.data);
    if (!createApp.ok) throw new Error(`App creation failed: ${JSON.stringify(createApp.data)}`);
    applicationId = createApp.data.applicationId;
  } else {
    console.log('Found existing application "kat-app":', applicationId);
  }

  console.log('\n=== STEP 3: Configure Git Provider ===');
  const gitConfig = await request('application.saveGitProvider', {
    applicationId: applicationId,
    customGitUrl: 'https://github.com/phandu-saohan/kat.git',
    customGitBranch: 'main',
    customGitBuildPath: '/',
    watchPaths: [],
    enableSubmodules: false,
    customGitSSHKeyId: null
  });
  console.log('Save Git Provider response:', gitConfig.status, gitConfig.data);

  console.log('\n=== STEP 4: Configure Build Type (nixpacks) ===');
  const buildConfig = await request('application.saveBuildType', {
    applicationId: applicationId,
    buildType: 'nixpacks',
    dockerfile: null,
    dockerContextPath: null,
    dockerBuildStage: null,
    herokuVersion: null,
    railpackVersion: null,
    publishDirectory: null,
    isStaticSpa: false
  });
  console.log('Save Build Type response:', buildConfig.status, buildConfig.data);

  console.log('\n=== STEP 5: Configure Environment Variables ===');
  const envContent = [
    `PORT=3000`,
    `ADMIN_TOKEN_KEY=${ADMIN_TOKEN_KEY}`,
    `TURSO_DATABASE_URL=${TURSO_DATABASE_URL}`,
    `TURSO_AUTH_TOKEN=${TURSO_AUTH_TOKEN}`
  ].join('\n');

  const envConfig = await request('application.saveEnvironment', {
    applicationId: applicationId,
    env: envContent,
    buildArgs: null,
    buildSecrets: null,
    createEnvFile: true
  });
  console.log('Save Environment response:', envConfig.status, envConfig.data);

  console.log('\n=== STEP 6: Configure Domain & Port ===');
  // First check generated domain
  let generatedHost = 'kat.72.61.123.73.traefik.me';
  try {
    const genRes = await request('domain.generateDomain', { appName: 'kat-app' });
    if (genRes.ok && genRes.data) {
      console.log('Dokploy suggested domain:', genRes.data);
      if (typeof genRes.data === 'string') generatedHost = genRes.data;
    }
  } catch (e) {
    console.log('Domain generation fallback used:', e.message);
  }

  // Create domain
  console.log(`Setting domain host: ${generatedHost} (port 3000)...`);
  const domainRes = await request('domain.create', {
    applicationId: applicationId,
    host: generatedHost,
    port: 3000,
    https: false,
    certificateType: 'none'
  });
  console.log('Domain create response:', domainRes.status, domainRes.data);

  // Also create host port 3050 for direct access
  console.log('Opening direct port 3050 -> 3000...');
  const portRes = await request('port.create', {
    applicationId: applicationId,
    publishedPort: 3050,
    publishMode: 'host',
    targetPort: 3000,
    protocol: 'tcp'
  });
  console.log('Port create response:', portRes.status, portRes.data);

  console.log('\n=== STEP 7: Trigger Deployment ===');
  const deployRes = await request('application.deploy', {
    applicationId: applicationId,
    title: 'Deploy K.A.T 2026',
    description: 'Initial deployment with Turso Cloud DB'
  });
  console.log('Deploy response:', deployRes.status, deployRes.data);

  console.log('\n=== STEP 8: Monitor Deployment Status ===');
  for (let i = 0; i < 60; i++) {
    await sleep(5000);
    const deploys = await request(`deployment.all?applicationId=${applicationId}`, null, 'GET');
    if (deploys.ok && Array.isArray(deploys.data) && deploys.data.length > 0) {
      const latest = deploys.data[0];
      console.log(`[T+${(i+1)*5}s] Deployment #${latest.deploymentId || latest.id}: Status = ${latest.status}`);

      if (latest.status === 'done' || latest.status === 'error') {
        const depId = latest.deploymentId || latest.id;
        const logs = await request(`deployment.readLogs?deploymentId=${depId}&tail=50`, null, 'GET');
        console.log('\n--- Deployment Logs ---');
        console.log(logs.data);
        break;
      }
    } else {
      console.log(`[T+${(i+1)*5}s] Waiting for deployment record...`);
    }
  }

  // Check application status
  const appStatus = await request(`application.one?applicationId=${applicationId}`, null, 'GET');
  console.log('\n=== Final Application Info ===');
  console.log('App Status:', appStatus.data?.applicationStatus);
  console.log('App URL via Traefik:', `http://${generatedHost}`);
  console.log('App URL direct Port:', `http://72.61.123.73:3050`);
}

run().catch(err => {
  console.error('Deployment error:', err);
});
