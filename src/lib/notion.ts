
/**
 * Notion integration library.
 * This library provides utilities to sync data from the store (Orders, Inventory, CRM) to Notion.
 */

export interface NotionSyncData {
    databaseId: string;
    properties: Record<string, any>;
}

export async function syncToNotion(data: NotionSyncData) {
    const notionApiKey = process.env.NOTION_API_KEY;

    if (!notionApiKey) {
        console.warn('[NotionLib] NOTION_API_KEY is not configured.');
        return { success: false, error: 'NOTION_API_KEY missing' };
    }

    try {
        const response = await fetch('https://api.notion.com/v1/pages', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${notionApiKey}`,
                'Content-Type': 'application/json',
                'Notion-Version': '2022-06-28'
            },
            body: JSON.stringify({
                parent: { database_id: data.databaseId },
                properties: data.properties
            })
        });

        if (!response.ok) {
            const errorData = await response.json();
            console.error('[NotionLib] Error syncing to Notion:', errorData);
            return { success: false, error: errorData.message || 'Error from Notion API' };
        }

        const result = await response.json();
        return { success: true, pageId: result.id };
    } catch (error) {
        console.error('[NotionLib] System Error:', error);
        return { success: false, error: 'System error' };
    }
}

/**
 * Maps an Order to Notion properties.
 * Adjust this based on your Notion Database schema.
 */
export function mapOrderToNotion(order: any) {
    return {
        "ID del Pedido": {
            "title": [
                {
                    "text": {
                        "content": order.id
                    }
                }
            ]
        },
        "Cliente": {
            "rich_text": [
                {
                    "text": {
                        "content": order.profiles?.full_name || order.customer_name || 'Cliente'
                    }
                }
            ]
        },
        "Email": {
            "email": order.profiles?.email || order.customer_email || ''
        },
        "WhatsApp": {
            "phone_number": order.profiles?.whatsapp || order.customer_phone || ''
        },
        "Total": {
            "number": order.total
        },
        "Estado": {
            "select": {
                "name": order.status
            }
        },
        "Fecha": {
            "date": {
                "start": order.created_at
            }
        }
    };
}
