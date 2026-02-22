const { fetchBcvExchangeRate } = require('./src/lib/bcv-scraper.ts'); // Wait, Node can't run TS directly easily without ts-node or transpilation.
// Let's rewrite the scraper logic in standard JS to test it quickly.

const cheerio = require('cheerio');

async function testFetch() {
    console.log('Fetching BCV...');
    try {
        const url = 'https://www.bcv.org.ve/';
        const response = await fetch(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8',
                'Accept-Language': 'es-ES,es;q=0.9,en;q=0.8',
            }
        });

        if (!response.ok) {
            console.error('Failed to fetch:', response.status, response.statusText);
            return;
        }

        const html = await response.text();
        const $ = cheerio.load(html);

        const dolarContainer = $('#dolar');
        if (!dolarContainer.length) {
            console.error('Could not find #dolar element');
            return;
        }

        const rateText = dolarContainer.find('strong').text().trim();
        if (!rateText) {
            console.error('Could not find strong tag with rate text inside #dolar');
            return;
        }

        const rateStr = rateText.replace(',', '.');
        const rate = parseFloat(rateStr);

        console.log('Parsed rate:', rate);
    } catch (error) {
        console.error('Error:', error);
    }
}

testFetch();
