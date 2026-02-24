import { test, expect } from '@playwright/test';

test.describe('Smoke Tests - Tienda Milys', () => {
    test('La página de inicio carga correctamente', async ({ page }) => {
        await page.goto('/');

        // Verificar que el título principal o banner esté presente
        // Ajustado según el reporte del subagent (Tu Estilo, Tu Esencia)
        await expect(page.getByText(/Tu Estilo/i)).toBeVisible();

        // Verificar que el botón de carrito esté presente
        const cartButton = page.locator('button').filter({ hasText: '0' }).or(page.locator('button').filter({ hasText: /carrito/i }));
        // Según el subagent el contador de carrito está en el header
    });

    test('El modal de login es accesible', async ({ page }) => {
        await page.goto('/');

        // Hacer clic en "Entrar" (Basado en el reporte del subagent)
        await page.getByRole('button', { name: /entrar/i }).click();

        // Verificar que el modal de login se abre
        await expect(page.getByText(/Iniciar sesión con Google/i)).toBeVisible();
    });

    test('Se puede añadir un producto al carrito', async ({ page }) => {
        await page.goto('/');

        // Esperar a que carguen los productos
        // El subagent interactuó con el producto "perfume"
        const product = page.getByText(/perfume/i).first();
        await product.scrollIntoViewIfNeeded();
        await product.click();

        // Hacer clic en Añadir al Carrito
        // El botón tiene el texto "Añadir al Carrito" o icono de ShoppingCart
        const addToCartButton = page.getByRole('button', { name: /añadir al carrito/i });
        await addToCartButton.click();

        // Verificar que el drawer del carrito se abre
        await expect(page.getByText(/tu carrito/i)).toBeVisible();
        // Verificar que el producto está en el carrito
        await expect(page.locator('.flex-1', { hasText: /perfume/i })).toBeVisible();
    });
});
