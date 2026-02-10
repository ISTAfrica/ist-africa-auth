
const https = require('https');

const baseUrl = 'https://ist-africa-auth-1.onrender.com';

function makeRequest(path, method = 'GET', body = null) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, baseUrl);
    const options = {
      method: method,
      headers: {
        'Content-Type': 'application/json',
      },
    };

    const req = https.request(url, options, (res) => {
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      res.on('end', () => {
        resolve({ statusCode: res.statusCode, data: data });
      });
    });

    req.on('error', (e) => {
      reject(e);
    });

    if (body) {
      req.write(JSON.stringify(body));
    }
    req.end();
  });
}

async function checkBackend() {
  console.log('Checking backend availability...');
  
  try {
    // Check root
    console.log('GET /');
    const rootRes = await makeRequest('/');
    console.log(`Status: ${rootRes.statusCode}`);
    console.log(`Response: ${rootRes.data.substring(0, 100)}...`);

    // Check health (common endpoint, guess)
    console.log('\nGET /health (guess)');
    const healthRes = await makeRequest('/health'); // Often endpoints are /api/health or just /health
    console.log(`Status: ${healthRes.statusCode}`);

     // Check api health (guess)
    console.log('\nGET /api/health (guess)');
    const apiHealthRes = await makeRequest('/api/health');
    console.log(`Status: ${apiHealthRes.statusCode}`);

  } catch (error) {
    console.error('Error connecting to backend:', error.message);
  }
}

checkBackend();
