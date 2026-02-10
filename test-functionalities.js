
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

async function testFunctionalities() {
    console.log('Testing Authentication Functionalities...');

    const uniqueId = Date.now();
    const testUser = {
        name: `Test User ${uniqueId}`,
        email: `testuser${uniqueId}@example.com`,
        password: 'Password123!'
    };

    try {
        // 1. Test Registration
        console.log(`\n1. Testing Registration for ${testUser.email}...`);
        const registerRes = await makeRequest('/api/auth/register', 'POST', testUser);
        console.log(`Status: ${registerRes.statusCode}`);
        console.log(`Response: ${registerRes.data}`);

        let isRegistered = false;
        if (registerRes.statusCode === 201 || registerRes.statusCode === 200) {
            console.log("✅ Registration endpoint reachable and accepted request.");
            isRegistered = true;
        } else {
            console.log("❌ Registration failed.");
        }

        // 2. Test Login (Expecting failure due to unverified email or success if no verification needed)
        console.log(`\n2. Testing Login for ${testUser.email}...`);
        const loginRes = await makeRequest('/api/auth/authenticate', 'POST', {
            email: testUser.email,
            password: testUser.password
        });
        console.log(`Status: ${loginRes.statusCode}`);
        console.log(`Response: ${loginRes.data}`);

        if (loginRes.statusCode === 200) {
            console.log("✅ Login successful (No verification needed?)");
        } else if (loginRes.statusCode === 401 || loginRes.statusCode === 403) { // Usually 400 or 401 for unverified
            console.log("ℹ️ Login failed as expected (likely due to unverified email).");
        } else {
            console.log("❌ Login failed with unexpected status.");
        }


        // 3. Test Invalid Login
        console.log(`\n3. Testing Invalid Login...`);
        const invalidLoginRes = await makeRequest('/api/auth/authenticate', 'POST', {
            email: 'invalid@example.com',
            password: 'wrongpassword'
        });
        console.log(`Status: ${invalidLoginRes.statusCode}`);
        // console.log(`Response: ${invalidLoginRes.data}`);
        if (invalidLoginRes.statusCode === 401 || invalidLoginRes.statusCode === 404 || invalidLoginRes.statusCode === 400) {
            console.log("✅ Invalid login correctly rejected.");
        } else {
            console.log("❌ Invalid login returned unexpected status.");
        }

        // 4. Test Public Clients Endpoint (if available without ID, usually not but lets try)
        console.log(`\n4. Testing /api/clients (Should be 401 unauthorized)...`);
        const clientsRes = await makeRequest('/api/clients', 'GET');
        console.log(`Status: ${clientsRes.statusCode}`);
        if (clientsRes.statusCode === 401) {
            console.log("✅ /api/clients correctly protected.");
        } else {
            console.log("❌ /api/clients returned unexpected status (should be 401).");
        }

    } catch (error) {
        console.error('Error during testing:', error.message);
    }
}

testFunctionalities();
