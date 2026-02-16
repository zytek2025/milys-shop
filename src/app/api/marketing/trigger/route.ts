import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

const N8N_WEBHOOK_URL = process.env.N8N_MARKETING_WEBHOOK_URL;

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { customer } = body;

        if (!customer || !customer.email || !customer.fullName) {
            return NextResponse.json({ error: 'Missing customer data' }, { status: 400 });
        }

        // Fetch ACTIVE promotions to give context to AI
        const supabase = await createClient();
        const { data: promotions } = await supabase
            .from('promotions')
            .select('*')
            .eq('is_active', true)
            .gte('end_date', new Date().toISOString().split('T')[0]);

        const payload = {
            customer: {
                fullName: customer.fullName,
                email: customer.email,
                whatsapp: customer.whatsapp || '',
                source: 'registration'
            },
            promotions: promotions || [],
            timestamp: new Date().toISOString()
        };

        // Send to n8n Webhook (if configured)
        if (N8N_WEBHOOK_URL) {
            try {
                // Determine if we should wait for response or fire-and-forget
                // For better UX during registration, we just fire and forget or await shortly
                // But since this is a server action, awaiting is safer to ensure delivery
                await fetch(N8N_WEBHOOK_URL, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload)
                });
                console.log('Sent to n8n webhook successfully');
            } catch (webhookError) {
                console.error('Error sending to n8n:', webhookError);
                // We don't fail the request if webhook fails, as registration was successful
            }
        } else {
            console.warn('N8N_MARKETING_WEBHOOK_URL not configured');
        }

        return NextResponse.json({ success: true, message: 'Marketing trigger processed' });

    } catch (error: any) {
        console.error('Marketing trigger error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
