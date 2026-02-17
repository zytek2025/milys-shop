-- SET THE CRM WEBHOOK URL
-- Replace 'TU_URL_DE_N8N_AQUI' with the actual URL from your n8n workflow.
-- Example: 'https://n8n.tu-dominio.com/webhook/trigger'

UPDATE store_settings 
SET crm_webhook_url = 'TU_URL_DE_N8N_AQUI' 
WHERE id = 'global';

-- Verify the change
SELECT id, crm_webhook_url FROM store_settings WHERE id = 'global';
