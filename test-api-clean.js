import https from 'https';

const BASE_URL = 'https://proyecto-test-pi.vercel.app';

function request(method, path, body = null, token = null) {
  return new Promise((resolve, reject) => {
    const url = new URL(BASE_URL + path);
    const options = {
      hostname: url.hostname,
      port: 443,
      path: url.pathname + url.search,
      method: method,
      headers: {
        'Content-Type': 'application/json',
      },
    };

    if (token) {
      options.headers['Authorization'] = 'Bearer ' + token;
    }

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, data: data ? JSON.parse(data) : data });
        } catch {
          resolve({ status: res.statusCode, data: data });
        }
      });
    });

    req.on('error', reject);
    if (body) req.write(JSON.stringify(body));
    req.end();
  });
}

async function runTests() {
  console.log('\n========================================');
  console.log('API TESTS');
  console.log('========================================\n');

  try {
    // Test 1: Frontend
    console.log('TEST 1: Frontend');
    const frontend = await request('GET', '/');
    console.log('Status:', frontend.status);
    if (frontend.status === 200) {
      console.log('Result: OK\n');
    } else {
      console.log('Result: FAILED');
      console.log('Response:', frontend.data, '\n');
    }

    // Test 2: Register
    console.log('TEST 2: Register');
    const registerData = {
      username: 'testuser_' + Date.now(),
      password: 'Password123!'
    };
    const register = await request('POST', '/api/auth/register', registerData);
    console.log('Status:', register.status);
    if (register.status === 201 || register.status === 200) {
      console.log('Result: OK');
      console.log('User:', registerData.username, '\n');
    } else {
      console.log('Result: FAILED');
      console.log('Response:', register.data, '\n');
    }

    // Test 3: Login
    console.log('TEST 3: Login');
    const loginData = {
      username: registerData.username,
      password: 'Password123!'
    };
    const login = await request('POST', '/api/auth/login', loginData);
    console.log('Status:', login.status);
    if (login.status === 200 && login.data.accessToken) {
      console.log('Result: OK');
      console.log('Token:', login.data.accessToken.substring(0, 50) + '...\n');
    } else {
      console.log('Result: FAILED');
      console.log('Response:', login.data, '\n');
    }

    // Test 4: Get Tasks
    console.log('TEST 4: Get Tasks');
    const tasks = await request('GET', '/api/tasks', null, login.data.accessToken);
    console.log('Status:', tasks.status);
    if (tasks.status === 200) {
      console.log('Result: OK\n');
    } else {
      console.log('Result: FAILED');
      console.log('Response:', tasks.data, '\n');
    }

    console.log('========================================');
    console.log('ALL TESTS COMPLETED');
    console.log('========================================\n');
  } catch (error) {
    console.error('ERROR:', error.message);
  }
}

runTests();
