
// import fetch from 'node-fetch'; // Not needed in Node 18+

const WEBHOOK_URL = 'https://main.dqcip6zepoktb.amplifyapp.com/api/marketing/trigger';
// const WEBHOOK_URL = 'http://localhost:3000/api/marketing/trigger'; // Toggle for local testing

const DUMMY_DATA = {
    customer: {
        fullName: 'Juan Pérez (Test)',
        email: 'juan.test@example.com',
        whatsapp: '+50760000000',
        source: 'registration_test'
    }
};

async function testWebhook() {
    console.log(`🚀 Sending test data to: ${WEBHOOK_URL}`);
    console.log('Payload:', JSON.stringify(DUMMY_DATA, null, 2));

    try {
        const response = await fetch(WEBHOOK_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(DUMMY_DATA)
        });

        const data = await response.json();
        console.log('✅ Response Status:', response.status);
        console.log('✅ Response Data:', data);

        if (response.ok) {
            console.log('🎉 Webhook test successful!');
        } else {
            console.error('❌ Webhook test failed.');
        }
    } catch (error) {
        console.error('❌ Error sending request:', error);
    }
}

testWebhook();
