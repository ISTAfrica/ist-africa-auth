
const https = require('https');

const baseUrl = 'https://ist-africa-auth-1.onrender.com';

function makeRequest(path, method = 'GET', body = null, timeout = 10000) {
    return new Promise((resolve, reject) => {
        const url = new URL(path, baseUrl);
        const options = {
            method: method,
            headers: { 'Content-Type': 'application/json' },
            timeout: timeout,
        };

        const req = https.request(url, options, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => resolve({ statusCode: res.statusCode, data }));
        });

        req.on('error', (e) => reject(e));
        req.on('timeout', () => {
            req.destroy();
            reject(new Error(`Request timed out after ${timeout}ms`));
        });

        if (body) req.write(JSON.stringify(body));
        req.end();
    });
}

async function quickTest() {
    console.log('Running Quick Checks...');

    try {
        // 1. Check Protected Endpoint
        console.log('\n[1] Checking Protected Endpoint (/api/clients)...');
        try {
            const clientsRes = await makeRequest('/api/clients', 'GET');
            console.log(`Status: ${clientsRes.statusCode} (Expected 401)`);
        } catch (e) { console.error(`Failed: ${e.message}`); }

        // 2. Check Invalid Login
        console.log('\n[2] Checking Invalid Login (/api/auth/authenticate)...');
        try {
            const loginRes = await makeRequest('/api/auth/authenticate', 'POST', {
                email: 'bad@example.com', password: 'badpassword'
            });
            console.log(`Status: ${loginRes.statusCode} (Expected 401 or 400)`);
            console.log(`Response: ${loginRes.data}`);
        } catch (e) { console.error(`Failed: ${e.message}`); }

        // 3. Try Registration LAST (might hang)
        console.log('\n[3] Attempting Registration (/api/auth/register)...');
        const uniqueId = Date.now();
        try {
            const regRes = await makeRequest('/api/auth/register', 'POST', {
                name: `User ${uniqueId}`,
                email: `user${uniqueId}@test.com`,
                password: 'Password123!'
            }, 15000); // 15s timeout
            console.log(`Status: ${regRes.statusCode}`);
            console.log(`Response: ${regRes.data}`);
        } catch (e) {
            console.error(`Registration Failed/Timed Out: ${e.message}`);
            console.log("Analysis: Registration hanging usually indicates SMTP timeout or connection issues.");
        }

    } catch (err) {
        console.error('Script Error:', err);
    }
}

quickTest();
