# Sistema de Devoluciones (Area de Devoluciones)

Este plan describe la implementación de un sistema completo de devoluciones que permita a los clientes solicitar devoluciones y a los administradores gestionarlas, integrando el flujo con el inventario y los saldos a favor (Store Credit).

## Cambios Propuestos

### Base de Datos
- **[NEW] [create-returns-system.sql](file:///c:/Users/dforn/OneDrive/Desktop/pruebas/la%20tienda/src/lib/supabase/create-returns-system.sql)**:
    - Tabla `returns` para rastrear solicitudes (id, order_id, profile_id, items, reason, status, amount_credited).
    - Estados: `requested`, `approved`, `rejected`, `collected`, `completed`.
    - Integración con RLS para que usuarios vean sus devoluciones y admins todas.

### Backend API
- **[NEW] [api/returns/route.ts](file:///c:/Users/dforn/OneDrive/Desktop/pruebas/la%20tienda/src/app/api/returns/route.ts)**:
    - `POST`: Los clientes crean solicitudes de devolución.
    - `GET`: Los clientes consultan su historial de devoluciones.
- **[NEW] [api/admin/returns/route.ts](file:///c:/Users/dforn/OneDrive/Desktop/pruebas/la%20tienda/src/app/api/admin/returns/route.ts)**:
    - `GET`: Lista todas las devoluciones para el admin.
- **[NEW] [api/admin/returns/[id]/route.ts](file:///c:/Users/dforn/OneDrive/Desktop/pruebas/la%20tienda/src/app/api/admin/returns/[id]/route.ts)**:
    - `PATCH`: Aprobar, rechazar o completar devoluciones (disparando el crédito a favor y retorno de stock).

### Frontend Admin
- **[NEW] [admin/returns/page.tsx](file:///c:/Users/dforn/OneDrive/Desktop/pruebas/la%20tienda/src/app/admin/returns/page.tsx)**:
    - Panel de gestión de devoluciones con filtros por estado.
    - Acciones rápidas para aprobar y procesar crédito.
- **[MODIFY] [admin/layout.tsx](file:///c:/Users/dforn/OneDrive/Desktop/pruebas/la%20tienda/src/app/admin/layout.tsx)**:
    - Añadir enlace al área de Devoluciones en la barra lateral.

### Frontend Cliente
- **[MODIFY] [orders/[id]/page.tsx](file:///c:/Users/dforn/OneDrive/Desktop/pruebas/la%20tienda/src/app/orders/%5Bid%5D/page.tsx)**:
    - Botón "Solicitar Devolución" si el pedido está `completed`.
- **[NEW] [returns/request/[orderId]/page.tsx](file:///c:/Users/dforn/OneDrive/Desktop/pruebas/la%20tienda/src/app/returns/request/%5BorderId%5D/page.tsx)**:
    - Formulario para elegir items, cantidad y motivo de devolución.

## Verificación Plan
### Pruebas Automatizadas
- Crear una devolución desde la cuenta de un cliente.
- Verificar que el admin la ve en el panel.
- Aprobarla como admin y verificar:
    - El stock del producto aumenta.
    - El saldo a favor (Store Credit) del cliente aumenta.
    - Se registra el movimiento en el historial.
