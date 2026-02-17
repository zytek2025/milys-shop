import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
    const report: any = {
        timestamp: new Date().toISOString(),
        tests: []
    };

    // Helper to simulate internal API calls (since we can't easily fetch localhost from inside Next.js edge runtime without full URL)
    // We will import the logic directly from the other route files if possible, 
    // OR we just instruct the user to run them individually.

    // Actually, importing the GET function from other routes works in Next.js App Router if they are exported!
    // Let's try to import them.

    try {
        const { GET: verifyStock } = await import('../stock/route');
        const { GET: verifyReturns } = await import('../returns/route');
        const { GET: verifyUsers } = await import('../users/route');

        // 1. Stock Verification
        try {
            const res = await verifyStock(req);
            const data = await res.json();
            report.tests.push({ name: 'Inventory Deduction', status: data.success ? 'PASS' : 'FAIL', details: data });
        } catch (e: any) {
            report.tests.push({ name: 'Inventory Deduction', status: 'ERROR', error: e.message });
        }

        // 2. Returns Verification
        try {
            const res = await verifyReturns(req);
            const data = await res.json();
            report.tests.push({ name: 'Returns Logic', status: data.success ? 'PASS' : 'FAIL', details: data });
        } catch (e: any) {
            report.tests.push({ name: 'Returns Logic', status: 'ERROR', error: e.message });
        }

        // 3. User Creation Verification
        try {
            const res = await verifyUsers(req);
            const data = await res.json();
            report.tests.push({ name: 'User Creation', status: data.success ? 'PASS' : 'FAIL', details: data });
        } catch (e: any) {
            report.tests.push({ name: 'User Creation', status: 'ERROR', error: e.message });
        }

        return NextResponse.json(report);

    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
