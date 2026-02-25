const https = require('https');

// CONFIGURACIÓN - REEMPLAZAR CON TU URL REAL DE TEST DE n8n
const N8N_URL = 'zytek.app.n8n.cloud';
const N8N_PATH = '/webhook/mily-assistant-trigger';

const testOrder = JSON.stringify({
    record: {
        id: 'test-order-' + Date.now(),
        full_name: 'Cliente WhatsApp Mily',
        email: 'dfornerino.usa@gmail.com',
        whatsapp: '584120000000', // Simulando un número de Venezuela
        cart_items: '1x Splash Waikiki Beach Coconut, 1x A Thousand Wishes',
        order_status: 'pending',
        recovery_sent: false,
        created_at: new Date().toISOString()
    },
    operation: 'INSERT',
    table_name: 'orders'
});

const options = {
    hostname: N8N_URL,
    path: N8N_PATH,
    method: 'POST',
    headers: {
        'Content-Type': 'application/json',
        'Content-Length': testOrder.length
    }
};

console.log('🚀 Iniciando prueba de Mily AI Assistant (Zero Dependencies)...');
console.log('📡 Enviando webhook a:', N8N_URL + N8N_PATH);

const req = https.request(options, (res) => {
    if (res.statusCode === 200) {
        console.log('✅ Webhook enviado con éxito (Status: 200).');
        console.log('💡 Mily debería estar procesando el carrito abandonado.');
    } else {
        console.log('❌ Error en la respuesta:', res.statusCode);
    }
});

req.on('error', (e) => {
    console.error('❌ Error de conexión:', e.message);
});

req.write(testOrder);
req.end();
