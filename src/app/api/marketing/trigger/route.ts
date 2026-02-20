
import { NextResponse } from 'next/server';
import { sendWebhook } from '@/lib/webhook-dispatcher';

export async function POST(req: Request) {
    try {
        const body = await req.json();

        // Use the centralized dispatcher for the new 'customer_registered' event
        await sendWebhook('customer_registered', {
            registered_at: new Date().toISOString()
        }, {
            name: body.user_metadata?.full_name || body.email?.split('@')[0] || 'Cliente',
            email: body.email,
            phone: body.user_metadata?.whatsapp || body.phone || ''
        });

        return NextResponse.json({ success: true, message: 'Registration webhook dispatched' });
    } catch (error: any) {
        console.error('Marketing trigger error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
