import { NextResponse } from 'next/server';

const N8N_WEBHOOK_URL = process.env.N8N_WEBHOOK_URL;

export async function POST(req: Request) {
    try {
        const body = await req.json();

        if (!N8N_WEBHOOK_URL) {
            console.warn('N8N_WEBHOOK_URL not configured. Skipping marketing trigger.');
            return NextResponse.json({ success: true, message: 'Webhook not configured' });
        }

        // Forward to n8n
        const response = await fetch(N8N_WEBHOOK_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(body),
        });

        if (!response.ok) {
            console.error('N8N Webhook failed:', await response.text());
            return NextResponse.json({ error: 'Failed to trigger marketing workflow' }, { status: 500 });
        }

        return NextResponse.json({ success: true });
    } catch (error: any) {
        console.error('Marketing trigger error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
