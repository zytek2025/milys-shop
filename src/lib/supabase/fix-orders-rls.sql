-- FIX DEFINITIVO DE PERMISOS PARA PEDIDOS (RLS)

-- 1. Habilitar RLS en las tablas si no lo están
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;

-- 2. Limpiar políticas antiguas (para evitar conflictos)
DROP POLICY IF EXISTS "Admins can do everything on orders" ON orders;
DROP POLICY IF EXISTS "Users can view own orders" ON orders;
DROP POLICY IF EXISTS "Users can create own orders" ON orders;
DROP POLICY IF EXISTS "Admins can do everything on order_items" ON order_items;
DROP POLICY IF EXISTS "Users can view own order_items" ON order_items;

-- 3. POLÍTICAS PARA LA TABLA 'orders'
-- Administrador: Control total
CREATE POLICY "Admins can do everything on orders" ON orders
FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);

-- Usuarios: Ver sus propios pedidos
CREATE POLICY "Users can view own orders" ON orders
FOR SELECT USING (auth.uid() = user_id);

-- Usuarios: Crear sus propios pedidos
CREATE POLICY "Users can create own orders" ON orders
FOR INSERT WITH CHECK (auth.uid() = user_id);

-- 4. POLÍTICAS PARA LA TABLA 'order_items'
-- Administrador: Control total
CREATE POLICY "Admins can do everything on order_items" ON order_items
FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);

-- Usuarios: Ver sus propios items de pedido
CREATE POLICY "Users can view own order_items" ON order_items
FOR SELECT USING (
  EXISTS (SELECT 1 FROM orders WHERE id = order_items.order_id AND user_id = auth.uid())
);

-- 5. RECARGAR SISTEMA
NOTIFY pgrst, 'reload schema';
