
import { NextResponse } from 'next/server';
import { sendWebhook } from '@/lib/webhook-dispatcher';

export async function POST(req: Request) {
    try {
        const body = await req.json();

        // Use the centralized dispatcher for the 'welcome' event
        await sendWebhook('welcome', body);

        return NextResponse.json({ success: true, message: 'Welcome webhook dispatched' });
    } catch (error: any) {
        console.error('Marketing trigger error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
