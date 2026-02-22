const http = require('http');

const payload = JSON.stringify({
    variant_id: "fbda3bc5-7dcf-4bd9-abb7-26804d1ad9f0", // a real variant
    quantity: 1,
    type: "purchase",
    reason: "Ajuste Panel: purchase",
    unit_cost: "5",
    utility_percentage: "200",
    unit_price: "15",
    exchange_rate: 60,
    update_price: true
});

const req = http.request({
    hostname: 'localhost',
    port: 3000,
    path: '/api/admin/inventory/movements',
    method: 'POST',
    headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(payload)
    }
}, res => {
    let data = '';
    res.on('data', chunk => { data += chunk; });
    res.on('end', () => {
        console.log('Status:', res.statusCode);
        console.log('Response:', data);
    });
});

req.on('error', e => {
    console.error(`Problem with request: ${e.message}`);
});

req.write(payload);
req.end();
