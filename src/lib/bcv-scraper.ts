export async function fetchBcvExchangeRate(): Promise<number | null> {
    try {
        // We use ve.dolarapi.com/v1/dolares/oficial which tracks the BCV rate reliably
        // This avoids SSL certificate errors from bcv.org.ve and HTML parsing issues.
        const url = 'https://ve.dolarapi.com/v1/dolares/oficial';
        const response = await fetch(url, {
            headers: {
                'Accept': 'application/json',
                'Cache-Control': 'no-cache',
                'Pragma': 'no-cache',
            },
            next: { revalidate: 0 } // Always fetch fresh
        });

        if (!response.ok) {
            console.error('[BCV Scraper] Failed to fetch from DolarAPI:', response.status, response.statusText);
            return null;
        }

        const data = await response.json();

        if (data && data.promedio && typeof data.promedio === 'number') {
            // The API returns the official average rate directly
            return data.promedio;
        }

        console.error('[BCV Scraper] Invalid data format from DolarAPI:', data);
        return null;

    } catch (error) {
        console.error('[BCV Scraper] Error during fetch:', error);
        return null; // Fallback happens gracefully in the caller
    }
}
