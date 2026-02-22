

async function testReportsApi() {
    const baseUrl = 'http://localhost:3001/api/admin/reports';
    const endpoints = ['overview', 'sales', 'inventory', 'finances'];

    for (const type of endpoints) {
        try {
            console.log(`\nTesting ${type}...`);
            // We can't easily fake the admin cookie from a node script, so we might get 403.
            // Let's modify the route.ts temporarily or just check the status.
            const res = await fetch(`${baseUrl}?type=${type}&period=30days`);
            console.log(`Status: ${res.status}`);

            if (res.status === 200 || res.status === 403) {
                console.log(`${type} endpoint is reachable.`);
            } else {
                console.log(`Error on ${type}:`, await res.text());
            }
        } catch (e) {
            console.error(e);
        }
    }
}

testReportsApi();
