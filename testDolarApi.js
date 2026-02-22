async function testApi() {
    try {
        const response = await fetch('https://ve.dolarapi.com/v1/dolares/oficial');
        if (!response.ok) {
            console.error('DolarAPI failed:', response.status);
            return;
        }
        const data = await response.json();
        console.log('DolarAPI Rate:', data);
    } catch (e) {
        console.error('Network Error:', e);
    }
}
testApi();
