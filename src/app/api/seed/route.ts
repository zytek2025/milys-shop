import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

function getSupabaseClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  
  if (!supabaseUrl || !supabaseKey) {
    throw new Error('Missing Supabase environment variables');
  }
  
  return createClient(supabaseUrl, supabaseKey);
}

// Sample product data
const sampleProducts = [
  {
    name: 'Classic White T-Shirt',
    description: 'A comfortable and timeless white t-shirt made from 100% organic cotton. Perfect for everyday wear.',
    price: 29.99,
    image_url: 'https://picsum.photos/seed/tshirt/400/400',
    category: 'Clothing',
    stock: 50
  },
  {
    name: 'Wireless Bluetooth Headphones',
    description: 'Premium wireless headphones with active noise cancellation, 30-hour battery life, and crystal clear sound.',
    price: 199.99,
    image_url: 'https://picsum.photos/seed/headphones/400/400',
    category: 'Electronics',
    stock: 25
  },
  {
    name: 'Leather Messenger Bag',
    description: 'Handcrafted genuine leather messenger bag with multiple compartments. Perfect for work or travel.',
    price: 149.99,
    image_url: 'https://picsum.photos/seed/bag/400/400',
    category: 'Accessories',
    stock: 15
  },
  {
    name: 'Smart Fitness Watch',
    description: 'Track your health and fitness with this advanced smartwatch. Features heart rate monitor, GPS, and 7-day battery life.',
    price: 249.99,
    image_url: 'https://picsum.photos/seed/watch/400/400',
    category: 'Electronics',
    stock: 30
  },
  {
    name: 'Denim Jacket',
    description: 'Classic blue denim jacket with a modern fit. Versatile piece that goes with any outfit.',
    price: 89.99,
    image_url: 'https://picsum.photos/seed/jacket/400/400',
    category: 'Clothing',
    stock: 20
  },
  {
    name: 'Minimalist Desk Lamp',
    description: 'Modern LED desk lamp with adjustable brightness and color temperature. USB charging port included.',
    price: 59.99,
    image_url: 'https://picsum.photos/seed/lamp/400/400',
    category: 'Home',
    stock: 40
  },
  {
    name: 'Running Sneakers',
    description: 'Lightweight running shoes with responsive cushioning and breathable mesh upper. Perfect for daily runs.',
    price: 129.99,
    image_url: 'https://picsum.photos/seed/sneakers/400/400',
    category: 'Footwear',
    stock: 35
  },
  {
    name: 'Portable Bluetooth Speaker',
    description: 'Compact waterproof speaker with powerful bass. 12-hour playtime and built-in microphone for calls.',
    price: 79.99,
    image_url: 'https://picsum.photos/seed/speaker/400/400',
    category: 'Electronics',
    stock: 45
  },
  {
    name: 'Wool Blend Sweater',
    description: 'Cozy wool blend sweater in a relaxed fit. Perfect for layering during cooler months.',
    price: 79.99,
    image_url: 'https://picsum.photos/seed/sweater/400/400',
    category: 'Clothing',
    stock: 22
  },
  {
    name: 'Ceramic Coffee Mug Set',
    description: 'Set of 4 handcrafted ceramic mugs in neutral tones. Microwave and dishwasher safe.',
    price: 34.99,
    image_url: 'https://picsum.photos/seed/mugs/400/400',
    category: 'Home',
    stock: 60
  }
];

// POST /api/seed - Seed the database with sample products
export async function POST() {
  try {
    const supabase = getSupabaseClient();
    
    // Insert products
    const { data, error } = await supabase
      .from('products')
      .insert(sampleProducts)
      .select();
    
    if (error) {
      // Check if it's a duplicate error (products already exist)
      if (error.code === '23505') {
        return NextResponse.json({ 
          message: 'Products already seeded',
          note: 'The database already contains products with similar data.'
        });
      }
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    
    return NextResponse.json({ 
      message: 'Products seeded successfully',
      count: data?.length || 0
    });
  } catch (error) {
    console.error('Error seeding products:', error);
    return NextResponse.json(
      { error: 'Failed to seed products' },
      { status: 500 }
    );
  }
}

// GET /api/seed - Check if products exist
export async function GET() {
  try {
    const supabase = getSupabaseClient();
    
    const { count, error } = await supabase
      .from('products')
      .select('*', { count: 'exact', head: true });
    
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    
    return NextResponse.json({ 
      productCount: count,
      needsSeed: count === 0
    });
  } catch (error) {
    console.error('Error checking products:', error);
    return NextResponse.json(
      { error: 'Failed to check products' },
      { status: 500 }
    );
  }
}
