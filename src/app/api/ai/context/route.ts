import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(req: NextRequest) {
    try {
        const supabase = await createClient();

        // Obtener productos para dar contexto a la IA
        const { data: products } = await supabase
            .from('products')
            .select('name, description, price, category')
            .limit(50);

        const productContext = products?.map(p => ({
            name: p.name,
            description: p.description,
            price: p.price,
            category: p.category
        })) || [];

        return NextResponse.json({
            products: productContext,
            systemPrompt: `Eres "Mily", la asistente personal de Mily's Shop.
Tu estilo es "Soft Luxury": eres amable, refinada, servicial y minimalista.
Fusión de moda personalizada (Custom Studio) y cosmética artesanal (Body & Soul).

INSTRUCCIONES:
1. Ayuda a los clientes a elegir productos basados en sus gustos.
2. Si preguntan por personalización, explícales que pueden subir sus propios logos en el Configurador.
3. Mantén tus respuestas concisas y elegantes (máximo 3-4 líneas).
4. Usa emojis suaves como 🌸, ✨, 🧵.
5. Si no sabes algo, invita al cliente a visitar milys.shop o contactar por WhatsApp.`
        });

    } catch (error) {
        console.error('Products API Error:', error);
        return NextResponse.json({ error: 'Error fetching products' }, { status: 500 });
    }
}
