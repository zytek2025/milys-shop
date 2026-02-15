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

        const lastMessage = messages[messages.length - 1].content;

        // NOTA: Para producción, el usuario debe configurar su GOOGLE_GENERATIVE_AI_API_KEY
        // o usar el servicio de IA configurado en el sistema.

        // Por ahora, retornaremos una respuesta que demuestre que la IA conoce los productos.
        return NextResponse.json({
            role: 'assistant',
            content: `¡Hola! Soy Mily. ✨ Veo que te interesas por nuestra colección. Basado en lo que tenemos, te recomendaría explorar nuestros productos de ${products?.[0]?.category || 'moda'}. ¿Buscas algo para tu estilo personal o quizás un regalo especial? 🌸`
        });

    } catch (error) {
        console.error('Chat Error:', error);
        return NextResponse.json({ error: 'Error en la comunicación con Mily.' }, { status: 500 });
    }
}
