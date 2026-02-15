import { Product } from '@/types';

export const MOCK_PRODUCTS: Product[] = [
    {
        id: '1',
        name: 'Camiseta Blanca Clásica',
        description: 'Una camiseta blanca cómoda y atemporal hecha de algodón 100% orgánico. Perfecta para el uso diario.',
        price: 29.99,
        image_url: 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?q=80&w=1780&auto=format&fit=crop',
        category: 'Ropa',
        stock: 50,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
    },
    {
        id: '2',
        name: 'Auriculares Bluetooth Inalámbricos',
        description: 'Auriculares inalámbricos premium con cancelación activa de ruido, 30 horas de batería y sonido cristalino.',
        price: 199.99,
        image_url: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?q=80&w=2070&auto=format&fit=crop',
        category: 'Electrónica',
        stock: 25,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
    },
    {
        id: '3',
        name: 'Bolso de Mensajero de Cuero',
        description: 'Bolso de cuero genuino hecho a mano con múltiples compartimentos. Perfecto para trabajar o viajar.',
        price: 149.99,
        image_url: 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?q=80&w=1974&auto=format&fit=crop',
        category: 'Accesorios',
        stock: 15,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
    },
    {
        id: '4',
        name: 'Reloj Inteligente Fitness',
        description: 'Monitorea tu salud y ejercicio con este smartwatch avanzado. Incluye monitor de ritmo cardíaco, GPS y batería de 7 días.',
        price: 249.99,
        image_url: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?q=80&w=1999&auto=format&fit=crop',
        category: 'Electrónica',
        stock: 30,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
    },
    {
        id: '5',
        name: 'Chaqueta de Mezclilla',
        description: 'Chaqueta clásica de mezclilla azul con un ajuste moderno. Pieza versátil que combina con cualquier atuendo.',
        price: 89.99,
        image_url: 'https://images.unsplash.com/photo-1601924994987-69e26d50dc26?q=80&w=2070&auto=format&fit=crop',
        category: 'Ropa',
        stock: 20,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
    },
    {
        id: '6',
        name: 'Lámpara de Escritorio Minimalista',
        description: 'Lámpara LED moderna con brillo y temperatura de color ajustables. Incluye puerto de carga USB.',
        price: 59.99,
        image_url: 'https://images.unsplash.com/photo-1507473888900-52e1adad5420?q=80&w=1973&auto=format&fit=crop',
        category: 'Hogar',
        stock: 40,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
    },
    {
        id: '7',
        name: 'Zapatillas de Running',
        description: 'Zapatillas ligeras con amortiguación sensible y malla transpirable. Perfectas para correr a diario.',
        price: 129.99,
        image_url: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?q=80&w=2070&auto=format&fit=crop',
        category: 'Calzado',
        stock: 35,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
    },
    {
        id: '8',
        name: 'Altavoz Bluetooth Portátil',
        description: 'Altavoz compacto resistente al agua con graves potentes. 12 horas de reproducción y micrófono incorporado.',
        price: 79.99,
        image_url: 'https://images.unsplash.com/photo-1608043152269-423dbba4e7e1?q=80&w=1936&auto=format&fit=crop',
        category: 'Electrónica',
        stock: 45,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
    }
];
