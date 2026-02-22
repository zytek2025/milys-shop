import * as cheerio from 'cheerio';

export async function fetchBcvExchangeRate(): Promise<number | null> {
    try {
        const url = 'https://www.bcv.org.ve/';
        const response = await fetch(url, {
            headers: {
                // User Agent required to avoid 403 Forbidden or captchas from BCV
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
                'Accept-Language': 'es-VE,es;q=0.9,en-US;q=0.8,en;q=0.7',
                'Cache-Control': 'no-cache',
                'Pragma': 'no-cache',
            },
            next: { revalidate: 0 } // Always fetch fresh
        });

        if (!response.ok) {
            console.error('[BCV Scraper] Failed to fetch:', response.status, response.statusText);
            return null;
        }

        const html = await response.text();
        const $ = cheerio.load(html);

        // Find the dollar container and extract text
        const dolarContainer = $('#dolar');
        if (!dolarContainer.length) {
            console.error('[BCV Scraper] Could not find #dolar container in HTML');
            return null;
        }

        const rawText = dolarContainer.text().trim();
        // Look for the number formatted as XX,XXXXXX (e.g., 50,123456)
        const match = rawText.match(/([0-9]+,[0-9]+)/);

        if (match && match[1]) {
            const numStr = match[1].replace(',', '.');
            const rate = parseFloat(numStr);
            if (!isNaN(rate) && rate > 0) {
                return rate;
            }
        }

        console.error('[BCV Scraper] Could not parse numeric rate from text:', rawText);
        return null;

    } catch (error) {
        console.error('[BCV Scraper] Error during fetch/parse:', error);
        return null;
    }
}
