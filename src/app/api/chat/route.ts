import { NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import OpenAI from 'openai';

export const runtime = 'edge';

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
3. Mantén tus respuestas concisas y elegantes (máximo 3-4 líneas).
4. Usa emojis suaves como 🌸, ✨, 🧵.
5. Si no sabes algo sobre un producto específico que no esté en la lista, invita al cliente a contactar por WhatsApp.`;

        // 3. Verificar si existe la API Key
        if (!process.env.OPENAI_API_KEY) {
            return new Response(
                JSON.stringify({
                    role: 'assistant',
                    content: '¡Hola! Soy Mily. ✨ Para poder ayudarte mejor, necesito que configures la API de OpenAI. Por ahora, puedo decirte que tenemos productos increíbles esperándote. 🌸'
                }),
                { headers: { 'Content-Type': 'application/json' } }
            );
        }

        // 4. Llamar a OpenAI con streaming
        const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

        const stream = await openai.chat.completions.create({
            model: 'gpt-4o-mini',
            messages: [
                { role: 'system', content: systemPrompt },
                ...messages
            ],
            stream: true,
            temperature: 0.7,
            max_tokens: 300,
        });

        // 5. Crear un ReadableStream para enviar la respuesta
        const encoder = new TextEncoder();
        const readable = new ReadableStream({
            async start(controller) {
                for await (const chunk of stream) {
                    const content = chunk.choices[0]?.delta?.content || '';
                    if (content) {
                        controller.enqueue(encoder.encode(content));
                    }
                }
                controller.close();
            },
        });

        return new Response(readable, {
            headers: {
                'Content-Type': 'text/plain; charset=utf-8',
                'Transfer-Encoding': 'chunked',
            },
        });

    } catch (error) {
        console.error('Chat Error:', error);
        return new Response(
            JSON.stringify({
                role: 'assistant',
                content: 'Lo siento, tuve un pequeño problema técnico. 🌸 Por favor, intenta de nuevo.'
            }),
            {
                status: 500,
                headers: { 'Content-Type': 'application/json' }
            }
        );
    }
}
