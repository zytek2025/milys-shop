import { Suspense } from 'react';
import { createClient } from '@/lib/supabase/server';
import { Hero } from '@/components/hero';
import { ProductGrid } from '@/components/products/product-grid';
import { CategoryFilter } from '@/components/products/category-filter';
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

  const hasContent = (products && products.length > 0) || (categories && categories.length > 0);

  if (!hasContent) {
    return { products: MOCK_PRODUCTS, categories: [] };
  }

  return { products: products || [], categories: categories || [] };
}

export default async function Home(props: {
  searchParams: Promise<{ category?: string }>
}) {
  const searchParams = await props.searchParams;
  const category = searchParams.category;

  const { products, categories: fetchedCategories } = await getProducts();
  const filteredProducts = category && category !== 'all'
    ? products.filter(p => p.category === category)
    : products;

  return (
    <div className="flex flex-col min-h-screen">
      <Hero />

      <section className="container mx-auto px-4 py-16" id="products">
        <div className="text-center mb-12">
          <SectionLabel label="Nuestras Colecciones" />
          <h2 className="text-4xl font-serif font-light mb-4">Descubre tu Estilo</h2>
          <p className="text-muted-foreground max-w-2xl mx-auto font-light">
            Explora el Custom Studio para moda personalizada o sumérgete en nuestra Body & Soul Collection.
          </p>
        </div>

        <CategoryFilter categories={fetchedCategories} />

        <Suspense fallback={<ProductGridSkeleton />}>
          <ProductGrid products={filteredProducts} />
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
