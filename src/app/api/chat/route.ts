import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(req: NextRequest) {
    try {
        const { messages } = await req.json();
        const supabase = await createClient();

        // 1. Obtener productos para dar contexto a la IA
        const { data: products } = await supabase
            .from('products')
            .select('name, description, price, category')
            .limit(50);

        const productContext = products?.map(p =>
            `- ${p.name}: ${p.description} (Precio: $${p.price}, Categoría: ${p.category})`
        ).join('\n') || 'No hay productos disponibles actualmente.';

        // 2. Definir el System Prompt enfocado en Mily's Shop
        const systemPrompt = `Eres "Mily", la asistente personal de Mily's Shop.
Tu estilo es "Soft Luxury": eres amable, refinada, servicial y minimalista.
Fusión de moda personalizada (Custom Studio) y cosmética artesanal (Body & Soul).

CONOCIMIENTO DE PRODUCTOS:
${productContext}

INSTRUCCIONES:
1. Ayuda a los clientes a elegir productos basados en sus gustos.
2. Si preguntan por personalización, explícales que pueden subir sus propios logos en el Configurador.
3. Mantén tus respuestas concisas y elegantes.
4. Usa emojis suaves como 🌸, ✨, 🧵.
5. Si no sabes algo sobre un producto específico que no esté en la lista, invita al cliente a contactar por WhatsApp.`;

        // 3. Simulación de llamada a IA (Aquí se integraría Gemini/OpenAI)
        // Para que el usuario pueda probarlo de inmediato, implementaremos una lógica base
        // que use el SDK si está disponible o un mock realista si falta la Key.

        // 3. Buscar la URL del Webhook en los ajustes
        const { data: settings } = await supabase
            .from('store_settings')
            .select('crm_webhook_url')
            .eq('id', 'global')
            .single();

        const webhookUrl = settings?.crm_webhook_url;
        const lastMessage = messages[messages.length - 1];

        if (webhookUrl) {
            try {
                // Enviar a n8n y esperar respuesta (IA Centralizada)
                const n8nResponse = await fetch(webhookUrl, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        event: 'virtual_assistant',
                        data: {
                            messages: messages, // Historial completo
                            user_id: (await supabase.auth.getUser()).data.user?.id,
                            system_context: productContext // Contexto de productos
                        }
                    })
                });

                if (n8nResponse.ok) {
                    const aiData = await n8nResponse.json();
                    // Esperamos que n8n devuelva { response: "Texto de la IA" } o similar
                    return NextResponse.json({
                        role: 'assistant',
                        content: aiData.response || aiData.content || aiData.message || "¡Entendido! 🌸"
                    });
                }
            } catch (err) {
                console.error('Error calling n8n for chat:', err);
            }
        }

        // Fallback si no hay webhook o falla
        console.warn('Using fallback chat response');
        return NextResponse.json({
            role: 'assistant',
            content: `¡Hola! Soy Mily. ✨ Veo que te interesas por nuestra colección. Basado en lo que tenemos, te recomendaría explorar nuestros productos de ${products?.[0]?.category || 'moda'}. ¿Buscas algo para tu estilo personal o quizás un regalo especial? 🌸`
        });

    } catch (error) {
        console.error('Chat Error:', error);
        return NextResponse.json({ error: 'Error en la comunicación con Mily.' }, { status: 500 });
    }
}
