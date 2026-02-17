
import { createClient } from '@/lib/supabase/server';

type WebhookEvent = 'welcome' | 'order_created' | 'order_shipped' | 'virtual_assistant';

interface WebhookPayload {
    event: WebhookEvent;
    data: Record<string, any>;
    timestamp?: string;
}

export async function sendWebhook(event: WebhookEvent, data: Record<string, any>) {
    try {
        const supabase = await createClient();

        // 1. Get the Webhook URL from Store Settings
        const { data: settings } = await supabase
            .from('store_settings')
            .select('crm_webhook_url')
            .eq('id', 'global')
            .single();

        const webhookUrl = settings?.crm_webhook_url;

        if (!webhookUrl) {
            console.warn(`[WebhookDispatcher] No webhook URL configured for event: ${event}`);
            return false;
        }

        // 2. Prepare Payload
        const payload: WebhookPayload = {
            event,
            data,
            timestamp: new Date().toISOString()
        };

        // 3. Send Request
        console.log(`[WebhookDispatcher] Sending ${event} to n8n...`);

        // Fire and forget (don't await response to avoid blocking UI)
        fetch(webhookUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        }).catch(err => console.error(`[WebhookDispatcher] Error sending ${event}:`, err));

        return true;
    } catch (error) {
        console.error('[WebhookDispatcher] System Error:', error);
        return false;
    }
}
