import { Suspense } from 'react';
import { createClient } from '@/lib/supabase/server';
import { Hero } from '@/components/hero';
import { ProductGrid } from '@/components/products/product-grid';
import { CategoryFilter } from '@/components/products/category-filter';
import { FeaturedOffers } from '@/components/featured-offers';
import { Skeleton } from '@/components/ui/skeleton';
import { MOCK_PRODUCTS } from '@/lib/mock-data';

async function getProducts() {
  const supabase = await createClient();

  // 1. Fetch products
  const { data: products, error: pError } = await supabase
    .from('products')
    .select('*')
    .order('created_at', { ascending: false });

  if (pError) {
    console.error('Error fetching products:', pError.message);
  }

  // 2. Fetch all categories for filtering
  const { data: categories, error: cError } = await supabase
    .from('categories')
    .select('id, name')
    .order('name');

  if (cError) {
    console.error('Error fetching categories:', cError.message);
  }

  // 3. Fetch active promotions for featured section
  const { data: promotions, error: promoError } = await supabase
    .from('promotions')
    .select('*')
    .eq('is_active', true)
    .gte('end_date', new Date().toISOString().split('T')[0])
    .order('value', { ascending: false })
    .limit(3);

  if (promoError) {
    console.error('Error fetching promotions:', promoError.message);
  }

  const hasContent = (products && products.length > 0) || (categories && categories.length > 0);

  if (!hasContent) {
    return { products: MOCK_PRODUCTS, categories: [], promotions: [] };
  }

  if (!hasContent) {
    return { products: MOCK_PRODUCTS, categories: [], promotions: [] };
  }

  return { products: products || [], categories: categories || [], promotions: promotions || [] };
}

export default async function Home(props: {
  searchParams: Promise<{ category?: string }>
}) {
  const searchParams = await props.searchParams;
  const category = searchParams.category;

  const { products, categories: fetchedCategories, promotions } = await getProducts();
  const filteredProducts = category && category !== 'all'
    ? products.filter(p => p.category === category)
    : products;

  return (
    <div className="flex flex-col min-h-screen">
      <Hero />

      <FeaturedOffers promotions={promotions} />

      <section className="container mx-auto px-6 py-24" id="products">
        <div className="flex flex-col items-center text-center mb-16">
          <SectionLabel label="Exclusive Collections" />
          <h2 className="text-5xl md:text-7xl font-serif font-black tracking-tighter mb-6 italic">Descubre tu <span className="text-primary">Estilo</span></h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto font-medium leading-relaxed">
            Explora el Custom Studio para moda personalizada o sumérgete en nuestra <span className="text-foreground font-bold">Body & Soul Collection</span>. Arte en cada detalle.
          </p>
        </div>

        <CategoryFilter categories={fetchedCategories} />

        <Suspense fallback={<ProductGridSkeleton />}>
          <ProductGrid products={filteredProducts} promotions={promotions} />
        </Suspense>
      </section>
    </div>
  );
}

function ProductGridSkeleton() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {Array.from({ length: 8 }).map((_, i) => (
        <div key={i} className="space-y-4">
          <Skeleton className="h-[300px] w-full rounded-xl" />
          <div className="space-y-2">
            <Skeleton className="h-4 w-[250px]" />
            <Skeleton className="h-4 w-[200px]" />
          </div>
        </div>
      ))}
    </div>
  );
}

function SectionLabel({ label }: { label: string }) {
  return (
    <h3 className="text-[10px] font-sans font-bold uppercase tracking-[0.2em] text-slate-400 flex items-center justify-center gap-2 mb-2">
      <span className="w-1.5 h-1.5 bg-lavanda rounded-full shadow-[0_0_8px_rgba(230,230,250,0.8)]"></span>
      {label}
    </h3>
  );
}
