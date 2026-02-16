'use client';

import { useState, useEffect } from 'react';
import {
    Package,
    Search,
    MoreVertical,
    Plus,
    Edit2,
    Trash2,
    ExternalLink,
    Loader2
} from 'lucide-react';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { toast } from 'sonner';
import type { Product } from '@/types';
import { ProductForm } from '@/components/admin/product-form';

export default function AdminProductsPage() {
    const [products, setProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

    useEffect(() => {
        fetchProducts();
    }, []);

    const fetchProducts = async () => {
        try {
            const res = await fetch('/api/admin/products');
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Failed to fetch');
            setProducts(Array.isArray(data) ? data : []);
        } catch (error: any) {
            toast.error(error.message || 'Error al cargar productos');
            setProducts([]);
        } finally {
            setLoading(false);
        }
    };

    const handleAdd = () => {
        setSelectedProduct(null);
        setIsFormOpen(true);
    };

    const handleEdit = (product: Product) => {
        setSelectedProduct(product);
        setIsFormOpen(true);
    };

    const filteredProducts = products.filter(p =>
        p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.category?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const handleDelete = async (id: string) => {
        if (!confirm('¿Estás seguro de eliminar este producto?')) return;

        try {
            const res = await fetch(`/api/admin/products/${id}`, { method: 'DELETE' });
            if (res.ok) {
                toast.success('Producto eliminado');
                setProducts(products.filter(p => p.id !== id));
            } else {
                throw new Error();
            }
        } catch (error) {
            toast.error('Error al eliminar producto');
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">Gestión de Catálogo</h1>
                    <p className="text-muted-foreground">Administra los productos de tu tienda.</p>
                </div>
                <Button
                    className="shrink-0 gap-2 rounded-xl h-11 px-6 shadow-lg shadow-primary/20"
                    onClick={handleAdd}
                >
                    <Plus size={18} />
                    Nuevo Producto
                </Button>
            </div>

            <Card className="border-none shadow-sm">
                <CardHeader className="pb-0">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground h-4 w-4" />
                        <Input
                            placeholder="Buscar por nombre o categoría..."
                            className="pl-10 h-11 rounded-xl bg-slate-50 dark:bg-slate-800/50 border-none"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </CardHeader>
                <CardContent className="p-0">
                    <div className="overflow-x-auto">
                        <Table>
                            <TableHeader>
                                <TableRow className="hover:bg-transparent border-slate-100 dark:border-slate-800">
                                    <TableHead className="w-[80px]">Imagen</TableHead>
                                    <TableHead>Producto</TableHead>
                                    <TableHead>Categoría</TableHead>
                                    <TableHead>Precio</TableHead>
                                    <TableHead>Stock</TableHead>
                                    <TableHead className="text-right">Acciones</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {loading ? (
                                    <TableRow>
                                        <TableCell colSpan={6} className="h-48 text-center text-muted-foreground">
                                            <div className="flex flex-col items-center gap-2">
                                                <Loader2 className="h-8 w-8 animate-spin" />
                                                <span>Cargando productos...</span>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ) : filteredProducts.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={6} className="h-48 text-center text-muted-foreground">
                                            No se encontraron productos.
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    filteredProducts.map((product) => (
                                        <TableRow key={product.id} className="group border-slate-100 dark:border-slate-800">
                                            <TableCell>
                                                <div className="h-12 w-12 rounded-lg overflow-hidden bg-slate-100 dark:bg-slate-800">
                                                    {product.image_url ? (
                                                        <img src={product.image_url} alt={product.name} className="h-full w-full object-cover" />
                                                    ) : (
                                                        <div className="h-full w-full flex items-center justify-center text-slate-400">
                                                            <Package size={20} />
                                                        </div>
                                                    )}
                                                </div>
                                            </TableCell>
                                            <TableCell className="font-medium">{product.name}</TableCell>
                                            <TableCell>
                                                <span className="px-2 py-1 rounded-md bg-slate-100 dark:bg-slate-800 text-xs font-semibold uppercase tracking-wider">
                                                    {product.category || 'Sin Cat.'}
                                                </span>
                                            </TableCell>
                                            <TableCell className="font-semibold">${product.price?.toFixed(2) || '0.00'}</TableCell>
                                            <TableCell>
                                                <div className="flex items-center gap-2">
                                                    <span className={product.stock < 5 ? 'text-destructive font-bold' : ''}>
                                                        {product.stock}
                                                    </span>
                                                    {product.stock < 5 && (
                                                        <span className="h-2 w-2 rounded-full bg-destructive animate-pulse" title="Stock bajo" />
                                                    )}
                                                </div>
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <div className="flex justify-end gap-2">
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="rounded-lg h-8 w-8"
                                                        onClick={() => handleEdit(product)}
                                                    >
                                                        <Edit2 size={16} className="text-slate-600" />
                                                    </Button>
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="rounded-lg h-8 w-8 hover:bg-destructive/10 hover:text-destructive"
                                                        onClick={() => handleDelete(product.id)}
                                                    >
                                                        <Trash2 size={16} />
                                                    </Button>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </div>
                </CardContent>
            </Card>

            <ProductForm
                product={selectedProduct}
                isOpen={isFormOpen}
                onClose={() => setIsFormOpen(false)}
                onSuccess={fetchProducts}
            />
        </div>
    );
}
